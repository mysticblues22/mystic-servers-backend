import dotenv from "dotenv";

export interface BootstrapOptions {
  /**
   * Optional environment file.
   *
   * If omitted, dotenv falls back to ".env".
   */
  envFile?: string;
}

export function bootstrap(
  options: BootstrapOptions = {},
): void {
  dotenv.config({
    path: options.envFile,
  });
}
