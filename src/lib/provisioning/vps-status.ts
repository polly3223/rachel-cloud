/**
 * VPS status checking and service management utilities.
 *
 * Provides functions for checking VPS status via Hetzner API,
 * restarting the rachel8 service, fetching logs, and checking
 * uptime -- all via SSH to the user's VPS.
 *
 * @module vps-status
 */

import { HetznerClient } from './hetzner-client';
import { execSSHCommand } from './ssh-exec';
import { decryptToken } from '$lib/crypto/encryption';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** VPS status information from the Hetzner API. */
export interface VPSStatus {
	/** Server lifecycle status (running, off, starting, etc.) */
	status: string;
	/** Public IPv4 address. */
	ip: string;
	/** ISO timestamp of server creation. */
	created: string;
	/** Datacenter name and location. */
	datacenter: string;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Get VPS status from the Hetzner API.
 *
 * Uses the existing HetznerClient.getServer() method to retrieve
 * real-time server status including IP, datacenter, and lifecycle state.
 *
 * @param hetznerServerId - The Hetzner server ID
 * @returns VPS status information
 */
export async function getVPSStatus(hetznerServerId: number): Promise<VPSStatus> {
	try {
		const client = new HetznerClient({
			apiToken: process.env.HETZNER_API_TOKEN!,
		});

		const { server } = await client.getServer(hetznerServerId);

		return {
			status: server.status,
			ip: server.public_net.ipv4.ip,
			created: server.created,
			datacenter: `${server.datacenter.name} (${server.datacenter.location.city}, ${server.datacenter.location.country})`,
		};
	} catch (error) {
		console.error(`Failed to get VPS status for server ${hetznerServerId}:`, error);
		return {
			status: 'unknown',
			ip: '',
			created: '',
			datacenter: '',
		};
	}
}

/**
 * Restart the rachel8 systemd service on a user's VPS via SSH.
 *
 * Sends `sudo systemctl restart rachel8`, waits 2 seconds for the
 * service to come back up, then verifies it is active.
 *
 * @param host - VPS IP address
 * @param encryptedPrivateKey - Encrypted SSH private key from the database
 * @returns Result with success flag and message
 */
export async function restartRachelService(
	host: string,
	encryptedPrivateKey: string
): Promise<{ success: boolean; message: string }> {
	try {
		const privateKey = decryptToken(encryptedPrivateKey);

		// Send restart command
		const restartResult = await execSSHCommand({
			host,
			privateKey,
			command: 'sudo systemctl restart rachel8',
		});

		if (restartResult.exitCode !== 0) {
			return {
				success: false,
				message: `Restart command failed: ${restartResult.stderr || 'Unknown error'}`,
			};
		}

		// Wait 2 seconds for the service to come back up
		await new Promise((resolve) => setTimeout(resolve, 2000));

		// Verify service is active
		const statusResult = await execSSHCommand({
			host,
			privateKey,
			command: 'sudo systemctl is-active rachel8',
		});

		if (statusResult.stdout === 'active') {
			return { success: true, message: 'Service restarted successfully' };
		}

		return {
			success: false,
			message: `Service not active after restart (status: ${statusResult.stdout})`,
		};
	} catch (error) {
		console.error(`Failed to restart rachel8 service on ${host}:`, error);
		return {
			success: false,
			message: 'Failed to connect to VPS',
		};
	}
}

/**
 * Fetch recent log lines from the rachel8 service via SSH.
 *
 * Retrieves journal output using `journalctl -u rachel8 -n <lines> --no-pager`.
 *
 * @param host - VPS IP address
 * @param encryptedPrivateKey - Encrypted SSH private key from the database
 * @param lines - Number of log lines to fetch (default: 100)
 * @returns Result with log content and success flag
 */
export async function fetchServiceLogs(
	host: string,
	encryptedPrivateKey: string,
	lines: number = 100
): Promise<{ logs: string; success: boolean }> {
	try {
		const privateKey = decryptToken(encryptedPrivateKey);

		const result = await execSSHCommand({
			host,
			privateKey,
			command: `journalctl -u rachel8 -n ${lines} --no-pager`,
		});

		return {
			logs: result.stdout,
			success: true,
		};
	} catch (error) {
		console.error(`Failed to fetch logs from ${host}:`, error);
		return {
			logs: '',
			success: false,
		};
	}
}

/**
 * Get the system uptime of a VPS via SSH.
 *
 * Executes `uptime -p` which returns human-readable output like
 * "up 3 days, 2 hours, 15 minutes".
 *
 * @param host - VPS IP address
 * @param encryptedPrivateKey - Encrypted SSH private key from the database
 * @returns Result with uptime string and success flag
 */
export async function getServiceUptime(
	host: string,
	encryptedPrivateKey: string
): Promise<{ uptime: string; success: boolean }> {
	try {
		const privateKey = decryptToken(encryptedPrivateKey);

		const result = await execSSHCommand({
			host,
			privateKey,
			command: 'uptime -p',
		});

		return {
			uptime: result.stdout,
			success: true,
		};
	} catch (error) {
		console.error(`Failed to get uptime from ${host}:`, error);
		return {
			uptime: 'Unknown',
			success: false,
		};
	}
}
