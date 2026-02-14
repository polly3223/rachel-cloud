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
import type {
	CreateServerRequest,
	CreateSSHKeyRequest,
	CreateFirewallRequest,
	HetznerServer,
	HetznerAction,
	HetznerServerResponse,
	HetznerActionsResponse,
	HetznerSSHKey,
	HetznerSSHKeyResponse,
	HetznerFirewall,
	HetznerFirewallResponse,
	ListFirewallsResponse,
	HetznerErrorResponse,
} from './types';

// Re-export types for consumers
export type {
	CreateServerRequest,
	CreateSSHKeyRequest,
	CreateFirewallRequest,
	HetznerServer,
	HetznerAction,
	HetznerServerResponse,
	HetznerActionsResponse,
	HetznerSSHKey,
	HetznerSSHKeyResponse,
	HetznerFirewall,
	HetznerFirewallResponse,
	ListFirewallsResponse,
};

/** Configuration for the Hetzner API client. */
export interface HetznerConfig {
  apiToken: string;
  baseUrl?: string;
}

/** Response from GET /servers/{id} */
export interface ServerResponse {
  server: HetznerServer;
}

/** Response from GET /actions/{id} */
export interface ActionResponse {
  action: HetznerAction;
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
            const errorBody = (await response.json()) as HetznerErrorResponse;
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
  async createServer(params: CreateServerRequest): Promise<HetznerServerResponse> {
    return this.request<HetznerServerResponse>('/servers', {
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
  async getServerActions(serverId: number): Promise<HetznerActionsResponse> {
    return this.request<HetznerActionsResponse>(`/servers/${serverId}/actions`);
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
  async createSSHKey(params: CreateSSHKeyRequest): Promise<HetznerSSHKeyResponse> {
    return this.request<HetznerSSHKeyResponse>('/ssh_keys', {
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
  async createFirewall(params: CreateFirewallRequest): Promise<HetznerFirewallResponse> {
    return this.request<HetznerFirewallResponse>('/firewalls', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  /**
   * Get details of a specific firewall.
   *
   * @see https://docs.hetzner.cloud/#firewalls-get-a-firewall
   */
  async getFirewall(firewallId: number): Promise<HetznerFirewallResponse> {
    return this.request<HetznerFirewallResponse>(`/firewalls/${firewallId}`);
  }

  /**
   * List all firewalls in the project.
   *
   * @see https://docs.hetzner.cloud/#firewalls-get-all-firewalls
   */
  async listFirewalls(): Promise<ListFirewallsResponse> {
    return this.request<ListFirewallsResponse>('/firewalls');
  }
}
