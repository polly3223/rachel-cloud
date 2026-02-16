/**
 * Rachel Cloud LLM Proxy Server
 *
 * Sits between Docker containers and Z.ai, providing:
 * - Auth injection (Z.ai API key)
 * - SSE response streaming
 * - Per-user usage tracking
 * - Rate limiting
 *
 * Usage: ZAI_API_KEY=xxx bun run src/proxy/server.ts
 * Port: 9999 (configurable via PROXY_PORT env var)
 *
 * Containers connect via: ANTHROPIC_BASE_URL=http://host.docker.internal:9999
 * User ID derived from: ANTHROPIC_AUTH_TOKEN=rachel-user-{USER_ID}
 */

import { config, log } from "./config";
import { extractUserId, forwardToZai } from "./forward";
import { checkRateLimit, rateLimitResponse } from "./rate-limit";
import { recordUsage } from "./usage";
import { closeDb } from "./db";

// ---------- Error responses ----------

function authError(): Response {
  return new Response(
    JSON.stringify({
      type: "error",
      error: {
        type: "authentication_error",
        message:
          "Missing or invalid user ID. Set ANTHROPIC_AUTH_TOKEN=rachel-user-{your-id} in your container.",
      },
    }),
    { status: 401, headers: { "content-type": "application/json" } },
  );
}

function notFoundError(): Response {
  return new Response(
    JSON.stringify({
      type: "error",
      error: { type: "not_found_error", message: "Unknown endpoint" },
    }),
    { status: 404, headers: { "content-type": "application/json" } },
  );
}

// ---------- Route handlers ----------

async function handleMessages(req: Request): Promise<Response> {
  const userId = extractUserId(req);
  if (!userId) return authError();

  // Check rate limit before forwarding
  const rateCheck = checkRateLimit(userId);
  if (!rateCheck.allowed) {
    log.warn("Rate limited", {
      userId,
      reason: rateCheck.reason,
      ...rateCheck.currentUsage,
    });
    return rateLimitResponse(rateCheck);
  }

  log.info("Request", { userId, endpoint: "/v1/messages" });

  const result = await forwardToZai(req, userId);

  // Record usage async — don't block the response
  result.usagePromise
    .then((usage) => {
      recordUsage(usage);
      log.info("Request complete", {
        userId: usage.userId,
        model: usage.model,
        inputTokens: usage.inputTokens,
        outputTokens: usage.outputTokens,
        durationMs: usage.durationMs,
        streaming: usage.streaming,
      });
    })
    .catch((err) => {
      log.error("Usage extraction failed", { userId, error: String(err) });
    });

  return result.response;
}

async function handleCountTokens(req: Request): Promise<Response> {
  const userId = extractUserId(req);
  if (!userId) return authError();

  log.debug("Count tokens", { userId });

  const result = await forwardToZai(req, userId, "/v1/messages/count_tokens");
  return result.response;
}

function handleHealth(): Response {
  return new Response(
    JSON.stringify({ status: "ok", uptime: process.uptime() }),
    { headers: { "content-type": "application/json" } },
  );
}

// ---------- Server ----------

const server = Bun.serve({
  port: config.port,
  hostname: "0.0.0.0",

  async fetch(req: Request): Promise<Response> {
    const url = new URL(req.url);
    const path = url.pathname;
    const method = req.method;

    // POST /v1/messages
    if (method === "POST" && path === "/v1/messages") {
      return handleMessages(req);
    }

    // POST /v1/messages/count_tokens
    if (method === "POST" && path === "/v1/messages/count_tokens") {
      return handleCountTokens(req);
    }

    // GET /health
    if (method === "GET" && path === "/health") {
      return handleHealth();
    }

    return notFoundError();
  },
});

log.info("LLM Proxy started", {
  port: config.port,
  upstream: config.upstreamBaseUrl,
  // NEVER log the API key
});

// ---------- Graceful shutdown ----------

function shutdown() {
  log.info("Shutting down proxy...");
  server.stop();
  closeDb();
  process.exit(0);
}

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
