import { nodeRepository } from "@mystic/database";
import { HttpError } from "../../errors/http-error.js";
import { hashNodeToken } from "../../utils/node-auth.js";

export interface NodeHeartbeatPayload {
  agentVersion?: string;
  metrics?: {
    totalCpuCores?: number;
    totalRamMb?: number;
    usedRamMb?: number;
    totalDiskGb?: number;
    usedDiskGb?: number;
  };
  cpu?: {
    totalCores?: number;
  };
  memory?: {
    totalMb?: number;
    availableMb?: number;
  };
  disk?: {
    totalGb?: number;
    availableGb?: number;
  };
  capabilities?: string[];
}

export async function processNodeHeartbeatService(
  token: string | undefined,
  payload: NodeHeartbeatPayload,
) {
  if (!token || typeof token !== "string") {
    throw new HttpError(401, "UNAUTHORIZED_NODE", "Node authentication token is required");
  }

  const tokenHash = hashNodeToken(token);
  const node = await nodeRepository.findByTokenHash(tokenHash);

  if (!node) {
    throw new HttpError(401, "UNAUTHORIZED_NODE", "Invalid or revoked node authorization token");
  }

  // Disabled nodes reject heartbeats and must not automatically transition to online
  if (node.status === "disabled") {
    throw new HttpError(403, "NODE_DISABLED", "Node is administratively disabled");
  }

  // Extract reported physical capacity totals
  const totalCpuCores =
    payload.metrics?.totalCpuCores ??
    payload.cpu?.totalCores ??
    node.totalCpuCores;

  const totalRamMb =
    payload.metrics?.totalRamMb ??
    payload.memory?.totalMb ??
    node.totalRamMb;

  const totalDiskGb =
    payload.metrics?.totalDiskGb ??
    payload.disk?.totalGb ??
    node.totalDiskGb;

  const capabilities = payload.capabilities || node.capabilities || [];
  const agentVersion = payload.agentVersion || node.agentVersion || "1.0.0";

  // Transition offline or pending nodes to online.
  const targetStatus = "online";

  const updatedNode = await nodeRepository.updateHeartbeat(node.id, {
    status: targetStatus,
    agentVersion,
    capabilities,
    totalCpuCores,
    totalRamMb,
    totalDiskGb,
  });

  const availableCpuCores = Math.max(0, (updatedNode?.totalCpuCores || 0) - (updatedNode?.allocatedCpuCores || 0));
  const availableRamMb = Math.max(0, (updatedNode?.totalRamMb || 0) - (updatedNode?.allocatedRamMb || 0));
  const availableDiskGb = Math.max(0, (updatedNode?.totalDiskGb || 0) - (updatedNode?.allocatedDiskGb || 0));

  return {
    status: "ok",
    nodeId: node.id,
    nodeName: node.name,
    nodeStatus: updatedNode?.status || targetStatus,
    capacity: {
      totalCpuCores: updatedNode?.totalCpuCores,
      allocatedCpuCores: updatedNode?.allocatedCpuCores,
      availableCpuCores,
      totalRamMb: updatedNode?.totalRamMb,
      allocatedRamMb: updatedNode?.allocatedRamMb,
      availableRamMb,
      totalDiskGb: updatedNode?.totalDiskGb,
      allocatedDiskGb: updatedNode?.allocatedDiskGb,
      availableDiskGb,
    },
  };
}
