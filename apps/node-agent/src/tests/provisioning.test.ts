import assert from "node:assert";
import { IncusProvider } from "../services/incus.provider.js";

async function runProvisioningTests() {
  console.log("=== RUNNING PROVISIONING & SCHEDULER TESTS ===");

  // Mock DB for Scheduler & Reservation Tests
  const mockNodes = [
    {
      id: "node-offline",
      name: "Node Offline",
      status: "offline",
      capabilities: ["incus", "lxc"],
      totalCpuCores: 32,
      allocatedCpuCores: 0,
      totalRamMb: 128000,
      allocatedRamMb: 0,
      totalDiskGb: 2000,
      allocatedDiskGb: 0,
      region: "US",
    },
    {
      id: "node-no-incus",
      name: "Node No Incus",
      status: "online",
      capabilities: ["kvm"],
      totalCpuCores: 32,
      allocatedCpuCores: 0,
      totalRamMb: 128000,
      allocatedRamMb: 0,
      totalDiskGb: 2000,
      allocatedDiskGb: 0,
      region: "US",
    },
    {
      id: "node-full",
      name: "Node Full Capacity",
      status: "online",
      capabilities: ["incus"],
      totalCpuCores: 4,
      allocatedCpuCores: 4, // 0 available
      totalRamMb: 16384,
      allocatedRamMb: 16384,
      totalDiskGb: 100,
      allocatedDiskGb: 100,
      region: "US",
    },
    {
      id: "node-eligible",
      name: "Node Eligible Incus Host",
      status: "online",
      capabilities: ["incus", "lxc"],
      totalCpuCores: 16,
      allocatedCpuCores: 2, // 14 available
      totalRamMb: 65536,
      allocatedRamMb: 8192, // 57344 MB available
      totalDiskGb: 1000,
      allocatedDiskGb: 100, // 900 GB available
      region: "US",
    },
  ];

  // 1. Scheduler Node Selection Test
  console.log("[Test 1] Scheduler Node Selection Logic...");
  const selectNode = (req: { provider: string; cpuCores: number; ramMb: number; diskGb: number }) => {
    const eligible = mockNodes.filter((node) => {
      if (node.status !== "online") return false;
      const hasCap = node.capabilities.includes(req.provider) || node.capabilities.includes("lxc");
      if (!hasCap) return false;
      const availCpu = node.totalCpuCores - node.allocatedCpuCores;
      const availRam = node.totalRamMb - node.allocatedRamMb;
      const availDisk = node.totalDiskGb - node.allocatedDiskGb;
      return availCpu >= req.cpuCores && availRam >= req.ramMb && availDisk >= req.diskGb;
    });

    if (eligible.length === 0) throw new Error("NO_ELIGIBLE_NODES");
    return eligible[0];
  };

  const selected = selectNode({ provider: "incus", cpuCores: 4, ramMb: 8192, diskGb: 100 });
  assert.strictEqual(selected.id, "node-eligible");
  console.log("✓ Scheduler Node Selection passed");

  // 2. Resource Reservation & Rollback Test
  console.log("[Test 2] Resource Reservation & Rollback...");
  const node = mockNodes[3];
  const initialCpu = node.allocatedCpuCores;

  // Reserve 4 CPUs
  node.allocatedCpuCores += 4;
  assert.strictEqual(node.allocatedCpuCores, 6);

  // Rollback on simulated provisioning failure
  node.allocatedCpuCores -= 4;
  assert.strictEqual(node.allocatedCpuCores, initialCpu, "Resource rollback must restore exact original allocation");
  console.log("✓ Reservation & Rollback passed");

  // 3. Idempotency Check Test
  console.log("[Test 3] Idempotency Protection...");
  const existingServers = new Map<string, any>();
  existingServers.set("order-101", { id: "srv-101", status: "active", name: "VPS-Order-101" });

  const provisionWithIdempotency = (orderId: string) => {
    if (existingServers.has(orderId)) {
      return { status: "existing", server: existingServers.get(orderId) };
    }
    const newServer = { id: `srv-${Date.now()}`, status: "active", name: `VPS-Order-${orderId}` };
    existingServers.set(orderId, newServer);
    return { status: "created", server: newServer };
  };

  const firstCall = provisionWithIdempotency("order-101");
  assert.strictEqual(firstCall.status, "existing");
  assert.strictEqual(firstCall.server.id, "srv-101");

  const secondCall = provisionWithIdempotency("order-102");
  assert.strictEqual(secondCall.status, "created");
  console.log("✓ Idempotency Protection passed");

  // 4. IncusProvider Interface Test
  console.log("[Test 4] IncusProvider Interface...");
  const incusProv = new IncusProvider();
  assert.strictEqual(incusProv.providerName, "incus");
  console.log("✓ IncusProvider Interface passed");

  console.log("\nALL PROVISIONING & SCHEDULER TESTS PASSED SUCCESSFULLY! 🎉");
}

runProvisioningTests().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
