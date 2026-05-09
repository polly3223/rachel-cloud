/**
 * Rachel Cloud LLM Proxy Server
 *
 * Sits between Docker containers and Z.ai, providing:
 * - Auth injection (Z.ai API key)
 * - SSE response streaming
 * - Per-user usage tracking & rate limiting
 * - Retry logic with exponential backoff (non-streaming)
 * - Comprehensive health checks
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
import { handleHealth } from "./health";

// ---------- Error responses ----------

function authError(requestId: string): Response {
  log.warn("Auth failed: missing user ID", { requestId });
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

function parseRequestUrl(req: Request): URL | null {
  try {
    return new URL(req.url);
  } catch (err) {
    log.warn("Malformed request URL", {
      url: req.url,
      error: String(err),
    });
    return null;
  }
}

// ---------- Route handlers ----------

async function handleMessages(req: Request): Promise<Response> {
  const requestId = crypto.randomUUID();
  const userId = extractUserId(req);
  if (!userId) return authError(requestId);

  log.info("Request received", {
    requestId,
    userId,
    path: "/v1/messages",
  });

  // Check rate limit before forwarding
  const rateCheck = checkRateLimit(userId);
  if (!rateCheck.allowed) {
    log.warn("Rate limited", {
      requestId,
      userId,
      reason: rateCheck.reason,
    });
    return rateLimitResponse(rateCheck);
  }

  try {
    const result = await forwardToZai(req, userId);

    // Record usage async — don't block the response
    result.usagePromise
      .then((usage) => {
        recordUsage(usage);
        log.info("Request complete", {
          requestId,
          userId: usage.userId,
          model: usage.model,
          inputTokens: usage.inputTokens,
          outputTokens: usage.outputTokens,
          durationMs: usage.durationMs,
          streaming: usage.streaming,
        });
      })
      .catch((err) => {
        log.error("Usage extraction failed", {
          requestId,
          userId,
          error: String(err),
        });
      });

    return result.response;
  } catch (err) {
    log.error("Request failed", {
      requestId,
      userId,
      error: String(err),
    });
    return new Response(
      JSON.stringify({
        type: "error",
        error: { type: "proxy_error", message: "Internal proxy error" },
      }),
      { status: 500, headers: { "content-type": "application/json" } },
    );
  }
}

async function handleCountTokens(req: Request): Promise<Response> {
  const requestId = crypto.randomUUID();
  const userId = extractUserId(req);
  if (!userId) return authError(requestId);

  log.debug("Count tokens", { requestId, userId });

  const result = await forwardToZai(req, userId, "/v1/messages/count_tokens");
  return result.response;
}

// ---------- Server ----------

const server = Bun.serve({
  port: config.port,
  hostname: "0.0.0.0",

  async fetch(req: Request): Promise<Response> {
    const url = parseRequestUrl(req);
    if (!url) {
      return new Response(
        JSON.stringify({
          type: "error",
          error: { type: "invalid_request_error", message: "Malformed request URL" },
        }),
        { status: 400, headers: { "content-type": "application/json" } },
      );
    }
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

    // GET /health or GET /health?detailed=true
    if (method === "GET" && path === "/health") {
      const detailed = url.searchParams.get("detailed") === "true";
      return handleHealth(detailed);
    }

    // GET /stats (alias for detailed health)
    if (method === "GET" && path === "/stats") {
      return handleHealth(true);
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
