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

## Phase 4: Landing Page & Public Launch

**Goal:** Public-facing landing page converts visitors to signups and explains the product clearly.
**Requirements:** LAND-01, LAND-02, LAND-03, LAND-04, LAND-05

### Success Criteria
1. Visitor lands on page and understands what Rachel Cloud is within 10 seconds
2. Landing page clearly shows $20/month pricing and "Sign Up" CTA is visible above fold
3. Demo video or screenshots demonstrate Rachel responding to Telegram messages
4. Landing page links to open-source Rachel8 repo and drives GitHub stars
5. Conversion rate from landing page visit to signup is above 5%

**Plans:** 5 plans (3 waves)

Plans:
- [ ] 04-01-PLAN.md — Tailwind CSS migration (CDN to @tailwindcss/vite) + route group restructuring (Wave 1)
- [ ] 04-05-PLAN.md — Create public Rachel repo + update cloud-init clone URL (Wave 1)
- [ ] 04-02-PLAN.md — Landing page sections: Hero, HowItWorks, Features, Pricing, OpenSource, FAQ, Footer (Wave 2)
- [ ] 04-03-PLAN.md — SEO meta tags, Open Graph, Twitter Cards, JSON-LD, sitemap.xml, robots.txt (Wave 2)
- [ ] 04-04-PLAN.md — Telegram chat mockup component + scroll-triggered animations (Wave 3)

---

## Phase 5: Dashboard & User Controls

**Goal:** Users can monitor their Rachel instance, view logs, restart it, and see uptime metrics.
**Requirements:** DASH-01, DASH-02, DASH-03, DASH-04, DASH-05

### Success Criteria
1. User opens dashboard and sees current server status (running/stopped/error) within 1 second
2. User clicks "Logs" and sees real-time log stream from their Rachel instance
3. User clicks "Restart" and instance restarts successfully within 30 seconds
4. Dashboard displays uptime percentage and last activity timestamp accurately
5. Dashboard is fully responsive and usable on mobile devices

### Plans (to be created during /gsd:plan-phase)

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

### Plans (to be created during /gsd:plan-phase)

---

## Phase 7: Auto-Updates & Rollout System

**Goal:** System can safely deploy new Rachel8 versions to all user instances with rollback capability.
**Requirements:** UPDT-01, UPDT-02, UPDT-03

### Success Criteria
1. Admin triggers update rollout and Rachel8 versions update across all instances
2. Updates roll out gradually (10% → 50% → 100%) to prevent mass outages
3. Failed update on any instance automatically rolls back to previous version
4. Update process completes without user intervention or service interruption
5. Users see updated Rachel8 version number in dashboard after rollout

### Plans (to be created during /gsd:plan-phase)

---

**Roadmap Summary:**
- Phase 1: Foundation (Auth)
- Phase 2: Payment & Onboarding
- Phase 3: Core Provisioning
- Phase 4: Marketing & Public Launch
- Phase 5: User Experience
- Phase 6: Reliability
- Phase 7: Operations

**Next Step:** Run `/gsd:plan-phase 1` to create detailed implementation plan for Authentication & User Foundation.
