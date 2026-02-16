/**
 * LLM Proxy — Request Forwarding & SSE Streaming
 *
 * Forwards Anthropic-compatible API requests to Z.ai,
 * injecting the shared API key and extracting per-user token usage.
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
}

// ---------- User ID extraction ----------

/**
 * Extract user ID from the Authorization header.
 * Containers set ANTHROPIC_AUTH_TOKEN=rachel-user-{USER_ID},
 * which the Claude Agent SDK sends as the Authorization header.
 */
export function extractUserId(req: Request): string | null {
  const auth = req.headers.get("authorization");
  if (!auth) return null;
  // Support both "rachel-user-{id}" and "Bearer rachel-user-{id}"
  const token = auth.replace(/^Bearer\s+/i, "");
  const match = token.match(/^rachel-user-(.+)$/);
  return match ? match[1] : null;
}

// ---------- Upstream forwarding ----------

const UPSTREAM_TIMEOUT_MS = 120_000;

/**
 * Forward an Anthropic-compatible request to Z.ai with auth injection.
 * Returns the proxied response and a promise that resolves to usage data
 * once the response is fully consumed (streaming) or read (non-streaming).
 */
export async function forwardToZai(
  req: Request,
  userId: string,
  endpoint: string = "/v1/messages",
): Promise<{ response: Response; usagePromise: Promise<UsageData> }> {
  const startTime = Date.now();

  let body: any;
  try {
    body = await req.json();
  } catch {
    return {
      response: new Response(
        JSON.stringify({
          type: "error",
          error: { type: "invalid_request_error", message: "Invalid JSON body" },
        }),
        { status: 400, headers: { "content-type": "application/json" } },
      ),
      usagePromise: Promise.resolve(emptyUsage(userId, startTime)),
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

  log.debug("Forwarding request", { userId, model, streaming: isStreaming, endpoint });

  // Fetch from upstream
  let upstreamRes: Response;
  try {
    upstreamRes = await fetch(upstreamUrl, {
      method: "POST",
      headers: upstreamHeaders,
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
    });
  } catch (err) {
    log.error("Upstream connection failed", { userId, error: String(err) });
    return {
      response: new Response(
        JSON.stringify({
          type: "error",
          error: { type: "proxy_error", message: "Upstream connection failed" },
        }),
        { status: 502, headers: { "content-type": "application/json" } },
      ),
      usagePromise: Promise.resolve(emptyUsage(userId, startTime)),
    };
  }

  // If upstream returned an error, pass it through unchanged
  if (!upstreamRes.ok && !isStreaming) {
    const errorBody = await upstreamRes.text();
    return {
      response: new Response(errorBody, {
        status: upstreamRes.status,
        headers: { "content-type": upstreamRes.headers.get("content-type") || "application/json" },
      }),
      usagePromise: Promise.resolve(emptyUsage(userId, startTime)),
    };
  }

  // ---------- Non-streaming response ----------
  if (!isStreaming) {
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
    };

    return {
      response: new Response(JSON.stringify(responseJson), {
        status: upstreamRes.status,
        headers: { "content-type": "application/json" },
      }),
      usagePromise: Promise.resolve(usage),
    };
  }

  // ---------- Streaming response (SSE) ----------
  return handleStreamingResponse(upstreamRes, userId, model, startTime);
}

// ---------- SSE streaming handler ----------

function handleStreamingResponse(
  upstreamRes: Response,
  userId: string,
  model: string,
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
      if (!dataStr || (eventType !== "message_start" && eventType !== "message_delta")) {
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
    resolveUsage!(emptyUsage(userId, startTime));
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

function emptyUsage(userId: string, startTime: number): UsageData {
  return {
    userId,
    model: "unknown",
    inputTokens: 0,
    outputTokens: 0,
    durationMs: Date.now() - startTime,
    timestamp: Math.floor(startTime / 1000),
    streaming: false,
  };
}
