# Mystic Platform Backend

The Mystic Platform Backend is a reusable backend platform designed to power multiple applications and services.

## Tech Stack

- Node.js 22
- TypeScript
- pnpm Workspace
- PostgreSQL
- Drizzle ORM
- Redis
- MinIO
- Docker
- Nginx Proxy Manager
- Grafana
- Prometheus
- Loki

---

## Repository Structure

```text
apps/
packages/
```

### Apps

- auth-service
- api-gateway
- portfolio-api
- worker

### Packages

- @mystic/config
- @mystic/logger
- @mystic/database
- @mystic/storage
- @mystic/redis
- @mystic/auth

---

## Development

Install dependencies:

```bash
pnpm install
```

Build a package:

```bash
pnpm build
```

---

## Engineering Principles

- Shared packages
- Docker-first
- Type-safe
- Structured logging
- Centralized configuration
- Production-ready by default
