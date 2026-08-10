export interface AuthUser {
  id: string;
  email: string;
  role: "admin" | "user";
}

declare module "fastify" {
  interface FastifyRequest {
    user?: AuthUser;
  }
}
