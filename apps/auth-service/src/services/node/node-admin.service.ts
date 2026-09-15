import { auditLogs, db, eq, nodeRepository, servers } from "@mystic/database";
import { HttpError } from "../../errors/http-error.js";
import { generateNodeToken, hashNodeToken } from "../../utils/node-auth.js";

export async function listAdminNodesService() {
  const rawNodes = await nodeRepository.findAll();

  const nodesList = rawNodes.map((n) => {
    const totalCpuCores = n.totalCpuCores || 0;
    const allocatedCpuCores = n.allocatedCpuCores || 0;
    const availableCpuCores = Math.max(0, totalCpuCores - allocatedCpuCores);

    const totalRamMb = n.totalRamMb || 0;
    const allocatedRamMb = n.allocatedRamMb || 0;
    const availableRamMb = Math.max(0, totalRamMb - allocatedRamMb);

    const totalDiskGb = n.totalDiskGb || 0;
    const allocatedDiskGb = n.allocatedDiskGb || 0;
    const availableDiskGb = Math.max(0, totalDiskGb - allocatedDiskGb);

    // Omit tokenHash from public DTO
    const { tokenHash, ...safeNode } = n;

    return {
      ...safeNode,
      totalCpuCores,
      allocatedCpuCores,
      availableCpuCores,
      totalRamMb,
      allocatedRamMb,
      availableRamMb,
      totalDiskGb,
      allocatedDiskGb,
      availableDiskGb,
    };
  });

  return { nodes: nodesList };
}

export async function getAdminNodeByIdService(nodeId: string) {
  const node = await nodeRepository.findById(nodeId);

  if (!node) {
    throw new HttpError(404, "NODE_NOT_FOUND", `Node with ID '${nodeId}' not found`);
  }

  const { tokenHash, ...safeNode } = node;

  const totalCpuCores = node.totalCpuCores || 0;
  const allocatedCpuCores = node.allocatedCpuCores || 0;
  const availableCpuCores = Math.max(0, totalCpuCores - allocatedCpuCores);

  const totalRamMb = node.totalRamMb || 0;
  const allocatedRamMb = node.allocatedRamMb || 0;
  const availableRamMb = Math.max(0, totalRamMb - allocatedRamMb);

  const totalDiskGb = node.totalDiskGb || 0;
  const allocatedDiskGb = node.allocatedDiskGb || 0;
  const availableDiskGb = Math.max(0, totalDiskGb - allocatedDiskGb);

  return {
    node: {
      ...safeNode,
      totalCpuCores,
      allocatedCpuCores,
      availableCpuCores,
      totalRamMb,
      allocatedRamMb,
      availableRamMb,
      totalDiskGb,
      allocatedDiskGb,
      availableDiskGb,
    },
  };
}

export async function createAdminNodeService(
  adminUserId: string,
  input: {
    name: string;
    hostname: string;
    address: string;
    region: string;
    totalCpuCores?: number;
    totalRamMb?: number;
    totalDiskGb?: number;
  },
) {
  const cleanName = input.name.trim();

  const existing = await nodeRepository.findByName(cleanName);
  if (existing) {
    throw new HttpError(400, "DUPLICATE_NODE_NAME", `Node with name '${cleanName}' already exists`);
  }

  // Generate node token and hash
  const plaintextToken = generateNodeToken();
  const tokenHash = hashNodeToken(plaintextToken);

  const newNode = await nodeRepository.createNode({
    name: cleanName,
    hostname: input.hostname.trim(),
    address: input.address.trim(),
    region: input.region.toUpperCase().trim(),
    status: "pending",
    totalCpuCores: input.totalCpuCores ?? 0,
    totalRamMb: input.totalRamMb ?? 0,
    totalDiskGb: input.totalDiskGb ?? 0,
    allocatedCpuCores: 0,
    allocatedRamMb: 0,
    allocatedDiskGb: 0,
    capabilities: [],
    tokenHash,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  // Audit Log Entry
  await db.insert(auditLogs).values({
    adminUserId,
    action: "NODE_CREATED",
    entityType: "node",
    entityId: newNode.id,
    details: JSON.stringify({ name: newNode.name, hostname: newNode.hostname, region: newNode.region }),
    createdAt: new Date(),
  });

  const { tokenHash: _th, ...safeNode } = newNode;

  return {
    node: safeNode,
    token: plaintextToken,
    warning: "Save this token now. It will not be shown again.",
  };
}

export async function updateAdminNodeService(
  nodeId: string,
  adminUserId: string,
  input: {
    name?: string;
    hostname?: string;
    address?: string;
    region?: string;
    status?: "pending" | "online" | "offline" | "disabled";
  },
) {
  const existing = await nodeRepository.findById(nodeId);
  if (!existing) {
    throw new HttpError(404, "NODE_NOT_FOUND", `Node with ID '${nodeId}' not found`);
  }

  if (input.name && input.name.trim() !== existing.name) {
    const duplicate = await nodeRepository.findByName(input.name.trim());
    if (duplicate) {
      throw new HttpError(400, "DUPLICATE_NODE_NAME", `Node with name '${input.name.trim()}' already exists`);
    }
  }

  const updatedNode = await nodeRepository.updateNode(nodeId, {
    ...(input.name ? { name: input.name.trim() } : {}),
    ...(input.hostname ? { hostname: input.hostname.trim() } : {}),
    ...(input.address ? { address: input.address.trim() } : {}),
    ...(input.region ? { region: input.region.toUpperCase().trim() } : {}),
    ...(input.status ? { status: input.status } : {}),
  });

  // Audit Log Entry
  await db.insert(auditLogs).values({
    adminUserId,
    action: "NODE_UPDATED",
    entityType: "node",
    entityId: nodeId,
    details: JSON.stringify({ oldStatus: existing.status, newStatus: updatedNode?.status }),
    createdAt: new Date(),
  });

  const { tokenHash, ...safeNode } = updatedNode || existing;

  return { node: safeNode };
}

export async function deleteAdminNodeService(nodeId: string, adminUserId: string) {
  const node = await nodeRepository.findById(nodeId);
  if (!node) {
    throw new HttpError(404, "NODE_NOT_FOUND", `Node with ID '${nodeId}' not found`);
  }

  // Check if active servers are assigned to this node
  const assignedServers = await db
    .select()
    .from(servers)
    .where(eq(servers.nodeId, nodeId));

  if (assignedServers.length > 0) {
    throw new HttpError(
      400,
      "NODE_HAS_ASSIGNED_SERVERS",
      `Cannot delete node '${node.name}' because it has ${assignedServers.length} active assigned server instance(s). Reassign or terminate servers first.`,
    );
  }

  await nodeRepository.deleteNode(nodeId);

  // Audit Log Entry
  await db.insert(auditLogs).values({
    adminUserId,
    action: "NODE_DELETED",
    entityType: "node",
    entityId: nodeId,
    details: JSON.stringify({ name: node.name }),
    createdAt: new Date(),
  });

  return { success: true, message: `Node '${node.name}' deleted successfully` };
}

export async function regenerateNodeTokenService(nodeId: string, adminUserId: string) {
  const node = await nodeRepository.findById(nodeId);
  if (!node) {
    throw new HttpError(404, "NODE_NOT_FOUND", `Node with ID '${nodeId}' not found`);
  }

  const plaintextToken = generateNodeToken();
  const tokenHash = hashNodeToken(plaintextToken);

  await nodeRepository.updateNode(nodeId, { tokenHash });

  // Audit Log Entry
  await db.insert(auditLogs).values({
    adminUserId,
    action: "NODE_TOKEN_REGENERATED",
    entityType: "node",
    entityId: nodeId,
    details: JSON.stringify({ name: node.name }),
    createdAt: new Date(),
  });

  return {
    token: plaintextToken,
    warning: "Save this token now. The old token is immediately invalidated.",
  };
}
