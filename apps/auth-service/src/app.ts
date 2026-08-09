import {
  createServer,
  type MysticServer,
} from "@mystic/core";

export async function buildApp(): Promise<MysticServer> {
  return createServer();
}
