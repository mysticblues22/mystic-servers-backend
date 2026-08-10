# Mystic Infrastructure Documentation

Version: 1.0

---

# Overview

Mystic Infrastructure is a self-hosted platform designed to provide secure, scalable, and production-ready infrastructure for hosting services.

The platform is built around containerized microservices and is designed to power multiple future products including:

- Mystic Server
- Antigravity Panel
- VPS Hosting
- Game Server Hosting
- API Services
- Customer Portal

The infrastructure emphasizes:

- Security
- High Availability
- Maintainability
- Scalability
- Automation

---

# Technology Stack

## Operating System

- Rocky Linux 9

## Container Platform

- Docker
- Docker Compose

## Reverse Proxy

- Nginx Proxy Manager

## Database

- PostgreSQL 17

## ORM

- Drizzle ORM

## Backend

- Node.js
- Fastify
- TypeScript

## Package Manager

- pnpm

## Authentication

- JWT
- Refresh Token Rotation
- Argon2 Password Hashing

## Logging

- Loki
- Promtail
- Dozzle

---

# Current Services

| Service | Status |
|----------|--------|
| PostgreSQL | ✅ Running |
| Auth Service | ✅ Running |
| Nginx Proxy Manager | ✅ Running |
| Loki | ✅ Running |
| Promtail | ✅ Running |
| Dozzle | ✅ Running |

---

# Current Authentication Features

- User Registration
- Login
- Logout
- Refresh Tokens
- JWT Authentication
- Email Verification
- Password Reset
- Role Based Authorization
- Protected Routes
- Session Management

---

# Repository Layout

```
backend/
    apps/
    packages/
    docker/

infrastructure/
    compose/
    env/

docs/
```

---

# Documentation Structure

| File | Description |
|------|-------------|
| 00-introduction.md | Project Overview |
| 01-infrastructure.md | VPS Documentation |
| 02-docker.md | Docker Infrastructure |
| 03-security.md | Security Documentation |
| 04-database.md | PostgreSQL & Drizzle |
| 05-authentication.md | Authentication System |
| 06-api.md | REST API Documentation |
| 07-deployment.md | Deployment Guide |
| 08-backup.md | Backup & Recovery |
| 09-developer-guide.md | Developer Guide |
| 10-engineering-journal.md | Engineering Journal |

---

# Design Principles

- Keep services independent.
- Keep infrastructure reproducible.
- Prefer security over convenience.
- Everything should be containerized where practical.
- Every change should be documented.
- Infrastructure should be recoverable from backups.
- Authentication is centralized through the Auth Service.

---

# Future Services

- Billing Service
- Customer Service
- VPS Service
- Node Manager
- Payment Service
- Notification Service
- Email Service
- Monitoring Dashboard
- Admin Panel

---

# Development Workflow

1. Update source code.
2. Build project.
3. Build Docker image.
4. Recreate container.
5. Test API.
6. Document changes.
7. Commit to Git.

---

# Version History

## Version 1.0

Initial production-ready authentication service including:

- Registration
- Login
- Logout
- JWT
- Refresh Rotation
- Password Reset
- Email Verification
- RBAC
- PostgreSQL
- Docker Deployment
