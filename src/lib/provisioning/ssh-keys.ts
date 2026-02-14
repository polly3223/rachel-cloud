/**
 * SSH key pair generation utility for VPS provisioning.
 *
 * Generates RSA 4096-bit key pairs using Node.js built-in crypto module.
 * - Public key: OpenSSH format (ssh-rsa ...) for Hetzner SSH key upload and cloud-init authorized_keys
 * - Private key: PKCS8 PEM format for ssh2 library connections
 *
 * No external dependencies required.
 */

import { generateKeyPairSync } from 'node:crypto';
import type { SSHKeyPair } from './types';

/**
 * Generate an RSA 4096-bit SSH key pair for VPS access.
 *
 * @returns SSHKeyPair with publicKey in OpenSSH format and privateKey in PKCS8 PEM format
 *
 * @example
 * ```typescript
 * const { publicKey, privateKey } = generateSSHKeyPair();
 * // publicKey: "ssh-rsa AAAAB3NzaC1yc2EA..."
 * // privateKey: "-----BEGIN PRIVATE KEY-----\nMIIJQg..."
 * ```
 */
export function generateSSHKeyPair(): SSHKeyPair {
	const { publicKey, privateKey } = generateKeyPairSync('rsa', {
		modulusLength: 4096,
		publicKeyEncoding: {
			type: 'spki',
			format: 'der'
		},
		privateKeyEncoding: {
			type: 'pkcs8',
			format: 'pem'
		}
	});

	// Convert DER-encoded SPKI public key to OpenSSH format (ssh-rsa ...)
	const sshPublicKey = derToOpenSSH(publicKey as unknown as Buffer);

	return {
		publicKey: sshPublicKey,
		privateKey: privateKey as string
	};
}

/**
 * Convert a DER-encoded SPKI RSA public key to OpenSSH wire format (ssh-rsa ...).
 *
 * OpenSSH format: "ssh-rsa <base64-encoded-key-data>"
 * Key data is: string("ssh-rsa") + mpint(e) + mpint(n)
 * where string and mpint are encoded as uint32 length prefix + data.
 */
function derToOpenSSH(spkiDer: Buffer): string {
	// Parse the SPKI DER structure to extract RSA modulus (n) and exponent (e)
	const { n, e } = parseRSAPublicKeyDER(spkiDer);

	// Build OpenSSH wire format
	const keyType = Buffer.from('ssh-rsa');
	const parts = [
		encodeSSHString(keyType),
		encodeSSHMpint(e),
		encodeSSHMpint(n)
	];

	const keyData = Buffer.concat(parts);
	return `ssh-rsa ${keyData.toString('base64')}`;
}

/**
 * Encode a buffer as an SSH string (uint32 big-endian length + data).
 */
function encodeSSHString(data: Buffer): Buffer {
	const lengthBuf = Buffer.alloc(4);
	lengthBuf.writeUInt32BE(data.length, 0);
	return Buffer.concat([lengthBuf, data]);
}

/**
 * Encode a buffer as an SSH mpint (uint32 big-endian length + data, with leading zero if high bit set).
 */
function encodeSSHMpint(data: Buffer): Buffer {
	// If the high bit is set, prepend a zero byte to indicate positive number
	if (data.length > 0 && (data[0] & 0x80) !== 0) {
		const padded = Buffer.alloc(data.length + 1);
		padded[0] = 0;
		data.copy(padded, 1);
		data = padded;
	}

	return encodeSSHString(data);
}

/**
 * Parse an RSA public key from DER-encoded SPKI format.
 * Extracts the modulus (n) and exponent (e) from the ASN.1 structure.
 *
 * SPKI structure:
 *   SEQUENCE {
 *     SEQUENCE { OID, NULL }      -- algorithm identifier
 *     BIT STRING {
 *       SEQUENCE {
 *         INTEGER (n)             -- modulus
 *         INTEGER (e)             -- exponent
 *       }
 *     }
 *   }
 */
function parseRSAPublicKeyDER(der: Buffer): { n: Buffer; e: Buffer } {
	let offset = 0;

	// Parse outer SEQUENCE
	const outer = parseDERTag(der, offset);
	offset = outer.contentOffset;

	// Parse algorithm identifier SEQUENCE (skip it)
	const algId = parseDERTag(der, offset);
	offset = algId.contentOffset + algId.length;

	// Parse BIT STRING
	const bitString = parseDERTag(der, offset);
	// Skip the "unused bits" byte in BIT STRING
	offset = bitString.contentOffset + 1;

	// Parse inner SEQUENCE (containing n and e)
	const inner = parseDERTag(der, offset);
	offset = inner.contentOffset;

	// Parse INTEGER (modulus n)
	const nTag = parseDERTag(der, offset);
	let n = der.subarray(nTag.contentOffset, nTag.contentOffset + nTag.length);
	offset = nTag.contentOffset + nTag.length;

	// Parse INTEGER (exponent e)
	const eTag = parseDERTag(der, offset);
	let e = der.subarray(eTag.contentOffset, eTag.contentOffset + eTag.length);

	// Strip leading zero bytes from ASN.1 INTEGER encoding (sign padding)
	if (n.length > 0 && n[0] === 0) {
		n = n.subarray(1);
	}
	if (e.length > 0 && e[0] === 0) {
		e = e.subarray(1);
	}

	return { n, e };
}

/**
 * Parse a single DER tag and return its type, length, and content offset.
 */
function parseDERTag(
	buf: Buffer,
	offset: number
): { tag: number; length: number; contentOffset: number } {
	const tag = buf[offset];
	offset += 1;

	let length = buf[offset];
	offset += 1;

	if (length & 0x80) {
		// Long form: high bit set means the low 7 bits encode how many length bytes follow
		const numLengthBytes = length & 0x7f;
		length = 0;
		for (let i = 0; i < numLengthBytes; i++) {
			length = (length << 8) | buf[offset];
			offset += 1;
		}
	}

	return { tag, length, contentOffset: offset };
}
