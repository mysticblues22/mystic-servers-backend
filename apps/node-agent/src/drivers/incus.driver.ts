import child_process from "node:child_process";
import fs from "node:fs";

export interface IncusContainerCreateOptions {
  name: string; // Sanitized Incus instance name e.g. "ms-srv-123456"
  image?: string; // Image e.g. "images:debian/12" or "images:ubuntu/24.04"
  cpuCores: number;
  ramMb: number;
  diskGb: number;
  sshPublicKey?: string;
  hostname?: string;
}

export interface IncusContainerState {
  name: string;
  status: "RUNNING" | "STOPPED" | "FROZEN" | "ERROR" | "UNKNOWN";
  statusCode: number;
  pid?: number;
  ips: {
    privateIp?: string;
    publicIp?: string;
  };
}

export class IncusDriver {
  /**
   * Checks if Incus binary and local daemon socket are available and responsive.
   */
  public isAvailable(): { available: boolean; reason?: string } {
    try {
      const res = child_process.spawnSync("incus", ["version"], {
        encoding: "utf8",
        timeout: 3000,
      });

      if (res.status !== 0) {
        return { available: false, reason: "Incus binary returned non-zero exit code" };
      }

      const info = child_process.spawnSync("incus", ["info"], {
        encoding: "utf8",
        timeout: 3000,
      });

      if (info.status !== 0) {
        return { available: false, reason: "Incus daemon is not reachable (incus info failed)" };
      }

      return { available: true };
    } catch (err: any) {
      return { available: false, reason: `Incus detection failed: ${err?.message || err}` };
    }
  }

  /**
   * Creates, configures limits, injects SSH key, and boots an LXC container in Incus.
   */
  public async createContainer(options: IncusContainerCreateOptions): Promise<IncusContainerState> {
    const availability = this.isAvailable();
    if (!availability.available) {
      const err: any = new Error(`Incus hypervisor is unavailable: ${availability.reason}`);
      err.statusCode = 503;
      err.code = "INCUS_UNAVAILABLE";
      throw err;
    }

    // Validate container name format strictly (a-z, 0-9, dash)
    if (!/^[a-zA-Z0-9-]{2,63}$/.test(options.name)) {
      const err: any = new Error(`Invalid container name format '${options.name}'. Must be alphanumeric and 2-63 characters.`);
      err.statusCode = 400;
      err.code = "INVALID_CONTAINER_NAME";
      throw err;
    }

    const imageRef = options.image || "images:debian/12";

    // 1. Launch instance
    const launchRes = child_process.spawnSync("incus", ["launch", imageRef, options.name], {
      encoding: "utf8",
      timeout: 120000,
    });

    if (launchRes.status !== 0) {
      const err: any = new Error(`Failed to launch Incus container '${options.name}': ${launchRes.stderr || launchRes.stdout}`);
      err.statusCode = 500;
      err.code = "CONTAINER_LAUNCH_FAILED";
      throw err;
    }

    try {
      // 2. Configure resource limits
      child_process.execSync(`incus config set ${options.name} limits.cpu ${options.cpuCores}`);
      child_process.execSync(`incus config set ${options.name} limits.memory ${options.ramMb}MB`);

      // Try setting root disk size (supported on ZFS, Btrfs, or LVM storage pools)
      try {
        child_process.execSync(`incus config device set ${options.name} root size ${options.diskGb}GiB`);
      } catch {
        // Ignore if storage driver does not support dynamic root quotas
      }

      // 3. Configure SSH Public Key if provided
      if (options.sshPublicKey && options.sshPublicKey.trim()) {
        const key = options.sshPublicKey.trim();
        const sshCmd = `mkdir -p /root/.ssh && echo "${key.replace(/"/g, '\\"')}" >> /root/.ssh/authorized_keys && chmod 700 /root/.ssh && chmod 600 /root/.ssh/authorized_keys`;
        
        // Wait up to 10 seconds for container OS initialization before injecting SSH key
        let injected = false;
        for (let attempt = 1; attempt <= 10; attempt++) {
          const sshRes = child_process.spawnSync("incus", ["exec", options.name, "--", "sh", "-c", sshCmd], {
            encoding: "utf8",
            timeout: 5000,
          });
          if (sshRes.status === 0) {
            injected = true;
            break;
          }
          child_process.spawnSync("sleep", ["1"]);
        }

        if (!injected) {
          console.warn(`[IncusDriver Warning] SSH key injection could not verify execution on container '${options.name}' within 10s.`);
        }
      }

      // 4. Query state
      return this.getContainerState(options.name);
    } catch (err: any) {
      // Clean up failed container if post-launch configuration fails
      this.destroyContainer(options.name);
      throw err;
    }
  }

  public startContainer(name: string): void {
    const res = child_process.spawnSync("incus", ["start", name], { encoding: "utf8", timeout: 15000 });
    if (res.status !== 0) {
      throw new Error(`Failed to start Incus container '${name}': ${res.stderr}`);
    }
  }

  public stopContainer(name: string): void {
    const res = child_process.spawnSync("incus", ["stop", name], { encoding: "utf8", timeout: 15000 });
    if (res.status !== 0) {
      throw new Error(`Failed to stop Incus container '${name}': ${res.stderr}`);
    }
  }

  public rebootContainer(name: string): void {
    const res = child_process.spawnSync("incus", ["restart", name], { encoding: "utf8", timeout: 15000 });
    if (res.status !== 0) {
      throw new Error(`Failed to reboot Incus container '${name}': ${res.stderr}`);
    }
  }

  public destroyContainer(name: string): void {
    child_process.spawnSync("incus", ["delete", name, "--force"], { encoding: "utf8", timeout: 30000 });
  }

  public getContainerState(name: string): IncusContainerState {
    const res = child_process.spawnSync("incus", ["info", name, "--format", "json"], {
      encoding: "utf8",
      timeout: 5000,
    });

    if (res.status !== 0) {
      return {
        name,
        status: "STOPPED",
        statusCode: 102,
        ips: {},
      };
    }

    try {
      const data = JSON.parse(res.stdout);
      const rawStatus = (data.status || "UNKNOWN").toUpperCase();

      let privateIp: string | undefined;
      let publicIp: string | undefined;

      if (data.state && data.state.network) {
        for (const netName of Object.keys(data.state.network)) {
          const net = data.state.network[netName];
          if (net.addresses) {
            for (const addr of net.addresses) {
              if (addr.family === "inet" && addr.scope === "global") {
                if (addr.address.startsWith("10.") || addr.address.startsWith("192.168.") || addr.address.startsWith("172.")) {
                  privateIp = addr.address;
                } else {
                  publicIp = addr.address;
                }
              }
            }
          }
        }
      }

      return {
        name,
        status: rawStatus === "RUNNING" ? "RUNNING" : rawStatus === "STOPPED" ? "STOPPED" : "UNKNOWN",
        statusCode: data.status_code || 103,
        pid: data.state?.pid,
        ips: {
          privateIp,
          publicIp,
        },
      };
    } catch {
      return {
        name,
        status: "UNKNOWN",
        statusCode: 0,
        ips: {},
      };
    }
  }
}

export const incusDriver = new IncusDriver();
