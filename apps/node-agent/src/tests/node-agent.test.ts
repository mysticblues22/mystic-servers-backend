import assert from "node:assert";
import { generateNodeToken, hashNodeToken, verifyNodeToken } from "../auth/node-auth.js";
import { capabilityService } from "../services/capability.service.js";
import { hostInfoService } from "../services/host-info.service.js";
import { UnimplementedVirtualizationProvider } from "../services/provider.interface.js";

async function runTests() {
  console.log("=== RUNNING NODE AGENT & PLATFORM TESTS ===");

  // 1. Authentication Tests
  console.log("[Test 1] Node Token Generation & Hashing...");
  const token = generateNodeToken();
  assert.ok(token.startsWith("node_sec_"), "Token should have node_sec_ prefix");
  assert.strictEqual(token.length, 73, "Token length should be 73 characters");

  const hash = hashNodeToken(token);
  assert.strictEqual(typeof hash, "string", "Hash should be string");
  assert.strictEqual(hash.length, 64, "SHA-256 hash should be 64 hex characters");
  assert.notStrictEqual(token, hash, "Plaintext token must not equal hash");

  const isValid = verifyNodeToken(token, hash);
  assert.strictEqual(isValid, true, "Valid token must pass verification");

  const isInvalid = verifyNodeToken("node_sec_invalid_token_1234567890", hash);
  assert.strictEqual(isInvalid, false, "Invalid token must fail verification");
  console.log("✓ Node Token Auth passed");

  // 2. Hardware Detection Tests
  console.log("[Test 2] Host Info Detection...");
  const cpu = hostInfoService.getCpuInfo();
  assert.ok(cpu.cores >= 1, "CPU cores should be >= 1");
  assert.ok(typeof cpu.model === "string", "CPU model should be string");

  const memory = hostInfoService.getMemoryInfo();
  assert.ok(memory.totalMb > 0, "Total RAM should be > 0 MB");
  assert.ok(memory.freeMb >= 0, "Free RAM should be >= 0 MB");

  const disk = hostInfoService.getDiskInfo();
  assert.ok(disk.totalGb > 0, "Total Disk should be > 0 GB");
  console.log("✓ Host Hardware Detection passed");

  // 3. Capability Detection Schema & Report Tests
  console.log("[Test 3] Virtualization Capability Detection...");
  const report = capabilityService.getCapabilitiesReport();
  assert.ok(Array.isArray(report.capabilities), "Capabilities should be an array");
  assert.ok(typeof report.kvm.kvmAvailable === "boolean", "KVM available should be boolean");
  assert.ok(typeof report.nestedKvm.supported === "boolean", "Nested KVM supported should be boolean");
  assert.ok(typeof report.incus.installed === "boolean", "Incus installed should be boolean");
  console.log("✓ Capability Detection passed");

  // 4. Provider Interface Unimplemented Error Handling
  console.log("[Test 4] Provider Abstraction Interface...");
  const provider = new UnimplementedVirtualizationProvider("incus");
  assert.strictEqual(provider.providerName, "incus");

  try {
    await provider.create({
      name: "test-vps",
      cpuCores: 2,
      ramMb: 2048,
      diskGb: 20,
      image: "ubuntu:24.04",
    });
    assert.fail("Should have thrown NOT_IMPLEMENTED error");
  } catch (err: any) {
    assert.strictEqual(err.statusCode, 501, "Should return 501 Not Implemented");
    assert.strictEqual(err.code, "NOT_IMPLEMENTED");
  }
  console.log("✓ Provider Interface passed");

  // 5. Resource Allocation Lock & Validation Logic
  console.log("[Test 5] Capacity Validation Rules...");
  const validateCapacity = (totalCpu: number, totalRam: number, totalDisk: number, allocCpu: number, allocRam: number, allocDisk: number) => {
    if (allocCpu < 0 || allocRam < 0 || allocDisk < 0) {
      throw new Error("Negative capacity");
    }
    if (allocCpu > totalCpu || allocRam > totalRam || allocDisk > totalDisk) {
      throw new Error("Overselling prevented");
    }
    return true;
  };

  assert.strictEqual(validateCapacity(10, 65536, 500, 4, 16384, 100), true);
  assert.throws(() => validateCapacity(10, 65536, 500, -1, 16384, 100), /Negative capacity/);
  assert.throws(() => validateCapacity(10, 65536, 500, 12, 16384, 100), /Overselling prevented/);
  console.log("✓ Resource Validation passed");

  console.log("\nALL NODE AGENT TESTS PASSED SUCCESSFULLY! 🎉");
}

runTests().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
