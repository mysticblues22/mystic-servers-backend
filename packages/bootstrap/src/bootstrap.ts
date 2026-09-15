import dotenv from "dotenv";
import fs from "node:fs";
import path from "node:path";

export interface BootstrapOptions {
  /**
   * Optional environment file.
   *
   * If omitted, dotenv falls back to standard candidate paths or .env.
   */
  envFile?: string;
}

export function bootstrap(options: BootstrapOptions = {}): void {
  // Always prioritize local .env in current working directory if present
  const localEnvPath = path.resolve(process.cwd(), ".env");
  if (fs.existsSync(localEnvPath)) {
    dotenv.config({ path: localEnvPath });
  }

  const candidates = [
    process.env.ENV_FILE,
    options.envFile,
    "../../../infrastructure/env/backend.env",
    "../../infrastructure/env/backend.env",
    "../infrastructure/env/backend.env",
    "/srv/git/infrastructure/env/backend.env",
  ].filter((p): p is string => Boolean(p));

  for (const envPath of candidates) {
    const resolvedPath = path.resolve(envPath);
    if (fs.existsSync(resolvedPath)) {
      dotenv.config({ path: resolvedPath });
      break;
    }
  }

  dotenv.config();
}
