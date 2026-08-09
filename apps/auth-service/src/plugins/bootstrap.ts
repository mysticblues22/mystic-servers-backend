import { bootstrap } from "@mystic/bootstrap";

export function initializeBootstrap(): void {
  bootstrap({
    envFile: "/srv/git/infrastructure/env/backend.env",
  });
}
