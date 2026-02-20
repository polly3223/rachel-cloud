/**
 * Container Orchestrator — Health Monitor
 *
 * Periodically sweeps all rachel-user-* containers, checks health
 * status, and auto-restarts unhealthy ones with circuit breaker
 * protection to prevent infinite restart loops.
 */

import { log, config } from "./config";
import { docker } from "./docker-client";
import { listAllContainers } from "./container-manager";

// ---------- Config ----------

const SWEEP_INTERVAL_MS = 30_000; // 30 seconds
const MAX_RESTARTS_PER_HOUR = 3;
const CIRCUIT_WINDOW_MS = 3_600_000; // 1 hour
const CONFIG_DRIFT_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

// ---------- Types ----------

interface CircuitState {
  restartCount: number;
  windowStart: number;
  isOpen: boolean;
  lastRestartAt: number;
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

export type HealthEventHandler = (result: HealthSweepResult) => void;

// ---------- State ----------

const circuits = new Map<string, CircuitState>();
let sweepInterval: ReturnType<typeof setInterval> | null = null;
let driftInterval: ReturnType<typeof setInterval> | null = null;
let sweeping = false;

// ---------- Circuit breaker ----------

function getCircuit(userId: string): CircuitState {
  let state = circuits.get(userId);
  if (!state) {
    state = {
      restartCount: 0,
      windowStart: 0,
      isOpen: false,
      lastRestartAt: 0,
    };
    circuits.set(userId, state);
  }

  // Reset window if expired
  if (Date.now() - state.windowStart > CIRCUIT_WINDOW_MS) {
    state.restartCount = 0;
    state.windowStart = 0;
    state.isOpen = false;
  }

  return state;
}

function recordRestart(userId: string): void {
  const state = getCircuit(userId);

  if (state.windowStart === 0) {
    state.windowStart = Date.now();
  }

  state.restartCount++;
  state.lastRestartAt = Date.now();

  if (state.restartCount >= MAX_RESTARTS_PER_HOUR) {
    state.isOpen = true;
    log.error("Circuit breaker OPEN — stopping restarts", {
      userId,
      restartCount: state.restartCount,
      windowStart: new Date(state.windowStart).toISOString(),
    });
  }
}

// ---------- Health sweep ----------

/**
 * Run a single health sweep across all containers.
 * Can be called manually or by the interval.
 */
export async function runHealthSweep(): Promise<HealthSweepResult> {
  const result: HealthSweepResult = {
    timestamp: Date.now(),
    containersChecked: 0,
    healthy: 0,
    unhealthy: 0,
    restarted: [],
    circuitOpen: [],
    errors: [],
  };

  let containers;
  try {
    containers = await listAllContainers();
  } catch (err) {
    log.error("Health sweep failed: cannot list containers", {
      error: String(err),
    });
    return result;
  }

  result.containersChecked = containers.length;

  for (const c of containers) {
    try {
      if (
        c.health === "healthy" ||
        c.health === "starting" ||
        c.health === "none"
      ) {
        // Healthy, starting, or no health check — OK
        if (c.state === "running") {
          result.healthy++;
        }
        continue;
      }

      if (c.health === "unhealthy" || c.state === "exited" || c.state === "dead") {
        result.unhealthy++;

        // Check circuit breaker
        const circuit = getCircuit(c.userId);
        if (circuit.isOpen) {
          result.circuitOpen.push(c.userId);
          log.debug("Skipping restart (circuit open)", {
            userId: c.userId,
          });
          continue;
        }

        // Restart
        log.warn("Restarting unhealthy container", {
          userId: c.userId,
          state: c.state,
          health: c.health,
        });

        try {
          if (c.state === "exited" || c.state === "dead") {
            await docker.startContainer(c.containerName);
          } else {
            await docker.restartContainer(c.containerName);
          }
          recordRestart(c.userId);
          result.restarted.push(c.userId);
        } catch (restartErr) {
          log.error("Failed to restart container", {
            userId: c.userId,
            error: String(restartErr),
          });
          result.errors.push({
            userId: c.userId,
            error: String(restartErr),
          });
        }
      }
    } catch (err) {
      result.errors.push({ userId: c.userId, error: String(err) });
    }
  }

  return result;
}

// ---------- Config drift detection ----------

/**
 * Check all containers for config drift (wrong env vars, wrong network).
 * Runs less frequently than health sweeps (every 5 minutes).
 */
async function checkConfigDrift(): Promise<void> {
  let containers;
  try {
    containers = await listAllContainers();
  } catch {
    return;
  }

  for (const c of containers) {
    try {
      const info = await docker.inspectContainer(c.containerName);
      const envVars = info.Config?.Env ?? [];
      const networkMode = info.HostConfig?.NetworkMode ?? "";

      const hasRachelCloud = envVars.some((e: string) => e === "RACHEL_CLOUD=true");
      const hasCorrectNetwork = networkMode === config.networkName;

      if (!hasRachelCloud || !hasCorrectNetwork) {
        log.error("CONFIG DRIFT DETECTED — container has wrong configuration", {
          userId: c.userId,
          container: c.containerName,
          hasRachelCloud,
          hasCorrectNetwork,
          actualNetwork: networkMode,
          expectedNetwork: config.networkName,
        });
      }
    } catch (err) {
      log.debug("Could not inspect container for drift check", {
        userId: c.userId,
        error: String(err),
      });
    }
  }
}

// ---------- Monitor lifecycle ----------

/**
 * Start the background health monitor.
 * Runs first sweep immediately, then every SWEEP_INTERVAL_MS.
 */
export function startHealthMonitor(
  onSweep?: HealthEventHandler,
): void {
  if (sweepInterval) {
    log.warn("Health monitor already running");
    return;
  }

  log.info("Starting health monitor", {
    intervalMs: SWEEP_INTERVAL_MS,
    maxRestartsPerHour: MAX_RESTARTS_PER_HOUR,
  });

  async function doSweep() {
    if (sweeping) {
      log.debug("Sweep already in progress, skipping");
      return;
    }

    sweeping = true;
    try {
      const result = await runHealthSweep();

      // Only log if something happened
      if (
        result.restarted.length > 0 ||
        result.circuitOpen.length > 0 ||
        result.errors.length > 0
      ) {
        log.info("Health sweep", {
          checked: result.containersChecked,
          healthy: result.healthy,
          unhealthy: result.unhealthy,
          restarted: result.restarted,
          circuitOpen: result.circuitOpen,
          errors: result.errors.length,
        });
      } else {
        log.debug("Health sweep OK", {
          checked: result.containersChecked,
          healthy: result.healthy,
        });
      }

      onSweep?.(result);
    } catch (err) {
      log.error("Health sweep error", { error: String(err) });
    } finally {
      sweeping = false;
    }
  }

  // Run first sweep immediately
  doSweep();

  sweepInterval = setInterval(doSweep, SWEEP_INTERVAL_MS);

  // Config drift check (every 5 minutes)
  checkConfigDrift();
  driftInterval = setInterval(checkConfigDrift, CONFIG_DRIFT_INTERVAL_MS);
}

/**
 * Stop the health monitor.
 */
export function stopHealthMonitor(): void {
  if (sweepInterval) {
    clearInterval(sweepInterval);
    sweepInterval = null;
  }
  if (driftInterval) {
    clearInterval(driftInterval);
    driftInterval = null;
  }
  log.info("Health monitor stopped");
}
