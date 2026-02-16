/**
 * LLM Proxy — SQLite Database
 *
 * Manages the proxy database for usage tracking and rate limiting.
 * Uses WAL mode for concurrent read/write performance.
 */

import { Database } from "bun:sqlite";
import { mkdirSync, existsSync } from "node:fs";
import { dirname } from "node:path";
import { log } from "./config";

const DB_PATH = process.env.PROXY_DB_PATH || "data/proxy.db";

// Ensure directory exists
const dir = dirname(DB_PATH);
if (!existsSync(dir)) {
  mkdirSync(dir, { recursive: true });
}

export const db = new Database(DB_PATH);

// Performance pragmas
db.exec("PRAGMA journal_mode = WAL");
db.exec("PRAGMA synchronous = NORMAL");
db.exec("PRAGMA busy_timeout = 5000");

// ---------- Schema ----------

db.exec(`
  -- Usage records: one row per API request
  CREATE TABLE IF NOT EXISTS usage (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    timestamp INTEGER NOT NULL,
    input_tokens INTEGER NOT NULL DEFAULT 0,
    output_tokens INTEGER NOT NULL DEFAULT 0,
    model TEXT NOT NULL DEFAULT '',
    duration_ms INTEGER NOT NULL DEFAULT 0,
    streaming INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  -- Index for rate limit queries (user + time window)
  CREATE INDEX IF NOT EXISTS idx_usage_user_time ON usage(user_id, timestamp);

  -- Per-user rate limit configuration
  -- If a user has no row here, default limits apply
  CREATE TABLE IF NOT EXISTS rate_limits (
    user_id TEXT PRIMARY KEY,
    daily_request_limit INTEGER NOT NULL DEFAULT 500,
    daily_token_limit INTEGER NOT NULL DEFAULT 2000000,
    hourly_request_limit INTEGER NOT NULL DEFAULT 60,
    hourly_token_limit INTEGER NOT NULL DEFAULT 500000,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
`);

// ---------- Default limits ----------

/**
 * Default rate limits applied when a user has no custom row in rate_limits.
 *
 * Rationale:
 * - 60 requests/hour  = ~1/min average, allows bursts
 * - 500 requests/day  = reasonable for a personal assistant
 * - 500K tokens/hour  = ~25 large conversations per hour
 * - 2M tokens/day     = generous daily allowance for GLM
 */
export const DEFAULT_LIMITS = {
  dailyRequestLimit: 500,
  dailyTokenLimit: 2_000_000,
  hourlyRequestLimit: 60,
  hourlyTokenLimit: 500_000,
} as const;

// ---------- Lifecycle ----------

export function closeDb(): void {
  db.close();
  log.info("Database closed");
}

log.info("Database initialized", { path: DB_PATH });
