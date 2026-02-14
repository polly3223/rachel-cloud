# Phase 6: Health Monitoring & Auto-Recovery - Research

**Researched:** 2026-02-14
**Domain:** Background job health monitoring, SSH-based service checks, circuit breaker pattern
**Confidence:** HIGH

## Summary

Phase 6 adds automated health monitoring and auto-recovery for user Rachel instances running on Hetzner VPSs. The system will periodically SSH into each active VPS, check the `rachel8` systemd service status, and automatically restart it if down. A circuit breaker prevents infinite restart loops, and email notifications keep users and admins informed.

The existing codebase already has all the building blocks: `execSSHCommand()` for SSH operations, `restartRachelService()` for service restarts, `node-schedule` for background jobs, Resend for emails, and Drizzle ORM for database operations. This phase is primarily about orchestrating these existing pieces into a coherent monitoring system.

**Primary recommendation:** Use a dedicated `health_checks` table (not columns on subscriptions) to cleanly separate health monitoring state from billing/provisioning state. Run a single `node-schedule` cron job every 60 seconds that sweeps all active VPSs in parallel (with concurrency limit to avoid SSH storms).

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- SSH-based health checks via existing `execSSHCommand()` -- check `systemctl is-active rachel8`
- Health check runs as background job in SvelteKit server process using `node-schedule`
- Every 60 seconds per VPS, batch all VPSs in single sweep
- Auto-restart via SSH: `sudo systemctl restart rachel8`
- Circuit breaker: 3 consecutive failures stops auto-recovery, alerts admin
- Use existing Resend email sender for notifications
- Email on: instance DOWN, instance RECOVERS, circuit breaker trips
- Health tracking in SQLite via Drizzle
- User dashboard: health status indicator
- Admin dashboard: health overview across all VPSs

### Claude's Discretion
- Exact DB schema design (separate table vs columns on subscriptions)
- Health check batching strategy (parallel vs sequential SSH)
- Log retention policy for health events
- Email template design for health notifications
- Whether to add a health check API endpoint

### Deferred Ideas (OUT OF SCOPE)
- External monitoring service integration
- SMS/webhook notifications
- Custom health check intervals per user
- Health check history/timeline UI
- Automated VPS reboot via Hetzner API
- Health check for Rachel Cloud app itself
</user_constraints>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| node-schedule | ^2.1.1 | Cron-like background job scheduling | Already in package.json, used by grace-period-enforcer |
| ssh2 | ^1.17.0 | SSH command execution | Already in package.json, used by ssh-exec.ts |
| drizzle-orm | ^0.45.1 | Database ORM for health tracking | Already in package.json, used throughout |
| resend | ^6.9.2 | Email notifications | Already in package.json, used by sender.ts |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| (none needed) | - | - | All dependencies already installed |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| node-schedule cron | setInterval | node-schedule handles process lifecycle better, already proven in codebase |
| SSH health check | HTTP health endpoint on VPS | Would require adding an HTTP server to Rachel8; SSH already works |
| In-process monitoring | External service (Better Stack) | External adds cost and complexity; in-process is sufficient for early stage |

**Installation:**
```bash
# No new packages needed -- all dependencies already installed
```

## Architecture Patterns

### Recommended Project Structure
```
src/lib/
├── monitoring/
│   ├── health-checker.ts      # Core health check logic + scheduling
│   ├── circuit-breaker.ts     # Circuit breaker state machine
│   └── health-notifications.ts # Email notifications for health events
├── db/
│   └── schema.ts              # Add healthChecks table
├── jobs/
│   └── grace-period-enforcer.ts  # Existing (pattern reference)
└── provisioning/
    ├── ssh-exec.ts            # Existing (reuse for health checks)
    └── vps-status.ts          # Existing (reuse restartRachelService)
```

### Pattern 1: Background Health Check Sweep
**What:** A single cron job runs every 60 seconds, queries all active VPSs from DB, checks each one via SSH in parallel (with concurrency limit), and updates health state.
**When to use:** When monitoring multiple remote services from a single control plane.
**Example:**
```typescript
// Sweep pattern: query -> check all -> update
import schedule from 'node-schedule';

const SWEEP_INTERVAL = '*/1 * * * *'; // every 60 seconds

export function startHealthMonitor() {
  schedule.scheduleJob('health-sweep', SWEEP_INTERVAL, async () => {
    const activeVPSs = await getActiveVPSs();
    // Process in parallel with concurrency limit
    await processInBatches(activeVPSs, 5, checkAndRecover);
  });
}
```

### Pattern 2: Circuit Breaker State Machine
**What:** Track consecutive failures per VPS. States: CLOSED (healthy) -> OPEN (tripped after 3 failures) -> HALF_OPEN (cooldown expired, try again).
**When to use:** Preventing infinite retry loops on persistently failing services.
**Example:**
```typescript
// State transitions
type CircuitState = 'closed' | 'open' | 'half_open';

// CLOSED: normal operation, attempt restarts on failure
// After 3 consecutive failures -> OPEN
// OPEN: stop attempting restarts, alert admin
// After cooldown (30 min) -> HALF_OPEN
// HALF_OPEN: try one restart
//   Success -> CLOSED
//   Failure -> OPEN (reset cooldown)
```

### Pattern 3: Parallel SSH with Concurrency Limit
**What:** Check multiple VPSs simultaneously but cap concurrent SSH connections to avoid exhausting system resources or triggering rate limits.
**When to use:** When batch-processing SSH operations across many hosts.
**Example:**
```typescript
async function processInBatches<T>(
  items: T[],
  concurrency: number,
  fn: (item: T) => Promise<void>
): Promise<void> {
  const chunks = [];
  for (let i = 0; i < items.length; i += concurrency) {
    chunks.push(items.slice(i, i + concurrency));
  }
  for (const chunk of chunks) {
    await Promise.allSettled(chunk.map(fn));
  }
}
```

### Anti-Patterns to Avoid
- **Checking health in request handlers:** Health checks must be background jobs, never blocking user requests
- **Storing health state only in memory:** Must persist to DB so health state survives server restarts
- **Unlimited concurrent SSH connections:** Cap at 5-10 to avoid resource exhaustion
- **Restarting without cooldown:** Circuit breaker prevents restart storms

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Job scheduling | Custom setInterval with drift correction | node-schedule cron expressions | Handles process lifecycle, already proven in codebase |
| SSH execution | Raw TCP socket management | ssh2 via existing execSSHCommand() | Connection handling, timeout management already solved |
| Email delivery | Direct SMTP | Resend via existing sender.ts | Deliverability, templates already set up |

**Key insight:** Every building block for this phase already exists in the codebase. The work is orchestration and state management, not new infrastructure.

## Common Pitfalls

### Pitfall 1: SSH Connection Storms
**What goes wrong:** Checking 50+ VPSs simultaneously opens 50+ SSH connections, exhausting file descriptors or triggering firewall rate limits.
**Why it happens:** Naive `Promise.all()` without concurrency control.
**How to avoid:** Process VPSs in batches of 5 with `Promise.allSettled()`. Use `allSettled` (not `all`) so one failure doesn't abort the entire sweep.
**Warning signs:** "Too many open files" errors, SSH timeouts increasing.

### Pitfall 2: Health Check Longer Than Interval
**What goes wrong:** If a sweep takes >60 seconds (slow SSH, many VPSs), the next sweep starts before the current one finishes, causing overlapping checks.
**Why it happens:** No mutex/guard on the sweep job.
**How to avoid:** Use a boolean `sweepInProgress` flag. Skip the sweep if the previous one hasn't finished. Log a warning when this happens.
**Warning signs:** Duplicate log entries for the same VPS check.

### Pitfall 3: Circuit Breaker State Lost on Restart
**What goes wrong:** Circuit breaker state is stored only in memory. Server restart resets all breakers, causing restart storms for VPSs that were correctly tripped.
**Why it happens:** Treating circuit breaker as runtime-only state.
**How to avoid:** Persist circuit breaker state (consecutive failures, tripped time) in the database.
**Warning signs:** Admin gets re-alerted for already-known issues after server restart.

### Pitfall 4: Email Notification Spam
**What goes wrong:** Health check fires every 60 seconds, and a down VPS triggers a notification email every 60 seconds.
**Why it happens:** Not tracking whether a "down" notification has already been sent.
**How to avoid:** Track `lastNotifiedAt` and notification state in DB. Only send on state transitions (healthy->down, down->healthy), not on every check.
**Warning signs:** User inbox flooded with identical "your instance is down" emails.

### Pitfall 5: Checking Deprovisioned/Grace Period VPSs
**What goes wrong:** Health check tries to SSH into VPSs that no longer exist or are in grace period.
**Why it happens:** Querying all subscriptions instead of only active+provisioned ones.
**How to avoid:** Query filter: `subscription.status = 'active' AND subscription.vpsProvisioned = true AND subscription.provisioningStatus = 'ready'`.
**Warning signs:** SSH connection errors for non-existent hosts.

## Code Examples

### Existing SSH Health Check Pattern
```typescript
// From vps-status.ts -- already checks service status
import { execSSHCommand } from './ssh-exec';
import { decryptToken } from '$lib/crypto/encryption';

// This pattern is the foundation for health checks
const result = await execSSHCommand({
  host: vpsIpAddress,
  privateKey: decryptToken(encryptedPrivateKey),
  command: 'sudo systemctl is-active rachel8',
});
const isHealthy = result.stdout === 'active';
```

### Existing Restart Pattern
```typescript
// From vps-status.ts -- restartRachelService already handles restart + verify
const result = await restartRachelService(host, encryptedPrivateKey);
// result.success: boolean, result.message: string
```

### Existing Job Scheduling Pattern
```typescript
// From grace-period-enforcer.ts -- pattern for background jobs
import schedule from 'node-schedule';

schedule.scheduleJob('health-sweep', '*/1 * * * *', async () => {
  // Sweep logic here
});
```

### Existing Email Pattern
```typescript
// From sender.ts -- pattern for notifications
import { Resend } from 'resend';
const resend = new Resend(process.env.RESEND_API_KEY);

await resend.emails.send({
  from: process.env.RESEND_FROM_EMAIL || 'Rachel Cloud <noreply@rachel.cloud>',
  to: userEmail,
  subject: 'Your Rachel Instance Status Update',
  html: '...',
});
```

### Drizzle Schema Pattern
```typescript
// From schema.ts -- pattern for new tables
import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export const healthChecks = sqliteTable('health_checks', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  // ... fields
});
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| External monitoring (Uptime Kuma) | In-process SSH health checks | N/A (design decision) | Simpler infra, no external dependencies |
| Polling-only monitoring | Event-driven + polling hybrid | N/A | Better UX with real-time dashboard updates |

**Deprecated/outdated:**
- None relevant -- this is a straightforward application of existing patterns.

## Open Questions

1. **Health check startup timing**
   - What we know: The health monitor job should start when the SvelteKit server starts
   - What's unclear: Best hook point in SvelteKit for starting background processes
   - Recommendation: Import and call `startHealthMonitor()` in `hooks.server.ts` (runs on server startup) or in a server-side `+layout.server.ts` load function. `hooks.server.ts` is the cleanest option since it runs once at startup.

2. **Database migration strategy**
   - What we know: Previous phases used `drizzle-kit push` for schema changes
   - What's unclear: Whether to use `push` or `generate` + `migrate` for production
   - Recommendation: Continue with `drizzle-kit push` for consistency with previous phases.

## Sources

### Primary (HIGH confidence)
- Existing codebase: `ssh-exec.ts`, `vps-status.ts`, `grace-period-enforcer.ts`, `sender.ts`, `schema.ts` -- directly inspected
- node-schedule: already installed and proven in `grace-period-enforcer.ts`
- Resend: already installed and proven in `sender.ts`

### Secondary (MEDIUM confidence)
- Circuit breaker pattern: well-established software pattern (Martin Fowler, Release It!)
- Concurrency-limited parallel processing: standard Node.js pattern

### Tertiary (LOW confidence)
- None -- all patterns are verified against existing codebase

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- all libraries already installed and proven in codebase
- Architecture: HIGH -- extending existing patterns (SSH checks, background jobs, email)
- Pitfalls: HIGH -- derived from direct analysis of existing code and common monitoring anti-patterns

**Research date:** 2026-02-14
**Valid until:** 2026-03-14 (stable domain, no fast-moving dependencies)
