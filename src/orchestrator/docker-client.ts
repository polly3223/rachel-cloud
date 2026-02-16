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
