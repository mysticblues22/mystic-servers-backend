import { bootstrap } from "@mystic/bootstrap";
import { buildNodeAgentApp } from "./app.js";
import { startAgentHeartbeatClient } from "./services/heartbeat-client.service.js";

async function main() {
  try {
    bootstrap();
  } catch {
    // Environment files optional for node agent
  }

  const app = await buildNodeAgentApp();

  const host = process.env.NODE_AGENT_HOST || "0.0.0.0";
  const port = parseInt(process.env.NODE_AGENT_PORT || process.env.PORT || "9090", 10);

  await app.listen({ host, port });

  app.log.info(`Mystic Node Agent listening on ${host}:${port}`);

  // Start background heartbeat loop to control plane if NODE_TOKEN configured
  startAgentHeartbeatClient();
}

main().catch((error) => {
  console.error("[Mystic Node Agent Boot Error]", error);
  process.exit(1);
});
