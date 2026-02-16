/**
 * LLM Proxy — Health Check Endpoint
 *
 * Provides basic and detailed health checks:
 * - GET /health       → fast (DB ping, uptime)
 * - GET /health?detailed=true → includes upstream check + usage stats
 */

import { db } from "./db";
import { config, log } from "./config";

// ---------- Types ----------

export interface HealthStatus {
  status: "ok" | "degraded" | "error";
  uptime: number;
  version: string;
  checks: {
    database: { status: "ok" | "error"; latencyMs: number; error?: string };
    upstream: {
      status: "ok" | "error" | "unknown";
      latencyMs?: number;
      error?: string;
    };
  };
  stats?: {
    totalRequests: number;
    totalTokens: number;
    uniqueUsers: number;
    last24h: {
      requests: number;
      inputTokens: number;
      outputTokens: number;
    };
  };
}

// ---------- Handler ----------

export async function handleHealth(
  detailed: boolean = false,
): Promise<Response> {
  const health: HealthStatus = {
    status: "ok",
    uptime: process.uptime(),
    version: "1.0.0",
    checks: {
      database: { status: "ok", latencyMs: 0 },
      upstream: { status: "unknown" },
    },
  };

  // Check database connectivity
  try {
    const start = performance.now();
    db.prepare("SELECT 1").get();
    health.checks.database.latencyMs = Math.round(performance.now() - start);
  } catch (err) {
    health.checks.database.status = "error";
    health.checks.database.error = String(err);
    health.status = "error";
  }

  // Detailed: check upstream reachability (lightweight HEAD request)
  if (detailed) {
    try {
      const start = performance.now();
      const resp = await fetch(config.upstreamBaseUrl, {
        method: "HEAD",
        signal: AbortSignal.timeout(5000),
      });
      health.checks.upstream.latencyMs = Math.round(
        performance.now() - start,
      );
      // 405 (Method Not Allowed) is fine — it means the server is reachable
      health.checks.upstream.status =
        resp.ok || resp.status === 405 ? "ok" : "error";
    } catch (err) {
      health.checks.upstream.status = "error";
      health.checks.upstream.error = String(err);
      health.status = "degraded";
    }
  }

  // Detailed: include usage stats
  if (detailed) {
    try {
      const now = Math.floor(Date.now() / 1000);
      const dayAgo = now - 86400;

      const total = db
        .prepare(
          `SELECT COUNT(*) as requests, COALESCE(SUM(input_tokens + output_tokens), 0) as tokens FROM usage`,
        )
        .get() as { requests: number; tokens: number };

      const users = db
        .prepare(`SELECT COUNT(DISTINCT user_id) as count FROM usage`)
        .get() as { count: number };

      const last24h = db
        .prepare(
          `SELECT
            COUNT(*) as requests,
            COALESCE(SUM(input_tokens), 0) as input_tokens,
            COALESCE(SUM(output_tokens), 0) as output_tokens
          FROM usage
          WHERE timestamp > ?`,
        )
        .get(dayAgo) as {
        requests: number;
        input_tokens: number;
        output_tokens: number;
      };

      health.stats = {
        totalRequests: total.requests,
        totalTokens: total.tokens,
        uniqueUsers: users.count,
        last24h: {
          requests: last24h.requests,
          inputTokens: last24h.input_tokens,
          outputTokens: last24h.output_tokens,
        },
      };
    } catch (err) {
      log.error("Failed to gather health stats", { error: String(err) });
    }
  }

  const statusCode = health.status === "error" ? 503 : 200;

  return new Response(JSON.stringify(health, null, 2), {
    status: statusCode,
    headers: { "content-type": "application/json" },
  });
}
