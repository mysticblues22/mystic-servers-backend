import child_process from "node:child_process";
import fs from "node:fs";

export interface KvmDetectionResult {
  devKvmExists: boolean;
  devKvmAccessible: boolean;
  cpuFlags: string[];
  kvmAvailable: boolean;
}

export interface NestedKvmDetectionResult {
  supported: boolean;
  vendor?: "intel" | "amd" | "none";
  parameterPath?: string;
  parameterValue?: string;
}

export interface IncusDetectionResult {
  installed: boolean;
  socketExists: boolean;
  socketPath?: string;
  daemonReachable: boolean;
  version?: string;
}

export interface NodeCapabilitiesReport {
  kvm: KvmDetectionResult;
  nestedKvm: NestedKvmDetectionResult;
  incus: IncusDetectionResult;
  capabilities: string[];
}

export class CapabilityService {
  /**
   * Detects CPU virtualization support flags from /proc/cpuinfo.
   */
  public getCpuVirtualizationFlags(): string[] {
    const flags: string[] = [];
    try {
      if (fs.existsSync("/proc/cpuinfo")) {
        const content = fs.readFileSync("/proc/cpuinfo", "utf8");
        if (/\bvmx\b/i.test(content)) {
          flags.push("vmx");
        }
        if (/\bsvm\b/i.test(content)) {
          flags.push("svm");
        }
      }
    } catch {
      // Ignore reading errors
    }
    return flags;
  }

  /**
   * Detects presence and permissions of /dev/kvm.
   */
  public detectKvm(): KvmDetectionResult {
    const devKvmExists = fs.existsSync("/dev/kvm");
    let devKvmAccessible = false;

    if (devKvmExists) {
      try {
        fs.accessSync("/dev/kvm", fs.constants.R_OK | fs.constants.W_OK);
        devKvmAccessible = true;
      } catch {
        devKvmAccessible = false;
      }
    }

    const cpuFlags = this.getCpuVirtualizationFlags();
    const hasHardwareVirt = cpuFlags.length > 0 || process.platform === "linux";
    const kvmAvailable = devKvmExists && devKvmAccessible && hasHardwareVirt;

    return {
      devKvmExists,
      devKvmAccessible,
      cpuFlags,
      kvmAvailable,
    };
  }

  /**
   * Detects nested KVM virtualization configuration.
   */
  public detectNestedKvm(): NestedKvmDetectionResult {
    // Check Intel Nested KVM parameter
    const intelPath = "/sys/module/kvm_intel/parameters/nested";
    try {
      if (fs.existsSync(intelPath)) {
        const val = fs.readFileSync(intelPath, "utf8").trim();
        const supported = val === "Y" || val === "1" || val === "true";
        return {
          supported,
          vendor: "intel",
          parameterPath: intelPath,
          parameterValue: val,
        };
      }
    } catch {}

    // Check AMD Nested KVM parameter
    const amdPath = "/sys/module/kvm_amd/parameters/nested";
    try {
      if (fs.existsSync(amdPath)) {
        const val = fs.readFileSync(amdPath, "utf8").trim();
        const supported = val === "Y" || val === "1" || val === "true";
        return {
          supported,
          vendor: "amd",
          parameterPath: amdPath,
          parameterValue: val,
        };
      }
    } catch {}

    return {
      supported: false,
      vendor: "none",
    };
  }

  /**
   * Detects Incus container hypervisor installation and daemon reachability.
   */
  public detectIncus(): IncusDetectionResult {
    let installed = false;
    let version: string | undefined;

    try {
      const res = child_process.spawnSync("incus", ["version"], {
        encoding: "utf8",
        timeout: 3000,
      });

      if (res.status === 0 && res.stdout) {
        installed = true;
        version = res.stdout.trim().split("\n")[0];
      }
    } catch {
      installed = false;
    }

    // Check known socket paths
    const potentialSockets = [
      "/var/lib/incus/unix.socket",
      "/var/snap/incus/common/incus/unix.socket",
    ];

    let socketExists = false;
    let socketPath: string | undefined;

    for (const sp of potentialSockets) {
      if (fs.existsSync(sp)) {
        socketExists = true;
        socketPath = sp;
        break;
      }
    }

    let daemonReachable = false;
    if (installed || socketExists) {
      try {
        const infoRes = child_process.spawnSync("incus", ["info"], {
          encoding: "utf8",
          timeout: 3000,
        });
        if (infoRes.status === 0) {
          daemonReachable = true;
        }
      } catch {}
    }

    return {
      installed,
      socketExists,
      socketPath,
      daemonReachable,
      version,
    };
  }

  /**
   * Generates a complete report of host virtualization capabilities.
   */
  public getCapabilitiesReport(): NodeCapabilitiesReport {
    const kvm = this.detectKvm();
    const nestedKvm = this.detectNestedKvm();
    const incus = this.detectIncus();

    const capabilities: string[] = [];

    if (incus.installed || incus.daemonReachable) {
      capabilities.push("lxc");
    }

    if (kvm.kvmAvailable) {
      capabilities.push("kvm");
    }

    if (kvm.kvmAvailable && nestedKvm.supported) {
      capabilities.push("nested-kvm");
    }

    return {
      kvm,
      nestedKvm,
      incus,
      capabilities,
    };
  }
}

export const capabilityService = new CapabilityService();
