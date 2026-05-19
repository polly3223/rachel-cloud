/**
 * Orchestrator Client
 *
 * HTTP client for the Container Orchestrator API at localhost:9998.
 * Used by the SvelteKit control plane to manage Docker containers.
 * Replaces all Hetzner/SSH operations.
 */

// ---------- Types ----------

export interface ContainerStatus {
  userId: string;
  containerId: string;
  containerName: string;
  image: string;
  state: string;
  health: string;
  startedAt: string;
  uptime: number;
}

export interface UpdateResult {
  userId: string;
  success: boolean;
  previousImage: string;
  newImage: string;
  durationMs: number;
  error?: string;
  rolledBack?: boolean;
}

export interface UpdateAllResult {
  total: number;
  succeeded: number;
  failed: number;
  rolledBack: number;
  skipped: number;
  results: UpdateResult[];
  durationMs: number;
}

export interface OrchestratorHealth {
  status: string;
  uptime: number;
  docker: boolean;
  containers: number;
}

export interface HealthSweepResult {
  timestamp: number;
  containersChecked: number;
  healthy: number;
  unhealthy: number;
  restarted: string[];
  circuitOpen: string[];
  errors: Array<{ userId: string; error: string }>;
}

// ---------- Error ----------

export class OrchestratorError extends Error {
  constructor(
    public status: number,
    message: string,
    public path: string,
  ) {
    super(`Orchestrator error ${status} on ${path}: ${message}`);
    this.name = "OrchestratorError";
  }
}

// ---------- Client ----------

class OrchestratorClient {
  private baseUrl: string;
  private apiKey: string;

  constructor() {
    this.baseUrl =
      process.env.ORCHESTRATOR_URL || "http://127.0.0.1:9998";
    this.apiKey = process.env.ORCHESTRATOR_API_KEY || "";
  }

  private async request<T>(
    method: string,
    path: string,
    body?: unknown,
    requireAuth = true,
  ): Promise<T> {
    const headers: Record<string, string> = {
      "content-type": "application/json",
    };
    if (requireAuth && this.apiKey) {
      headers["authorization"] = `Bearer ${this.apiKey}`;
    }

    const res = await fetch(`${this.baseUrl}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    const json = (await res.json()) as any;

    if (!res.ok) {
      throw new OrchestratorError(
        res.status,
        json?.message || json?.error || "Unknown error",
        path,
      );
    }

    return json as T;
  }

  // ===== Container lifecycle =====

  async provisionContainer(params: {
    userId: string;
    telegramBotToken: string;
    ownerTelegramUserId: string;
    groqApiKey?: string;
  }): Promise<{ status: string; container: ContainerStatus }> {
    return this.request("POST", "/containers", params);
  }

  async deprovisionContainer(
    userId: string,
    removeData = false,
  ): Promise<{ status: string }> {
    const qs = removeData ? "?removeData=true" : "";
    return this.request(
      "DELETE",
      `/containers/${encodeURIComponent(userId)}${qs}`,
    );
  }

  async restartContainer(
    userId: string,
  ): Promise<{ status: string; container: ContainerStatus }> {
    return this.request(
      "POST",
      `/containers/${encodeURIComponent(userId)}/restart`,
    );
  }

  // ===== Status =====

  async getContainerStatus(
    userId: string,
  ): Promise<{ status: string; container: ContainerStatus } | null> {
    try {
      return await this.request(
        "GET",
        `/containers/${encodeURIComponent(userId)}`,
      );
    } catch (err) {
      if (err instanceof OrchestratorError && err.status === 404)
        return null;
      throw err;
    }
  }

  async listContainers(): Promise<{
    status: string;
    containers: ContainerStatus[];
  }> {
    return this.request("GET", "/containers");
  }

  // ===== Updates =====

  async updateContainer(
    userId: string,
    image?: string,
    options?: { force?: boolean; geminiModel?: string },
  ): Promise<{ status: string; result: UpdateResult }> {
    return this.request(
      "POST",
      `/containers/${encodeURIComponent(userId)}/update`,
      {
        ...(image ? { image } : {}),
        ...(options?.force !== undefined ? { force: options.force } : {}),
        ...(options?.geminiModel ? { geminiModel: options.geminiModel } : {}),
      },
    );
  }

  async updateAll(
    image?: string,
  ): Promise<{ status: string; result: UpdateAllResult }> {
    return this.request(
      "POST",
      "/update-all",
      image ? { image } : {},
    );
  }

  // ===== Health =====

  async healthSweep(): Promise<{
    status: string;
    result: HealthSweepResult;
  }> {
    return this.request("POST", "/sweep");
  }

  async getHealth(): Promise<OrchestratorHealth> {
    return this.request("GET", "/health", undefined, false);
  }

  // ===== Logs =====

  async getContainerLogs(
    userId: string,
    options?: { tail?: number; since?: number },
  ): Promise<{ status: string; logs: string }> {
    const params = new URLSearchParams();
    if (options?.tail) params.set("tail", String(options.tail));
    if (options?.since) params.set("since", String(options.since));
    const qs = params.toString() ? `?${params}` : "";
    return this.request(
      "GET",
      `/containers/${encodeURIComponent(userId)}/logs${qs}`,
    );
  }
}

// Singleton instance
export const orchestrator = new OrchestratorClient();
