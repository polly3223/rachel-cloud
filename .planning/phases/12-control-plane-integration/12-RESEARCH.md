# Phase 12 Research: Control Plane Integration

## 1. Current v1.0 Architecture

### Provisioning (9 files — mostly dead code after Docker pivot)

| File | Purpose | Docker Impact |
|------|---------|---------------|
| `provision-vps.ts` | 6-phase VPS creation via Hetzner API | **REPLACE** → orchestrator HTTP call |
| `deprovision-vps.ts` | Hetzner server + SSH key deletion | **REPLACE** → orchestrator DELETE call |
| `hetzner-client.ts` | Hetzner Cloud API wrapper | **DEAD CODE** |
| `cloud-init-builder.ts` | Cloud-config YAML for Ubuntu bootstrap | **DEAD CODE** |
| `ssh-injector.ts` | SSH .credentials.json + .env injection | **DEAD CODE** |
| `ssh-exec.ts` | Generic SSH command runner | **DEAD CODE** |
| `ssh-keys.ts` | RSA 4096 key pair generation | **DEAD CODE** |
| `vps-status.ts` | Hetzner API + SSH status | **REPLACE** → orchestrator GET call |
| `types.ts` | Hetzner API types | **REPLACE** with Docker types |

### Monitoring (3 files)

| File | Purpose | Docker Impact |
|------|---------|---------------|
| `health-checker.ts` | 60s SSH sweep, auto-restart, emails | **REPLACE** → orchestrator owns health |
| `health-notifications.ts` | Resend emails for instance down/up | **KEEP** (trigger from orchestrator) |
| `circuit-breaker.ts` | State machine | **REMOVE** (orchestrator has its own) |

### Updates (2 files)

| File | Purpose | Docker Impact |
|------|---------|---------------|
| `update-engine.ts` | Per-VPS SSH update | **DEAD CODE** → orchestrator update |
| `rollout-orchestrator.ts` | 10/50/100% rollout | **DEAD CODE** → orchestrator update-all |

### Billing & Jobs

| File | Purpose | Docker Impact |
|------|---------|---------------|
| `subscription-manager.ts` | Subscription CRUD, grace period | **MODIFY** → orchestrator deprovision |
| `grace-period-enforcer.ts` | Deprovision after 3 days | **MODIFY** → orchestrator client call |
| `polar-client.ts` | Polar SDK init | **KEEP** |

### Auth

| File | Purpose | Docker Impact |
|------|---------|---------------|
| `auth/config.ts` | Better Auth + Polar webhooks | **MODIFY** → orchestrator deprovision in webhooks |

### Admin

| File | Purpose | Docker Impact |
|------|---------|---------------|
| `admin/data.ts` | Overview, MRR, VPS count, costs | **MODIFY** → container fields, new cost constants |
| `admin/guard.ts` | Admin auth middleware | **KEEP** |

---

## 2. Database Schema Changes

### subscriptions table

**Remove:** `hetznerServerId`, `hetznerSshKeyId`, `vpsIpAddress`, `vpsHostname`, `sshPrivateKey`

**Add:** `containerId` (text, nullable), `containerName` (text, nullable)

**Rename (optional):** `vpsProvisioned` → keep as-is or rename to `containerProvisioned` for clarity

**Simplify provisioning status:** Remove `cloud_init` and `injecting_secrets` phases. New: `pending | creating | starting | ready | failed`

**Rename update fields:** `currentVersion`/`targetVersion`/`previousVersion` → `currentImage`/`targetImage`/`previousImage`

### claudeTokens table

**Make optional** — not required for all-inclusive tier. Keep for BYOS users.

### telegramBots table — No changes

### healthChecks table — No changes (already generic)

### Migration strategy

Non-destructive: add new columns, keep old ones nullable. Clean up old columns after v1.0 fully retired.

---

## 3. Route Changes

### API Routes

| Route | Current | New |
|-------|---------|-----|
| `POST /api/provision/deploy` | `provisionVPS()` | Orchestrator `POST /containers` |
| `POST /api/provision/callback/[userId]` | Cloud-init callback | **DELETE** |
| `GET /api/vps/status` | Hetzner + SSH | Orchestrator `GET /containers/:userId` |
| `POST /api/vps/restart` | SSH systemctl | Orchestrator `POST /containers/:userId/restart` |
| `GET /api/vps/logs` | SSH journalctl | Needs new orchestrator logs endpoint |
| `*  /api/claude/*` | Claude OAuth | **Make optional** |

Consider renaming `/api/vps/*` → `/api/instance/*`.

### Page Routes

| Route | Change |
|-------|--------|
| `(app)/onboarding` | Remove Claude OAuth requirement; just Payment → Telegram → Deploy |
| `(app)/dashboard` | Container status instead of VPS; remove IP/datacenter; show health |
| `(app)/dashboard/claude` | Optional/hidden for all-inclusive |
| `(admin)/admin` | Container count instead of VPS count; Docker costs |
| `(admin)/admin/infrastructure` | Container fleet from orchestrator |
| `(admin)/admin/updates` | Orchestrator `POST /update-all` |
| `(admin)/admin/users` | Container ID/state instead of VPS IP |

---

## 4. New Orchestrator Client

Central new module: `src/lib/orchestrator/client.ts`

Calls the orchestrator HTTP API at `http://127.0.0.1:9998`:

```typescript
const ORCHESTRATOR_URL = process.env.ORCHESTRATOR_URL || 'http://127.0.0.1:9998';
const ORCHESTRATOR_API_KEY = process.env.ORCHESTRATOR_API_KEY;

export class OrchestratorClient {
  async provisionContainer(userId, telegramBotToken, ownerTelegramUserId, groqApiKey?)
  async deprovisionContainer(userId, removeData?)
  async restartContainer(userId)
  async getContainerStatus(userId)
  async listContainers()
  async updateContainer(userId, image?)
  async updateAll(image?)
  async healthSweep()
  async getHealth()
}
```

Bearer token auth, retry logic, typed responses matching orchestrator types.

### Missing: Container logs endpoint

Phase 11 orchestrator doesn't have `GET /containers/:userId/logs`. Needs to be added (Docker Engine has `GET /containers/{id}/logs`).

---

## 5. Provisioning Flow Comparison

### v1.0 (6 phases, ~2 minutes)
1. Validate subscription + Claude tokens + Telegram bot
2. Generate SSH key → Hetzner
3. Cloud-init YAML → create VPS
4. Poll cloud-init callback (60-110s)
5. SSH inject credentials
6. Verify service running

### v2.0 (1 call, ~10 seconds)
1. Validate subscription + Telegram bot (no Claude needed)
2. Call orchestrator `POST /containers`
3. Orchestrator: create volume → create container → start
4. Update DB: containerId, containerName, status='ready'

Dramatically simpler. No SSH, no cloud-init, no polling, no secret injection.

---

## 6. Webhook Changes

### Polar webhook handlers (in auth/config.ts)

| Event | Current | New |
|-------|---------|-----|
| `onSubscriptionActive` | Update DB status | **No change** |
| `onSubscriptionCanceled` | `scheduleGracePeriod()` → `deprovisionVPS()` after 3 days | Grace period → `orchestratorClient.deprovisionContainer(userId, removeData=false)` |
| `onSubscriptionRevoked` | Update DB only | `orchestratorClient.deprovisionContainer(userId, removeData=true)` |
| `onSubscriptionUncanceled` | Cancel grace period | **No change** |

### Onboarding flow
- Remove Claude OAuth step requirement
- New: Payment → Telegram bot → Deploy

---

## 7. Key Decisions

1. **Orchestrator client = single point of contact** — all SvelteKit code talks to Docker via orchestrator HTTP API only
2. **Health monitoring in orchestrator** — control plane polls for status, doesn't run its own sweeps
3. **Claude OAuth optional** — all-inclusive tier uses proxy; BYOS users can still connect Claude
4. **Container logs** — add to orchestrator as part of Phase 12
5. **Non-destructive migration** — add new columns, keep old ones nullable
6. **Provisioning is synchronous** — fast enough to await (no fire-and-forget + polling)
