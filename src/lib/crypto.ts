import "server-only";
import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
} from "crypto";

/**
 * App-level AES-256-GCM encryption for secrets stored in the shared multi-tenant
 * database (GHL access/refresh tokens). The key is derived from TOKEN_ENCRYPTION_KEY
 * (any sufficiently random string; we hash it to 32 bytes).
 *
 * Encrypted format: base64( iv[12] || authTag[16] || ciphertext ), prefixed with
 * "enc:v1:" so legacy/plaintext values can be detected and handled gracefully.
 */

const PREFIX = "enc:v1:";
const ALGO = "aes-256-gcm";
const IV_LEN = 12;

function getKey(): Buffer {
  const secret =
    process.env.TOKEN_ENCRYPTION_KEY ||
    process.env.NEXTAUTH_SECRET ||
    "";
  if (!secret) {
    throw new Error(
      "TOKEN_ENCRYPTION_KEY (or NEXTAUTH_SECRET) is required to encrypt secrets."
    );
  }
  // Normalize any-length secret to a 32-byte key.
  return createHash("sha256").update(secret).digest();
}

export function encryptSecret(plaintext: string): string {
  if (!plaintext) return plaintext;
  const key = getKey();
  const iv = randomBytes(IV_LEN);
  const cipher = createCipheriv(ALGO, key, iv);
  const ciphertext = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();
  const packed = Buffer.concat([iv, authTag, ciphertext]).toString("base64");
  return `${PREFIX}${packed}`;
}

export function decryptSecret(value: string | null | undefined): string {
  if (!value) return "";
  // Backwards-compatible: anything not in our format is treated as plaintext.
  if (!value.startsWith(PREFIX)) return value;
  const key = getKey();
  const packed = Buffer.from(value.slice(PREFIX.length), "base64");
  const iv = packed.subarray(0, IV_LEN);
  const authTag = packed.subarray(IV_LEN, IV_LEN + 16);
  const ciphertext = packed.subarray(IV_LEN + 16);
  const decipher = createDecipheriv(ALGO, key, iv);
  decipher.setAuthTag(authTag);
  const plaintext = Buffer.concat([
    decipher.update(ciphertext),
    decipher.final(),
  ]);
  return plaintext.toString("utf8");
}
