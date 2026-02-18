/**
 * Container Orchestrator — Docker Engine API Client
 *
 * Thin wrapper around the Docker Engine API using Bun's native
 * fetch() over Unix socket. Zero external dependencies.
 */

import { config } from "./config";
import type {
  DockerContainerListItem,
  DockerContainerInspect,
  DockerCreateResponse,
  DockerCreateContainerBody,
  DockerNetworkInspect,
  DockerVolumeInspect,
} from "./types";

const API_BASE = `http://localhost/${config.dockerApiVersion}`;

// ---------- Error class ----------

export class DockerApiError extends Error {
  constructor(
    public status: number,
    public path: string,
    public body: string,
  ) {
    super(`Docker API error ${status} on ${path}: ${body}`);
    this.name = "DockerApiError";
  }
}

// ---------- Core fetch helpers ----------

async function dockerFetch(
  path: string,
  options: RequestInit = {},
): Promise<Response> {
  const url = `${API_BASE}${path}`;
  return fetch(url, {
    ...options,
    // @ts-expect-error — Bun extension for Unix socket
    unix: config.dockerSocket,
  });
}

async function dockerJson<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const res = await dockerFetch(path, options);
  if (!res.ok) {
    const body = await res.text();
    throw new DockerApiError(res.status, path, body);
  }
  return res.json() as Promise<T>;
}

// ---------- Docker API ----------

export const docker = {
  // ===== Containers =====

  async listContainers(
    all = false,
  ): Promise<DockerContainerListItem[]> {
    return dockerJson(`/containers/json?all=${all}`);
  },

  async inspectContainer(
    nameOrId: string,
  ): Promise<DockerContainerInspect> {
    return dockerJson(
      `/containers/${encodeURIComponent(nameOrId)}/json`,
    );
  },

  async createContainer(
    name: string,
    body: DockerCreateContainerBody,
  ): Promise<DockerCreateResponse> {
    return dockerJson(
      `/containers/create?name=${encodeURIComponent(name)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      },
    );
  },

  async startContainer(nameOrId: string): Promise<void> {
    const res = await dockerFetch(
      `/containers/${encodeURIComponent(nameOrId)}/start`,
      { method: "POST" },
    );
    // 204 = started, 304 = already running
    if (res.status === 204 || res.status === 304) return;
    throw new DockerApiError(res.status, "start", await res.text());
  },

  async stopContainer(
    nameOrId: string,
    timeoutSec = 10,
  ): Promise<void> {
    const res = await dockerFetch(
      `/containers/${encodeURIComponent(nameOrId)}/stop?t=${timeoutSec}`,
      { method: "POST" },
    );
    // 204 = stopped, 304 = already stopped, 404 = doesn't exist
    if (
      res.status === 204 ||
      res.status === 304 ||
      res.status === 404
    )
      return;
    throw new DockerApiError(res.status, "stop", await res.text());
  },

  async restartContainer(
    nameOrId: string,
    timeoutSec = 10,
  ): Promise<void> {
    const res = await dockerFetch(
      `/containers/${encodeURIComponent(nameOrId)}/restart?t=${timeoutSec}`,
      { method: "POST" },
    );
    if (res.status === 204) return;
    throw new DockerApiError(res.status, "restart", await res.text());
  },

  async removeContainer(
    nameOrId: string,
    force = false,
  ): Promise<void> {
    const res = await dockerFetch(
      `/containers/${encodeURIComponent(nameOrId)}?force=${force}`,
      { method: "DELETE" },
    );
    // 204 = removed, 404 = already gone
    if (res.status === 204 || res.status === 404) return;
    throw new DockerApiError(res.status, "remove", await res.text());
  },

  // ===== Volumes =====

  async createVolume(name: string): Promise<DockerVolumeInspect> {
    return dockerJson("/volumes/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ Name: name }),
    });
  },

  async removeVolume(name: string): Promise<void> {
    const res = await dockerFetch(
      `/volumes/${encodeURIComponent(name)}`,
      { method: "DELETE" },
    );
    if (res.status === 204 || res.status === 404) return;
    throw new DockerApiError(
      res.status,
      "removeVolume",
      await res.text(),
    );
  },

  async inspectVolume(
    name: string,
  ): Promise<DockerVolumeInspect | null> {
    try {
      return await dockerJson(
        `/volumes/${encodeURIComponent(name)}`,
      );
    } catch (err) {
      if (err instanceof DockerApiError && err.status === 404)
        return null;
      throw err;
    }
  },

  // ===== Networks =====

  async createNetwork(
    name: string,
    options?: { enableIcc?: boolean },
  ): Promise<{ Id: string }> {
    return dockerJson("/networks/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        Name: name,
        Driver: "bridge",
        Options: {
          "com.docker.network.bridge.enable_icc": String(
            options?.enableIcc ?? false,
          ),
        },
      }),
    });
  },

  async listNetworks(): Promise<DockerNetworkInspect[]> {
    return dockerJson("/networks");
  },

  // ===== Logs =====

  async getContainerLogs(
    nameOrId: string,
    options?: { tail?: number; since?: number; stdout?: boolean; stderr?: boolean },
  ): Promise<string> {
    const params = new URLSearchParams({
      stdout: String(options?.stdout ?? true),
      stderr: String(options?.stderr ?? true),
      tail: String(options?.tail ?? 100),
    });
    if (options?.since) params.set('since', String(options.since));

    const res = await dockerFetch(
      `/containers/${encodeURIComponent(nameOrId)}/logs?${params}`,
    );
    if (!res.ok) throw new DockerApiError(res.status, 'logs', await res.text());
    // Docker logs include 8-byte header frames for multiplexed streams.
    // Strip them for clean text output.
    const raw = await res.arrayBuffer();
    const bytes = new Uint8Array(raw);
    let output = '';
    let offset = 0;
    while (offset + 8 <= bytes.length) {
      const size =
        (bytes[offset + 4] << 24) |
        (bytes[offset + 5] << 16) |
        (bytes[offset + 6] << 8) |
        bytes[offset + 7];
      offset += 8;
      if (offset + size > bytes.length) break;
      output += new TextDecoder().decode(bytes.slice(offset, offset + size));
      offset += size;
    }
    return output || new TextDecoder().decode(bytes);
  },

  // ===== Exec =====

  /**
   * Execute a command inside a running container.
   * Uses Docker exec API: create exec instance, then start it.
   */
  async execInContainer(
    nameOrId: string,
    cmd: string[],
  ): Promise<string> {
    // Create exec instance
    const exec = await dockerJson<{ Id: string }>(
      `/containers/${encodeURIComponent(nameOrId)}/exec`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          Cmd: cmd,
          AttachStdout: true,
          AttachStderr: true,
        }),
      },
    );

    // Start exec (returns output stream)
    const res = await dockerFetch(`/exec/${exec.Id}/start`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ Detach: false }),
    });

    if (!res.ok) {
      throw new DockerApiError(res.status, "exec/start", await res.text());
    }

    return res.text();
  },

  // ===== Utility =====

  async ping(): Promise<boolean> {
    try {
      const res = await dockerFetch("/_ping");
      return res.ok;
    } catch {
      return false;
    }
  },
};
