---
phase: 10-llm-proxy
plan: 03
status: complete
---

## Summary

Added production hardening to the LLM proxy: retry logic, comprehensive health endpoint, structured logging, and systemd service.

### What was done
- **forward.ts**: Added `fetchWithRetry()` with exponential backoff (1s, 2s, 4s) for non-streaming requests. Streaming requests use plain fetch (no retry — SSE cannot be replayed). Request IDs (`crypto.randomUUID()`) added for log correlation. Structured Anthropic-compatible error responses via `proxyErrorResponse()` helper.
- **health.ts**: New module with `handleHealth(detailed)`. Basic mode: DB ping + uptime. Detailed mode: upstream HEAD request (682ms latency confirmed), usage stats (total requests, tokens, unique users, 24h breakdown). Returns 503 on DB error, 200 otherwise.
- **server.ts**: Updated routing: `/health?detailed=true`, `/stats` (alias). Request IDs in all log entries. Try/catch with 500 fallback for unexpected errors.
- **ops/rachel-cloud-proxy.service**: systemd unit with Restart=always, RestartSec=5, EnvironmentFile for secrets, security hardening (NoNewPrivileges, ProtectSystem=strict, ReadWritePaths=/data, PrivateTmp), 256MB memory limit, journal logging.
- **.env.proxy.example**: Documented configuration template.

### Verification
- All plan verification checks passed (6/6)
- Integration test: health, detailed health, stats, auth, and forwarding all work correctly
- Z.ai upstream is reachable (confirmed via detailed health check)
- Usage tracking and stats correctly count requests/users/tokens

### Key decisions
- Streaming requests are never retried (SSE streams can't be replayed)
- Health endpoint only checks upstream on `?detailed=true` to avoid hammering Z.ai
- `/stats` is an alias for detailed health (convenient for monitoring)
- systemd uses ProtectHome=read-only — proxy can read code but only write to data/
