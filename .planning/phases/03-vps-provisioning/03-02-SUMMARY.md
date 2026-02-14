---
phase: 03-vps-provisioning
plan: 02
subsystem: infra
tags: [hetzner, api-client, exponential-backoff, retry, rate-limiting, fetch]

# Dependency graph
requires:
  - phase: 03-vps-provisioning/03-01
    provides: "VPS tracking DB schema and provisioning type definitions"
provides:
  - "HetznerClient class with all CRUD methods for VPS lifecycle"
  - "Automatic retry with exponential backoff on transient failures"
  - "Rate limit detection and intelligent wait before retry"
  - "Type-safe request/response interfaces for Hetzner Cloud API v1"
affects: [03-vps-provisioning, provisioning-orchestrator, deprovision-vps]

# Tech tracking
tech-stack:
  added: [exponential-backoff@3.1.3]
  patterns: [api-client-with-backoff, rate-limit-header-parsing, typed-fetch-wrapper]

key-files:
  created:
    - "src/lib/provisioning/hetzner-client.ts"
  modified:
    - "package.json"

key-decisions:
  - "Local type definitions in hetzner-client.ts (03-01 types.ts not yet available; will be integrated later)"
  - "Smart retry: retries on 429/5xx, skips retry on 4xx client errors to fail fast on bad requests"
  - "Rate limit warning threshold at 100 remaining requests for proactive monitoring"

patterns-established:
  - "API client pattern: class with private request<T>() method wrapping all public methods with retry"
  - "Rate limit monitoring: check RateLimit-Remaining header on every response, warn below threshold"
  - "Error classification: attach isRetriable flag to errors for retry/no-retry decision"

# Metrics
duration: 2min
completed: 2026-02-14
---

# Phase 3 Plan 02: Hetzner Cloud API Client Summary

**Hetzner Cloud API client with exponential backoff retry, rate limit handling, and 9 typed CRUD methods for VPS lifecycle management**

## Performance

- **Duration:** 2 min
- **Started:** 2026-02-14T09:21:56Z
- **Completed:** 2026-02-14T09:23:43Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- Installed exponential-backoff@3.1.3 for battle-tested retry logic
- Implemented HetznerClient class with 9 API methods covering servers, SSH keys, and firewalls
- Automatic exponential backoff (5 attempts, 1-30s delay, full jitter) on all API calls
- Rate limit detection: parses RateLimit-Reset header on 429, warns when remaining < 100
- Smart retry logic: retries on 429/5xx, fails fast on 4xx client errors
- Complete TypeScript type definitions for all Hetzner API request/response interfaces

## Task Commits

Each task was committed atomically:

1. **Task 1: Install exponential-backoff library** - `a3c826a` (chore)
2. **Task 2: Implement Hetzner Cloud API client with retry logic** - `995a4cc` (feat)

## Files Created/Modified
- `src/lib/provisioning/hetzner-client.ts` - Hetzner Cloud API client with retry logic, rate limit handling, and typed interfaces (439 lines)
- `package.json` - Added exponential-backoff@3.1.3 dependency

## Decisions Made
- **Local type definitions:** Plan 03-01's types.ts was not yet available (parallel execution), so all Hetzner API types are defined locally in hetzner-client.ts. These will be refactored to import from types.ts once 03-01 completes.
- **Smart retry classification:** 4xx errors (except 429) are marked non-retriable to fail fast on invalid requests, while 5xx and 429 errors trigger retries. This prevents wasting retry attempts on errors that won't self-resolve.
- **Rate limit warning at 100:** Threshold of 100 remaining requests provides early warning before hitting the Hetzner limit of 3600 requests/hour.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Local type definitions instead of import from types.ts**
- **Found during:** Task 2 (Hetzner client implementation)
- **Issue:** Plan says "Import types from src/lib/provisioning/types.ts (created in plan 03-01)" but that file doesn't exist yet (03-01 executing in parallel)
- **Fix:** Defined all types locally within hetzner-client.ts with export annotations, ready for later refactoring
- **Files modified:** src/lib/provisioning/hetzner-client.ts
- **Verification:** TypeScript compiles cleanly with all types defined locally
- **Committed in:** 995a4cc (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Expected deviation due to parallel execution. Local types are identical to what 03-01 will produce and can be trivially replaced with imports later.

## Issues Encountered
None

## User Setup Required

**External services require manual configuration.** A HETZNER_API_TOKEN environment variable is required:
- Source: Hetzner Cloud Console -> Security -> API tokens -> Generate API token (Read & Write permissions)
- The token is used by HetznerClient for all API operations

## Next Phase Readiness
- HetznerClient is ready for use by provisioning orchestrator (plan 03-04 or later)
- All server, SSH key, and firewall CRUD operations available
- Once 03-01 types.ts lands, types can be consolidated (non-blocking refactor)
- Ready for 03-03 (cloud-init builder) and subsequent plans

---
*Phase: 03-vps-provisioning*
*Completed: 2026-02-14*
