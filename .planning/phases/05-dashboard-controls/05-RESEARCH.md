# Phase 5: Dashboard & User Controls - Research

**Researched:** 2026-02-14
**Domain:** SvelteKit dashboard, Hetzner API, SSH remote execution, admin auth
**Confidence:** HIGH

## Summary

Phase 5 adds two dashboards: an enhanced user dashboard (server status, restart, logs) and a new admin dashboard (users, revenue, costs, VPS overview). The good news is that the existing codebase already has nearly everything needed: the `HetznerClient` class has a `getServer()` method that returns server status, the `ssh2` library is already installed with working SSH patterns in `ssh-injector.ts`, and the `hooks.server.ts` already has a handle function that can be extended with admin route protection.

No new npm dependencies are required. The main work is: (1) creating a reusable SSH command executor extracted from `ssh-injector.ts` patterns, (2) adding admin route guard logic to `hooks.server.ts`, (3) building the admin route group with layout and pages, and (4) enhancing the user dashboard with live status, restart, and logs.

**Primary recommendation:** Reuse existing `HetznerClient.getServer()` for VPS status, extract SSH command execution patterns from `ssh-injector.ts` into a reusable utility, protect admin routes via `hooks.server.ts` handle function with hardcoded email check, and use simple polling (not SSE) for log updates.

<user_constraints>

## User Constraints (from CONTEXT.md)

### Locked Decisions
- Server status via Hetzner API `GET /servers/{id}` (already implemented in HetznerClient)
- Restart via SSH `systemctl restart rachel8`
- Logs via SSH `journalctl -u rachel8 -n 100 --no-pager`
- Admin route group at `(admin)` / `/admin/*`
- Admin auth by hardcoded email in env var `ADMIN_EMAIL`
- Admin auth in `hooks.server.ts` (not layout-level)
- Same repo, same SvelteKit app
- Polling for logs (not SSE/WebSockets)

### Claude's Discretion
- Admin dashboard visual design
- Polling interval (5-10s)
- Number of log lines (50-100)
- Error handling UX for SSH failures
- Optional Hetzner API response caching

### Deferred Ideas (OUT OF SCOPE)
- Real-time log streaming via SSE/WebSockets
- Admin actions (force-restart, force-deprovision)
- Usage metrics/charts over time
- CSV export
- Multi-admin support
- Admin audit log

</user_constraints>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| ssh2 | ^1.17.0 | SSH command execution on user VPSs | Already installed, battle-tested patterns in ssh-injector.ts |
| HetznerClient | N/A (internal) | Hetzner API calls (getServer for status) | Already built in Phase 3, has retry logic and rate limit handling |
| SvelteKit | ^2.0.0 | Route groups, hooks, layouts, server load | Project framework, route groups already used for (app) and (landing) |
| Drizzle ORM | ^0.45.1 | Database queries for user/subscription data | Already used throughout project |
| Better Auth | ^1.4.18 | Session management, authentication | Already configured with hooks.server.ts |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Tailwind CSS | ^4.1.18 | Dashboard styling | Already configured via @tailwindcss/vite |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Polling for logs | SSE (sveltekit-sse) | SSE is real-time but adds complexity; polling every 5-10s is simple and sufficient for MVP |
| Hooks-based admin auth | Layout-based auth | Hooks run before all load functions; layouts can be bypassed during client-side navigation |
| Hardcoded admin email | Role-based access (DB column) | Role-based is more flexible but overkill for single admin; env var is simpler |

**Installation:** No new packages needed. All dependencies already in package.json.

## Architecture Patterns

### Recommended Project Structure
```
src/
├── routes/
│   ├── (admin)/                    # NEW: Admin route group
│   │   ├── admin/
│   │   │   ├── +layout.svelte      # Admin sidebar layout
│   │   │   ├── +layout.server.ts   # Load admin data (all users, etc.)
│   │   │   ├── +page.svelte        # Admin dashboard overview
│   │   │   └── +page.server.ts     # Load aggregated stats
│   ├── (app)/                      # EXISTING: User routes
│   │   ├── dashboard/
│   │   │   ├── +page.svelte        # ENHANCE: Add status, restart, logs
│   │   │   └── +page.server.ts     # ENHANCE: Add VPS status check
├── lib/
│   ├── admin/
│   │   └── guard.ts                # Admin auth check utility
│   ├── provisioning/
│   │   └── ssh-exec.ts             # NEW: Reusable SSH command executor
│   │   └── vps-status.ts           # NEW: VPS status checking via Hetzner API
```

### Pattern 1: Admin Route Protection via hooks.server.ts
**What:** Check if request path starts with `/admin` and verify the session user's email matches `ADMIN_EMAIL` env var. Redirect to `/dashboard` if not admin.
**When to use:** Every request to admin routes.
**Example:**
```typescript
// In hooks.server.ts handle function
if (event.url.pathname.startsWith('/admin')) {
  const session = event.locals.session;
  if (!session || session.user.email !== process.env.ADMIN_EMAIL) {
    throw redirect(302, '/dashboard');
  }
}
```
**Confidence:** HIGH - This is the documented SvelteKit pattern for route protection. The project's existing hooks.server.ts already attaches session to `event.locals`.

### Pattern 2: Reusable SSH Command Executor
**What:** Extract the SSH connect + exec pattern from `ssh-injector.ts` into a generic utility that takes a host, private key, and command string, returns stdout.
**When to use:** For status checks, restart commands, log fetching.
**Example:**
```typescript
// src/lib/provisioning/ssh-exec.ts
export async function execSSHCommand(config: {
  host: string;
  privateKey: string;
  command: string;
  username?: string;
  timeoutMs?: number;
}): Promise<{ stdout: string; stderr: string; exitCode: number }> {
  const conn = new Client();
  try {
    await connectSSH(conn, config);
    return await execCommand(conn, config.command);
  } finally {
    conn.end();
  }
}
```
**Confidence:** HIGH - The exact same ssh2 patterns are already proven in ssh-injector.ts.

### Pattern 3: VPS Status via Hetzner API
**What:** Use existing `HetznerClient.getServer(serverId)` to get real-time server status (running/stopping/off/etc).
**When to use:** Dashboard page load, status refresh.
**Example:**
```typescript
// Already exists in hetzner-client.ts:
const response = await hetznerClient.getServer(serverId);
const status = response.server.status; // 'running' | 'off' | 'starting' | etc.
```
**Confidence:** HIGH - `getServer()` is already implemented and tested. The HetznerServer type includes `status` field.

### Pattern 4: API Endpoints for Dashboard Actions
**What:** Create SvelteKit API routes for restart and logs that the dashboard calls via fetch.
**When to use:** User clicks Restart button or views logs.
**Example:**
```typescript
// src/routes/api/vps/restart/+server.ts
export const POST: RequestHandler = async (event) => {
  const session = await requireAuth(event);
  const subscription = await getSubscription(session.user.id);
  // SSH into VPS and restart rachel8 service
  await execSSHCommand({
    host: subscription.vpsIpAddress,
    privateKey: decryptToken(subscription.sshPrivateKey),
    command: 'sudo systemctl restart rachel8'
  });
  return json({ success: true });
};
```
**Confidence:** HIGH - Standard SvelteKit API route pattern used throughout the project.

### Anti-Patterns to Avoid
- **Layout-based admin auth:** Layout load functions run in parallel with page load functions. A malicious user could potentially access page data before the layout redirect fires. Use hooks.server.ts instead.
- **SSE for MVP logs:** Overengineered for this use case. Polling every 5-10 seconds is simpler, requires no special server configuration, and works identically across all deployment targets.
- **Direct SSH from client:** Never expose SSH credentials to the browser. All SSH operations go through server-side API endpoints.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| SSH command execution | New SSH library wrapper | Existing ssh2 + ssh-injector patterns | Proven, handles timeouts, error formatting |
| Hetzner server status | Custom HTTP calls | Existing HetznerClient.getServer() | Has retry logic, rate limit handling, typed responses |
| Admin auth middleware | Custom session parsing | Existing getSession() + hooks.server.ts | Session already attached to event.locals |
| Database queries | Raw SQL | Existing Drizzle ORM patterns | Type-safe, consistent with rest of codebase |

**Key insight:** Phase 5 is primarily a UI/integration phase. Almost all backend capabilities already exist; we're exposing them through new routes and enhancing the dashboard UI.

## Common Pitfalls

### Pitfall 1: SSH Connection Timeouts on Cold VPS
**What goes wrong:** SSH connections to user VPSs may timeout if the server is starting up or under load.
**Why it happens:** Hetzner VPSs take a few seconds to become SSH-accessible after boot.
**How to avoid:** Set reasonable SSH timeouts (10-15 seconds for status checks, not 30s like provisioning). Show "connecting..." state in UI. Catch timeout errors gracefully and show "Unable to connect" instead of crashing.
**Warning signs:** SSH commands hanging, dashboard appearing frozen.

### Pitfall 2: Admin Email Check Case Sensitivity
**What goes wrong:** `user.email !== process.env.ADMIN_EMAIL` fails because email casing differs.
**Why it happens:** Emails are case-insensitive per RFC but stored as entered.
**How to avoid:** Always compare with `.toLowerCase()` on both sides.
**Warning signs:** Admin can't access admin panel despite correct email.

### Pitfall 3: SSH Private Key Decryption on Every Request
**What goes wrong:** Decrypting the SSH private key for every log poll or status check adds latency.
**Why it happens:** Keys are stored encrypted in the database (correct for security).
**How to avoid:** This is acceptable for now. Decryption is fast (AES-256-GCM). If it becomes a problem, add a short-lived in-memory cache (5 minutes). Don't optimize prematurely.
**Warning signs:** Dashboard load times exceeding 2-3 seconds.

### Pitfall 4: Polling Without Cleanup
**What goes wrong:** setInterval for log polling continues running after component unmount.
**Why it happens:** Svelte 5 effects with intervals need proper cleanup.
**How to avoid:** Use `$effect()` with a cleanup return function to clear the interval, same pattern used in the existing provisioning status polling.
**Warning signs:** Multiple polling intervals stacking up, memory leaks.

### Pitfall 5: Admin Data Leaking to Non-Admin Users
**What goes wrong:** Admin API endpoints return sensitive data if auth isn't checked.
**Why it happens:** Forgetting to add admin check to API routes (only protecting page routes).
**How to avoid:** Create a reusable `requireAdmin()` function that both hooks and API routes use. Apply it consistently.
**Warning signs:** Non-admin users seeing admin data via direct API calls.

## Code Examples

### VPS Status Check (reusing existing HetznerClient)
```typescript
// Source: existing hetzner-client.ts getServer method
import { HetznerClient } from '$lib/provisioning/hetzner-client';
import { decryptToken } from '$lib/crypto/encryption';

export async function getVPSStatus(hetznerServerId: number): Promise<{
  status: string;
  ip: string;
  created: string;
}> {
  const client = new HetznerClient({
    apiToken: process.env.HETZNER_API_TOKEN!
  });
  const { server } = await client.getServer(hetznerServerId);
  return {
    status: server.status,          // 'running' | 'off' | 'starting' | etc.
    ip: server.public_net.ipv4.ip,
    created: server.created
  };
}
```

### SSH Command for Service Restart
```typescript
// Reusing ssh2 patterns from ssh-injector.ts
import { Client } from 'ssh2';

export async function restartRachelService(host: string, privateKey: string): Promise<void> {
  const conn = new Client();
  try {
    await connectSSH(conn, { host, privateKey, username: 'rachel' });
    await execCommand(conn, 'sudo systemctl restart rachel8', 'restart service');
  } finally {
    conn.end();
  }
}
```

### SSH Command for Log Fetching
```typescript
export async function fetchServiceLogs(
  host: string,
  privateKey: string,
  lines: number = 100
): Promise<string> {
  const conn = new Client();
  try {
    await connectSSH(conn, { host, privateKey, username: 'rachel' });
    const logs = await execCommand(
      conn,
      `journalctl -u rachel8 -n ${lines} --no-pager`,
      'fetch logs'
    );
    return logs;
  } finally {
    conn.end();
  }
}
```

### Admin Guard in hooks.server.ts
```typescript
// Pattern: extend existing handle function
import { sequence } from '@sveltejs/kit/hooks';

const authHandle: Handle = async ({ event, resolve }) => {
  // Existing auth logic...
  return resolve(event);
};

const adminGuard: Handle = async ({ event, resolve }) => {
  if (event.url.pathname.startsWith('/admin')) {
    const session = event.locals.session;
    const adminEmail = process.env.ADMIN_EMAIL?.toLowerCase();
    if (!session || session.user.email.toLowerCase() !== adminEmail) {
      throw redirect(302, '/dashboard');
    }
  }
  return resolve(event);
};

export const handle = sequence(authHandle, adminGuard);
```

### Admin Dashboard Data Aggregation
```typescript
// Drizzle ORM queries for admin overview
import { db } from '$lib/db';
import { users, subscriptions } from '$lib/db/schema';
import { eq, count, sql } from 'drizzle-orm';

// Get all users with subscription status
const allUsers = await db
  .select({
    id: users.id,
    email: users.email,
    name: users.name,
    createdAt: users.createdAt,
    subscriptionStatus: subscriptions.status,
    vpsProvisioned: subscriptions.vpsProvisioned,
    vpsIpAddress: subscriptions.vpsIpAddress,
    hetznerServerId: subscriptions.hetznerServerId,
  })
  .from(users)
  .leftJoin(subscriptions, eq(users.id, subscriptions.userId));

// Calculate MRR
const activeCount = allUsers.filter(u => u.subscriptionStatus === 'active').length;
const mrr = activeCount * 20; // $20/month per user
const estimatedCosts = allUsers.filter(u => u.vpsProvisioned).length * 3.49; // ~EUR3.49/VPS
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Layout-based route guards | hooks.server.ts handle guards | SvelteKit 1.x → 2.x | More reliable, runs before load functions |
| WebSockets for all real-time | SSE or polling depending on need | 2024+ | Simpler for one-way data, less infrastructure |
| Separate admin app | Route groups in same app | SvelteKit route groups stable | Single deployment, shared code, less complexity |

**Deprecated/outdated:**
- `+guard.server.js` files: Proposed in SvelteKit issue #9482 but never implemented. Use hooks.server.ts instead.
- Per-directory hooks: Proposed in issue #6731 but not implemented. Global hooks with path checking is the standard.

## Open Questions

1. **Server uptime from Hetzner vs SSH**
   - What we know: Hetzner API returns `server.created` timestamp. SSH `uptime` gives actual runtime.
   - What's unclear: Whether `server.created` reflects reboots or just initial creation.
   - Recommendation: Use SSH `uptime` command for accurate uptime. Fall back to Hetzner `created` date if SSH fails.

2. **Admin email configuration**
   - What we know: Single admin (Lorenzo), env var is simplest.
   - What's unclear: Whether multiple admins will be needed soon.
   - Recommendation: Use `ADMIN_EMAIL` env var for now. Easy to extend to comma-separated list later if needed.

## Sources

### Primary (HIGH confidence)
- Existing codebase: `src/lib/provisioning/hetzner-client.ts` - HetznerClient.getServer() already implemented
- Existing codebase: `src/lib/provisioning/ssh-injector.ts` - SSH patterns (connectSSH, execCommand) proven
- Existing codebase: `src/lib/provisioning/types.ts` - ServerStatus type includes all Hetzner states
- Existing codebase: `src/hooks.server.ts` - Handle function already processes auth
- SvelteKit docs: https://svelte.dev/docs/kit/hooks - Handle function, sequence helper

### Secondary (MEDIUM confidence)
- Hetzner API docs: https://docs.hetzner.cloud - Server status endpoint, response format
- SvelteKit hooks discussion: https://github.com/sveltejs/kit/discussions/3911 - Route guard patterns

### Tertiary (LOW confidence)
- None - all patterns verified against existing codebase or official docs

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - all libraries already in use, no new dependencies
- Architecture: HIGH - extending existing patterns (route groups, hooks, SSH)
- Pitfalls: HIGH - based on existing codebase patterns and known SvelteKit behavior

**Research date:** 2026-02-14
**Valid until:** 2026-03-14 (stable stack, no fast-moving dependencies)
