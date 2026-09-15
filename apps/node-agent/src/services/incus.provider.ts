import { incusDriver } from "../drivers/incus.driver.js";
import {
  IVirtualizationProvider,
  UnimplementedVirtualizationProvider,
  VirtualizationInstanceOptions,
} from "./provider.interface.js";

export class IncusProvider implements IVirtualizationProvider {
  public readonly providerName = "incus";

  async create(options: VirtualizationInstanceOptions): Promise<any> {
    const container = await incusDriver.createContainer({
      name: options.name,
      image: options.image || "images:debian/12",
      cpuCores: options.cpuCores,
      ramMb: options.ramMb,
      diskGb: options.diskGb,
      sshPublicKey: options.sshKeys?.[0],
      hostname: options.hostname,
    });

    return container;
  }

  async start(instanceId: string): Promise<any> {
    incusDriver.startContainer(instanceId);
    return incusDriver.getContainerState(instanceId);
  }

  async stop(instanceId: string): Promise<any> {
    incusDriver.stopContainer(instanceId);
    return incusDriver.getContainerState(instanceId);
  }

  async reboot(instanceId: string): Promise<any> {
    incusDriver.rebootContainer(instanceId);
    return incusDriver.getContainerState(instanceId);
  }

  async destroy(instanceId: string): Promise<any> {
    incusDriver.destroyContainer(instanceId);
    return { status: "DESTROYED" };
  }

  async getState(instanceId: string): Promise<any> {
    return incusDriver.getContainerState(instanceId);
  }

  // Unimplemented operations throw structured 501 NOT_IMPLEMENTED errors
  async reinstall(_instanceId: string, _image: string): Promise<never> {
    return new UnimplementedVirtualizationProvider("incus").reinstall(_instanceId, _image);
  }

  async getMetrics(_instanceId: string): Promise<never> {
    return new UnimplementedVirtualizationProvider("incus").getMetrics(_instanceId);
  }

  async getConsole(_instanceId: string): Promise<never> {
    return new UnimplementedVirtualizationProvider("incus").getConsole(_instanceId);
  }

  async createSnapshot(_instanceId: string, _snapshotName: string): Promise<never> {
    return new UnimplementedVirtualizationProvider("incus").createSnapshot(_instanceId, _snapshotName);
  }
}

export const incusProvider = new IncusProvider();
