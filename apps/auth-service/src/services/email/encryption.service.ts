import crypto from "node:crypto";
import { HttpError } from "../../errors/http-error.js";

const ALGORITHM = "aes-256-gcm";

function getEncryptionKey(): Buffer {
  const key = process.env.ENCRYPTION_KEY;

  if (!key || key.trim() === "") {
    throw new HttpError(
      500,
      "MISSING_ENCRYPTION_KEY",
      "ENCRYPTION_KEY environment variable is required for storing/decrypting SMTP credentials. No default fallback key is permitted for security compliance.",
    );
  }

  // Hash key to 32 bytes to ensure valid AES-256 key length
  return crypto.createHash("sha256").update(key).digest();
}

export function encryptSecret(plaintext: string): string {
  if (!plaintext) return "";
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(plaintext, "utf8", "hex");
  encrypted += cipher.final("hex");
  const authTag = cipher.getAuthTag().toString("hex");

  return `${iv.toString("hex")}:${authTag}:${encrypted}`;
}

export function decryptSecret(ciphertext: string): string {
  if (!ciphertext) return "";
  const parts = ciphertext.split(":");
  if (parts.length !== 3) {
    throw new HttpError(400, "INVALID_CIPHERTEXT", "Malformed encrypted credential payload");
  }

  const key = getEncryptionKey();
  const iv = Buffer.from(parts[0], "hex");
  const authTag = Buffer.from(parts[1], "hex");
  const encryptedText = parts[2];

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encryptedText, "hex", "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
}
