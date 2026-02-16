/**
 * LLM Proxy — Usage Recording
 *
 * Records completed request data (token counts, model, duration) to SQLite.
 * Uses a prepared statement for performance.
 */

import { db } from "./db";
import { log } from "./config";
import type { UsageData } from "./forward";

// Prepared statement — reused across all calls
const insertUsage = db.prepare(`
  INSERT INTO usage (user_id, timestamp, input_tokens, output_tokens, model, duration_ms, streaming)
  VALUES (?, ?, ?, ?, ?, ?, ?)
`);

/**
 * Record a completed request's usage data to the database.
 * This is called async after the response is sent — it never blocks the client.
 */
export function recordUsage(usage: UsageData): void {
  try {
    insertUsage.run(
      usage.userId,
      usage.timestamp,
      usage.inputTokens,
      usage.outputTokens,
      usage.model,
      usage.durationMs,
      usage.streaming ? 1 : 0,
    );
    log.debug("Usage recorded", {
      userId: usage.userId,
      inputTokens: usage.inputTokens,
      outputTokens: usage.outputTokens,
    });
  } catch (err) {
    log.error("Failed to record usage", {
      userId: usage.userId,
      error: String(err),
    });
  }
}
