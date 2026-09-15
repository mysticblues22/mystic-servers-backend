import { nodeRepository } from "@mystic/database";

let monitorTimer: NodeJS.Timeout | null = null;

export async function checkStaleNodesService(): Promise<{ markedOfflineCount: number }> {
  const offlineThresholdMs = parseInt(process.env.NODE_OFFLINE_THRESHOLD_MS || "90000", 10);
  const thresholdDate = new Date(Date.now() - offlineThresholdMs);

  const staleNodes = await nodeRepository.findStaleNodes(thresholdDate);

  let markedOfflineCount = 0;
  for (const node of staleNodes) {
    if (node.status === "online") {
      await nodeRepository.updateStatus(node.id, "offline");
      markedOfflineCount++;
    }
  }

  return { markedOfflineCount };
}

export function startNodeMonitorWorker(): void {
  if (monitorTimer) return;

  const intervalMs = parseInt(process.env.NODE_MONITOR_INTERVAL_MS || "30000", 10);

  monitorTimer = setInterval(async () => {
    try {
      await checkStaleNodesService();
    } catch (err: any) {
      console.error("[Node Monitor Worker Error]", err?.message || err);
    }
  }, intervalMs);

  // Unref timer so process isn't forcibly held open during shutdown/testing
  if (monitorTimer.unref) {
    monitorTimer.unref();
  }
}

export function stopNodeMonitorWorker(): void {
  if (monitorTimer) {
    clearInterval(monitorTimer);
    monitorTimer = null;
  }
}
