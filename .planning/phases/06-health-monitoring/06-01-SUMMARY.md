---
phase: 06-health-monitoring
plan: 01
subsystem: monitoring
tags: [health-check, circuit-breaker, ssh, node-schedule, sqlite, drizzle]

# Dependency graph
requires:
  - phase: 03-vps-provisioning
    provides: SSH execution (ssh-exec.ts), VPS restart (vps-status.ts), encrypted SSH keys
  - phase: 05-dashboard-controls
    provides: hooks.server.ts with auth/admin guard pattern
provides:
  - healthChecks table for persistent health state tracking
  - Circuit breaker state machine (pure-logic, reusable)
  - Background health sweep service (60s interval, 5-connection concurrency)
  - Auto-restart capability for unhealthy services
affects: [06-02-auto-recovery-notifications, 06-03-dashboard-health-status]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Circuit breaker pattern: closed -> open (3 failures) -> half_open (30m cooldown) -> closed (on success)"
    - "Background sweep pattern: cron job + batched parallel SSH with concurrency limit"
    - "Upsert pattern: insert().onConflictDoUpdate() for idempotent health record persistence"

key-files:
  created:
    - src/lib/monitoring/circuit-breaker.ts
    - src/lib/monitoring/health-checker.ts
  modified:
    - src/lib/db/schema.ts
    - src/hooks.server.ts

key-decisions:
  - "Pure-logic circuit breaker module (no DB calls) for testability and reuse"
  - "30-minute circuit cooldown before half_open probe (prevents restart storms)"
  - "SSH-unreachable VPSs marked down but no restart attempted (restart won't help if host is unreachable)"
  - "Health monitor gated behind NODE_ENV=production or ENABLE_HEALTH_MONITOR=true env var"

patterns-established:
  - "Monitoring module pattern: src/lib/monitoring/ directory for all health/monitoring code"
  - "Sweep guard pattern: boolean flag prevents overlapping cron executions"
  - "Health status enum: healthy | unhealthy | down | circuit_open"

# Metrics
duration: 4 min
completed: 2026-02-14
---

# Phase 6 Plan 01: Health Check Foundation Summary

**healthChecks DB table with circuit breaker state machine and background SSH health sweep service running every 60 seconds with 5-connection concurrency limit**

## Performance

- **Duration:** 4 min
- **Started:** 2026-02-14T10:54:35Z
- **Completed:** 2026-02-14T10:58:32Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments
- healthChecks table with 18 columns: health status, circuit breaker state, failure counters, notification timestamps, and lifetime metrics (totalChecks/totalFailures/totalRecoveries)
- Pure-logic circuit breaker module with all state transitions: closed -> open after 3 consecutive failures, open -> half_open after 30-minute cooldown, half_open -> closed on success or -> open on failure
- Background health sweep service: every 60s cron job queries all active/provisioned VPSs, SSH-checks rachel8 service status (10s timeouts), auto-restarts unhealthy services when circuit allows, persists all state to DB
- Concurrency-limited parallel processing (5 SSH connections max) with Promise.allSettled to prevent SSH storms
- Sweep overlap guard prevents concurrent sweeps when a sweep takes longer than 60 seconds
- Health monitor startup integrated into hooks.server.ts with production/env-var gate

## Task Commits

Each task was committed atomically:

1. **Task 1: Add healthChecks table to DB schema + circuit breaker module** - `71862264` (feat)
2. **Task 2: Implement health check sweep service and start on server boot** - `8074dd4a` (feat)

## Files Created/Modified
- `src/lib/db/schema.ts` - Added healthChecks table with 18 columns for health state persistence
- `src/lib/monitoring/circuit-breaker.ts` - Pure-logic circuit breaker state machine (shouldAttemptRestart, getStateAfterFailure, getStateAfterSuccess, getEffectiveCircuitState, resetCircuitBreaker)
- `src/lib/monitoring/health-checker.ts` - Background health sweep service with scheduling, SSH health checks, auto-restart, circuit breaker integration, and upsert persistence
- `src/hooks.server.ts` - Added startHealthMonitor() call on server boot (gated by env)

## Decisions Made
- Pure-logic circuit breaker module with no DB calls -- caller manages persistence, making it testable and reusable
- 30-minute circuit cooldown before half_open probe (prevents restart storms on persistently failing VPSs)
- When SSH connection itself fails (host unreachable), mark as down but do NOT attempt restart (restart won't help)
- Health monitor gated behind `NODE_ENV === 'production'` or `ENABLE_HEALTH_MONITOR === 'true'` to prevent running in development

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Health check foundation complete with persistent state and circuit breaker
- Ready for Plan 06-02: auto-recovery email notifications (can read health state, circuit breaker flags like `recovered` and `tripped`)
- Ready for Plan 06-03: dashboard health status display (can query healthChecks table)

---
*Phase: 06-health-monitoring*
*Completed: 2026-02-14*
