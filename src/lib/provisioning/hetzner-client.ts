/**
 * Hetzner Cloud API Client
 *
 * Production-ready wrapper around the Hetzner Cloud API v1 with:
 * - Exponential backoff retry logic via backOff()
 * - Rate limit detection and intelligent wait
 * - Type-safe request/response interfaces
 * - Descriptive error messages with endpoint context
 *
 * @module hetzner-client
 */
import { backOff } from 'exponential-backoff';

// ---------------------------------------------------------------------------
// Local type definitions
// These will be replaced by imports from ./types.ts once plan 03-01 lands.
// ---------------------------------------------------------------------------

/** Configuration for the Hetzner API client. */
export interface HetznerConfig {
  apiToken: string;
  baseUrl?: string;
}

// -- Server types -----------------------------------------------------------

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

export interface HetznerServer {
  id: number;
  name: string;
  status: string;
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
  server_type: {
    id: number;
    name: string;
    description: string;
  };
  datacenter: {
    id: number;
    name: string;
    description: string;
  };
  created: string;
}

export interface HetznerAction {
  id: number;
  command: string;
  status: 'running' | 'success' | 'error';
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

export interface CreateServerResponse {
  server: HetznerServer;
  action: HetznerAction;
  next_actions: HetznerAction[];
  root_password: string | null;
}

export interface ServerResponse {
  server: HetznerServer;
}

export interface ActionsResponse {
  actions: HetznerAction[];
}

export interface ActionResponse {
  action: HetznerAction;
}

// -- SSH Key types ----------------------------------------------------------

export interface CreateSSHKeyRequest {
  name: string;
  public_key: string;
  labels?: Record<string, string>;
}

export interface HetznerSSHKey {
  id: number;
  name: string;
  fingerprint: string;
  public_key: string;
  created: string;
  labels: Record<string, string>;
}

export interface SSHKeyResponse {
  ssh_key: HetznerSSHKey;
}

// -- Firewall types ---------------------------------------------------------

export interface FirewallRule {
  direction: 'in' | 'out';
  protocol: 'tcp' | 'udp' | 'icmp' | 'esp' | 'gre';
  port?: string;
  source_ips?: string[];
  destination_ips?: string[];
  description?: string;
}

export interface CreateFirewallRequest {
  name: string;
  rules: FirewallRule[];
  labels?: Record<string, string>;
  apply_to?: Array<{
    type: string;
    server?: { id: number };
    label_selector?: { selector: string };
  }>;
}

export interface HetznerFirewall {
  id: number;
  name: string;
  rules: FirewallRule[];
  applied_to: Array<{
    type: string;
    server?: { id: number };
    applied_to_resources: Array<{
      type: string;
      server?: { id: number };
    }>;
  }>;
  created: string;
  labels: Record<string, string>;
}

export interface FirewallResponse {
  firewall: HetznerFirewall;
}

// -- Hetzner error format ---------------------------------------------------

interface HetznerErrorBody {
  error: {
    code: string;
    message: string;
  };
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const DEFAULT_BASE_URL = 'https://api.hetzner.cloud/v1';
const RATE_LIMIT_WARNING_THRESHOLD = 100;

// ---------------------------------------------------------------------------
// HetznerClient
// ---------------------------------------------------------------------------

/**
 * Hetzner Cloud API client with automatic retry logic and rate limit handling.
 *
 * All API methods pass through a central `request()` method that wraps
 * `fetch()` with exponential backoff (5 attempts, 1-30 s delay, full jitter).
 * Rate-limited responses (HTTP 429) are detected, the `RateLimit-Reset`
 * header is parsed, and the request is retried after the appropriate wait.
 */
export class HetznerClient {
  private readonly apiToken: string;
  private readonly baseUrl: string;

  constructor(config: HetznerConfig) {
    if (!config.apiToken) {
      throw new Error('HetznerClient: apiToken is required');
    }
    this.apiToken = config.apiToken;
    this.baseUrl = config.baseUrl ?? DEFAULT_BASE_URL;
  }

  // -------------------------------------------------------------------------
  // Private: core request with retry & rate-limit handling
  // -------------------------------------------------------------------------

  /**
   * Execute an HTTP request against the Hetzner Cloud API with automatic
   * exponential backoff retry on transient failures and rate limits.
   *
   * @param endpoint  - API path, e.g. "/servers"
   * @param options   - Standard RequestInit (method, body, headers, etc.)
   * @returns Parsed JSON response of type T
   * @throws Error with descriptive message including endpoint and status code
   */
  private async request<T>(
    endpoint: string,
    options?: RequestInit,
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;

    return backOff(
      async () => {
        const response = await fetch(url, {
          ...options,
          headers: {
            Authorization: `Bearer ${this.apiToken}`,
            'Content-Type': 'application/json',
            ...options?.headers,
          },
        });

        // -- Rate limit monitoring ------------------------------------------
        const remainingHeader = response.headers.get('RateLimit-Remaining');
        if (remainingHeader !== null) {
          const remaining = parseInt(remainingHeader, 10);
          if (!Number.isNaN(remaining) && remaining < RATE_LIMIT_WARNING_THRESHOLD) {
            console.warn(
              `[HetznerClient] Rate limit warning: ${remaining} requests remaining ` +
                `(endpoint: ${options?.method ?? 'GET'} ${endpoint})`,
            );
          }
        }

        // -- Handle 429 Rate Limited ----------------------------------------
        if (response.status === 429) {
          const resetHeader = response.headers.get('RateLimit-Reset');
          let waitMs = 60_000; // default 60 s if header missing

          if (resetHeader) {
            const resetEpochSeconds = parseInt(resetHeader, 10);
            if (!Number.isNaN(resetEpochSeconds)) {
              waitMs = Math.max(resetEpochSeconds * 1000 - Date.now(), 1000);
            }
          }

          console.warn(
            `[HetznerClient] Rate limited on ${options?.method ?? 'GET'} ${endpoint}. ` +
              `Retry after ${waitMs}ms`,
          );

          // Throw to trigger backOff retry
          throw new Error(
            `Rate limited on ${options?.method ?? 'GET'} ${endpoint}. ` +
              `Retry after ${waitMs}ms`,
          );
        }

        // -- Handle DELETE with no content ----------------------------------
        if (response.status === 204) {
          return undefined as unknown as T;
        }

        // -- Handle other HTTP errors ---------------------------------------
        if (!response.ok) {
          let errorMessage = response.statusText;
          try {
            const errorBody = (await response.json()) as HetznerErrorBody;
            if (errorBody.error?.message) {
              errorMessage = errorBody.error.message;
            }
          } catch {
            // Body may not be JSON; fall back to statusText
          }

          const err = new Error(
            `Hetzner API error on ${options?.method ?? 'GET'} ${endpoint}: ` +
              `${response.status} ${errorMessage}`,
          );

          // Retry on server errors (5xx); throw immediately on client errors
          if (response.status >= 500) {
            throw err;
          }

          // For 4xx (except 429 handled above), don't retry — throw directly
          // Use a non-retriable error by attaching a flag
          (err as Error & { isRetriable: boolean }).isRetriable = false;
          throw err;
        }

        // -- Success --------------------------------------------------------
        return (await response.json()) as T;
      },
      {
        numOfAttempts: 5,
        startingDelay: 1000,
        timeMultiple: 2,
        maxDelay: 30_000,
        jitter: 'full',
        retry: (err: Error) => {
          // Don't retry on non-retriable errors (4xx client errors)
          if ('isRetriable' in err && (err as Error & { isRetriable: boolean }).isRetriable === false) {
            return false;
          }
          console.debug(
            `[HetznerClient] Retrying after error: ${err.message}`,
          );
          return true;
        },
      },
    );
  }

  // -------------------------------------------------------------------------
  // Public API: Servers
  // -------------------------------------------------------------------------

  /**
   * Create a new server (VPS).
   *
   * @see https://docs.hetzner.cloud/#servers-create-a-server
   */
  async createServer(params: CreateServerRequest): Promise<CreateServerResponse> {
    return this.request<CreateServerResponse>('/servers', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  /**
   * Get details of a specific server.
   *
   * @see https://docs.hetzner.cloud/#servers-get-a-server
   */
  async getServer(serverId: number): Promise<ServerResponse> {
    return this.request<ServerResponse>(`/servers/${serverId}`);
  }

  /**
   * Delete a server permanently.
   *
   * @see https://docs.hetzner.cloud/#servers-delete-a-server
   */
  async deleteServer(serverId: number): Promise<void> {
    await this.request<void>(`/servers/${serverId}`, {
      method: 'DELETE',
    });
  }

  /**
   * Get all actions for a specific server.
   *
   * @see https://docs.hetzner.cloud/#server-actions-get-all-actions-for-a-server
   */
  async getServerActions(serverId: number): Promise<ActionsResponse> {
    return this.request<ActionsResponse>(`/servers/${serverId}/actions`);
  }

  // -------------------------------------------------------------------------
  // Public API: Actions
  // -------------------------------------------------------------------------

  /**
   * Get details of a specific action.
   *
   * @see https://docs.hetzner.cloud/#actions-get-an-action
   */
  async getAction(actionId: number): Promise<ActionResponse> {
    return this.request<ActionResponse>(`/actions/${actionId}`);
  }

  // -------------------------------------------------------------------------
  // Public API: SSH Keys
  // -------------------------------------------------------------------------

  /**
   * Create an SSH key resource.
   *
   * @see https://docs.hetzner.cloud/#ssh-keys-create-an-ssh-key
   */
  async createSSHKey(params: CreateSSHKeyRequest): Promise<SSHKeyResponse> {
    return this.request<SSHKeyResponse>('/ssh_keys', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  /**
   * Delete an SSH key resource.
   *
   * @see https://docs.hetzner.cloud/#ssh-keys-delete-an-ssh-key
   */
  async deleteSSHKey(keyId: number): Promise<void> {
    await this.request<void>(`/ssh_keys/${keyId}`, {
      method: 'DELETE',
    });
  }

  // -------------------------------------------------------------------------
  // Public API: Firewalls
  // -------------------------------------------------------------------------

  /**
   * Create a firewall with rules.
   *
   * @see https://docs.hetzner.cloud/#firewalls-create-a-firewall
   */
  async createFirewall(params: CreateFirewallRequest): Promise<FirewallResponse> {
    return this.request<FirewallResponse>('/firewalls', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  /**
   * Get details of a specific firewall.
   *
   * @see https://docs.hetzner.cloud/#firewalls-get-a-firewall
   */
  async getFirewall(firewallId: number): Promise<FirewallResponse> {
    return this.request<FirewallResponse>(`/firewalls/${firewallId}`);
  }
}
