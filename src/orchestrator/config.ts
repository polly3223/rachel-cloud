/**
 * Container Orchestrator — Configuration
 *
 * Loads orchestrator settings from environment variables.
 */

export interface OrchestratorConfig {
  dockerSocket: string;
  dockerApiVersion: string;
  imageName: string;
  networkName: string;
  port: number;
  containerPrefix: string;
  volumePrefix: string;
  proxyUrl: string;
  groqApiKey: string;
  defaults: {
    memoryBytes: number;
    memorySwapBytes: number;
    nanoCpus: number;
    pidsLimit: number;
  };
}

function loadConfig(): OrchestratorConfig {
  return {
    dockerSocket: process.env.DOCKER_SOCKET || "/var/run/docker.sock",
    dockerApiVersion: process.env.DOCKER_API_VERSION || "v1.45",
    imageName: process.env.RACHEL_IMAGE || "rachel8:latest",
    networkName: process.env.DOCKER_NETWORK || "rachel-net",
    port: parseInt(process.env.ORCHESTRATOR_PORT || "9998", 10),
    containerPrefix: "rachel-user-",
    volumePrefix: "rachel-user-",
    proxyUrl:
      process.env.PROXY_URL || "http://host.docker.internal:9999",
    groqApiKey: process.env.GROQ_API_KEY || "",
    defaults: {
      memoryBytes: 1536 * 1024 * 1024,    // 1.5GB — Claude Code CLI needs ~800MB+
      memorySwapBytes: 2048 * 1024 * 1024, // 2GB total (512MB swap)
      nanoCpus: 1_000_000_000,             // 1.0 CPU — Claude Code spawns subprocesses
      pidsLimit: 256,                      // Claude Code uses subprocesses for tools
    },
  };
}

export const config = loadConfig();

// ---------- Logging ----------

const LOG_LEVELS = { debug: 0, info: 1, warn: 2, error: 3 } as const;
const level =
  (process.env.LOG_LEVEL as keyof typeof LOG_LEVELS) || "info";

export const log = {
  debug: (...args: unknown[]) => {
    if (LOG_LEVELS[level] <= LOG_LEVELS.debug)
      console.log(new Date().toISOString(), "[ORCH/DEBUG]", ...args);
  },
  info: (...args: unknown[]) => {
    if (LOG_LEVELS[level] <= LOG_LEVELS.info)
      console.log(new Date().toISOString(), "[ORCH/INFO]", ...args);
  },
  warn: (...args: unknown[]) => {
    if (LOG_LEVELS[level] <= LOG_LEVELS.warn)
      console.warn(new Date().toISOString(), "[ORCH/WARN]", ...args);
  },
  error: (...args: unknown[]) => {
    console.error(new Date().toISOString(), "[ORCH/ERROR]", ...args);
  },
};
