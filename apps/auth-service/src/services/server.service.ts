import { db, eq, servers } from "@mystic/database";
import { HttpError } from "../errors/http-error.js";

export async function listCustomerServersService(userId: string) {
  const userServers = await db
    .select()
    .from(servers)
    .where(eq(servers.userId, userId))
    .orderBy(servers.createdAt);

  return { servers: userServers };
}

export async function getCustomerServerByIdService(userId: string, serverId: string) {
  const [server] = await db
    .select()
    .from(servers)
    .where(eq(servers.id, serverId));

  if (!server) {
    throw new HttpError(404, "SERVER_NOT_FOUND", `Server with ID '${serverId}' not found`);
  }

  // IDOR Protection: Verify server belongs to authenticated user
  if (server.userId !== userId) {
    throw new HttpError(403, "FORBIDDEN", "You do not have permission to view this server instance.");
  }

  return { server };
}

export async function listAllServersAdminService() {
  const allServers = await db
    .select()
    .from(servers)
    .orderBy(servers.createdAt);

  return { servers: allServers };
}
