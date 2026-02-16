---
phase: 10-llm-proxy
plan: 02
status: complete
---

## Summary

Added per-user rate limiting and usage tracking via SQLite: 3 files (db.ts, usage.ts, rate-limit.ts) in `src/proxy/`, plus server.ts integration.

### What was done
- **db.ts**: SQLite at `data/proxy.db` (configurable via PROXY_DB_PATH). WAL mode + NORMAL sync + 5s busy timeout. Creates `usage` table (user_id, timestamp, tokens, model, duration, streaming) with compound index on (user_id, timestamp). Creates `rate_limits` table for per-user configurable limits. Exports DEFAULT_LIMITS and closeDb().
- **usage.ts**: `recordUsage()` inserts UsageData into SQLite via prepared statement. Async — never blocks the client response.
- **rate-limit.ts**: `checkRateLimit()` runs synchronous SQLite queries (hourly + daily request counts and token sums). Falls back to DEFAULT_LIMITS when user has no custom row. `rateLimitResponse()` builds 429 with Anthropic-compatible error body and Retry-After header.
- **server.ts**: Integrated — checks rate limit before forwarding, records usage after completion, closes DB on shutdown.

### Default limits
- 60 requests/hour, 500 requests/day
- 500K tokens/hour, 2M tokens/day

### Verification
- Proxy starts, creates data/proxy.db with correct schema
- Usage record inserted after forwarded request (verified via sqlite3)
- Tables: usage, rate_limits (+ sqlite_sequence, autoindex)
- Index: idx_usage_user_time on (user_id, timestamp)
- All plan verification checks passed
