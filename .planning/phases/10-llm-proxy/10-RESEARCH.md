# Phase 10: LLM Proxy Server - Research

**Researched:** 2026-02-16
**Domain:** Anthropic Messages API, Z.ai GLM API, SSE Streaming Proxy, Rate Limiting, Bun HTTP Server
**Confidence:** HIGH

## Summary

Phase 10 builds a lightweight Bun HTTP proxy that sits between Rachel Cloud Docker containers and the Z.ai Anthropic-compatible API endpoint. The proxy receives Anthropic Messages API requests from containers (which use the Claude Agent SDK), injects the Z.ai auth token, forwards requests to `https://api.z.ai/api/anthropic/v1/messages`, streams SSE responses back transparently, and tracks per-user usage with rate limiting via SQLite.

**Key architectural insight:** Rachel8 containers use the Claude Agent SDK (`@anthropic-ai/claude-agent-sdk`), which internally makes HTTP requests to the Anthropic Messages API. By setting `ANTHROPIC_BASE_URL=http://host.docker.internal:9999` in the container, all Claude SDK API calls are redirected to the proxy. The SDK sends `ANTHROPIC_AUTH_TOKEN` as the `Authorization` header. The proxy strips this, injects the real Z.ai API key, and forwards to Z.ai.

**Primary recommendation:** Bun.serve() with transparent SSE pass-through (pipe upstream response body directly to client), bun:sqlite for synchronous rate limiting checks (microsecond latency), and sliding window counters for rate limits.

## Standard Stack

### Core Technologies
| Component | Version | Purpose | Why Standard |
|-----------|---------|---------|--------------|
| Bun.serve() | 1.1+ | HTTP server | Native, fast, consistent with Rachel8 stack; built-in streaming support |
| bun:sqlite | Built-in | Rate limit + usage storage | Synchronous API, 3-6x faster than better-sqlite3, zero dependencies |
| Anthropic Messages API | 2023-06-01 | Request/response format | Industry standard, used by Claude Agent SDK |
| Z.ai API | Anthropic-compatible | Upstream LLM provider | Shared GLM subscription for all tenants |
| Server-Sent Events (SSE) | Standard | Response streaming | Anthropic streaming format, must pass through transparently |

## Anthropic Messages API Specification

### Request Format

**Endpoint:** `POST /v1/messages`

**Required Headers:**
| Header | Value | Purpose |
|--------|-------|---------|
| `content-type` | `application/json` | Request body format |
| `anthropic-version` | `2023-06-01` | API version (MUST be forwarded to Z.ai) |
| `x-api-key` | API key | Authentication (standard Anthropic) |
| `anthropic-beta` | Feature flags | Beta features (MUST be forwarded if present) |

**Request Body (key fields):**
```json
{
  "model": "claude-opus-4-6",
  "messages": [{"role": "user", "content": "Hello"}],
  "max_tokens": 1024,
  "stream": true,
  "system": "Optional system prompt",
  "temperature": 1.0,
  "tools": [],
  "thinking": {"type": "enabled", "budget_tokens": 16000}
}
```

**Response (non-streaming):**
```json
{
  "id": "msg_...",
  "type": "message",
  "role": "assistant",
  "model": "claude-opus-4-6",
  "content": [{"type": "text", "text": "Response"}],
  "stop_reason": "end_turn",
  "usage": {
    "input_tokens": 25,
    "output_tokens": 15,
    "cache_creation_input_tokens": 0,
    "cache_read_input_tokens": 0
  }
}
```

### SSE Streaming Format

When `"stream": true`, the response is `Content-Type: text/event-stream` with these event types:

**Event Flow:**
1. `message_start` - Contains Message object with empty content and initial `usage.input_tokens`
2. `content_block_start` - Starts a content block (text, tool_use, thinking)
3. `content_block_delta` - Incremental content (text_delta, input_json_delta, thinking_delta, signature_delta)
4. `content_block_stop` - Ends a content block
5. `message_delta` - Final usage info with cumulative `usage.output_tokens` and `stop_reason`
6. `message_stop` - Stream complete
7. `ping` - Keep-alive (can appear anywhere)
8. `error` - Error during stream (e.g., overloaded_error)

**Example SSE stream:**
```
event: message_start
data: {"type": "message_start", "message": {"id": "msg_...", "type": "message", "role": "assistant", "content": [], "model": "claude-opus-4-6", "stop_reason": null, "usage": {"input_tokens": 25, "output_tokens": 1}}}

event: content_block_start
data: {"type": "content_block_start", "index": 0, "content_block": {"type": "text", "text": ""}}

event: ping
data: {"type": "ping"}

event: content_block_delta
data: {"type": "content_block_delta", "index": 0, "delta": {"type": "text_delta", "text": "Hello"}}

event: content_block_stop
data: {"type": "content_block_stop", "index": 0}

event: message_delta
data: {"type": "message_delta", "delta": {"stop_reason": "end_turn"}, "usage": {"output_tokens": 15}}

event: message_stop
data: {"type": "message_stop"}
```

**Token Extraction from Streams:**
- `input_tokens`: Available in `message_start` event's `message.usage.input_tokens`
- `output_tokens`: Available in `message_delta` event's `usage.output_tokens` (cumulative)
- The proxy must parse SSE events to extract token counts for usage tracking without buffering the entire response

## Z.ai API Specifics

### Endpoint
- **Base URL:** `https://api.z.ai/api/anthropic`
- **Full Messages URL:** `https://api.z.ai/api/anthropic/v1/messages`

### Authentication
Z.ai uses the same Anthropic-compatible auth. The `ANTHROPIC_AUTH_TOKEN` environment variable is sent as the `Authorization` header by the Claude Agent SDK.

**How the Claude Agent SDK sends auth:**
- When `ANTHROPIC_AUTH_TOKEN` is set, the SDK sends it as the `Authorization` header
- When using `apiKeyHelper`, it sends as both `Authorization` and `X-Api-Key` headers
- The proxy should set the `Authorization` header (or `x-api-key` -- Z.ai accepts both)

### Available Models
| Model | Equivalent | Quota Consumption |
|-------|-----------|-------------------|
| GLM-5 | Claude Opus tier | 3x |
| GLM-4.7 | Claude Sonnet tier | 1x |
| GLM-4.6 | Mid tier | 1x |
| GLM-4.5 | Lower tier | 1x |
| GLM-4.5-Air | Claude Haiku tier | 0.5x |

### Key Differences from Standard Anthropic
1. **Same request/response format** -- Z.ai's Anthropic-compatible endpoint accepts the same JSON body and returns the same response structure
2. **Same SSE format** -- Streaming events match the Anthropic SSE spec
3. **Model names differ** -- Container sends `claude-opus-4-6`, Z.ai maps to GLM equivalent
4. **Auth mechanism identical** -- Uses `Authorization` header with bearer token

## Claude Agent SDK Request Flow

The Claude Agent SDK (used by Rachel8 via `@anthropic-ai/claude-agent-sdk`) makes HTTP requests internally. The flow:

```
Container (Rachel8)
  └─> Claude Agent SDK query()
      └─> HTTP POST to ANTHROPIC_BASE_URL/v1/messages
          Headers: Authorization: <ANTHROPIC_AUTH_TOKEN>, anthropic-version, content-type, anthropic-beta
          Body: {model, messages, max_tokens, stream: true, ...}
              └─> Proxy (port 9999)
                  ├─ Extract X-Rachel-User-ID header (set by container env)
                  ├─ Strip container's Authorization header
                  ├─ Inject Z.ai API key as Authorization header
                  ├─ Forward to https://api.z.ai/api/anthropic/v1/messages
                  ├─ Stream SSE response back
                  └─ Parse SSE to extract token usage for logging
```

**Critical: The proxy must forward these headers to Z.ai:**
- `anthropic-version` (required by Z.ai)
- `anthropic-beta` (if present, for feature flags)
- `content-type: application/json`

**Critical: The proxy must NOT forward:**
- The container's `Authorization` header (contains dummy/empty token)
- `X-Rachel-User-ID` (internal routing header)

## SSE Proxy Streaming in Bun

### Pattern 1: Transparent Stream Pass-Through (Recommended)

The most efficient approach: pipe the upstream response body directly to the client without buffering. Bun.serve() can return a Response with a ReadableStream body.

```typescript
// Fetch from upstream
const upstreamResponse = await fetch(upstreamUrl, {
  method: "POST",
  headers: forwardHeaders,
  body: JSON.stringify(requestBody),
});

// Pipe the body straight through
return new Response(upstreamResponse.body, {
  status: upstreamResponse.status,
  headers: {
    "content-type": "text/event-stream",
    "cache-control": "no-cache",
    "connection": "keep-alive",
  },
});
```

**Pros:** Zero buffering, minimal latency, lowest memory usage
**Cons:** Cannot extract token counts from the stream

### Pattern 2: Tee Stream for Usage Extraction (Recommended for this proxy)

Use `ReadableStream.tee()` or a TransformStream to fork the SSE stream: one fork goes to the client, the other is parsed for token counts.

```typescript
const upstreamResponse = await fetch(upstreamUrl, { ... });
const [clientStream, usageStream] = upstreamResponse.body!.tee();

// Send clientStream to user immediately
const response = new Response(clientStream, {
  status: upstreamResponse.status,
  headers: { "content-type": "text/event-stream", ... },
});

// Parse usageStream in background for token counts
parseUsageFromSSE(usageStream, userId, requestId);

return response;
```

**Pros:** Client receives stream with zero added latency; usage tracked in background
**Cons:** Slight memory overhead for tee'd stream; must handle stream errors on both forks

### Pattern 3: TransformStream Interceptor

Use a TransformStream to inspect each chunk as it passes through, extracting usage data inline.

```typescript
const { readable, writable } = new TransformStream({
  transform(chunk, controller) {
    // Pass chunk through to client
    controller.enqueue(chunk);
    // Also parse for usage data
    extractUsageFromChunk(chunk, accumulator);
  },
  flush() {
    // Stream complete -- log final usage
    logUsage(accumulator);
  }
});

upstreamResponse.body!.pipeTo(writable);
return new Response(readable, { ... });
```

**Pros:** Single stream, inline processing
**Cons:** Transform adds microsecond latency per chunk (negligible)

**Recommendation:** Pattern 3 (TransformStream) is best for this proxy. It allows inline usage extraction with negligible overhead, and the flush() handler provides a clean point to log final usage.

## Rate Limiting with SQLite

### Approach: Sliding Window Counter

For per-user rate limiting, a sliding window counter provides the best balance of accuracy and simplicity.

**Schema:**
```sql
CREATE TABLE usage (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  timestamp INTEGER NOT NULL,  -- Unix epoch seconds
  input_tokens INTEGER NOT NULL DEFAULT 0,
  output_tokens INTEGER NOT NULL DEFAULT 0,
  model TEXT,
  request_id TEXT,
  duration_ms INTEGER
);

CREATE INDEX idx_usage_user_time ON usage(user_id, timestamp);

CREATE TABLE rate_limits (
  user_id TEXT PRIMARY KEY,
  daily_request_limit INTEGER NOT NULL DEFAULT 1000,
  daily_token_limit INTEGER NOT NULL DEFAULT 1000000,
  hourly_request_limit INTEGER NOT NULL DEFAULT 100,
  hourly_token_limit INTEGER NOT NULL DEFAULT 200000
);
```

**Rate Check Query (single synchronous call):**
```sql
-- Check hourly request count
SELECT COUNT(*) as count
FROM usage
WHERE user_id = ? AND timestamp > ?;  -- ? = now - 3600

-- Check daily token usage
SELECT COALESCE(SUM(input_tokens + output_tokens), 0) as total_tokens
FROM usage
WHERE user_id = ? AND timestamp > ?;  -- ? = now - 86400
```

**Why bun:sqlite:**
- Synchronous API means rate checks complete in microseconds
- No network round-trip (embedded database)
- WAL mode supports concurrent reads during writes
- 3-6x faster than better-sqlite3

**Performance:** At 100 requests/second across all users, SQLite handles this trivially. A single `SELECT COUNT(*)` with an index takes <0.1ms.

### Alternative: In-Memory with Periodic Flush

Keep rate limit counters in a Map for O(1) lookups, periodically flush to SQLite for persistence.

**Tradeoff:** Faster checks but loses data on crash. Since this is a rate limiter (not billing), occasional data loss on restart is acceptable. However, SQLite is already fast enough that in-memory caching adds unnecessary complexity.

**Recommendation:** Use bun:sqlite directly. It is fast enough for the expected load (10-30 users, <10 requests/second total).

## User Identification

### X-Rachel-User-ID Header

Containers identify themselves via the `X-Rachel-User-ID` header. This is set in the container's environment and included in every request by a thin wrapper or middleware.

**Problem:** The Claude Agent SDK does NOT natively add custom headers. The container itself does not control what headers the SDK sends.

**Solutions:**

1. **Environment variable in run-container.sh** -- Set `X_RACHEL_USER_ID` env var, but the SDK won't send it as a header.

2. **Derive from source IP/port** -- The proxy can map Docker container IPs to user IDs. Docker assigns predictable IPs on the bridge network. The proxy would need a mapping table.

3. **ANTHROPIC_AUTH_TOKEN as user identifier** -- Each container gets a unique `ANTHROPIC_AUTH_TOKEN` value (not the Z.ai key, but a per-user token like `rachel-user-123`). The proxy extracts the user ID from this token. This is elegant because:
   - The SDK already sends ANTHROPIC_AUTH_TOKEN as the Authorization header
   - No SDK modification needed
   - Each container already has a unique token
   - The proxy strips this and replaces with the real Z.ai key

**Recommendation:** Option 3 -- Use `ANTHROPIC_AUTH_TOKEN=rachel-user-{USER_ID}` in each container. The proxy extracts the user ID from the Authorization header, then replaces it with the real Z.ai API key. This requires zero changes to the Claude Agent SDK or Rachel8 code.

**Implementation:**
```typescript
// In proxy
function extractUserId(req: Request): string | null {
  const auth = req.headers.get("authorization");
  if (!auth) return null;
  // ANTHROPIC_AUTH_TOKEN=rachel-user-{USER_ID}
  const match = auth.match(/^rachel-user-(.+)$/);
  return match ? match[1] : null;
}
```

**In run-container.sh:**
```bash
-e ANTHROPIC_AUTH_TOKEN="rachel-user-${USER_ID}"
-e ANTHROPIC_BASE_URL="http://host.docker.internal:9999"
```

## Bun.serve() HTTP Server

### Basic Structure

```typescript
import { serve } from "bun";

const server = serve({
  port: 9999,
  hostname: "0.0.0.0",  // Listen on all interfaces (needed for Docker)
  async fetch(req: Request): Promise<Response> {
    const url = new URL(req.url);

    if (req.method === "POST" && url.pathname === "/v1/messages") {
      return handleMessages(req);
    }

    if (req.method === "GET" && url.pathname === "/health") {
      return new Response("ok");
    }

    return new Response("Not Found", { status: 404 });
  },
});

console.log(`LLM Proxy listening on port ${server.port}`);
```

### Key Considerations

1. **Bun.serve() supports streaming responses natively** -- Return a Response with a ReadableStream body
2. **Request body can be read as JSON** -- `const body = await req.json()`
3. **fetch() is built-in** -- No external HTTP client needed for upstream calls
4. **No middleware framework needed** -- The proxy has 2-3 routes, plain fetch handler is sufficient
5. **Graceful shutdown** -- Handle SIGTERM/SIGINT to close database and stop accepting connections

## Error Handling & Retries

### Upstream Error Categories

| Error | HTTP Status | Action |
|-------|-------------|--------|
| Z.ai down | 502/503/504 | Retry with exponential backoff (max 3 attempts) |
| Z.ai rate limited | 429 | Return 429 to container with retry-after header |
| Z.ai overloaded | 529 | Return 529 to container |
| Invalid request | 400 | Pass through to container |
| Auth failure | 401 | Log error, return 500 (indicates Z.ai key issue) |
| Stream error | Mid-stream | SSE error event already in protocol |

### Retry Strategy

```typescript
async function fetchWithRetry(url: string, options: RequestInit, maxRetries = 3): Promise<Response> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await fetch(url, options);
      if (response.status < 500) return response; // Don't retry client errors
      if (attempt < maxRetries - 1) {
        await Bun.sleep(1000 * Math.pow(2, attempt)); // 1s, 2s, 4s
      }
    } catch (error) {
      if (attempt === maxRetries - 1) throw error;
      await Bun.sleep(1000 * Math.pow(2, attempt));
    }
  }
  throw new Error("Max retries exceeded");
}
```

**Important:** Only retry on network errors and 5xx responses. Never retry 4xx (client errors) or streaming responses (can't replay an SSE stream).

## File Structure

```
/home/rachel/rachel-cloud/src/proxy/
  server.ts      -- Bun.serve() entry point, route handling
  forward.ts     -- Request forwarding, auth injection, SSE streaming
  rate-limit.ts  -- Per-user rate limit checking
  usage.ts       -- Usage logging and token extraction from SSE
  db.ts          -- SQLite database initialization and schema
  health.ts      -- Health check endpoint
  config.ts      -- Configuration (env vars, defaults)
```

## Summary of Recommendations

| Aspect | Recommendation | Justification |
|--------|----------------|---------------|
| **HTTP Server** | Bun.serve() | Native, fast, consistent with stack |
| **SSE Streaming** | TransformStream interceptor | Transparent pass-through with inline usage extraction |
| **Rate Limit Storage** | bun:sqlite with WAL mode | Synchronous, fast, persistent, zero dependencies |
| **Rate Limit Algorithm** | Sliding window counter | Simple, accurate enough, cheap per-check |
| **User Identification** | ANTHROPIC_AUTH_TOKEN=rachel-user-{ID} | Zero SDK changes, elegant auth header reuse |
| **Auth Injection** | Replace Authorization header | Strip container token, inject Z.ai key |
| **Upstream URL** | https://api.z.ai/api/anthropic/v1/messages | Z.ai Anthropic-compatible endpoint |
| **Retries** | Exponential backoff, max 3 attempts | Only for 5xx/network errors, not streaming |
| **Token Extraction** | Parse message_start and message_delta SSE events | input_tokens from start, output_tokens from delta |
| **Logging** | Structured JSON to stdout | Captured by systemd journal |

## Sources

- [Anthropic Messages API - Create a Message](https://platform.claude.com/docs/en/api/messages)
- [Anthropic Streaming Messages](https://platform.claude.com/docs/en/api/messages-streaming)
- [Claude Code LLM Gateway Configuration](https://code.claude.com/docs/en/llm-gateway)
- [Z.ai Developer Documentation - FAQs](https://docs.z.ai/devpack/faq)
- [Using Z.ai with Claude Code for Cheaper](https://hboon.com/using-z-ai-with-claude-code-for-cheaper/)
- [How to Use Z.AI in Claude Code](https://claudelog.com/faqs/how-to-use-z-ai-in-claude-code/)
- [Bun HTTP Server Documentation](https://bun.com/docs/guides/http/server)
- [Bun SQLite Module](https://bun.com/docs/runtime/sqlite)
- [How to Build Real-time Applications with Bun](https://oneuptime.com/blog/post/2026-01-31-bun-realtime-applications/view)
- [SQLite-only Rate Limiting](https://summarity.com/sqlite-rate-limit)
- [Rate Limiting Guide: From Token Bucket to Sliding Window](https://api7.ai/blog/rate-limiting-guide-algorithms-best-practices)
- [node-rate-limiter-flexible SQLite Wiki](https://github.com/animir/node-rate-limiter-flexible/wiki/SQLite)
