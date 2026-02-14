---
phase: 06-health-monitoring
plan: 02
subsystem: monitoring
tags: [health-notifications, email, resend, circuit-breaker, auto-recovery]

# Dependency graph
requires:
  - phase: 06-health-monitoring/01
    provides: healthChecks table, circuit breaker state machine, health sweep service
  - phase: 02-billing-onboarding
    provides: Resend email sender pattern (sender.ts)
provides:
  - Health event email notifications (instance down, recovered, circuit breaker alert)
  - Notification integration at state transition points in health checker
  - Spam prevention via lastNotifiedDownAt/lastNotifiedUpAt timestamps
affects: [06-03-dashboard-health-status]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Fire-and-forget email pattern: .catch(() => {}) ensures email failures never break health sweep"
    - "Notification spam guard: canSendDownNotification() with 5-minute cooldown via lastNotifiedDownAt"
    - "State transition notifications: emails only on transitions (healthy->unhealthy, unhealthy->healthy, circuit trip)"

key-files:
  created:
    - src/lib/monitoring/health-notifications.ts
  modified:
    - src/lib/monitoring/health-checker.ts

key-decisions:
  - "Keep notification functions in health-notifications.ts (not sender.ts) since they are monitoring-specific"
  - "5-minute cooldown between down notifications prevents spam from rapid failure cycling"
  - "Recovery email only sent if user was previously notified of downtime (lastNotifiedDownAt set)"
  - "Silent auto-restart on first failure: if restart succeeds immediately, no email sent to user"

patterns-established:
  - "Health notification module pattern: separate file for monitoring-specific emails"
  - "Notification guard pattern: timestamp-based cooldown to prevent email spam"

# Metrics
duration: 5 min
completed: 2026-02-14
---

# Phase 6 Plan 02: Health Notification Emails Summary

**Three health event email notifications (instance down, recovered, circuit breaker alert) integrated at state transition points with 5-minute spam guard and fire-and-forget delivery**

## Performance

- **Duration:** 5 min
- **Started:** 2026-02-14T11:00:27Z
- **Completed:** 2026-02-14T11:05:48Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- Three email notification functions with full HTML templates: instance down (red/warning), instance recovered (green/success with downtime duration), circuit breaker alert (red/critical with VPS details table)
- Notification integration at all state transition points in health-checker.ts: down email on first failure after restart fails, recovery email when transitioning back to healthy, admin alert when circuit breaker trips
- Spam prevention via lastNotifiedDownAt timestamp with 5-minute cooldown guard
- Silent auto-recovery: if restart succeeds on first failure, no email is sent (user never notices the brief blip)
- User email/name now available in health sweep via innerJoin with users table

## Task Commits

Each task was committed atomically:

1. **Task 1: Create health notification email functions** - `07d95f37` (feat)
2. **Task 2: Integrate notifications into health checker** - `90788e15` (feat)

## Files Created/Modified
- `src/lib/monitoring/health-notifications.ts` - Three email notification functions: sendInstanceDownEmail, sendInstanceRecoveredEmail, sendCircuitBreakerAlert (all return Promise<boolean>, never throw)
- `src/lib/monitoring/health-checker.ts` - Added notification imports, users table JOIN, notification calls at state transitions, spam guard, lastNotifiedDownAt/lastNotifiedUpAt persistence

## Decisions Made
- Kept notification functions in `health-notifications.ts` rather than `sender.ts` since they are monitoring-specific (sender.ts is for billing emails)
- 5-minute cooldown for down notifications (plan suggested 15 minutes, but 5 is more appropriate for a 60-second check interval where a user could recover and fail again within 15 minutes)
- Recovery email includes approximate downtime calculated from lastFailureAt, not lastNotifiedDownAt (more accurate measure of actual outage)
- userName fallback to 'there' when users.name is null (e.g., "Hi there,")

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] userName can be null in users table**
- **Found during:** Task 2 (health checker integration)
- **Issue:** users.name is nullable in schema, but notification functions expect a string
- **Fix:** Added `vps.userName || 'there'` fallback at each notification call site
- **Files modified:** src/lib/monitoring/health-checker.ts
- **Verification:** TypeScript compiles cleanly with the fallback
- **Committed in:** 90788e15 (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Minor null-safety fix. No scope creep.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required. ADMIN_EMAIL env var is already configured from Phase 5.

## Next Phase Readiness
- Health notification system complete with all three email types
- Ready for Plan 06-03: Dashboard health status display (healthChecks table fully populated with status, notifications, and timestamps)

---
*Phase: 06-health-monitoring*
*Completed: 2026-02-14*
