import { and, eq, lte } from "drizzle-orm";

import { db } from "../drizzle.js";
import { nodes } from "../schema/nodes.js";

export class NodeRepository {
  async createNode(data: typeof nodes.$inferInsert) {
    const [node] = await db
      .insert(nodes)
      .values(data)
      .returning();

    return node;
  }

  async findById(id: string) {
    const [node] = await db
      .select()
      .from(nodes)
      .where(eq(nodes.id, id));

    return node ?? null;
  }

  async findByName(name: string) {
    const [node] = await db
      .select()
      .from(nodes)
      .where(eq(nodes.name, name));

    return node ?? null;
  }

  async findByTokenHash(tokenHash: string) {
    const [node] = await db
      .select()
      .from(nodes)
      .where(eq(nodes.tokenHash, tokenHash));

    return node ?? null;
  }

  async findAll() {
    return await db
      .select()
      .from(nodes)
      .orderBy(nodes.createdAt);
  }

  async updateHeartbeat(
    id: string,
    data: {
      status?: "online" | "pending" | "offline" | "disabled";
      agentVersion?: string;
      capabilities?: string[];
      totalCpuCores?: number;
      totalRamMb?: number;
      totalDiskGb?: number;
    },
  ) {
    const [node] = await db
      .update(nodes)
      .set({
        lastHeartbeat: new Date(),
        updatedAt: new Date(),
        ...(data.status ? { status: data.status } : {}),
        ...(data.agentVersion ? { agentVersion: data.agentVersion } : {}),
        ...(data.capabilities ? { capabilities: data.capabilities } : {}),
        ...(data.totalCpuCores !== undefined ? { totalCpuCores: data.totalCpuCores } : {}),
        ...(data.totalRamMb !== undefined ? { totalRamMb: data.totalRamMb } : {}),
        ...(data.totalDiskGb !== undefined ? { totalDiskGb: data.totalDiskGb } : {}),
      })
      .where(eq(nodes.id, id))
      .returning();

    return node ?? null;
  }

  /**
   * Updates allocated capacity with strict resource checks:
   * 1. Allocated resources cannot be negative.
   * 2. Allocated resources cannot exceed total capacity (no overselling allowed).
   */
  async updateCapacity(
    id: string,
    allocatedCpuCores: number,
    allocatedRamMb: number,
    allocatedDiskGb: number,
  ) {
    const node = await this.findById(id);
    if (!node) {
      throw new Error(`Node with ID '${id}' not found`);
    }

    if (
      allocatedCpuCores < 0 ||
      allocatedRamMb < 0 ||
      allocatedDiskGb < 0
    ) {
      throw new Error("Allocated resource values cannot be negative.");
    }

    if (
      allocatedCpuCores > node.totalCpuCores ||
      allocatedRamMb > node.totalRamMb ||
      allocatedDiskGb > node.totalDiskGb
    ) {
      throw new Error(
        `Capacity allocation exceeds total node capacity. (Requested: ${allocatedCpuCores} CPU, ${allocatedRamMb}MB RAM, ${allocatedDiskGb}GB Disk | Total: ${node.totalCpuCores} CPU, ${node.totalRamMb}MB RAM, ${node.totalDiskGb}GB Disk)`,
      );
    }

    const [updatedNode] = await db
      .update(nodes)
      .set({
        allocatedCpuCores,
        allocatedRamMb,
        allocatedDiskGb,
        updatedAt: new Date(),
      })
      .where(eq(nodes.id, id))
      .returning();

    return updatedNode;
  }

  async updateStatus(
    id: string,
    status: "pending" | "online" | "offline" | "disabled",
  ) {
    const [updatedNode] = await db
      .update(nodes)
      .set({
        status,
        updatedAt: new Date(),
      })
      .where(eq(nodes.id, id))
      .returning();

    return updatedNode ?? null;
  }

  async updateNode(
    id: string,
    data: {
      name?: string;
      hostname?: string;
      address?: string;
      region?: string;
      status?: "pending" | "online" | "offline" | "disabled";
      tokenHash?: string;
    },
  ) {
    const [updatedNode] = await db
      .update(nodes)
      .set({
        ...(data.name ? { name: data.name } : {}),
        ...(data.hostname ? { hostname: data.hostname } : {}),
        ...(data.address ? { address: data.address } : {}),
        ...(data.region ? { region: data.region } : {}),
        ...(data.status ? { status: data.status } : {}),
        ...(data.tokenHash ? { tokenHash: data.tokenHash } : {}),
        updatedAt: new Date(),
      })
      .where(eq(nodes.id, id))
      .returning();

    return updatedNode ?? null;
  }

  async findStaleNodes(staleThresholdDate: Date) {
    return await db
      .select()
      .from(nodes)
      .where(
        and(
          eq(nodes.status, "online"),
          lte(nodes.lastHeartbeat, staleThresholdDate),
        ),
      );
  }

  async deleteNode(id: string) {
    const [deletedNode] = await db
      .delete(nodes)
      .where(eq(nodes.id, id))
      .returning();

    return deletedNode ?? null;
  }
}

export const nodeRepository = new NodeRepository();
