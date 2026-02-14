/**
 * Reusable SSH command execution utility.
 *
 * Extracted from the SSH patterns in ssh-injector.ts into a generic,
 * reusable function for quick operations like status checks, service
 * restarts, and log fetching.
 *
 * Uses shorter timeouts (15s) than ssh-injector (30s) because these
 * are quick status checks, not provisioning operations.
 *
 * @module ssh-exec
 */

import { Client } from 'ssh2';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Configuration for SSH command execution. */
export interface SSHExecConfig {
	/** Target host IP address or hostname. */
	host: string;
	/** Decrypted SSH private key (PEM format). */
	privateKey: string;
	/** Shell command to execute on the remote host. */
	command: string;
	/** SSH username (defaults to 'rachel'). */
	username?: string;
	/** Connection timeout in milliseconds (defaults to 15000). */
	connectTimeoutMs?: number;
	/** Command execution timeout in milliseconds (defaults to 15000). */
	commandTimeoutMs?: number;
}

/** Result of an SSH command execution. */
export interface SSHExecResult {
	/** Standard output from the command. */
	stdout: string;
	/** Standard error output from the command. */
	stderr: string;
	/** Process exit code (0 = success). */
	exitCode: number;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Default SSH connection timeout for quick operations. */
const DEFAULT_CONNECT_TIMEOUT_MS = 15_000;

/** Default command execution timeout for quick operations. */
const DEFAULT_COMMAND_TIMEOUT_MS = 15_000;

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Execute a command on a remote host via SSH.
 *
 * Establishes an SSH connection, executes the given command, collects
 * stdout/stderr, and returns the result. The connection is always
 * closed in the finally block.
 *
 * @param config - SSH connection and command configuration
 * @returns Promise resolving to the command result
 * @throws Error if the connection fails or times out
 *
 * @example
 * ```typescript
 * const result = await execSSHCommand({
 *   host: '168.119.100.42',
 *   privateKey: '-----BEGIN PRIVATE KEY-----\n...',
 *   command: 'sudo systemctl is-active rachel8',
 * });
 * console.log(result.stdout); // 'active'
 * ```
 */
export async function execSSHCommand(config: SSHExecConfig): Promise<SSHExecResult> {
	const conn = new Client();
	const username = config.username ?? 'rachel';
	const connectTimeoutMs = config.connectTimeoutMs ?? DEFAULT_CONNECT_TIMEOUT_MS;
	const commandTimeoutMs = config.commandTimeoutMs ?? DEFAULT_COMMAND_TIMEOUT_MS;

	try {
		// Establish SSH connection
		await connectSSH(conn, {
			host: config.host,
			username,
			privateKey: config.privateKey,
			connectTimeoutMs,
		});

		// Execute command and collect output
		return await executeCommand(conn, config.command, commandTimeoutMs);
	} finally {
		// Always close the connection
		conn.end();
	}
}

// ---------------------------------------------------------------------------
// Private helpers
// ---------------------------------------------------------------------------

/**
 * Establish an SSH connection with timeout.
 */
function connectSSH(
	conn: Client,
	config: {
		host: string;
		username: string;
		privateKey: string;
		connectTimeoutMs: number;
	}
): Promise<void> {
	return new Promise<void>((resolve, reject) => {
		const timeout = setTimeout(() => {
			conn.end();
			reject(
				new Error(
					`SSH connection to ${config.host} timed out after ${config.connectTimeoutMs}ms`
				)
			);
		}, config.connectTimeoutMs);

		conn.on('ready', () => {
			clearTimeout(timeout);
			resolve();
		});

		conn.on('error', (err) => {
			clearTimeout(timeout);
			reject(
				new Error(`SSH connection to ${config.host} failed: ${err.message}`)
			);
		});

		conn.connect({
			host: config.host,
			port: 22,
			username: config.username,
			privateKey: config.privateKey,
			readyTimeout: config.connectTimeoutMs,
		});
	});
}

/**
 * Execute a command over an established SSH connection.
 */
function executeCommand(
	conn: Client,
	command: string,
	timeoutMs: number
): Promise<SSHExecResult> {
	return new Promise<SSHExecResult>((resolve, reject) => {
		const timeout = setTimeout(() => {
			reject(
				new Error(
					`SSH command timed out after ${timeoutMs}ms: ${command}`
				)
			);
		}, timeoutMs);

		conn.exec(command, (err, stream) => {
			if (err) {
				clearTimeout(timeout);
				return reject(
					new Error(`SSH exec failed: ${err.message}`)
				);
			}

			let stdout = '';
			let stderr = '';

			stream.on('data', (data: Buffer) => {
				stdout += data.toString();
			});

			stream.stderr.on('data', (data: Buffer) => {
				stderr += data.toString();
			});

			stream.on('close', (code: number) => {
				clearTimeout(timeout);
				resolve({
					stdout: stdout.trim(),
					stderr: stderr.trim(),
					exitCode: code ?? 0,
				});
			});
		});
	});
}
