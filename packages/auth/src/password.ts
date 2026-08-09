import argon2 from "argon2";

/**
 * Hash a plain-text password.
 */
export async function hashPassword(
  password: string,
): Promise<string> {
  return argon2.hash(password, {
    type: argon2.argon2id,

    memoryCost: 65_536,

    timeCost: 3,

    parallelism: 1,
  });
}

/**
 * Verify a password against its hash.
 */
export async function verifyPassword(
  password: string,
  hash: string,
): Promise<boolean> {
  return argon2.verify(hash, password);
}
