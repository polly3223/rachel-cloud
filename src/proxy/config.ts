/**
 * LLM Proxy — Configuration
 *
 * Loads and validates proxy settings from environment variables.
 * CRITICAL: The Z.ai API key is NEVER logged or exposed.
 */

export interface ProxyConfig {
  zaiApiKey: string;
  port: number;
  upstreamBaseUrl: string;
  logLevel: "debug" | "info" | "warn" | "error";
}

function loadConfig(): ProxyConfig {
  const zaiApiKey = process.env.ZAI_API_KEY;
  if (!zaiApiKey) {
    console.error("FATAL: ZAI_API_KEY environment variable is required");
    process.exit(1);
  }

  return {
    zaiApiKey, // NEVER log this value
    port: parseInt(process.env.PROXY_PORT || "9999", 10),
    upstreamBaseUrl:
      process.env.ZAI_UPSTREAM_URL || "https://api.z.ai/api/anthropic",
    logLevel:
      (process.env.LOG_LEVEL as ProxyConfig["logLevel"]) || "info",
  };
}

export const config = loadConfig();

// ---------- Logging utility ----------

const LOG_LEVELS = { debug: 0, info: 1, warn: 2, error: 3 } as const;

export const log = {
  debug: (...args: unknown[]) => {
    if (LOG_LEVELS[config.logLevel] <= LOG_LEVELS.debug)
      console.log(new Date().toISOString(), "[DEBUG]", ...args);
  },
  info: (...args: unknown[]) => {
    if (LOG_LEVELS[config.logLevel] <= LOG_LEVELS.info)
      console.log(new Date().toISOString(), "[INFO]", ...args);
  },
  warn: (...args: unknown[]) => {
    if (LOG_LEVELS[config.logLevel] <= LOG_LEVELS.warn)
      console.warn(new Date().toISOString(), "[WARN]", ...args);
  },
  error: (...args: unknown[]) => {
    console.error(new Date().toISOString(), "[ERROR]", ...args);
  },
};
