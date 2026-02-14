# Stack Research: Managed AI Agent Hosting Platform

**Domain:** Managed AI agent hosting platform with auto-provisioned VPS instances
**Researched:** 2026-02-14
**Overall Confidence:** High (90%)

## Executive Summary

This research identifies the optimal technology stack for Rachel Cloud, a managed hosting platform that auto-provisions dedicated Hetzner VPS instances for Rachel AI agent deployments. The stack prioritizes developer experience, operational simplicity, production reliability, and cost efficiency while leveraging modern 2026 best practices.

**Key Architectural Decisions:**
- **Runtime:** Bun 1.3.9 for both control plane and agent instances (unified runtime, superior performance)
- **Control Plane Framework:** Hono 4.11.9 (runtime-agnostic, production-proven)
- **Database:** PostgreSQL 18.2 (robust multi-tenancy, transaction support, backup capabilities)
- **ORM:** Drizzle ORM 0.45.1 (code-first TypeScript, minimal overhead)
- **Frontend:** React 19.2.4 + TypeScript 6.0 + Vite 7.3.1 + shadcn/ui (modern, type-safe DX)
- **Agent Communication:** grammY 1.40.0 for Telegram Bot API integration

---

## Recommended Stack

### Core Backend Technologies

| Technology | Version | Purpose | Why Recommended | Confidence |
|------------|---------|---------|-----------------|------------|
| **Bun** | 1.3.9 | JavaScript runtime | 2-3.5x faster than Node.js (30K-50K RPS vs 13K-20K), built-in SQLite/PostgreSQL clients, 60% faster builds on macOS, production-ready in 2026, unified runtime for entire stack | High (90%) |
| **Hono** | 4.11.9 | Web framework | Runtime-agnostic (works on Bun/Node/Deno/Cloudflare), built on Web Standards (WinterCG), ultrafast, small bundle size, proven production usage, simpler than Elysia | High (95%) |
| **PostgreSQL** | 18.2 | Primary database | Industry-standard for multi-tenant SaaS, ACID compliance, robust backup/restore, handles concurrent writes, JSON support for flexible schemas, managed hosting available | High (95%) |
| **Drizzle ORM** | 0.45.1 | Database ORM | Code-first TypeScript (no generate step), lightweight (~7.4kb), SQL-like syntax, instant type updates, better for serverless than Prisma, v1.0 near release | High (85%) |
| **grammY** | 1.40.0 | Telegram Bot framework | Full Bot API coverage, TypeScript-native, works on Bun/Deno/Node, active maintenance, 100% type-safe, best-in-class DX | High (90%) |

### Frontend Technologies

| Technology | Version | Purpose | Why Recommended | Confidence |
|------------|---------|---------|-----------------|------------|
| **React** | 19.2.4 | UI framework | Industry standard, massive ecosystem, React 20 upcoming, excellent TypeScript support | High (95%) |
| **TypeScript** | 6.0 Beta | Type safety | Strict mode default, ESM default, React 20 support, improved inference, modern tooling | High (90%) |
| **Vite** | 7.3.1 | Build tool | 60% faster than webpack, native ESM, instant HMR, optimized for React/TS, regular releases | High (95%) |
| **Tailwind CSS** | 3.4+ | Styling | Utility-first, minimal bundle, plays well with shadcn/ui, production standard | High (95%) |
| **shadcn/ui** | Latest | Component library | Headless components, Tailwind-based, copy-paste architecture (not NPM dependency), accessible, modern admin templates available | High (85%) |

### Infrastructure & DevOps

| Technology | Version | Purpose | Why Recommended | Confidence |
|------------|---------|---------|-----------------|------------|
| **Hetzner Cloud API** | Latest | VPS provisioning | Cost-effective, cloud-init support, reliable EU infrastructure, instant provisioning, good API | High (90%) |
| **cloud-init** | Latest | Server initialization | Industry standard for VPS provisioning, YAML-based, user-data + vendor-data patterns, Ubuntu native | High (95%) |
| **systemd** | System default | Process management | Built into Ubuntu, service supervision, journal logging, auto-restart, boot integration | High (95%) |
| **Docker** | 27+ (optional) | Containerization | Dependency isolation, simplified deployment, optional for simpler setups where systemd suffices | Medium (70%) |
| **Ubuntu Server** | 24.04 LTS | Operating system | Long-term support (until 2029), cloud-init native, systemd standard, PostgreSQL/Docker support | High (95%) |

### Supporting Libraries

| Technology | Version | Purpose | Why Recommended | Confidence |
|------------|---------|---------|-----------------|------------|
| **Stripe SDK** | Latest (node) | Payment processing | Official SDK, webhook handling, subscription APIs, retry logic, TypeScript types | High (95%) |
| **oauth2-pkce** | Latest | OAuth 2.0 + PKCE | TypeScript-native, zero dependencies, implements RFC 7636, browser + server support | High (80%) |
| **OpenTelemetry** | Latest | Observability | Industry standard, systemd integration possible, vendor-agnostic telemetry | Medium (75%) |
| **Better Stack / Datadog** | SaaS | APM & Logging | Production-grade monitoring, log aggregation, uptime checks, incident management | Medium (70%) |
| **Zod** | Latest | Runtime validation | TypeScript-first schema validation, Drizzle integration, lightweight, excellent DX | High (90%) |
| **Redis** | 7+ (optional) | Session/cache | JWT blacklisting, session management, pub/sub for multi-instance coordination | Medium (70%) |

---

## Installation & Setup

### Control Plane (Main SaaS Application)

```bash
# Initialize Bun project
bun init

# Core dependencies
bun add hono
bun add drizzle-orm postgres
bun add stripe grammy
bun add oauth2-pkce
bun add zod

# Dev dependencies
bun add -d drizzle-kit typescript @types/node

# Frontend (separate or monorepo)
bun create vite@latest dashboard --template react-ts
cd dashboard
bun add @tanstack/react-query
bun add @tanstack/react-router
bun add tailwindcss autoprefixer postcss
bunx shadcn-ui@latest init
```

### Agent Instance (Deployed on Each VPS)

```bash
# Via cloud-init / deployment script
curl -fsSL https://bun.sh/install | bash
git clone https://github.com/your-org/rachel8.git
cd rachel8
bun install
bun run src/index.ts
```

### Database Setup

```bash
# PostgreSQL (managed hosting recommended)
# Neon.tech, Supabase, or self-hosted
createdb rachel_cloud

# Drizzle migrations
bun drizzle-kit generate
bun drizzle-kit migrate
```

---

## Detailed Architecture

### Control Plane Components

**Purpose:** SaaS dashboard, user management, billing, VPS provisioning orchestration

**Stack:**
- **Backend API:** Hono on Bun
- **Database:** PostgreSQL 18.2 with Drizzle ORM
- **Auth:** OAuth 2.0 + PKCE (Claude OAuth) with hybrid JWT + Redis session management
- **Billing:** Stripe Subscriptions API with webhook signature verification
- **Provisioning:** Hetzner Cloud API client with cloud-init templates
- **Frontend:** React 19 + TypeScript 6 + Vite 7 + shadcn/ui

**Key Patterns:**
1. **Hybrid Auth:** Short-lived JWTs (10-15 min) in HttpOnly cookies + refresh tokens in PostgreSQL
2. **Webhook Security:** Use `express.raw()` equivalent in Hono, verify Stripe signatures with 5-min tolerance
3. **VPS Lifecycle:** Track state machine (provisioning → active → suspended → terminated) in PostgreSQL
4. **Health Monitoring:** Poll VPS health endpoints, auto-recovery via Hetzner API restarts

### Agent Instance Components

**Purpose:** Single-tenant Rachel8 deployment running on dedicated Hetzner CX23 VPS

**Stack:**
- **Runtime:** Bun 1.3.9
- **Agent:** Rachel8 (Claude Agent SDK)
- **Bot Framework:** grammY 1.40.0
- **Process Manager:** systemd service
- **Local State:** SQLite (via Bun built-in client) or PostgreSQL for complex needs

**Deployment via cloud-init:**

```yaml
#cloud-config
packages:
  - git
  - curl

runcmd:
  - curl -fsSL https://bun.sh/install | bash
  - export BUN_INSTALL="/root/.bun"
  - export PATH="$BUN_INSTALL/bin:$PATH"
  - git clone https://github.com/your-org/rachel8.git /opt/rachel8
  - cd /opt/rachel8
  - bun install
  - echo "TELEGRAM_BOT_TOKEN=${bot_token}" > .env
  - echo "CLAUDE_API_KEY=${claude_key}" >> .env

write_files:
  - path: /etc/systemd/system/rachel8.service
    content: |
      [Unit]
      Description=Rachel8 AI Agent
      After=network.target

      [Service]
      Type=simple
      User=root
      WorkingDirectory=/opt/rachel8
      ExecStart=/root/.bun/bin/bun run src/index.ts
      Restart=always
      RestartSec=10
      Environment="NODE_ENV=production"

      [Install]
      WantedBy=multi-user.target

  - path: /opt/rachel8/health-check.sh
    permissions: '0755'
    content: |
      #!/bin/bash
      curl -f http://localhost:3000/health || exit 1

runcmd:
  - systemctl daemon-reload
  - systemctl enable rachel8
  - systemctl start rachel8
```

### Database Schema Strategy

**Multi-tenancy Model:**
- `users` table: Claude OAuth data, subscription status
- `vps_instances` table: Hetzner server IDs, IP addresses, status, health metrics
- `billing_events` table: Stripe webhook audit log
- `bot_configurations` table: Per-user Telegram bot tokens, settings

**Drizzle Schema Example:**

```typescript
import { pgTable, serial, text, timestamp, jsonb } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  claudeUserId: text('claude_user_id').unique().notNull(),
  email: text('email').notNull(),
  stripeCustomerId: text('stripe_customer_id'),
  subscriptionStatus: text('subscription_status'), // active, past_due, canceled
  createdAt: timestamp('created_at').defaultNow(),
});

export const vpsInstances = pgTable('vps_instances', {
  id: serial('id').primaryKey(),
  userId: serial('user_id').references(() => users.id),
  hetznerServerId: text('hetzner_server_id').unique(),
  ipAddress: text('ip_address'),
  status: text('status'), // provisioning, active, failed, terminated
  healthStatus: jsonb('health_status'),
  lastHealthCheck: timestamp('last_health_check'),
  createdAt: timestamp('created_at').defaultNow(),
});
```

---

## Alternatives Considered

### Runtime: Bun vs Node.js vs Deno

**Chosen: Bun 1.3.9**

**Why not Node.js?**
- 2-3x slower request handling
- No built-in database clients
- Heavier cold starts
- Still enterprise standard but Bun reached production parity in 2026

**Why not Deno?**
- Smaller ecosystem than Bun in 2026
- Bun has better npm compatibility
- Bun's build performance superior (60% faster on macOS)
- Less community momentum for backend frameworks

**Trade-offs:**
- Bun has longer cold starts than Node.js (disadvantage for serverless)
- Some native modules still fail in Bun
- Enterprise adoption lower than Node.js (risk mitigation: tested internally first)

**Verdict:** Bun's performance gains justify the risk for a greenfield project. For conservative choice, use Node.js 22 LTS.

---

### Framework: Hono vs Elysia vs Express

**Chosen: Hono 4.11.9**

**Why not Elysia?**
- Bun-specific (locks you in)
- Less mature than Hono
- Hono works on Node/Deno/Cloudflare Workers (escape hatch if Bun fails)

**Why not Express?**
- Legacy API design (callback-based)
- Slower than modern alternatives
- No native TypeScript support

**Why not Fastify?**
- Good choice but Hono is faster and simpler
- Hono's Web Standards approach is more future-proof

**Verdict:** Hono provides the best balance of performance, simplicity, and runtime flexibility.

---

### ORM: Drizzle vs Prisma

**Chosen: Drizzle ORM 0.45.1**

**Why not Prisma 7?**
- Requires separate schema language (PSL) + generate step
- Heavier runtime footprint
- Slower type-checking updates (vs Drizzle's instant feedback)
- Better abstraction but less SQL transparency

**When to use Prisma instead:**
- Team prefers schema-first design
- Need Prisma's mature migration tooling
- Want maximum abstraction from SQL

**Verdict:** Drizzle's code-first approach and lightweight footprint align better with Bun's philosophy.

---

### Database: PostgreSQL vs SQLite

**Chosen: PostgreSQL 18.2**

**Why not SQLite?**
- Single-process write lock (poor concurrency)
- No user/permission management
- Harder to backup/replicate
- Good for agent instances, wrong for multi-tenant control plane

**When to use SQLite instead:**
- Single-tenant local agent storage (Rachel8 on each VPS)
- Embedded use cases
- Simplified deployment

**Verdict:** PostgreSQL required for SaaS control plane. Consider SQLite for per-VPS agent state.

---

### Frontend: React vs Next.js vs SvelteKit

**Chosen: React 19.2.4 + Vite 7.3.1**

**Why not Next.js?**
- Overkill for a dashboard (SSR not needed)
- Adds complexity (server components, routing conventions)
- React + Vite gives more control and faster builds

**Why not SvelteKit or Solid.js?**
- Smaller talent pool
- Less mature component ecosystems
- React's shadcn/ui templates are superior

**Verdict:** Plain React + Vite is simpler and faster for a dashboard SPA.

---

### Monitoring: OpenTelemetry vs Better Stack vs Datadog

**Chosen: Better Stack (recommended) or Datadog**

**Why not self-hosted Prometheus + Grafana?**
- High operational overhead
- Team must maintain monitoring infra
- Better to outsource for MVP

**Why Better Stack over Datadog?**
- Lower cost for startups
- Built-in incident management
- Simpler setup
- Datadog better for large enterprises

**OpenTelemetry:**
- Use as instrumentation layer regardless of backend
- Future-proof vendor switching

**Verdict:** Better Stack for MVP, migrate to Datadog if scaling significantly.

---

## What NOT to Use

### Runtime & Frameworks

**❌ Node.js with CommonJS**
- Use ESM (ES Modules) exclusively in 2026
- TypeScript 6.0 defaults to ESM
- Bun/Deno are ESM-first

**❌ Express.js for new projects**
- Legacy callback-based API
- Poor TypeScript support without extensive setup
- Slower than modern alternatives
- Use Hono, Fastify, or Elysia instead

**❌ Create React App (CRA)**
- Officially deprecated in 2023
- Use Vite instead (60% faster builds, better DX)

**❌ Webpack**
- Slower than Vite, esbuild, or Bun's bundler
- Complex configuration
- Use Vite for frontend, Bun for backend builds

### Databases & ORMs

**❌ TypeORM**
- Buggy, inconsistent API
- Drizzle and Prisma are superior
- Maintenance concerns

**❌ Sequelize**
- Poor TypeScript support
- Active Record pattern adds overhead
- Use Drizzle or Prisma

**❌ MongoDB for this use case**
- Relational data (users, billing, VPS instances) fits PostgreSQL better
- ACID guarantees needed for billing
- PostgreSQL has JSON support for flexible fields

### Authentication

**❌ Storing passwords locally**
- Delegate to Claude OAuth 2.0
- No need for password hashing, reset flows, etc.

**❌ Long-lived JWTs without refresh tokens**
- Security risk (cannot revoke)
- Use hybrid model: short JWTs + refresh tokens in DB/Redis

**❌ client-side JWT storage in localStorage**
- XSS vulnerability
- Use HttpOnly cookies instead

### Infrastructure

**❌ Heroku**
- Expensive at scale
- Less control than VPS
- Hetzner + cloud-init is 5-10x cheaper

**❌ Kubernetes for MVP**
- Massive operational overhead
- systemd + Docker is sufficient for <1000 VPS instances
- Consider Kubernetes only at 10K+ scale

**❌ Serverless (AWS Lambda, Vercel Functions) for agent instances**
- Bun has poor cold start performance
- Long-running Telegram bots need persistent processes
- VPS model is correct here

### Telegram Bot Libraries

**❌ node-telegram-bot-api**
- Outdated API design
- Poor TypeScript support
- Use grammY instead

**❌ Telegraf**
- Less active than grammY
- grammY has better types and DX

---

## Risk Mitigation

### Bun Production Readiness

**Risk:** Bun is newer than Node.js, some edge cases may exist

**Mitigation:**
1. **Test rigorously in staging** with production-like workloads
2. **Monitor error rates** closely in first month
3. **Keep Node.js fallback option** (Hono works on Node.js)
4. **Join Bun Discord** for community support
5. **Budget 10% extra time** for Bun-specific debugging

**Confidence Assessment:** Bun v1.3 (2026) is production-ready for most use cases based on community reports. Enterprises still testing but not yet widespread. For risk-averse teams, start with Node.js 22 LTS.

---

### Drizzle ORM Maturity

**Risk:** Drizzle still pre-v1.0 (currently 0.45.1, v1.0 in beta)

**Mitigation:**
1. **v1.0 release imminent** (beta 2 already shipped)
2. **Active development** and community support
3. **Escape hatch:** Drizzle generates raw SQL, can drop to SQL if needed
4. **Migration tooling** (drizzle-kit) is stable

**Confidence Assessment:** Safe to use. API is stable, migration path to v1.0 will be smooth.

---

### Hetzner Vendor Lock-in

**Risk:** Provisioning logic ties you to Hetzner Cloud API

**Mitigation:**
1. **Abstract provisioning layer** behind interface
2. **cloud-init is portable** (works on AWS, DigitalOcean, etc.)
3. **Hetzner's API is simple** - easy to replicate for other providers
4. **No proprietary tech** used (just standard Ubuntu + systemd)

**Confidence Assessment:** Low lock-in risk. Migration to DigitalOcean/Vultr would take 1-2 weeks.

---

## Version Verification Summary

All versions verified via web search on 2026-02-14:

| Technology | Recommended Version | Last Updated | Source |
|------------|-------------------|--------------|---------|
| Bun | 1.3.9 | Feb 7, 2026 | [InfoQ](https://www.infoq.com/news/2026/01/bun-v3-1-release/) |
| Hono | 4.11.9 | 5 days ago | [npm](https://www.npmjs.com/package/hono) |
| PostgreSQL | 18.2 | Feb 12, 2026 | [PostgreSQL.org](https://www.postgresql.org/) |
| Drizzle ORM | 0.45.1 | 2 months ago | [npm](https://www.npmjs.com/package/drizzle-orm) |
| React | 19.2.4 | 17 days ago | [npm](https://www.npmjs.com/package/react) |
| TypeScript | 6.0 Beta | Feb 2026 | [Medium](https://medium.com/@onix_react/announcing-typescript-6-0-beta-38fe5b94b02b) |
| Vite | 7.3.1 | 1 month ago | [npm](https://www.npmjs.com/package/vite) |
| grammY | 1.40.0 | Recent | [npm](https://www.npmjs.com/package/grammy) |

---

## Implementation Roadmap

### Phase 1: MVP Control Plane (Weeks 1-4)

1. **Week 1:** Bun + Hono API skeleton, PostgreSQL + Drizzle schema, basic auth
2. **Week 2:** Stripe subscription integration, webhook handling
3. **Week 3:** Hetzner Cloud API integration, cloud-init templates
4. **Week 4:** React dashboard, user signup flow, VPS provisioning UI

### Phase 2: Agent Deployment (Weeks 5-6)

1. **Week 5:** cloud-init script refinement, systemd service setup, health checks
2. **Week 6:** Telegram bot configuration UI, grammY integration testing

### Phase 3: Monitoring & Operations (Weeks 7-8)

1. **Week 7:** Better Stack integration, systemd monitoring, alerting
2. **Week 8:** Auto-recovery logic, backup/restore, load testing

### Phase 4: Production Hardening (Weeks 9-12)

1. **Week 9:** Security audit, rate limiting, DDoS protection
2. **Week 10:** Performance optimization, caching strategy
3. **Week 11:** Documentation, runbooks, incident response
4. **Week 12:** Beta launch, monitoring, iteration

---

## Sources

### General Managed Hosting & VPS
- [Managed VPS Hosting: 7 Unbeatable Advantages for AI and Automation in 2026 - TezHost](https://tezhost.com/managed-vps-hosting-7-advantages-for-ai-and-automation/)
- [Best VPS Hosting & Managed VPS Services 2026 | InMotion Hosting](https://www.inmotionhosting.com/vps-hosting)

### Hetzner Cloud
- [Hetzner API overview](https://docs.hetzner.cloud/)
- [GitHub - vitobotta/hetzner-cloud-init](https://github.com/vitobotta/hetzner-cloud-init)
- [Hetzner Cloud API](https://docs.hetzner.cloud/reference/cloud)

### Bun Runtime
- [Bun Introduces Built-in Database Clients and Zero-Config Frontend Development - InfoQ](https://www.infoq.com/news/2026/01/bun-v3-1-release/)
- [Node vs Bun vs Deno: What Actually Runs in Production (2026 Guide) | JavaScript in Plain English](https://javascript.plainenglish.io/node-vs-bun-vs-deno-what-actually-runs-in-production-2026-guide-a3552c18ce91)
- [Why Choose Bun Over Node.js, Deno, and Other JavaScript Runtimes in Late 2026? | Medium](https://lalatenduswain.medium.com/why-choose-bun-over-node-js-deno-and-other-javascript-runtimes-in-late-2026-121f25f208eb)

### Web Frameworks
- [Elysia - Ergonomic Framework for Humans | ElysiaJS](https://elysiajs.com)
- [Hono - Web framework built on Web Standards](https://hono.dev/)
- [How Hono and Elysia Are Challenging Express and Fastify | Adyog Blog](https://blog.adyog.com/how-hono-and-elysia-are-challenging-express-and-fastify/)

### Databases & ORMs
- [PostgreSQL vs SQLite | Which Relational Databases Wins In 2026?](https://www.selecthub.com/relational-database-solutions/postgresql-vs-sqlite/)
- [Drizzle vs Prisma ORM in 2026: A Practical Comparison for TypeScript Developers](https://makerkit.dev/blog/tutorials/drizzle-vs-prisma)
- [Prisma vs Drizzle ORM in 2026 — What You Really Need to Know | Medium](https://medium.com/@thebelcoder/prisma-vs-drizzle-orm-in-2026-what-you-really-need-to-know-9598cf4eaa7c)
- [PostgreSQL: PostgreSQL 18.1, 17.7, 16.11, 15.15, 14.20, and 13.23 Released!](https://www.postgresql.org/about/news/postgresql-181-177-1611-1515-1420-and-1323-released-3171/)

### Frontend Stack
- [Announcing TypeScript 6.0 Beta | Medium](https://medium.com/@onix_react/announcing-typescript-6-0-beta-38fe5b94b02b)
- [Vite | Next Generation Frontend Tooling](https://vite.dev/)
- [11+ Best Open Source Shadcn Dashboard Templates for 2026](https://tailwind-admin.com/blogs/free-shadcn-dashboard-templates)
- [Free Shadcn Dashboard built with React and Tailwind - Tailwindadmin](https://tailwind-admin.com/)

### Authentication & Security
- [OAuth 2.0 PKCE implementation libraries 2026 JavaScript](https://oauth.net/code/javascript/)
- [GitHub - Archelyst/oauth2-pkce](https://github.com/Archelyst/oauth2-pkce)
- [JWTs vs. sessions: which authentication approach is right for you?](https://stytch.com/blog/jwts-vs-sessions-which-is-right-for-you/)
- [Using JWTs for Sessions? Avoid These Mistakes | SuperTokens](https://supertokens.com/blog/are-you-using-jwts-for-user-sessions-in-the-correct-way)

### Stripe Integration
- [Build a subscriptions integration | Stripe Documentation](https://docs.stripe.com/billing/subscriptions/build-subscriptions)
- [How subscriptions work | Stripe Documentation](https://docs.stripe.com/billing/subscriptions/overview)
- [Set up and deploy a webhook | Stripe Documentation](https://docs.stripe.com/webhooks/quickstart?lang=node)
- [Resolve webhook signature verification errors | Stripe Documentation](https://docs.stripe.com/webhooks/signature)

### Telegram Bot Development
- [GitHub - grammyjs/grammY: The Telegram Bot Framework](https://github.com/grammyjs/grammY)
- [grammY](https://grammy.dev/)
- [The Simplest Way to Deploy a Telegram Bot in 2026 | Kuberns Blog](https://kuberns.com/blogs/post/deploy-telegram-bot/)
- [What are the Best Practices for Building Secure Telegram Bots?](https://alexhost.com/faq/what-are-the-best-practices-for-building-secure-telegram-bots/)

### Monitoring & Operations
- [Best Node.js Application Monitoring Tools in 2026 | Better Stack Community](https://betterstack.com/community/comparisons/nodejs-application-monitoring-tools/)
- [Systemd: The Complete Guide for 2026 | DevToolbox Blog](https://devtoolbox.dedyn.io/blog/systemd-complete-guide)
- [How to Collect SystemD Service Status with the OpenTelemetry Collector](https://oneuptime.com/blog/post/2026-02-06-collect-systemd-service-status-opentelemetry-collector/view)

### Infrastructure & Deployment
- [9 Best Docker VPS Hosting Services (Feb 2026)](https://hostadvice.com/docker-hosting/docker-vps-hosting/)
- [cloud-init - The standard for customising cloud instances](https://cloud-init.io/)
- [Cloud-init on Ubuntu: A Comprehensive Guide — linuxvox.com](https://linuxvox.com/blog/cloud-init-ubuntu/)
- [How To Use Cloud-Config For Your Initial Server Setup | DigitalOcean](https://www.digitalocean.com/community/tutorials/how-to-use-cloud-config-for-your-initial-server-setup)

### Session Management
- [Securing Node.js Applications with JWT, Refresh Tokens, and Redis | Medium](https://medium.com/@choubeyayush4/securing-node-js-applications-with-jwt-refresh-tokens-and-redis-80ffbb54285a)
- [How to Implement Token Storage with Redis](https://oneuptime.com/blog/post/2026-01-21-redis-token-storage/view)

---

## Final Recommendations

### For Conservative Teams (Lower Risk)

Replace these components with battle-tested alternatives:

- **Bun → Node.js 22 LTS** (stable, enterprise-proven)
- **Hono → Fastify** (mature Node.js ecosystem)
- **Drizzle → Prisma 7** (better tooling, larger community)

This conservative stack sacrifices 30-40% performance for maximum stability.

### For Aggressive Teams (Higher Performance)

Go all-in on bleeding edge:

- **Bun 1.3.9** as recommended
- **Elysia instead of Hono** (Bun-specific optimizations)
- **Drizzle ORM** as recommended
- **Bun's built-in SQLite** for agent instances (skip external DB)

This aggressive stack maximizes performance but requires careful testing.

---

## Confidence Assessment

- **Backend Stack (Bun/Hono/PostgreSQL/Drizzle):** 85% confidence - production-ready with proper testing
- **Frontend Stack (React/Vite/shadcn):** 95% confidence - industry standard, proven
- **Infrastructure (Hetzner/cloud-init/systemd):** 90% confidence - battle-tested patterns
- **Telegram Integration (grammY):** 90% confidence - best library for TypeScript bots
- **Overall Recommendation:** 90% confidence for greenfield project with risk mitigation steps

---

**Last Updated:** 2026-02-14
**Next Review:** Q2 2026 (after Drizzle v1.0 release, TypeScript 6.0 stable, React 20 launch)
