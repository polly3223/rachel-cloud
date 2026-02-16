---
phase: 10-llm-proxy
plan: 01
status: complete
---

## Summary

Built the core LLM proxy server: 3 files (config.ts, forward.ts, server.ts) in `src/proxy/`.

### What was done
- **config.ts**: Loads ZAI_API_KEY (required), PROXY_PORT (default 9999), ZAI_UPSTREAM_URL (default Z.ai), LOG_LEVEL. Exports typed config and log utility. API key is never logged.
- **forward.ts**: `extractUserId()` parses `Authorization: rachel-user-{ID}` header. `forwardToZai()` injects Z.ai API key, forwards Anthropic headers, uses TransformStream for SSE pass-through while extracting token usage from `message_start` and `message_delta` events. Non-streaming responses extract usage from JSON body. Returns 502 on upstream network errors.
- **server.ts**: Bun.serve() on port 9999 with routes: POST /v1/messages (proxy), POST /v1/messages/count_tokens, GET /health. Returns 401 for missing user ID, 404 for unknown routes. Graceful shutdown on SIGTERM/SIGINT.

### Verification
- Proxy starts with `ZAI_API_KEY=test bun run src/proxy/server.ts`
- Without ZAI_API_KEY: exits with "FATAL: ZAI_API_KEY environment variable is required"
- Health endpoint returns 200 with uptime
- Missing auth returns 401 with Anthropic-compatible error body
- User ID correctly extracted from `Authorization: rachel-user-123`
- All plan verification checks passed

### Key decisions
- TransformStream passes ALL bytes through unmodified (read-only usage observation)
- SSE buffer handles events spanning multiple chunks
- 120s timeout on upstream fetch
- Server.ts already imports rate-limit + usage (written in parallel with plan 10-02)
