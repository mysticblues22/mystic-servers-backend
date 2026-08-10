# Introduction

## Purpose

Mystic Infrastructure is the backend platform powering all Mystic services.

Instead of building isolated applications, the platform follows a modular architecture where every component is an independent service.

Each service communicates using HTTP APIs over an isolated Docker network.

---

# Objectives

The infrastructure has been designed with the following objectives:

- Security
- Reliability
- Scalability
- Simplicity
- Maintainability

---

# Architecture

```
                Internet
                    │
                    ▼
        Nginx Proxy Manager
                    │
      ┌─────────────┴─────────────┐
      ▼                           ▼
 Auth Service               Future Services
      │
      ▼
 PostgreSQL
```

---

# Authentication

Authentication is centralized into a dedicated Auth Service.

The Auth Service is responsible for:

- User Registration
- Login
- Logout
- Refresh Tokens
- Password Reset
- Email Verification
- JWT Generation
- Role Based Authorization

No other service stores passwords.

---

# Repository Structure

```
backend/

    apps/
        auth-service/

    packages/
        auth/
        bootstrap/
        config/
        core/
        database/
        logger/

    docker/

infrastructure/

    compose/
    env/

docs/
```

---

# Coding Standards

- TypeScript everywhere
- Repository Pattern
- Service Layer
- Controllers remain thin
- Validation using Zod
- Database through Drizzle ORM
- JWT authentication
- Argon2 password hashing

---

# Authentication Flow

```
Client

↓

Fastify Route

↓

Controller

↓

Service

↓

Repository

↓

PostgreSQL

↓

JWT Generation

↓

Response
```

---

# Deployment Workflow

Developer

↓

Git Repository

↓

Docker Build

↓

Docker Image

↓

Docker Compose

↓

Running Container

---

# Security Principles

- Passwords are never stored in plaintext.
- Password reset tokens are hashed.
- JWT access tokens are short-lived.
- Refresh tokens are stored in the database.
- Refresh token rotation prevents replay attacks.
- Sessions can be revoked.
- Email verification is required.
- Role-based authorization protects privileged endpoints.

---

# Long-Term Vision

The current authentication service forms the foundation of the complete Mystic ecosystem.

Future services will authenticate exclusively through this Auth Service, enabling centralized identity management across the platform.
