/**
 * Container Orchestrator — Container Manager
 *
 * High-level container lifecycle: provision, deprovision, restart,
 * update, list. Translates UserContainerEnv into Docker API calls
 * with all security hardening from run-container.sh.
 */

import { config, log } from "./config";
import { docker, DockerApiError } from "./docker-client";
import type {
  UserContainerEnv,
  ContainerStatus,
  DockerContainerInspect,
  DockerCreateContainerBody,
  UpdateResult,
  UpdateProgressCallback,
  UpdateAllResult,
} from "./types";

// ---------- Helpers ----------

function containerName(userId: string): string {
  return `${config.containerPrefix}${userId}`;
}

function volumeName(userId: string): string {
  return `${config.volumePrefix}${userId}-data`;
}

function userIdFromName(name: string): string {
  // Docker prepends "/" to container names
  return name.replace(/^\//, "").replace(config.containerPrefix, "");
}

function toContainerStatus(
  userId: string,
  info: DockerContainerInspect,
): ContainerStatus {
  const startedAt = info.State.StartedAt;
  const uptime = info.State.Running
    ? Math.floor(
        (Date.now() - new Date(startedAt).getTime()) / 1000,
      )
    : 0;

  return {
    userId,
    containerId: info.Id,
    containerName: info.Name.replace(/^\//, ""),
    image: info.Config.Image,
    state: info.State.Status,
    health: info.State.Health?.Status ?? "none",
    startedAt,
    uptime,
  };
}

// ---------- Network & Volume helpers ----------

async function ensureNetwork(): Promise<void> {
  const networks = await docker.listNetworks();
  const exists = networks.some((n) => n.Name === config.networkName);
  if (exists) return;

  log.info("Creating network", { name: config.networkName });
  await docker.createNetwork(config.networkName, {
    enableIcc: false,
  });
}

async function ensureVolume(name: string): Promise<void> {
  const vol = await docker.inspectVolume(name);
  if (vol) return;

  log.info("Creating volume", { name });
  await docker.createVolume(name);
}

// ---------- Container config builder ----------

function buildContainerConfig(
  userId: string,
  env: UserContainerEnv,
): DockerCreateContainerBody {
  const envVars: string[] = [
    `TELEGRAM_BOT_TOKEN=${env.telegramBotToken}`,
    `OWNER_TELEGRAM_USER_ID=${env.ownerTelegramUserId}`,
    `SHARED_FOLDER_PATH=/data`,
    `NODE_ENV=production`,
    `LOG_LEVEL=${env.logLevel || "info"}`,
    `ANTHROPIC_BASE_URL=${config.proxyUrl}`,
    `ANTHROPIC_API_KEY=rachel-user-${userId}`,
  ];

  // Optional env vars
  const groqKey = env.groqApiKey || config.groqApiKey;
  if (groqKey) envVars.push(`GROQ_API_KEY=${groqKey}`);
  if (env.sttProvider) envVars.push(`STT_PROVIDER=${env.sttProvider}`);

  return {
    Image: config.imageName,
    Env: envVars,
    User: "1001:1001",
    HostConfig: {
      Memory: config.defaults.memoryBytes,
      MemorySwap: config.defaults.memorySwapBytes,
      NanoCpus: config.defaults.nanoCpus,
      PidsLimit: config.defaults.pidsLimit,
      Binds: [`${volumeName(userId)}:/data:rw`],
      Tmpfs: { "/tmp": "rw,noexec,nosuid,size=100m" },
      NetworkMode: config.networkName,
      // Linux Docker doesn't auto-resolve host.docker.internal on custom bridge networks.
      ExtraHosts: ["host.docker.internal:host-gateway"],
      RestartPolicy: { Name: "unless-stopped" },
      CapDrop: ["ALL"],
      SecurityOpt: ["no-new-privileges"],
      // ReadonlyRootfs disabled: Claude Code CLI writes to ~/.claude.json, ~/.claude/, etc.
      ReadonlyRootfs: false,
      LogConfig: {
        Type: "json-file",
        Config: {
          "max-size": "10m",
          "max-file": "3",
        },
      },
    },
  };
}

// ---------- Core lifecycle ----------

/**
 * Provision a user container. Idempotent:
 * - If running with correct image → no-op
 * - If stopped → start
 * - If wrong image → recreate
 * - If missing → create + start
 */
export async function provisionContainer(
  userId: string,
  env: UserContainerEnv,
): Promise<ContainerStatus> {
  const name = containerName(userId);
  log.info("Provisioning container", { userId });

  // Check if container already exists
  let existing: DockerContainerInspect | null = null;
  try {
    existing = await docker.inspectContainer(name);
  } catch (err) {
    if (!(err instanceof DockerApiError && err.status === 404))
      throw err;
  }

  if (existing) {
    // Already exists — check if it needs updating
    if (
      existing.Config.Image === config.imageName &&
      existing.State.Running
    ) {
      log.info("Container already running", { userId });
      return toContainerStatus(userId, existing);
    }

    if (existing.Config.Image !== config.imageName) {
      // Wrong image — recreate
      log.info("Image mismatch, recreating", {
        userId,
        current: existing.Config.Image,
        target: config.imageName,
      });
      await docker.stopContainer(name);
      await docker.removeContainer(name);
      // Fall through to create
    } else {
      // Correct image but not running — start it
      log.info("Starting stopped container", { userId });
      await docker.startContainer(name);
      const info = await docker.inspectContainer(name);
      return toContainerStatus(userId, info);
    }
  }

  // Create new container
  await ensureNetwork();
  await ensureVolume(volumeName(userId));

  const containerConfig = buildContainerConfig(userId, env);
  await docker.createContainer(name, containerConfig);
  await docker.startContainer(name);

  log.info("Container provisioned", { userId });
  const info = await docker.inspectContainer(name);
  return toContainerStatus(userId, info);
}

/**
 * Deprovision a user container.
 * If removeData=true, also deletes the named volume (destructive!).
 */
export async function deprovisionContainer(
  userId: string,
  removeData = false,
): Promise<void> {
  const name = containerName(userId);
  log.info("Deprovisioning container", { userId, removeData });

  await docker.stopContainer(name);
  await docker.removeContainer(name);

  if (removeData) {
    log.warn("Removing user data volume", { userId });
    await docker.removeVolume(volumeName(userId));
  }

  log.info("Container deprovisioned", { userId });
}

/**
 * Restart a user container.
 */
export async function restartContainer(
  userId: string,
): Promise<ContainerStatus> {
  const name = containerName(userId);
  log.info("Restarting container", { userId });

  await docker.restartContainer(name);

  const info = await docker.inspectContainer(name);
  return toContainerStatus(userId, info);
}

/**
 * Get status of a single user container.
 * Returns null if container doesn't exist.
 */
export async function getContainerStatus(
  userId: string,
): Promise<ContainerStatus | null> {
  try {
    const info = await docker.inspectContainer(containerName(userId));
    return toContainerStatus(userId, info);
  } catch (err) {
    if (err instanceof DockerApiError && err.status === 404)
      return null;
    throw err;
  }
}

/**
 * List all rachel-user-* containers with their status.
 */
export async function listAllContainers(): Promise<ContainerStatus[]> {
  const all = await docker.listContainers(true);
  const rachelContainers = all.filter((c) =>
    c.Names.some((n) => n.startsWith(`/${config.containerPrefix}`)),
  );

  const statuses: ContainerStatus[] = [];

  for (const c of rachelContainers) {
    try {
      const info = await docker.inspectContainer(c.Id);
      const userId = userIdFromName(c.Names[0]);
      statuses.push(toContainerStatus(userId, info));
    } catch (err) {
      log.error("Failed to inspect container", {
        id: c.Id,
        error: String(err),
      });
    }
  }

  return statuses;
}

// ---------- Wait for healthy ----------

/**
 * Poll container health until "healthy" or timeout.
 * Returns true if healthy, false if timeout.
 */
export async function waitForHealthy(
  nameOrId: string,
  timeoutMs = 60_000,
): Promise<boolean> {
  const start = Date.now();
  const pollInterval = 2000;

  while (Date.now() - start < timeoutMs) {
    try {
      const info = await docker.inspectContainer(nameOrId);
      const health = info.State.Health?.Status;

      if (health === "healthy") return true;
      if (health === "unhealthy") return false;
      // "starting" or no health check — keep waiting
    } catch {
      // Container might not exist yet, keep polling
    }

    await Bun.sleep(pollInterval);
  }

  return false;
}

// ---------- Single container update ----------

/**
 * Update a single container to a new image.
 * Rolls back to the old image if the new one fails health checks.
 */
export async function updateContainer(
  userId: string,
  newImage?: string,
): Promise<UpdateResult> {
  const name = containerName(userId);
  const targetImage = newImage || config.imageName;
  const startTime = Date.now();

  log.info("Updating container", { userId, targetImage });

  // Get current state
  let existing: DockerContainerInspect;
  try {
    existing = await docker.inspectContainer(name);
  } catch (err) {
    return {
      userId,
      success: false,
      previousImage: "unknown",
      newImage: targetImage,
      durationMs: Date.now() - startTime,
      error: `Container not found: ${err}`,
    };
  }

  const previousImage = existing.Config.Image;

  // Already on target image?
  if (previousImage === targetImage) {
    log.info("Already on target image, skipping", { userId });
    return {
      userId,
      success: true,
      previousImage,
      newImage: targetImage,
      durationMs: Date.now() - startTime,
    };
  }

  // Extract env vars from existing container to preserve them
  const envVars = existing.Config.Env;

  // Stop and remove old container
  await docker.stopContainer(name);
  await docker.removeContainer(name);

  // Create new container with new image but same env
  try {
    const containerConfig = buildContainerConfigFromEnv(
      userId,
      targetImage,
      envVars,
    );
    await docker.createContainer(name, containerConfig);
    await docker.startContainer(name);

    // Wait for healthy
    const healthy = await waitForHealthy(name, 60_000);
    if (healthy) {
      log.info("Container updated successfully", { userId, targetImage });
      return {
        userId,
        success: true,
        previousImage,
        newImage: targetImage,
        durationMs: Date.now() - startTime,
      };
    }

    // Not healthy — rollback
    log.warn("New image unhealthy, rolling back", {
      userId,
      targetImage,
      previousImage,
    });
    await docker.stopContainer(name);
    await docker.removeContainer(name);

    const rollbackConfig = buildContainerConfigFromEnv(
      userId,
      previousImage,
      envVars,
    );
    await docker.createContainer(name, rollbackConfig);
    await docker.startContainer(name);

    return {
      userId,
      success: false,
      previousImage,
      newImage: targetImage,
      durationMs: Date.now() - startTime,
      error: "Container unhealthy after 60s",
      rolledBack: true,
    };
  } catch (err) {
    // Critical failure — try to restore old container
    log.error("Update failed, attempting rollback", {
      userId,
      error: String(err),
    });

    try {
      await docker.removeContainer(name, true);
      const rollbackConfig = buildContainerConfigFromEnv(
        userId,
        previousImage,
        envVars,
      );
      await docker.createContainer(name, rollbackConfig);
      await docker.startContainer(name);
    } catch (rollbackErr) {
      log.error("Rollback also failed!", {
        userId,
        error: String(rollbackErr),
      });
    }

    return {
      userId,
      success: false,
      previousImage,
      newImage: targetImage,
      durationMs: Date.now() - startTime,
      error: String(err),
      rolledBack: true,
    };
  }
}

// ---------- Fleet update ----------

/**
 * Rolling update of all rachel-user-* containers.
 * Sequential — one at a time to minimize disruption.
 */
export async function updateAllContainers(
  newImage?: string,
  onProgress?: UpdateProgressCallback,
): Promise<UpdateAllResult> {
  const startTime = Date.now();
  const containers = await listAllContainers();
  const results: UpdateResult[] = [];

  let succeeded = 0;
  let failed = 0;
  let rolledBack = 0;
  let skipped = 0;

  for (let i = 0; i < containers.length; i++) {
    const c = containers[i];

    onProgress?.({
      total: containers.length,
      completed: i,
      current: c.userId,
      results,
    });

    const result = await updateContainer(c.userId, newImage);
    results.push(result);

    if (result.success) {
      if (result.previousImage === result.newImage) {
        skipped++;
      } else {
        succeeded++;
      }
    } else {
      failed++;
      if (result.rolledBack) rolledBack++;
    }
  }

  onProgress?.({
    total: containers.length,
    completed: containers.length,
    current: "",
    results,
  });

  return {
    total: containers.length,
    succeeded,
    failed,
    rolledBack,
    skipped,
    results,
    durationMs: Date.now() - startTime,
  };
}

// ---------- Internal helper ----------

/**
 * Build container config from raw env vars (for updates/rollbacks
 * where we preserve the original env from inspect).
 */
function buildContainerConfigFromEnv(
  userId: string,
  image: string,
  envVars: string[],
): DockerCreateContainerBody {
  return {
    Image: image,
    Env: envVars,
    User: "1001:1001",
    HostConfig: {
      Memory: config.defaults.memoryBytes,
      MemorySwap: config.defaults.memorySwapBytes,
      NanoCpus: config.defaults.nanoCpus,
      PidsLimit: config.defaults.pidsLimit,
      Binds: [`${volumeName(userId)}:/data:rw`],
      Tmpfs: { "/tmp": "rw,noexec,nosuid,size=100m" },
      NetworkMode: config.networkName,
      // Linux Docker doesn't auto-resolve host.docker.internal on custom bridge networks.
      ExtraHosts: ["host.docker.internal:host-gateway"],
      RestartPolicy: { Name: "unless-stopped" },
      CapDrop: ["ALL"],
      SecurityOpt: ["no-new-privileges"],
      // ReadonlyRootfs disabled: Claude Code CLI writes to ~/.claude.json, ~/.claude/, etc.
      ReadonlyRootfs: false,
      LogConfig: {
        Type: "json-file",
        Config: {
          "max-size": "10m",
          "max-file": "3",
        },
      },
    },
  };
}
