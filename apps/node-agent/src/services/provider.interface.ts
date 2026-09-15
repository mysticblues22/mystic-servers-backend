export interface VirtualizationInstanceOptions {
  name: string;
  cpuCores: number;
  ramMb: number;
  diskGb: number;
  image: string;
  hostname?: string;
  sshKeys?: string[];
  environment?: Record<string, string>;
}

export interface IVirtualizationProvider {
  readonly providerName: string;

  create(options: VirtualizationInstanceOptions): Promise<any>;
  start(instanceId: string): Promise<any>;
  stop(instanceId: string): Promise<any>;
  reboot(instanceId: string): Promise<any>;
  reinstall(instanceId: string, image: string): Promise<any>;
  destroy(instanceId: string): Promise<any>;
  getState(instanceId: string): Promise<any>;
  getMetrics(instanceId: string): Promise<any>;
  getConsole(instanceId: string): Promise<any>;
  createSnapshot(instanceId: string, snapshotName: string): Promise<any>;
}

export class UnimplementedVirtualizationProvider implements IVirtualizationProvider {
  constructor(public readonly providerName: string) {}

  private notImplemented(methodName: string): never {
    const error: any = new Error(
      `Provider '${this.providerName}' method '${methodName}' is not implemented yet. Provisioning lifecycle operations will be implemented in subsequent phases.`,
    );
    error.statusCode = 501;
    error.code = "NOT_IMPLEMENTED";
    throw error;
  }

  async create(_options: VirtualizationInstanceOptions): Promise<never> {
    return this.notImplemented("create");
  }

  async start(_instanceId: string): Promise<never> {
    return this.notImplemented("start");
  }

  async stop(_instanceId: string): Promise<never> {
    return this.notImplemented("stop");
  }

  async reboot(_instanceId: string): Promise<never> {
    return this.notImplemented("reboot");
  }

  async reinstall(_instanceId: string, _image: string): Promise<never> {
    return this.notImplemented("reinstall");
  }

  async destroy(_instanceId: string): Promise<never> {
    return this.notImplemented("destroy");
  }

  async getState(_instanceId: string): Promise<never> {
    return this.notImplemented("getState");
  }

  async getMetrics(_instanceId: string): Promise<never> {
    return this.notImplemented("getMetrics");
  }

  async getConsole(_instanceId: string): Promise<never> {
    return this.notImplemented("getConsole");
  }

  async createSnapshot(_instanceId: string, _snapshotName: string): Promise<never> {
    return this.notImplemented("createSnapshot");
  }
}
