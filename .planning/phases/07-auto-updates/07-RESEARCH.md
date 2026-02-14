# Phase 7: Auto-Updates & Rollout System - Research

**Researched:** 2026-02-14
**Domain:** VPS fleet update management via SSH
**Confidence:** HIGH

## Summary

The auto-update system needs to SSH into user VPSs, pull the latest Rachel8 code from the public GitHub repo, install dependencies, restart the service, and verify it's running. This is straightforward infrastructure work building on the existing SSH execution and health monitoring patterns already in the codebase.

The gradual rollout (10% -> 50% -> 100%) prevents mass outages by limiting blast radius. Each stage waits for confirmation that updates succeeded before proceeding. Failed updates automatically rollback to the previous git commit hash.

**Primary recommendation:** Build a simple update engine using existing `execSSHCommand` from `ssh-exec.ts`, with a rollout orchestrator that batches VPSs and tracks progress per-instance in the database.

## User Constraints (from CONTEXT.md)

### Locked Decisions
- Update = SSH -> git pull -> bun install -> restart -> verify
- Rollback = git checkout <prev_hash> -> bun install -> restart -> verify
- Gradual rollout: 10% -> 50% -> 100%
- Version = git commit hash
- Admin page at /admin/updates
- Use existing ssh-exec.ts and admin auth

### Claude's Discretion
- Rollout timing and error thresholds
- UI layout details
- Version display in user dashboard

### Deferred Ideas (OUT OF SCOPE)
- Automatic scheduled updates
- Per-user opt-in/opt-out
- Canary deployments
- Update changelog display

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| ssh2 | ^1.17.0 | SSH connections | Already in project, used by ssh-exec.ts |
| drizzle-orm | ^0.45.1 | Database operations | Already in project, used for all DB |
| SvelteKit | ^2.0.0 | Admin UI routes | Already in project |

### Supporting
No new libraries needed. This phase uses only existing dependencies.

## Architecture Patterns

### Recommended Project Structure
```
src/
  lib/
    updates/
      update-engine.ts      # SSH-based update/rollback per VPS
      rollout-orchestrator.ts # Gradual rollout logic (10/50/100%)
  routes/
    (admin)/admin/updates/
      +page.server.ts       # Server load + actions
      +page.svelte          # Admin updates UI
    api/updates/
      trigger/+server.ts    # POST to trigger rollout
      status/+server.ts     # GET rollout status
```

### Pattern 1: Update Engine (per-VPS SSH operations)
**What:** Executes update sequence on a single VPS via SSH
**When to use:** Called by rollout orchestrator for each VPS in a batch

Steps:
1. SSH: `git rev-parse HEAD` (capture current hash for rollback)
2. SSH: `git pull origin main`
3. SSH: `bun install`
4. SSH: `sudo systemctl restart rachel8`
5. Wait 5 seconds for service startup
6. SSH: `sudo systemctl is-active rachel8` (verify)
7. SSH: `git rev-parse HEAD` (capture new hash)

### Pattern 2: Rollback (on failure)
**What:** Reverts a VPS to its previous version
**When to use:** When update verification fails

Steps:
1. SSH: `git checkout <previous_hash>`
2. SSH: `bun install`
3. SSH: `sudo systemctl restart rachel8`
4. Wait 5 seconds
5. SSH: `sudo systemctl is-active rachel8` (verify)

### Pattern 3: Gradual Rollout
**What:** Deploy in stages with error threshold checks
**When to use:** Every rollout

Stages:
- Stage 1: 10% of VPSs (canary group)
- Stage 2: 50% of VPSs (early majority)
- Stage 3: 100% of VPSs (full fleet)

Between stages: check failure rate. If >30% of a stage failed, halt rollout.

### Anti-Patterns to Avoid
- **Parallel SSH storms:** Limit concurrency to 5 SSH connections (same as health checker)
- **No rollback tracking:** Always store previous commit hash before updating
- **Blocking API calls:** Rollout runs async, admin polls for status

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| SSH execution | Custom SSH | existing ssh-exec.ts | Already battle-tested in project |
| Admin auth | Custom auth | existing requireAdmin | Already handles admin guard |
| Batch processing | Custom batching | Same pattern as health-checker processInBatches | Proven concurrency limit pattern |

## Common Pitfalls

### Pitfall 1: SSH Timeout During Updates
**What goes wrong:** `bun install` can take 30+ seconds, default 15s timeout kills it
**Why it happens:** Update commands take longer than health checks
**How to avoid:** Use longer timeouts (60s connect, 120s command) for update operations
**Warning signs:** Frequent timeout errors during updates

### Pitfall 2: Race Condition with Health Checker
**What goes wrong:** Health checker restarts a service mid-update
**Why it happens:** Health sweep runs every 60s, might see service as "down" during restart
**How to avoid:** Set a per-VPS "updating" flag; health checker skips VPSs being updated

### Pitfall 3: Partial Update State
**What goes wrong:** VPS has new code but old dependencies (git pull succeeded, bun install failed)
**Why it happens:** Network issues during dependency installation
**How to avoid:** Always rollback on any step failure; verify service is active after restart

### Pitfall 4: Admin Triggers Multiple Rollouts
**What goes wrong:** Two rollouts run simultaneously, causing conflicts
**Why it happens:** Admin clicks trigger button twice
**How to avoid:** Track rollout state; reject new rollouts if one is in progress

## Code Examples

### SSH Update Command Sequence
```typescript
// Capture current version for rollback
const currentResult = await execSSHCommand({
  host, privateKey,
  command: 'cd /home/rachel/rachel && git rev-parse HEAD',
  commandTimeoutMs: 30_000,
});
const previousHash = currentResult.stdout.trim();

// Pull latest
await execSSHCommand({
  host, privateKey,
  command: 'cd /home/rachel/rachel && git pull origin main',
  commandTimeoutMs: 60_000,
});

// Install dependencies
await execSSHCommand({
  host, privateKey,
  command: 'cd /home/rachel/rachel && bun install',
  commandTimeoutMs: 120_000,
});

// Restart service
await execSSHCommand({
  host, privateKey,
  command: 'sudo systemctl restart rachel8',
  commandTimeoutMs: 30_000,
});
```

### DB Schema for Version Tracking
```typescript
// Add to subscriptions table or create dedicated updates table
currentVersion: text('current_version'),        // git commit hash
targetVersion: text('target_version'),          // target hash during rollout
updateStatus: text('update_status'),            // pending, updating, success, failed, rolled_back
lastUpdateAt: integer('last_update_at', { mode: 'timestamp' }),
previousVersion: text('previous_version'),      // for rollback
```

## Sources

### Primary (HIGH confidence)
- Existing codebase: ssh-exec.ts, health-checker.ts, schema.ts (direct inspection)
- Project architecture patterns from Phases 3, 5, 6

### Secondary (MEDIUM confidence)
- Git operations (pull, checkout, rev-parse) are standard and well-documented

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - uses only existing project dependencies
- Architecture: HIGH - follows established patterns from health monitoring
- Pitfalls: HIGH - identified from direct codebase analysis

**Research date:** 2026-02-14
**Valid until:** 2026-03-14
