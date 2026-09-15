import { capabilityService } from "./capability.service.js";
import { hostInfoService } from "./host-info.service.js";

let clientTimer: NodeJS.Timeout | null = null;

export async function sendAgentHeartbeatOnce(): Promise<boolean> {
  const controlPlaneUrl = (process.env.CONTROL_PLANE_URL || "http://localhost:3001").replace(/\/$/, "");
  const nodeToken = process.env.NODE_TOKEN || process.env.NODE_SECRET;

  if (!nodeToken) {
    return false;
  }

  const endpoint = `${controlPlaneUrl}/nodes/heartbeat`;

  try {
    const hardware = hostInfoService.getHardwareMetrics();
    const capabilitiesReport = capabilityService.getCapabilitiesReport();

    const payload = {
      agentVersion: "1.0.0",
      timestamp: new Date().toISOString(),
      metrics: {
        totalCpuCores: hardware.cpu.cores,
        totalRamMb: hardware.ram.totalMb,
        usedRamMb: hardware.ram.usedMb,
        totalDiskGb: hardware.disk.totalGb,
        usedDiskGb: hardware.disk.usedGb,
      },
      capabilities: capabilitiesReport.capabilities,
    };

    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${nodeToken}`,
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      console.warn(`[Agent Heartbeat Warning] Control plane returned status ${res.status}: ${errText.slice(0, 100)}`);
      return false;
    }

    return true;
  } catch (err: any) {
    console.warn(`[Agent Heartbeat Connection Warning] Failed to reach control plane at '${endpoint}':`, err?.message || err);
    return false;
  }
}

export function startAgentHeartbeatClient(): void {
  if (clientTimer) return;

  const nodeToken = process.env.NODE_TOKEN || process.env.NODE_SECRET;
  if (!nodeToken) {
    console.log("[Agent Heartbeat Client] NODE_TOKEN not set. Automatic heartbeat sync inactive.");
    return;
  }

  const intervalMs = parseInt(process.env.NODE_HEARTBEAT_INTERVAL || "30000", 10);

  // Initial heartbeat on boot
  sendAgentHeartbeatOnce();

  clientTimer = setInterval(async () => {
    await sendAgentHeartbeatOnce();
  }, intervalMs);

  if (clientTimer.unref) {
    clientTimer.unref();
  }
}

export function stopAgentHeartbeatClient(): void {
  if (clientTimer) {
    clearInterval(clientTimer);
    clientTimer = null;
  }
}
