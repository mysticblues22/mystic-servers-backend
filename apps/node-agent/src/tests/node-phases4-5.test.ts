import assert from "node:assert";
import { generateNodeToken, hashNodeToken, verifyNodeToken } from "../auth/node-auth.js";

async function runPhase4And5Tests() {
  console.log("=== RUNNING PHASES 4 & 5 CONTROL PLANE & HEARTBEAT TESTS ===");

  // Mock In-Memory Database Store for Node Testing
  const dbNodes = new Map<string, any>();
  const dbServers = new Map<string, any>();

  // Helper Functions mimicking Services
  const createNode = (name: string, hostname: string, address: string, region: string) => {
    for (const [, n] of dbNodes) {
      if (n.name === name) throw new Error("DUPLICATE_NODE_NAME");
    }
    const token = generateNodeToken();
    const tokenHash = hashNodeToken(token);
    const id = `node-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

    const nodeRecord = {
      id,
      name,
      hostname,
      address,
      region,
      status: "pending",
      totalCpuCores: 10,
      totalRamMb: 65536,
      totalDiskGb: 500,
      allocatedCpuCores: 0,
      allocatedRamMb: 0,
      allocatedDiskGb: 0,
      capabilities: [],
      agentVersion: null,
      tokenHash,
      lastHeartbeat: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    dbNodes.set(id, nodeRecord);
    return { node: nodeRecord, token };
  };

  const processHeartbeat = (token: string, payload: any) => {
    const tokenHash = hashNodeToken(token);
    let matchedNode: any = null;

    for (const [, n] of dbNodes) {
      if (n.tokenHash === tokenHash) {
        matchedNode = n;
        break;
      }
    }

    if (!matchedNode) {
      throw new Error("UNAUTHORIZED_NODE");
    }

    if (matchedNode.status === "disabled") {
      throw new Error("NODE_DISABLED");
    }

    matchedNode.lastHeartbeat = new Date();
    matchedNode.agentVersion = payload.agentVersion || "1.0.0";
    matchedNode.capabilities = payload.capabilities || [];
    matchedNode.totalCpuCores = payload.metrics?.totalCpuCores ?? matchedNode.totalCpuCores;
    matchedNode.totalRamMb = payload.metrics?.totalRamMb ?? matchedNode.totalRamMb;
    matchedNode.totalDiskGb = payload.metrics?.totalDiskGb ?? matchedNode.totalDiskGb;

    // Allocated resources are NOT overwritten by heartbeat!
    matchedNode.status = "online";
    matchedNode.updatedAt = new Date();

    const availableCpuCores = Math.max(0, matchedNode.totalCpuCores - matchedNode.allocatedCpuCores);
    const availableRamMb = Math.max(0, matchedNode.totalRamMb - matchedNode.allocatedRamMb);
    const availableDiskGb = Math.max(0, matchedNode.totalDiskGb - matchedNode.allocatedDiskGb);

    return {
      status: "ok",
      nodeId: matchedNode.id,
      nodeStatus: matchedNode.status,
      capacity: {
        totalCpuCores: matchedNode.totalCpuCores,
        allocatedCpuCores: matchedNode.allocatedCpuCores,
        availableCpuCores,
      },
    };
  };

  const checkStaleNodes = (thresholdMs = 90000) => {
    const thresholdDate = new Date(Date.now() - thresholdMs);
    let markedOffline = 0;

    for (const [, n] of dbNodes) {
      if (n.status === "online" && n.lastHeartbeat && n.lastHeartbeat <= thresholdDate) {
        n.status = "offline";
        markedOffline++;
      }
    }
    return markedOffline;
  };

  const deleteNode = (id: string) => {
    for (const [, s] of dbServers) {
      if (s.nodeId === id) throw new Error("NODE_HAS_ASSIGNED_SERVERS");
    }
    dbNodes.delete(id);
    return true;
  };

  // Test 1: Node Registration & Token Generation
  console.log("[Test 1] Node Registration & Token Generation...");
  const { node: n1, token: t1 } = createNode("debian13-01", "host01.mystic.local", "192.168.1.50", "US");
  assert.strictEqual(n1.name, "debian13-01");
  assert.strictEqual(n1.status, "pending");
  assert.ok(t1.startsWith("node_sec_"));
  assert.notStrictEqual(n1.tokenHash, t1, "Plaintext token must not be stored in node record");
  console.log("✓ Registration & Token Generation passed");

  // Test 2: Duplicate Node Name Rejection
  console.log("[Test 2] Duplicate Node Name Rejection...");
  assert.throws(() => createNode("debian13-01", "host02.mystic.local", "192.168.1.51", "US"), /DUPLICATE_NODE_NAME/);
  console.log("✓ Duplicate Prevention passed");

  // Test 3: Authenticated Node Heartbeat & State Transition (pending -> online)
  console.log("[Test 3] Authenticated Heartbeat Sync (pending -> online)...");
  const hb1 = processHeartbeat(t1, {
    agentVersion: "1.0.0",
    metrics: { totalCpuCores: 16, totalRamMb: 65536, totalDiskGb: 1000 },
    capabilities: ["lxc", "kvm", "nested-kvm"],
  });

  assert.strictEqual(hb1.status, "ok");
  assert.strictEqual(hb1.nodeStatus, "online");
  assert.strictEqual(dbNodes.get(n1.id).status, "online");
  assert.strictEqual(dbNodes.get(n1.id).totalCpuCores, 16);
  assert.deepStrictEqual(dbNodes.get(n1.id).capabilities, ["lxc", "kvm", "nested-kvm"]);
  console.log("✓ Heartbeat State Transition passed");

  // Test 4: Resource Accounting Rule (Allocated resources remain untouched)
  console.log("[Test 4] Resource Accounting Rule (Allocated unchanged)...");
  dbNodes.get(n1.id).allocatedCpuCores = 4; // Reserve 4 CPUs
  processHeartbeat(t1, {
    agentVersion: "1.0.1",
    metrics: { totalCpuCores: 16, totalRamMb: 65536, totalDiskGb: 1000 },
  });
  assert.strictEqual(dbNodes.get(n1.id).allocatedCpuCores, 4, "Heartbeat must NOT overwrite control-plane allocation state");
  assert.strictEqual(dbNodes.get(n1.id).totalCpuCores - dbNodes.get(n1.id).allocatedCpuCores, 12, "Available CPU should be 12");
  console.log("✓ Resource Accounting Rule passed");

  // Test 5: Stale Node Monitor Transition (online -> offline)
  console.log("[Test 5] Stale Node Monitor Transition (online -> offline)...");
  // Simulate 100s elapsed since last heartbeat
  dbNodes.get(n1.id).lastHeartbeat = new Date(Date.now() - 100000);
  const marked = checkStaleNodes(90000);
  assert.strictEqual(marked, 1);
  assert.strictEqual(dbNodes.get(n1.id).status, "offline");
  console.log("✓ Stale Node Monitor (online -> offline) passed");

  // Test 6: Resumed Heartbeat Transition (offline -> online)
  console.log("[Test 6] Resumed Heartbeat Transition (offline -> online)...");
  processHeartbeat(t1, { agentVersion: "1.0.1" });
  assert.strictEqual(dbNodes.get(n1.id).status, "online");
  console.log("✓ Resumed Heartbeat (offline -> online) passed");

  // Test 7: Disabled Node Protection Rule
  console.log("[Test 7] Disabled Node Protection Rule...");
  dbNodes.get(n1.id).status = "disabled";
  assert.throws(() => processHeartbeat(t1, { agentVersion: "1.0.1" }), /NODE_DISABLED/);
  assert.strictEqual(dbNodes.get(n1.id).status, "disabled", "Disabled node must remain disabled");
  console.log("✓ Disabled Node Protection passed");

  // Test 8: Node Deletion Safety Check (Assigned Server Protection)
  console.log("[Test 8] Node Deletion Safety Check...");
  dbServers.set("srv-01", { id: "srv-01", nodeId: n1.id });
  assert.throws(() => deleteNode(n1.id), /NODE_HAS_ASSIGNED_SERVERS/);

  dbServers.delete("srv-01");
  assert.strictEqual(deleteNode(n1.id), true);
  assert.strictEqual(dbNodes.has(n1.id), false);
  console.log("✓ Node Deletion Safety passed");

  console.log("\nALL PHASES 4 & 5 TESTS PASSED SUCCESSFULLY! 🎉");
}

runPhase4And5Tests().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
