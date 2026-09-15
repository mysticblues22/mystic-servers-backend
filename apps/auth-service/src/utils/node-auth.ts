import crypto from "node:crypto";

/**
 * Generates a cryptographically secure, random node credential token.
 * Example format: "node_sec_3f8b91..."
 */
export function generateNodeToken(): string {
  const bytes = crypto.randomBytes(32).toString("hex");
  return `node_sec_${bytes}`;
}

/**
 * Computes a SHA-256 hash of a node token for database storage and verification.
 * Plaintext node tokens must NEVER be stored in the database.
 */
export function hashNodeToken(token: string): string {
  if (!token || typeof token !== "string") {
    throw new Error("Invalid token format for hashing");
  }
  return crypto.createHash("sha256").update(token.trim()).digest("hex");
}

/**
 * Performs a timing-safe verification of a node token against a stored token hash.
 */
export function verifyNodeToken(token: string, expectedHash: string): boolean {
  if (!token || !expectedHash) return false;
  const hash = hashNodeToken(token);
  try {
    return crypto.timingSafeEqual(
      Buffer.from(hash, "utf8"),
      Buffer.from(expectedHash, "utf8"),
    );
  } catch {
    return false;
  }
}
