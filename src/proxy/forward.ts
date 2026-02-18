/**
 * LLM Proxy — Request Forwarding & SSE Streaming
 *
 * Forwards Anthropic-compatible API requests to Z.ai,
 * injecting the shared API key and extracting per-user token usage.
 * Non-streaming requests are retried on 5xx/network errors with exponential backoff.
 */

import { config, log } from "./config";

// ---------- Types ----------

export interface UsageData {
  userId: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  durationMs: number;
  timestamp: number;
  streaming: boolean;
  requestId: string;
}

// ---------- User ID extraction ----------

/**
 * Extract user ID from the request headers.
 * Containers set ANTHROPIC_API_KEY=rachel-user-{USER_ID},
 * which the Claude CLI sends as either:
 *   - x-api-key header (Anthropic SDK convention)
 *   - Authorization: Bearer ... header
 */
export function extractUserId(req: Request): string | null {
  // Check x-api-key first (what Claude CLI / Anthropic SDK sends)
  const apiKey = req.headers.get("x-api-key");
  if (apiKey) {
    const match = apiKey.match(/^rachel-user-(.+)$/);
    if (match) return match[1];
  }
  // Fallback to Authorization header
  const auth = req.headers.get("authorization");
  if (auth) {
    const token = auth.replace(/^Bearer\s+/i, "");
    const match = token.match(/^rachel-user-(.+)$/);
    if (match) return match[1];
  }
  return null;
}

// ---------- Retry logic ----------

const MAX_RETRIES = 3;
const RETRY_DELAYS = [1000, 2000, 4000]; // Exponential backoff: 1s, 2s, 4s

/**
 * Fetch with automatic retry for 5xx and network errors.
 * Does NOT retry 4xx (client errors) — those are the container's problem.
 */
async function fetchWithRetry(
  url: string,
  options: RequestInit,
  requestId: string,
  maxRetries: number = MAX_RETRIES,
): Promise<Response> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(url, options);

      // Don't retry client errors (4xx)
      if (response.status < 500) {
        return response;
      }

      // 5xx — retry if attempts left
      if (attempt < maxRetries) {
        log.warn("Upstream 5xx, retrying", {
          requestId,
          status: response.status,
          attempt: attempt + 1,
          maxRetries,
        });
        await Bun.sleep(RETRY_DELAYS[attempt] || 4000);
        continue;
      }

      // Final attempt failed with 5xx — return the response as-is
      return response;
    } catch (error) {
      lastError = error as Error;

      if (attempt < maxRetries) {
        log.warn("Upstream network error, retrying", {
          requestId,
          error: String(error),
          attempt: attempt + 1,
          maxRetries,
        });
        await Bun.sleep(RETRY_DELAYS[attempt] || 4000);
        continue;
      }
    }
  }

  // All retries exhausted with network errors
  throw lastError || new Error("All retry attempts failed");
}

// ---------- Error response helpers ----------

function proxyErrorResponse(
  status: number,
  errorType: string,
  message: string,
): Response {
  return new Response(
    JSON.stringify({
      type: "error",
      error: { type: errorType, message },
    }),
    { status, headers: { "content-type": "application/json" } },
  );
}

// ---------- Upstream forwarding ----------

const UPSTREAM_TIMEOUT_MS = 120_000;

/**
 * Forward an Anthropic-compatible request to Z.ai with auth injection.
 * Returns the proxied response and a promise that resolves to usage data
 * once the response is fully consumed (streaming) or read (non-streaming).
 *
 * Non-streaming requests are retried up to 3 times on 5xx/network errors.
 * Streaming requests are NOT retried (SSE streams cannot be replayed).
 */
export async function forwardToZai(
  req: Request,
  userId: string,
  endpoint: string = "/v1/messages",
): Promise<{ response: Response; usagePromise: Promise<UsageData> }> {
  const startTime = Date.now();
  const requestId = crypto.randomUUID();

  let body: any;
  try {
    body = await req.json();
  } catch {
    return {
      response: proxyErrorResponse(400, "invalid_request_error", "Invalid JSON body"),
      usagePromise: Promise.resolve(emptyUsage(userId, requestId, startTime)),
    };
  }

  const isStreaming = body.stream === true;
  const model = body.model || "unknown";
  const upstreamUrl = `${config.upstreamBaseUrl}${endpoint}`;

  // Build upstream headers — inject Z.ai key, forward Anthropic headers
  const upstreamHeaders: Record<string, string> = {
    "content-type": "application/json",
    authorization: `Bearer ${config.zaiApiKey}`,
    "anthropic-version":
      req.headers.get("anthropic-version") || "2023-06-01",
  };

  const beta = req.headers.get("anthropic-beta");
  if (beta) upstreamHeaders["anthropic-beta"] = beta;

  log.debug("Forwarding request", {
    requestId,
    userId,
    model,
    streaming: isStreaming,
    endpoint,
  });

  const fetchOptions: RequestInit = {
    method: "POST",
    headers: upstreamHeaders,
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
  };

  // ---------- Non-streaming: fetch with retry ----------
  if (!isStreaming) {
    let upstreamRes: Response;
    try {
      upstreamRes = await fetchWithRetry(upstreamUrl, fetchOptions, requestId);
    } catch (err) {
      const isTimeout =
        err instanceof Error && err.name === "TimeoutError";
      log.error("Upstream failed after retries", {
        requestId,
        userId,
        error: String(err),
      });
      return {
        response: isTimeout
          ? proxyErrorResponse(504, "timeout_error", "Upstream request timed out")
          : proxyErrorResponse(502, "proxy_error", "Failed to reach upstream API after retries"),
        usagePromise: Promise.resolve(emptyUsage(userId, requestId, startTime)),
      };
    }

    // Pass through upstream errors unchanged
    if (!upstreamRes.ok) {
      const errorBody = await upstreamRes.text();
      return {
        response: new Response(errorBody, {
          status: upstreamRes.status,
          headers: {
            "content-type":
              upstreamRes.headers.get("content-type") || "application/json",
          },
        }),
        usagePromise: Promise.resolve(emptyUsage(userId, requestId, startTime)),
      };
    }

    const responseJson = await upstreamRes.json();
    const inputTokens = responseJson?.usage?.input_tokens ?? 0;
    const outputTokens = responseJson?.usage?.output_tokens ?? 0;

    const usage: UsageData = {
      userId,
      model,
      inputTokens,
      outputTokens,
      durationMs: Date.now() - startTime,
      timestamp: Math.floor(startTime / 1000),
      streaming: false,
      requestId,
    };

    return {
      response: new Response(JSON.stringify(responseJson), {
        status: upstreamRes.status,
        headers: { "content-type": "application/json" },
      }),
      usagePromise: Promise.resolve(usage),
    };
  }

  // ---------- Streaming: single attempt (no retry) ----------
  let upstreamRes: Response;
  try {
    upstreamRes = await fetch(upstreamUrl, fetchOptions);
  } catch (err) {
    const isTimeout = err instanceof Error && err.name === "TimeoutError";
    log.error("Upstream connection failed (streaming)", {
      requestId,
      userId,
      error: String(err),
    });
    return {
      response: isTimeout
        ? proxyErrorResponse(504, "timeout_error", "Upstream request timed out")
        : proxyErrorResponse(502, "proxy_error", "Upstream connection failed"),
      usagePromise: Promise.resolve(emptyUsage(userId, requestId, startTime)),
    };
  }

  return handleStreamingResponse(upstreamRes, userId, model, requestId, startTime);
}

// ---------- SSE streaming handler ----------

function handleStreamingResponse(
  upstreamRes: Response,
  userId: string,
  model: string,
  requestId: string,
  startTime: number,
): { response: Response; usagePromise: Promise<UsageData> } {
  const decoder = new TextDecoder();
  let buffer = "";
  let inputTokens = 0;
  let outputTokens = 0;

  let resolveUsage: (usage: UsageData) => void;
  const usagePromise = new Promise<UsageData>((resolve) => {
    resolveUsage = resolve;
  });

  const transform = new TransformStream<Uint8Array, Uint8Array>({
    transform(chunk, controller) {
      // Pass through bytes unmodified
      controller.enqueue(chunk);

      // Observe: decode and scan for usage events
      try {
        buffer += decoder.decode(chunk, { stream: true });
        extractUsageFromBuffer();
      } catch {
        // Never corrupt the stream — ignore parse errors
      }
    },
    flush() {
      // Process any remaining buffered data
      try {
        if (buffer.length > 0) {
          extractUsageFromBuffer();
        }
      } catch {
        // ignore
      }

      resolveUsage({
        userId,
        model,
        inputTokens,
        outputTokens,
        durationMs: Date.now() - startTime,
        timestamp: Math.floor(startTime / 1000),
        streaming: true,
        requestId,
      });
    },
  });

  function extractUsageFromBuffer() {
    // Split on double newlines (SSE event boundary)
    const parts = buffer.split("\n\n");
    // Keep the last part as it may be incomplete
    buffer = parts.pop() || "";

    for (const eventBlock of parts) {
      const lines = eventBlock.split("\n");
      let eventType = "";
      let dataStr = "";

      for (const line of lines) {
        if (line.startsWith("event: ")) {
          eventType = line.slice(7).trim();
        } else if (line.startsWith("data: ")) {
          dataStr = line.slice(6);
        }
      }

      // Only parse JSON for events we care about
      if (
        !dataStr ||
        (eventType !== "message_start" && eventType !== "message_delta")
      ) {
        continue;
      }

      try {
        const data = JSON.parse(dataStr);
        if (eventType === "message_start") {
          inputTokens = data?.message?.usage?.input_tokens ?? inputTokens;
        } else if (eventType === "message_delta") {
          outputTokens = data?.usage?.output_tokens ?? outputTokens;
        }
      } catch {
        // Skip unparseable events silently
      }
    }
  }

  // Pipe upstream body through the TransformStream
  if (!upstreamRes.body) {
    resolveUsage!(emptyUsage(userId, requestId, startTime));
    return {
      response: new Response(null, { status: 502 }),
      usagePromise,
    };
  }

  const readable = upstreamRes.body.pipeThrough(transform);

  const response = new Response(readable, {
    status: upstreamRes.status,
    headers: {
      "content-type": "text/event-stream",
      "cache-control": "no-cache",
      connection: "keep-alive",
    },
  });

  return { response, usagePromise };
}

// ---------- Helpers ----------

function emptyUsage(
  userId: string,
  requestId: string,
  startTime: number,
): UsageData {
  return {
    userId,
    model: "unknown",
    inputTokens: 0,
    outputTokens: 0,
    durationMs: Date.now() - startTime,
    timestamp: Math.floor(startTime / 1000),
    streaming: false,
    requestId,
  };
}
