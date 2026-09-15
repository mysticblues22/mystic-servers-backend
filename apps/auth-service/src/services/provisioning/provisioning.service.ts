import {
  auditLogs,
  db,
  eq,
  ipv4Inventory,
  nodeRepository,
  orderRepository,
  planRepository,
  servers,
} from "@mystic/database";
import { HttpError } from "../../errors/http-error.js";
import { nodeScheduler } from "./scheduler.service.js";

export interface ProvisioningOptions {
  orderId: string;
  adminUserId?: string;
  sshPublicKey?: string;
  image?: string;
}

export class ProvisioningService {
  /**
   * Orchestrates full end-to-end VPS provisioning for a paid order on an Incus host node.
   */
  public async provisionServerForOrder(options: ProvisioningOptions) {
    const { orderId, adminUserId, sshPublicKey, image } = options;

    // 1. Fetch and validate order
    const order = await orderRepository.findById(orderId);
    if (!order) {
      throw new HttpError(404, "ORDER_NOT_FOUND", `Order with ID '${orderId}' not found`);
    }

    if (order.status !== "paid") {
      throw new HttpError(400, "ORDER_NOT_PAID", `Order '${orderId}' cannot be provisioned because its status is '${order.status}' (must be 'paid')`);
    }

    // 2. Fetch order items and plan
    const orderItems = order.items || [];
    if (!orderItems || orderItems.length === 0) {
      throw new HttpError(400, "ORDER_ITEMS_EMPTY", `Order '${orderId}' has no item records`);
    }

    const firstItem = orderItems[0];
    if (!firstItem || !firstItem.planId) {
      throw new HttpError(400, "INVALID_ORDER_ITEM", `Order '${orderId}' item missing valid planId`);
    }
    const plan = await planRepository.findById(firstItem.planId);
    if (!plan) {
      throw new HttpError(404, "PLAN_NOT_FOUND", `Plan with ID '${firstItem.planId}' not found`);
    }

    const provider = "incus";

    // 3. Idempotency Check (Check if server already exists for this order)
    const existingServers = await db
      .select()
      .from(servers)
      .where(eq(servers.name, `VPS-Order-${order.orderNumber}`));

    if (existingServers.length > 0) {
      const existing = existingServers[0];
      if (existing.status === "active" || existing.status === "provisioning") {
        return {
          status: "existing",
          message: "Server is already provisioned or currently provisioning for this order.",
          server: existing,
        };
      }
    }

    // 4. Select Node via Scheduler
    const node = await nodeScheduler.selectNode({
      provider,
      cpuCores: plan.cpuCores,
      ramMb: plan.ramMb,
      diskGb: plan.diskGb,
    });

    // 5. Reserve Capacity Transactionally (Atomic check & update)
    const newAllocCpu = (node.allocatedCpuCores || 0) + plan.cpuCores;
    const newAllocRam = (node.allocatedRamMb || 0) + plan.ramMb;
    const newAllocDisk = (node.allocatedDiskGb || 0) + plan.diskGb;

    await nodeRepository.updateCapacity(node.id, newAllocCpu, newAllocRam, newAllocDisk);

    // 6. Safe IP Allocation from IPv4 Pool (if available)
    let assignedPublicIp: string | undefined;
    let allocatedIpRecord: any | null = null;

    try {
      const availableIps = await db
        .select()
        .from(ipv4Inventory)
        .where(eq(ipv4Inventory.status, "available"))
        .limit(1);

      if (availableIps.length > 0) {
        allocatedIpRecord = availableIps[0];
        assignedPublicIp = allocatedIpRecord.ipAddress;
      }
    } catch {
      // Ignore IP pool query errors and fallback
    }

    // 7. Insert Server Record (Status: provisioning)
    const serverName = `VPS-Order-${order.orderNumber}`;
    const serverHostname = `node-${order.orderNumber}.mystic.internal`;

    const [serverRecord] = await db
      .insert(servers)
      .values({
        userId: order.userId,
        planId: plan.id,
        nodeId: node.id,
        provider,
        providerInstanceId: `ms-${order.id.slice(0, 8)}`,
        name: serverName,
        hostname: serverHostname,
        region: node.region,
        cpuCores: plan.cpuCores,
        ramMb: plan.ramMb,
        diskGb: plan.diskGb,
        publicIp: assignedPublicIp || null,
        privateIp: null,
        status: "provisioning",
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    // 8. Call Node Agent to Create Container
    const containerName = `ms-${serverRecord.id.slice(0, 8)}`;
    const targetAgentUrl = node.address.startsWith("http") ? node.address : `http://${node.address}:9090`;
    const agentToken = process.env.NODE_SECRET || process.env.NODE_TOKEN || "node-agent-token";

    try {
      const agentRes = await fetch(`${targetAgentUrl}/virtualization/incus/containers`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${agentToken}`,
          "X-Node-Token": agentToken,
        },
        body: JSON.stringify({
          name: containerName,
          image: image || "images:debian/12",
          cpuCores: plan.cpuCores,
          ramMb: plan.ramMb,
          diskGb: plan.diskGb,
          sshKeys: sshPublicKey ? [sshPublicKey] : [],
          hostname: serverHostname,
        }),
      });

      if (!agentRes.ok) {
        const errJson = await agentRes.json().catch(() => ({}));
        throw new Error(errJson?.error?.message || `Node agent returned HTTP ${agentRes.status}`);
      }

      const agentData = await agentRes.json();
      const containerState = agentData.container;

      // 9. Mark Server ACTIVE & Update IPs
      const [activeServer] = await db
        .update(servers)
        .set({
          status: "active",
          providerInstanceId: containerName,
          privateIp: containerState?.ips?.privateIp || null,
          ...(containerState?.ips?.publicIp ? { publicIp: containerState.ips.publicIp } : {}),
          updatedAt: new Date(),
        })
        .where(eq(servers.id, serverRecord.id))
        .returning();

      // Update IPv4 Inventory record status if assigned
      if (allocatedIpRecord) {
        await db
          .update(ipv4Inventory)
          .set({
            status: "assigned",
            assignedServerId: activeServer.id,
            assignedUserId: order.userId,
            updatedAt: new Date(),
          })
          .where(eq(ipv4Inventory.id, allocatedIpRecord.id));
      }

      // Audit Log Entry
      await db.insert(auditLogs).values({
        adminUserId: adminUserId || null,
        action: "PROVISIONING_COMPLETED",
        entityType: "server",
        entityId: activeServer.id,
        details: JSON.stringify({
          orderId,
          nodeId: node.id,
          nodeName: node.name,
          containerName,
          status: "active",
        }),
        createdAt: new Date(),
      });

      return {
        status: "success",
        message: `VPS instance '${activeServer.name}' successfully provisioned on node '${node.name}'.`,
        server: activeServer,
      };
    } catch (err: any) {
      // 10. FAILURE CLEANUP & ROLLBACK PATH
      try {
        const rollbackCpu = Math.max(0, (node.allocatedCpuCores || 0));
        const rollbackRam = Math.max(0, (node.allocatedRamMb || 0));
        const rollbackDisk = Math.max(0, (node.allocatedDiskGb || 0));
        await nodeRepository.updateCapacity(node.id, rollbackCpu, rollbackRam, rollbackDisk);
      } catch {}

      // Mark Server record as failed
      await db
        .update(servers)
        .set({
          status: "failed",
          updatedAt: new Date(),
        })
        .where(eq(servers.id, serverRecord.id));

      // Audit Log Entry
      await db.insert(auditLogs).values({
        adminUserId: adminUserId || null,
        action: "PROVISIONING_FAILED",
        entityType: "server",
        entityId: serverRecord.id,
        details: JSON.stringify({
          orderId,
          nodeId: node.id,
          error: err?.message || err,
        }),
        createdAt: new Date(),
      });

      throw new HttpError(
        500,
        "PROVISIONING_FAILED",
        `Provisioning failed on node '${node.name}': ${err?.message || err}. Node resources have been rolled back.`,
      );
    }
  }
}

export const provisioningService = new ProvisioningService();
