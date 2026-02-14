import { randomBytes, createCipheriv, createDecipheriv } from "node:crypto";
const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;
function getEncryptionKey() {
  const key = process.env.ENCRYPTION_KEY;
  if (!key) {
    throw new Error("ENCRYPTION_KEY environment variable is not set");
  }
  const keyBuffer = Buffer.from(key, "base64");
  if (keyBuffer.length !== 32) {
    throw new Error("ENCRYPTION_KEY must be a base64-encoded 32-byte key");
  }
  return keyBuffer;
}
function encryptToken(plaintext) {
  const key = getEncryptionKey();
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  const result = {
    iv: iv.toString("base64"),
    encrypted: encrypted.toString("base64"),
    authTag: authTag.toString("base64")
  };
  return Buffer.from(JSON.stringify(result)).toString("base64");
}
function decryptToken(ciphertext) {
  const key = getEncryptionKey();
  const parsed = JSON.parse(Buffer.from(ciphertext, "base64").toString("utf8"));
  const iv = Buffer.from(parsed.iv, "base64");
  const encrypted = Buffer.from(parsed.encrypted, "base64");
  const authTag = Buffer.from(parsed.authTag, "base64");
  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);
  const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
  return decrypted.toString("utf8");
}
export {
  decryptToken as d,
  encryptToken as e
};
