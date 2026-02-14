/**
 * TypeScript types for Hetzner Cloud API interactions and provisioning configuration.
 *
 * API types use snake_case to match Hetzner API field names.
 * Internal types use camelCase per TypeScript conventions.
 */

// ---------------------------------------------------------------------------
// Status Enums
// ---------------------------------------------------------------------------

/** Hetzner server lifecycle states */
export type ServerStatus =
	| 'initializing'
	| 'starting'
	| 'running'
	| 'stopping'
	| 'off'
	| 'deleting'
	| 'rebuilding'
	| 'migrating'
	| 'unknown';

/** Hetzner action status */
export type ActionStatus = 'running' | 'success' | 'error';

/** Internal provisioning lifecycle status */
export type ProvisioningStatus =
	| 'pending'
	| 'creating'
	| 'cloud_init'
	| 'injecting_secrets'
	| 'ready'
	| 'failed';

// ---------------------------------------------------------------------------
// Hetzner API Request Types
// ---------------------------------------------------------------------------

/** POST /servers - Create a new server */
export interface CreateServerRequest {
	name: string;
	server_type: string;
	image: string;
	location?: string;
	ssh_keys?: number[];
	user_data?: string;
	firewalls?: Array<{ firewall: number }>;
	start_after_create?: boolean;
	public_net?: {
		enable_ipv4: boolean;
		enable_ipv6: boolean;
	};
}

/** POST /ssh_keys - Upload an SSH public key */
export interface CreateSSHKeyRequest {
	name: string;
	public_key: string;
}

/** POST /firewalls - Create a firewall */
export interface CreateFirewallRequest {
	name: string;
	rules: FirewallRule[];
}

/** Firewall rule definition */
export interface FirewallRule {
	direction: 'in' | 'out';
	protocol: 'tcp' | 'udp' | 'icmp' | 'esp' | 'gre';
	port?: string;
	source_ips?: string[];
	destination_ips?: string[];
	description?: string;
}

// ---------------------------------------------------------------------------
// Hetzner API Response Types
// ---------------------------------------------------------------------------

/** Server object returned by Hetzner API */
export interface HetznerServer {
	id: number;
	name: string;
	status: ServerStatus;
	public_net: {
		ipv4: {
			ip: string;
			blocked: boolean;
		};
		ipv6: {
			ip: string;
			blocked: boolean;
		};
	};
	created: string;
	server_type: {
		id: number;
		name: string;
		description: string;
	};
	datacenter: {
		id: number;
		name: string;
		location: {
			id: number;
			name: string;
			city: string;
			country: string;
		};
	};
}

/** Action object returned by Hetzner API */
export interface HetznerAction {
	id: number;
	command: string;
	status: ActionStatus;
	progress: number;
	started: string;
	finished: string | null;
	error: {
		code: string;
		message: string;
	} | null;
	resources: Array<{
		id: number;
		type: string;
	}>;
}

/** Response from POST /servers */
export interface HetznerServerResponse {
	server: HetznerServer;
	action: HetznerAction;
	next_actions: HetznerAction[];
	root_password: string | null;
}

/** Response from GET /servers/{id}/actions */
export interface HetznerActionsResponse {
	actions: HetznerAction[];
}

/** SSH key object returned by Hetzner API */
export interface HetznerSSHKey {
	id: number;
	name: string;
	fingerprint: string;
	public_key: string;
	created: string;
}

/** Response from POST /ssh_keys */
export interface HetznerSSHKeyResponse {
	ssh_key: HetznerSSHKey;
}

/** Firewall object returned by Hetzner API */
export interface HetznerFirewall {
	id: number;
	name: string;
	rules: FirewallRule[];
	applied_to: Array<{
		type: string;
		server?: { id: number };
	}>;
	created: string;
}

/** Response from POST /firewalls */
export interface HetznerFirewallResponse {
	firewall: HetznerFirewall;
	actions: HetznerAction[];
}

/** Generic Hetzner API error response */
export interface HetznerErrorResponse {
	error: {
		code: string;
		message: string;
	};
}

// ---------------------------------------------------------------------------
// Internal Configuration Types
// ---------------------------------------------------------------------------

/** Configuration for cloud-init user-data generation */
export interface CloudInitConfig {
	username: string;
	sshPublicKey: string;
	callbackUrl: string;
}

/** Configuration for SSH-based secret injection after cloud-init */
export interface SSHInjectionConfig {
	host: string;
	username: string;
	privateKey: string;
	claudeAccessToken: string;
	claudeRefreshToken: string;
	claudeExpiresAt: number;
	telegramBotToken: string;
	ownerTelegramUserId: string;
}

/** SSH key pair generated for VPS access */
export interface SSHKeyPair {
	publicKey: string;
	privateKey: string;
}
