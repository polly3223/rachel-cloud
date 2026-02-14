# Architecture Research
**Domain:** Managed AI agent hosting
**Researched:** 2026-02-14
**Confidence:** High

## Standard Architecture (system overview diagram)

```
┌─────────────────────────────────────────────────────────────────────┐
│                         CONTROL PLANE                                │
│  ┌────────────────┐  ┌──────────────┐  ┌─────────────────────────┐ │
│  │  Web Dashboard │  │  API Gateway │  │  Auth Service           │ │
│  │  (Frontend)    │──│  (REST API)  │──│  (OAuth 2.0 + PKCE)     │ │
│  └────────────────┘  └──────────────┘  └─────────────────────────┘ │
│                             │                                        │
│  ┌──────────────────────────┼──────────────────────────────────┐   │
│  │     ORCHESTRATION LAYER  │                                  │   │
│  │  ┌───────────────────────▼──────┐  ┌───────────────────┐   │   │
│  │  │  Provisioning Engine         │  │  Health Monitor   │   │   │
│  │  │  - Hetzner API Integration   │  │  - Heartbeat      │   │   │
│  │  │  - Cloud-init templating     │  │  - Auto-recovery  │   │   │
│  │  │  - Deployment orchestration  │  │  - Log aggregation│   │   │
│  │  └──────────────────────────────┘  └───────────────────┘   │   │
│  │                                                              │   │
│  │  ┌──────────────────┐  ┌────────────────┐  ┌────────────┐  │   │
│  │  │  Billing Service │  │  State Manager │  │  Metrics   │  │   │
│  │  │  (Stripe)        │  │  (VPS metadata)│  │  Collector │  │   │
│  │  └──────────────────┘  └────────────────┘  └────────────┘  │   │
│  └──────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                    ┌─────────────┼────────────┐
                    │    HETZNER CLOUD API     │
                    └─────────────┬────────────┘
                                  │
┌─────────────────────────────────▼─────────────────────────────────┐
│                         DATA PLANE                                 │
│  ┌─────────────────────┐  ┌─────────────────────┐               │
│  │  User VPS Instance  │  │  User VPS Instance  │  ...          │
│  │  ─────────────────  │  │  ─────────────────  │               │
│  │  - Rachel8 Agent    │  │  - Rachel8 Agent    │               │
│  │  - Telegram Bot     │  │  - Telegram Bot     │               │
│  │  - Health endpoint  │  │  - Health endpoint  │               │
│  │  - Log shipper      │  │  - Log shipper      │               │
│  └─────────────────────┘  └─────────────────────┘               │
│           │                         │                             │
│           └─────────┬───────────────┘                             │
│                     │                                              │
│              ┌──────▼──────┐                                       │
│              │   Telegram  │                                       │
│              │   Bot API   │                                       │
│              └─────────────┘                                       │
└───────────────────────────────────────────────────────────────────┘
```

## Component Responsibilities

| Component | Responsibilities | Technology Choices | Build Order |
|-----------|-----------------|-------------------|-------------|
| **Web Dashboard** | User interface for signup, status viewing, server management, settings | Next.js/React, TailwindCSS | Phase 2 |
| **API Gateway** | Single entry point for all API calls, request routing, rate limiting, request validation | Express/Fastify (Bun), OpenAPI spec | Phase 1 |
| **Auth Service** | OAuth 2.0 + PKCE flow with Claude, session management, token validation | Lucia/Arctic, JWT | Phase 1 |
| **Billing Service** | Stripe integration, subscription lifecycle, payment webhooks, usage tracking | Stripe SDK, webhook handlers | Phase 2 |
| **Provisioning Engine** | Core orchestrator: create/destroy VPS via Hetzner API, cloud-init template generation, deployment automation | Hetzner Cloud API client, cloud-init YAML templating | Phase 1 (MVP) |
| **State Manager** | Track VPS metadata (IP, status, user mapping), deployment state machine, configuration storage | PostgreSQL/SQLite, Drizzle ORM | Phase 1 |
| **Health Monitor** | Poll VPS health endpoints, detect failures, trigger auto-recovery workflows, log aggregation | Scheduled jobs (cron/BullMQ), retry logic | Phase 2 |
| **Metrics Collector** | Resource usage tracking, performance metrics, billing data aggregation | Prometheus/custom time-series | Phase 3 |
| **VPS Instance** | Isolated runtime environment per user: Rachel8 agent + Telegram bot, health check endpoint, log shipping | Ubuntu 24.04, systemd, Bun | Phase 1 (cloud-init) |

## Recommended Project Structure

Based on Internal Developer Platform (IDP) patterns and modern monorepo practices:

```
rachel-cloud/
├── apps/
│   ├── control-plane/          # Main backend API (Bun + Hono/Elysia)
│   │   ├── src/
│   │   │   ├── routes/         # API endpoints
│   │   │   ├── services/       # Business logic layer
│   │   │   │   ├── provisioning/   # Hetzner VPS orchestration
│   │   │   │   ├── auth/          # OAuth 2.0 + PKCE
│   │   │   │   ├── billing/       # Stripe integration
│   │   │   │   └── monitoring/    # Health checks
│   │   │   ├── db/             # Database schema + migrations
│   │   │   ├── workers/        # Background jobs (health monitoring)
│   │   │   └── config/         # Environment config
│   │   └── package.json
│   │
│   └── dashboard/              # Web frontend (Next.js)
│       ├── app/                # App router pages
│       ├── components/         # React components
│       └── lib/                # Client utilities
│
├── packages/
│   ├── shared/                 # Shared types, constants
│   └── templates/              # Cloud-init templates
│
├── infra/                      # Infrastructure as Code (optional)
│   └── deployment/             # Platform deployment configs
│
└── docs/
    └── architecture/
```

## Architectural Patterns

### 1. Control Plane / Data Plane Separation
**Pattern:** Decouple management infrastructure from user workloads
- **Control Plane:** Hosts management services (API, dashboard, orchestration)
- **Data Plane:** Individual VPS instances running Rachel8 agents
- **Benefit:** Independent scaling, security isolation, easier maintenance
- **Implementation:** Control plane can be single VPS initially, scale to multi-node cluster later

### 2. Single-Tenant Isolation (Database-per-Instance Model)
**Pattern:** Each user gets dedicated VPS (strongest isolation)
- **Rachel Cloud Strategy:** One CX23 VPS per user
- **Benefit:** No noisy neighbor issues, complete resource guarantees, simplified security model
- **Trade-off:** Higher cost per user vs. multi-tenant containerization, but acceptable at $20/month price point

### 3. Declarative Infrastructure as Code
**Pattern:** Define desired state via cloud-init templates
- **Implementation:** Generate cloud-init YAML with user-specific config (Telegram token, API keys)
- **Benefit:** Reproducible deployments, version-controlled configurations, easy rollbacks
- **Tool Choice:** Cloud-init (industry standard for VPS initialization)

### 4. Health Endpoint Monitoring + Circuit Breaker
**Pattern:** Proactive health checks with automated recovery
- **Implementation:**
  - Each VPS exposes `/health` endpoint (liveness + readiness)
  - Control plane polls every 60 seconds
  - Circuit states: Healthy → Degraded → Failed → Recovering
  - Auto-recovery: Attempt restart (systemd) → Recreate VPS if persistent failure
- **Benefit:** Self-healing infrastructure, reduced MTTR (Mean Time to Resolution)

### 5. API Gateway as Orchestration Layer
**Pattern:** Centralized routing, auth, and rate limiting
- **Responsibilities:**
  - Route dashboard → control plane services
  - Validate JWT tokens from auth service
  - Apply Hetzner API rate limits (3600 req/hr) with queuing
  - Aggregate multi-service responses
- **Benefit:** Single entry point, simplified client logic, centralized policy enforcement

### 6. Event-Driven Provisioning Workflow
**Pattern:** Asynchronous state machine for VPS lifecycle
- **Workflow:**
  ```
  User Subscribe → Stripe Payment Success (webhook) →
  Queue Provisioning Job → Create VPS (Hetzner API) →
  Poll for IP assignment → Generate cloud-init →
  Inject user config → Monitor deployment →
  Mark Active in DB → Notify user
  ```
- **Implementation:** BullMQ or similar job queue with retry logic
- **Benefit:** Handles failures gracefully, provides status updates, non-blocking user experience

### 7. Immutable Infrastructure
**Pattern:** Replace rather than update VPS instances
- **Strategy:** Version cloud-init templates, deploy new VPS for major updates
- **Benefit:** Eliminates configuration drift, easy rollbacks, predictable state

## Data Flow

### 1. User Signup & Provisioning Flow
```
User → Dashboard → API Gateway → Auth Service (OAuth) →
→ Billing Service (Stripe) → Provisioning Engine →
→ Hetzner API (create VPS) → State Manager (record metadata) →
→ Health Monitor (verify deployment) → User (notify success)
```

### 2. VPS Health Monitoring Flow
```
Health Monitor (control plane) → VPS /health endpoint →
→ Response analysis → State Manager (update status) →
→ [If unhealthy] → Auto-recovery trigger →
→ Restart attempt (SSH systemd) OR VPS recreation
```

### 3. User Interaction Flow (Telegram)
```
Telegram User → Telegram Bot API → Rachel8 Agent (on VPS) →
→ Claude Agent SDK → Anthropic API →
→ Response → Telegram Bot API → User
```
*Note: This flow bypasses control plane entirely (data plane autonomy)*

### 4. Log & Metrics Aggregation Flow
```
VPS (systemd journal) → Log shipper → Control Plane Metrics Collector →
→ Time-series DB → Dashboard API → User view
```

## Scaling Considerations

### Immediate (0-100 users)
- **Control Plane:** Single VPS (Hetzner CX41: 4 vCPU, 8GB RAM)
- **Database:** PostgreSQL on same VPS (SQLite acceptable for MVP)
- **Hetzner API:** 3600 req/hr limit = ~1 req/sec (sufficient for 100 VPS lifecycle ops)

### Short-term (100-500 users)
- **Control Plane:** Separate API, DB, worker nodes (3 VPS)
- **Database:** Managed PostgreSQL (Hetzner or external)
- **Health Monitoring:** Dedicated worker pool (avoid overwhelming single poller)
- **Rate Limiting:** Implement queue for Hetzner API calls

### Long-term (500+ users)
- **Multi-region:** Deploy control planes in EU + US regions
- **Load Balancing:** Multiple API gateway instances behind Hetzner Load Balancer
- **Observability:** Migrate to Prometheus + Grafana for metrics, Loki for logs
- **Cost Optimization:** Negotiate bulk pricing with Hetzner, implement spot/reserved instances

### Cost Projection
- Per user: €3.49/mo (VPS) + ~€0.50/mo (control plane overhead) = €3.99/mo cost
- Revenue: $20/mo = ~€18.50/mo (assuming 1.08 EUR/USD)
- Gross margin: ~78% (before Stripe fees, Anthropic API costs)

## Anti-Patterns to Avoid

### 1. Shared VPS Multi-Tenancy
**Why avoid:** Rachel8 runs arbitrary Claude Agent SDK code, potential security risks
**Correct approach:** Dedicated VPS per user (current plan)

### 2. Synchronous Provisioning in API Request
**Why avoid:** VPS creation takes 30-120 seconds, blocks HTTP request, poor UX
**Correct approach:** Async job queue with webhooks/polling for status

### 3. Storing Secrets in State Manager
**Why avoid:** User Telegram bot tokens, Anthropic API keys are sensitive
**Correct approach:** Inject via cloud-init, store only on VPS filesystem (encrypted at rest)

### 4. Manual Health Checks
**Why avoid:** Doesn't scale, slow incident detection
**Correct approach:** Automated polling + alerting + auto-recovery

### 5. Tight Coupling Between Services
**Why avoid:** Hard to test, deploy, and scale independently
**Correct approach:** API contracts, event-driven communication, service boundaries

### 6. Ignoring Hetzner Rate Limits
**Why avoid:** 3600 req/hr hard limit → API failures during bulk operations
**Correct approach:** Request queue with rate limiting, retry with exponential backoff

### 7. Stateful Control Plane Without HA
**Why avoid:** Single point of failure for all user management
**Correct approach:** At minimum, daily DB backups + documented recovery procedure (Phase 1), move to HA later

## Integration Points

### External Services
1. **Hetzner Cloud API**
   - Authentication: Bearer token (env var)
   - Rate limit: 3600 req/hr
   - Key operations: Create/delete server, list servers, get server details
   - Error handling: Retry 429 (rate limit), exponential backoff for 5xx

2. **Anthropic Claude API (OAuth)**
   - Grant type: Authorization Code with PKCE
   - Scopes: TBD (user identity, potentially usage quotas)
   - Token storage: Encrypted in State Manager, refreshed via refresh token

3. **Stripe**
   - Integration: Checkout Sessions for signup, Customer Portal for management
   - Webhooks: `checkout.session.completed`, `customer.subscription.deleted`
   - Idempotency: Use Stripe idempotency keys for all POST requests

4. **Telegram Bot API**
   - User-managed: Each user creates their own bot via BotFather
   - Token injection: Via cloud-init to VPS environment
   - No direct integration needed in control plane

### Internal Service Contracts
1. **Provisioning Engine → State Manager**
   - API: `createVPS(userId, config)`, `updateVPSStatus(vpsId, status)`
   - Events: `vps.created`, `vps.failed`, `vps.deleted`

2. **Health Monitor → Provisioning Engine**
   - API: `triggerRecovery(vpsId, issue)`
   - Recovery actions: `restart`, `recreate`, `alert_admin`

3. **API Gateway → All Services**
   - Authentication: JWT validation (via Auth Service)
   - Error format: Standard JSON schema `{error, message, code}`

## Build Order Implications

### Phase 1: Core Provisioning (MVP)
**Goal:** Prove VPS provisioning + Rachel8 deployment works end-to-end
**Components:**
1. Minimal API Gateway (auth bypass with API key for testing)
2. Provisioning Engine (Hetzner API integration)
3. State Manager (SQLite, basic schema)
4. Cloud-init template for Rachel8 deployment
5. Manual testing via CLI/Postman

**Validation:** Can create VPS, deploy Rachel8, connect via Telegram

### Phase 2: User-Facing Platform
**Goal:** Public launch with signup, billing, dashboard
**Components:**
1. Auth Service (Claude OAuth 2.0 + PKCE)
2. Billing Service (Stripe integration)
3. Web Dashboard (read-only status, logs)
4. Health Monitor (basic polling, manual recovery)
5. API Gateway (full JWT validation)

**Validation:** Users can self-service signup and deploy

### Phase 3: Production Hardening
**Goal:** Reliability, observability, auto-recovery
**Components:**
1. Auto-recovery workflows
2. Log aggregation pipeline
3. Metrics collector + dashboards
4. Database backups + disaster recovery
5. Rate limiting + request queuing

**Validation:** 99% uptime, <5min MTTR for VPS failures

### Phase 4: Scale & Optimize
**Goal:** Support 500+ users, reduce costs
**Components:**
1. Multi-region deployment
2. Load balancing
3. Advanced monitoring (Prometheus/Grafana)
4. Cost optimization (reserved instances, spot pricing)

## Sources

- [Railway vs. DigitalOcean App Platform | Railway Docs](https://docs.railway.com/platform/compare-to-digitalocean)
- [6 best Railway alternatives in 2026 | Northflank Blog](https://northflank.com/blog/railway-alternatives)
- [Railway vs Render (2026) | Northflank Blog](https://northflank.com/blog/railway-vs-render)
- [Anypoint Platform Hosting Overview | MuleSoft Documentation](https://docs.mulesoft.com/hosting-home/)
- [High-level architecture - Azure Databricks | Microsoft Learn](https://learn.microsoft.com/en-us/azure/databricks/getting-started/high-level-architecture)
- [What are hosted control planes? | Red Hat](https://www.redhat.com/en/topics/containers/what-are-hosted-control-planes)
- [Control and data plane pattern - Cloudflare Reference Architecture](https://developers.cloudflare.com/reference-architecture/diagrams/storage/durable-object-control-data-plane-pattern/)
- [VPS Provisioning Guide | GreenCloud VPS Blog](https://blog.greencloudvps.com/vps-provisioning-a-complete-guide-to-fast-scalable-virtual-server-deployment.php)
- [Cloud-Init Configuration Guide | RamNode](https://ramnode.com/guides/cloud-init)
- [Proxmox Cloud-Init Made Easy | Virtualization Howto](https://www.virtualizationhowto.com/2025/10/proxmox-cloud-init-made-easy-automating-vm-provisioning-like-the-cloud/)
- [Tutorial - Customize Linux VM with cloud-init | Microsoft Learn](https://learn.microsoft.com/en-us/azure/virtual-machines/linux/tutorial-automate-vm-deployment)
- [What is multi-tenant architecture? | Future Processing (2026)](https://www.future-processing.com/blog/multi-tenant-architecture/)
- [Multi-Tenant Performance Crisis | AddWeb Solution (2026)](https://www.addwebsolution.com/blog/multi-tenant-performance-crisis-advanced-isolation-2026)
- [Designing Multi-tenant SaaS on AWS | ClickIT (2026)](https://www.clickittech.com/software-development/multi-tenant-architecture/)
- [SaaS Multitenancy Best Practices | Frontegg](https://frontegg.com/blog/saas-multitenancy)
- [Platform Engineering in 2026 | Growin](https://www.growin.com/blog/platform-engineering-2026/)
- [10 Platform engineering predictions for 2026 | Platform Engineering](https://platformengineering.org/blog/10-platform-engineering-predictions-for-2026)
- [Platform Engineering: Building IDPs | Dasroot](https://dasroot.net/posts/2026/01/platform-engineering-building-internal-developer-platforms/)
- [AI Merging With Platform Engineering | The New Stack](https://thenewstack.io/in-2026-ai-is-merging-with-platform-engineering-are-you-ready/)
- [API Gateway Pattern | Microservices.io](https://microservices.io/patterns/apigateway.html)
- [API gateway framework: 2026 guide | DigitalAPI.ai](https://www.digitalapi.ai/blogs/api-gateway-framework-the-complete-2026-guide-for-modern-microservices)
- [API Gateway Deep Dive | Medium](https://medium.com/@rainagesh78/api-gateway-deep-dive-architecture-patterns-and-real-world-design-insights-52bd9d7144ff)
- [Top 10 API Gateway Platforms 2026 | DigitalAPI.ai](https://www.digitalapi.ai/blogs/best-api-gateway)
- [Health Monitoring Pattern | Distributed Application Architecture](https://jurf.github.io/daap/resilience-and-reliability-patterns/health-monitoring/)
- [Health Endpoint Monitoring | Microsoft Architecture Center](https://github.com/MicrosoftDocs/architecture-center/blob/main/docs/patterns/health-endpoint-monitoring-content.md)
- [Cloud Native Architecture Patterns (2026) | ClearFuze](https://clearfuze.com/blog/cloud-native-architecture-patterns/)
- [Autonomous Enterprise Platform Control | CNCF (2026)](https://www.cncf.io/blog/2026/01/23/the-autonomous-enterprise-and-the-four-pillars-of-platform-control-2026-forecast/)
- [Cloud-Native Architecture in 2026 | TheLinuxCode](https://thelinuxcode.com/cloudnative-architecture-in-2026-patterns-tradeoffs-and-practical-builds/)
