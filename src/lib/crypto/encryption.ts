import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;

/**
 * Get and validate the encryption key from environment variables.
 * The key must be a base64-encoded 32-byte (256-bit) key.
 */
function getEncryptionKey(): Buffer {
	const key = process.env.ENCRYPTION_KEY;
	if (!key) {
		throw new Error('ENCRYPTION_KEY environment variable is not set');
	}

	const keyBuffer = Buffer.from(key, 'base64');
	if (keyBuffer.length !== 32) {
		throw new Error('ENCRYPTION_KEY must be a base64-encoded 32-byte key');
	}

	return keyBuffer;
}

/**
 * Encrypt a plaintext string using AES-256-GCM.
 * Returns a base64-encoded JSON string containing the IV, encrypted data, and auth tag.
 */
export function encryptToken(plaintext: string): string {
	const key = getEncryptionKey();
	const iv = randomBytes(IV_LENGTH);

	const cipher = createCipheriv(ALGORITHM, key, iv);
	const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
	const authTag = cipher.getAuthTag();

	const result = {
		iv: iv.toString('base64'),
		encrypted: encrypted.toString('base64'),
		authTag: authTag.toString('base64')
	};

	return Buffer.from(JSON.stringify(result)).toString('base64');
}

/**
 * Decrypt a ciphertext string that was encrypted with encryptToken.
 * The ciphertext should be a base64-encoded JSON string.
 */
export function decryptToken(ciphertext: string): string {
	const key = getEncryptionKey();

	// Parse the ciphertext
	const parsed = JSON.parse(Buffer.from(ciphertext, 'base64').toString('utf8'));
	const iv = Buffer.from(parsed.iv, 'base64');
	const encrypted = Buffer.from(parsed.encrypted, 'base64');
	const authTag = Buffer.from(parsed.authTag, 'base64');

	const decipher = createDecipheriv(ALGORITHM, key, iv);
	decipher.setAuthTag(authTag);

	const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
	return decrypted.toString('utf8');
}
