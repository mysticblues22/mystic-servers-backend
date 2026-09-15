import { nodeRepository } from "@mystic/database";
import { HttpError } from "../../errors/http-error.js";

export interface NodeSchedulerRequest {
  provider: string; // e.g. "incus"
  cpuCores: number;
  ramMb: number;
  diskGb: number;
  preferredRegion?: string;
}

export class NodeScheduler {
  /**
   * Selects an online physical host node with sufficient available CPU, RAM, and Disk capacity.
   */
  public async selectNode(request: NodeSchedulerRequest) {
    const allNodes = await nodeRepository.findAll();

    // 1. Filter online nodes supporting requested provider capability
    const eligibleNodes = allNodes.filter((node) => {
      if (node.status !== "online") return false;

      const caps = node.capabilities || [];
      const supportsProvider =
        request.provider === "incus"
          ? caps.includes("incus") || caps.includes("lxc")
          : caps.includes(request.provider);

      if (!supportsProvider) return false;

      // 2. Capacity checks
      const availableCpu = (node.totalCpuCores || 0) - (node.allocatedCpuCores || 0);
      const availableRam = (node.totalRamMb || 0) - (node.allocatedRamMb || 0);
      const availableDisk = (node.totalDiskGb || 0) - (node.allocatedDiskGb || 0);

      return (
        availableCpu >= request.cpuCores &&
        availableRam >= request.ramMb &&
        availableDisk >= request.diskGb
      );
    });

    if (eligibleNodes.length === 0) {
      throw new HttpError(
        503,
        "NO_ELIGIBLE_NODES",
        `No online node with provider capability '${request.provider}' and sufficient CPU (${request.cpuCores} cores), RAM (${request.ramMb} MB), and Disk (${request.diskGb} GB) is available.`,
      );
    }

    // 3. Match preferred region if specified
    if (request.preferredRegion) {
      const regionMatch = eligibleNodes.find(
        (n) => n.region.toUpperCase() === request.preferredRegion?.toUpperCase(),
      );
      if (regionMatch) return regionMatch;
    }

    // Return first eligible node
    return eligibleNodes[0];
  }
}

export const nodeScheduler = new NodeScheduler();
