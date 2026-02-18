# Roadmap: Rachel Cloud

**Created:** 2026-02-14
**Phases:** 7
**Requirements:** 39 mapped

## Phase 1: Authentication & User Foundation ✅

**Status:** Complete (2026-02-14)
**Goal:** Users can sign up, authenticate, and connect their Claude account securely.
**Requirements:** AUTH-01, AUTH-02, AUTH-03, AUTH-04, AUTH-05, AUTH-06

### Success Criteria
1. ✅ User signs up with email or Google OAuth and receives confirmation within 30 seconds
2. ✅ User completes Claude account OAuth connection and sees "Connected" status in dashboard
3. ✅ User logs out and back in, session persists, and Claude tokens auto-refresh without re-auth
4. ✅ Security audit shows all Claude tokens encrypted at rest with AES-256-GCM

### Plans

**Plans:** 3/3 complete (2 waves)

Plans:
- [x] 01-01-PLAN.md — Database, Better Auth, and token encryption foundation
- [x] 01-02-PLAN.md — Auth API endpoints and session management (Wave 2)
- [x] 01-03-PLAN.md — Claude OAuth 2.0 + PKCE with auto-refresh (Wave 2)

---

## Phase 2: Billing & Onboarding ✅

**Status:** Complete (2026-02-14)
**Goal:** Users can subscribe, enter their Telegram bot token, and complete payment flow.
**Requirements:** BILL-01, BILL-02, BILL-03, BILL-04, BILL-05, BILL-06, ONBR-01, ONBR-02, ONBR-03, ONBR-04

### Success Criteria
1. ✅ User completes Polar checkout and sees active subscription status within 60 seconds
2. ✅ User follows BotFather instructions, enters token, and system validates it before proceeding
3. ✅ User cancels subscription and VPS is deprovisioned after 3-day grace period
4. ✅ Failed payment triggers email notification and subscription status updates correctly
5. ✅ Average onboarding time from signup to "ready to provision" is under 5 minutes

### Plans

**Plans:** 4/4 complete (3 waves)

Plans:
- [x] 02-01-PLAN.md — Database schema extensions, Polar SDK setup, and Better Auth integration (Wave 1)
- [x] 02-02-PLAN.md — Polar webhooks, grace period logic, and email notifications (Wave 2)
- [x] 02-03-PLAN.md — Telegram bot validation and onboarding flow UI (Wave 2)
- [x] 02-04-PLAN.md — Billing dashboard and subscription management pages (Wave 3)

---

## Phase 3: VPS Provisioning & Deployment ✅

**Status:** Complete (2026-02-14)
**Goal:** System auto-provisions a dedicated Hetzner VPS with Rachel8 running in under 2 minutes.
**Requirements:** PROV-01, PROV-02, PROV-03, PROV-04, PROV-05, PROV-06, PROV-07, PROV-08

### Success Criteria
1. ✅ User clicks "Deploy" and sees their Rachel bot responding on Telegram within 2 minutes
2. ✅ Provisioning succeeds 95%+ of the time with clear error messages on failure
3. ✅ Cloud-init validation reports success/failure back to control plane for every provision
4. ✅ Failed provisions are automatically cleaned up with no orphaned VPS instances
5. ✅ User's Claude tokens and Telegram bot token are injected securely without appearing in logs

### Plans

**Plans:** 4/4 complete (3 waves)

Plans:
- [x] 03-01-PLAN.md — Database schema extensions + SSH key generation (Wave 1)
- [x] 03-02-PLAN.md — Hetzner API client with retry logic (Wave 1)
- [x] 03-03-PLAN.md — Cloud-init builder + SSH injector + callback endpoint (Wave 2)
- [x] 03-04-PLAN.md — Provisioning orchestrator + deprovisioning + Deploy button (Wave 3)

---

## Phase 4: Landing Page & Public Launch ✅

**Status:** Complete (2026-02-14)
**Goal:** Public-facing landing page converts visitors to signups and explains the product clearly.
**Requirements:** LAND-01, LAND-02, LAND-03, LAND-04, LAND-05

### Success Criteria
1. ✅ Visitor lands on page and understands what Rachel Cloud is within 10 seconds
2. ✅ Landing page clearly shows $20/month pricing and "Sign Up" CTA is visible above fold
3. ✅ Demo video or screenshots demonstrate Rachel responding to Telegram messages
4. ✅ Landing page links to open-source Rachel8 repo and drives GitHub stars
5. Conversion rate from landing page visit to signup is above 5%

**Plans:** 5/5 complete (3 waves)

Plans:
- [x] 04-01-PLAN.md — Tailwind CSS migration (CDN to @tailwindcss/vite) + route group restructuring (Wave 1)
- [x] 04-05-PLAN.md — Create public Rachel repo + update cloud-init clone URL (Wave 1)
- [x] 04-02-PLAN.md — Landing page sections: Hero, HowItWorks, Features, Pricing, OpenSource, FAQ, Footer (Wave 2)
- [x] 04-03-PLAN.md — SEO meta tags, Open Graph, Twitter Cards, JSON-LD, sitemap.xml, robots.txt (Wave 2)
- [x] 04-04-PLAN.md — Telegram chat mockup component + scroll-triggered animations (Wave 3)

---

## Phase 5: Dashboard & User Controls

**Goal:** Users can monitor their Rachel instance, view logs, restart it, and see uptime metrics. Admin can view all users, revenue, costs, and VPS status.
**Requirements:** DASH-01, DASH-02, DASH-03, DASH-04, DASH-05, ADMIN-01

### Success Criteria
1. User opens dashboard and sees current server status (running/stopped/error) within 1 second
2. User views recent log lines from their Rachel instance
3. User clicks "Restart" and instance restarts successfully within 30 seconds
4. Dashboard displays VPS IP, uptime, and datacenter info
5. Dashboard is fully responsive and usable on mobile devices
6. Admin dashboard shows all users with subscription status, MRR, costs, and VPS status
7. Admin dashboard is only accessible to admin user (ADMIN_EMAIL)

**Plans:** 4 plans (2 waves)

Plans:
- [x] 05-01-PLAN.md — Admin auth middleware + admin route group + admin layout (Wave 1)
- [x] 05-02-PLAN.md — Remote VPS status checking + restart service SSH utilities + API endpoints (Wave 1)
- [x] 05-03-PLAN.md — User dashboard enhancements: server status, restart, logs, connection info (Wave 2)
- [ ] 05-04-PLAN.md — Admin dashboard: users list, revenue, costs, VPS overview (Wave 2)

---

## Phase 6: Health Monitoring & Auto-Recovery

**Goal:** System automatically detects and recovers from Rachel instance failures with minimal downtime.
**Requirements:** MNTR-01, MNTR-02, MNTR-03, MNTR-04

### Success Criteria
1. System detects crashed Rachel instance within 60 seconds and auto-restarts it
2. User receives email notification when their instance goes down and when it recovers
3. Auto-recovery uses circuit breaker to prevent infinite restart loops
4. 99% of instance failures are auto-recovered without user intervention
5. Mean time to recovery (MTTR) is under 5 minutes for automated failures

**Plans:** 3 plans (2 waves)

Plans:
- [x] 06-01-PLAN.md — DB schema for health tracking + health check service + circuit breaker (Wave 1)
- [x] 06-02-PLAN.md — Auto-recovery with circuit breaker + email notifications (Wave 2)
- [x] 06-03-PLAN.md — Health status in user dashboard + admin dashboard (Wave 2)

---

## Phase 7: Auto-Updates & Rollout System ✅

**Status:** Complete (2026-02-14)
**Goal:** System can safely deploy new Rachel8 versions to all user instances with rollback capability.
**Requirements:** UPDT-01, UPDT-02, UPDT-03

### Success Criteria
1. ✅ Admin triggers update rollout and Rachel8 versions update across all instances
2. ✅ Updates roll out gradually (10% → 50% → 100%) to prevent mass outages
3. ✅ Failed update on any instance automatically rolls back to previous version
4. ✅ Update process completes without user intervention or service interruption
5. ✅ Users see updated Rachel8 version number in dashboard after rollout

**Plans:** 2/2 complete (2 waves)

Plans:
- [x] 07-01-PLAN.md — DB schema for version tracking + SSH-based update engine (Wave 1)
- [x] 07-02-PLAN.md — Rollout orchestrator (gradual 10%/50%/100%) + admin updates page (Wave 2)

---

## v2.0 — Docker Multi-Tenant

---

## Phase 9: Dockerfile & Image Build

**Goal:** Create a production-ready Docker image for Rachel8 that can be spun up as isolated user containers.
**Requirements:** DOCK-01, DOCK-02, DOCK-03, DOCK-04, DOCK-06

### Success Criteria
1. `docker build` produces a Rachel8 image with Bun, all deps, and skills pre-installed
2. Container starts and Rachel bot responds on Telegram within 30 seconds
3. Each container has isolated filesystem — user A cannot access user B's data
4. Container respects memory limit (512MB) and CPU limit (0.5 cores)
5. Container auto-restarts on crash via Docker restart policy
6. Container env vars configure: Telegram bot token, proxy URL, user ID, Groq key

### Plans
- [ ] 09-01-PLAN.md — Dockerfile, .dockerignore, build script, base image selection (Wave 1)
- [ ] 09-02-PLAN.md — Container config: env vars, volumes, network, resource limits, restart policy (Wave 1)
- [ ] 09-03-PLAN.md — Integration test: build image, run container, verify Rachel responds on Telegram (Wave 2)

---

## Phase 10: LLM Proxy Server

**Goal:** Build a lightweight proxy that sits between containers and Z.ai, handling auth, rate limiting, and usage tracking.
**Requirements:** PROX-01, PROX-02, PROX-03, PROX-04, PROX-05, PROX-06

### Success Criteria
1. Proxy receives Anthropic-compatible POST /v1/messages and forwards to Z.ai with correct auth
2. Proxy streams responses back to container without corruption
3. Per-user rate limit enforced — returns 429 when exceeded
4. Usage log records every request: user ID, timestamp, input/output tokens
5. Z.ai API key never appears in container env or logs
6. Proxy handles Z.ai downtime gracefully (retries, clear error to user)

### Plans
- [ ] 10-01-PLAN.md — Bun HTTP server, request forwarding, Z.ai auth injection, response streaming (Wave 1)
- [ ] 10-02-PLAN.md — Per-user rate limiting (SQLite), usage tracking, logging (Wave 1)
- [ ] 10-03-PLAN.md — Error handling, retries, health endpoint, systemd service (Wave 2)

---

## Phase 11: Container Orchestrator

**Goal:** Replace Hetzner VPS provisioning with Docker container lifecycle management.
**Requirements:** ORCH-01, ORCH-02, ORCH-03, ORCH-04, ORCH-05, DOCK-05, DOCK-07

### Success Criteria
1. Admin can create a new user container from control plane in under 10 seconds
2. Admin can stop/restart/remove a container without affecting other users
3. Container health is visible in admin dashboard (running, stopped, restarting, exited)
4. Crashed containers are detected within 60 seconds
5. All containers can be updated to new image version with rolling restart
6. Deprovisioned containers have all user data cleaned up

### Plans
- [ ] 11-01-PLAN.md — Docker API client (dockerode or shell exec), create/start/stop/remove/inspect (Wave 1)
- [ ] 11-02-PLAN.md — Health monitoring: poll container status, detect crashes, report to DB (Wave 1)
- [ ] 11-03-PLAN.md — Rolling update: build new image, recreate containers one-by-one, rollback on failure (Wave 2)
- [ ] 11-04-PLAN.md — Deprovision: stop container, remove volumes, clean user data (Wave 2)

---

## Phase 12: Control Plane Integration

**Goal:** Update the SvelteKit control plane to work with Docker instead of Hetzner VPS.
**Requirements:** CTRL-01, CTRL-02, CTRL-03, CTRL-04

### Success Criteria
1. User dashboard shows container status (running/stopped/error) with live updates
2. Admin dashboard shows all containers with CPU/memory usage and request counts
3. New user onboarding creates Docker container instead of Hetzner VPS
4. Billing page offers all-inclusive $20/mo tier (no external sub required)
5. End-to-end flow works: signup → pay → create bot → container running → chat on Telegram

### Plans
- [ ] 12-01-PLAN.md — Replace VPS provisioning API with Docker orchestrator calls (Wave 1)
- [ ] 12-02-PLAN.md — Update user dashboard: container status, restart button, logs (Wave 1)
- [ ] 12-03-PLAN.md — Update admin dashboard: container fleet view, resource usage, request stats (Wave 2)
- [ ] 12-04-PLAN.md — Onboarding flow update: remove Claude OAuth, add all-inclusive option (Wave 2)
- [ ] 12-05-PLAN.md — End-to-end testing: full signup-to-chat flow on Docker (Wave 3)

---

---

## v3.0 — Telegram-First & Cleanup

---

## Phase 13: Dead Code Cleanup

**Goal:** Remove all legacy Hetzner VPS, SSH, and health monitoring code that was replaced by the Docker orchestrator in v2.0.
**Requirements:** CLEAN-01, CLEAN-02, CLEAN-03, CLEAN-04, CLEAN-05, CLEAN-06, CLEAN-07, CLEAN-08

### Success Criteria
1. All Hetzner/SSH provisioning files deleted (~14 files, ~2,500 LOC)
2. `ssh2` dependency removed from package.json
3. `healthChecks` table removed from schema
4. Legacy VPS columns removed from subscriptions schema
5. Cloud-init callback endpoint removed
6. Application builds and all existing functionality works unchanged
7. No remaining imports from deleted modules

### Plans
- [ ] 13-01-PLAN.md — Delete provisioning, monitoring, and update-engine files; remove ssh2 dep (Wave 1)
- [ ] 13-02-PLAN.md — Schema cleanup: remove healthChecks table, legacy VPS columns; create migration (Wave 1)
- [ ] 13-03-PLAN.md — Verify build, grep for dead references, final cleanup (Wave 2)

---

## Phase 14: Telegram-Only Authentication

**Goal:** Replace the entire web-based auth system with Telegram as the sole authentication mechanism. One shared Rachel bot, users identified by Telegram user ID, no web signup needed.
**Requirements:** TGAUTH-01..14, TGUX-01..05, WEB-01..03

### Success Criteria
1. Single shared Rachel bot receives messages from all users
2. Messages are routed to the correct user's container based on Telegram user ID
3. New user sends `/start` → gets link to web dashboard → subscribes via Polar → container auto-provisioned → chatting in <2 minutes
4. Web dashboard authenticated via Telegram Login Widget (user sees status, logs, billing)
5. User can also manage basic things via Telegram commands (/status, /restart, /logs, /billing, /help)
6. Better Auth, Claude OAuth, and Google OAuth code removed
7. Landing page has "Message @RachelAI on Telegram" CTA + Telegram Login Widget for returning users
8. Admin dashboard accessible via Telegram Login Widget + admin telegram_id check
9. DB schema uses `telegram_id` as user primary key

### Plans
- [ ] 14-01-PLAN.md — New DB schema: users table (telegram_id PK), update subscriptions FK (Wave 1)
- [ ] 14-02-PLAN.md — Telegram Login Widget: embed, hash verification, lightweight session management (Wave 1)
- [ ] 14-03-PLAN.md — Shared bot message router: receive → lookup user → forward to container → respond (Wave 2)
- [ ] 14-04-PLAN.md — Polar integration: checkout with telegram_id, webhook provisions container (Wave 2)
- [ ] 14-05-PLAN.md — Telegram bot commands: /start, /status, /restart, /logs, /billing, /help (Wave 3)
- [ ] 14-06-PLAN.md — Remove Better Auth + Claude OAuth; update dashboard/admin auth guards (Wave 3)
- [ ] 14-07-PLAN.md — Update landing page, onboarding flow, and admin dashboard (Wave 4)

---

**Roadmap Summary:**

### v1.0 (Complete)
- Phase 1: Foundation (Auth) ✅
- Phase 2: Payment & Onboarding ✅
- Phase 3: Core Provisioning ✅
- Phase 4: Marketing & Public Launch ✅
- Phase 5: User Experience ✅
- Phase 6: Reliability ✅
- Phase 7: Operations ✅
- Phase 8: Polish & Gap Fixes ✅

### v2.0 — Docker Multi-Tenant (Complete)
- Phase 9: Dockerfile & Image Build ✅
- Phase 10: LLM Proxy Server ✅
- Phase 11: Container Orchestrator ✅
- Phase 12: Control Plane Integration ✅

### v3.0 — Telegram-First & Cleanup
- Phase 13: Dead Code Cleanup
- Phase 14: Telegram-Only Authentication

## Phase 15: Container Page Serving — REMOVED

**Status:** Removed (2026-02-18)
**Reason:** The nginx reverse proxy + socat + orchestrator page API approach was over-engineered. Container Rachels can simply use `cloudflared tunnel --url` to create quick public tunnels. This works out of the box, requires zero host-side infrastructure, and the container Rachel already knows how to do it via the system prompt. The tradeoff (random URLs that change on restart) is acceptable.

---

## Phase 16: Infrastructure Go-Live

**Goal:** Get the full stack running in production so the first real user can sign up, pay, and start chatting with Rachel on Telegram.
**Requirements:** INFRA-01, INFRA-02, INFRA-03, INFRA-04, INFRA-05, INFRA-06, INFRA-07, INFRA-08

### Success Criteria
1. Docker image builds successfully and container starts responding on Telegram within 30 seconds
2. Orchestrator and LLM proxy running as systemd services (survive reboots)
3. SvelteKit running as production build (not vite preview)
4. Full end-to-end flow works: get-rachel.com → Telegram Login → Polar checkout → container provisioned → chat on Telegram
5. Polar in production mode — real payments work
6. nginx + socat installed and configured for container page serving
7. DB migration applied (drizzle-kit push)
8. Bot commands work: /start, /status, /restart, /billing, /help

### Plans
- [ ] 16-01-PLAN.md — Build Rachel8 Docker image, run DB migration, production SvelteKit build (Wave 1)
- [ ] 16-02-PLAN.md — Systemd services for orchestrator (9998), LLM proxy (9999), SvelteKit (5173) (Wave 1)
- [ ] 16-03-PLAN.md — Install nginx + socat, configure wildcard reverse proxy for *.get-rachel.com (Wave 2)
- [ ] 16-04-PLAN.md — Switch Polar to production, verify webhook, end-to-end signup flow test (Wave 2)

---

**4 phases** | **47 requirements** | All mapped ✓
