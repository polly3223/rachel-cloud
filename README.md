# Rachel Cloud

Managed hosting platform for [Rachel](https://github.com/polly3223/Rachel8) — your personal AI assistant, deployed and running in minutes.

Rachel is an open-source AI agent (Claude Code + Telegram) that lives on a server and does real work: runs commands, manages files, browses the web, schedules tasks, and remembers everything. **Rachel Cloud** is the managed version — we handle the infrastructure so you don't have to.

## How It Works

1. User signs up and connects their Telegram
2. User provides their Anthropic API key (Claude Code)
3. We spin up a dedicated Hetzner VPS (CX23 — 2 vCPU, 4GB RAM, €3.49/mo)
4. Rachel is auto-deployed via cloud-init with the user's config
5. User talks to their personal Rachel via Telegram — it's their own server, their own agent

```
User (Telegram) → Rachel Bot → Claude Code (user's API key) → Tools (bash, files, web, etc.)
                                       ↓
                              Hetzner VPS (dedicated per user)
                              - Full server access
                              - Persistent memory
                              - Scheduled tasks
                              - File storage (syncthing optional)
```

## Architecture

### Core Services

| Service | Purpose | Tech |
|---------|---------|------|
| **Web App** | Dashboard, onboarding, billing | Next.js, Hono API |
| **Provisioner** | Spins up/down Hetzner VPS instances | Hetzner Cloud API, cloud-init |
| **Billing** | Subscription management | Stripe |
| **Orchestrator** | Health checks, auto-recovery, usage monitoring | Cron + Hetzner API |

### Infrastructure Per User

Each user gets a dedicated Hetzner CX23 (€3.49/mo):
- Ubuntu 24.04
- Bun runtime
- Rachel8 (auto-deployed from latest release)
- Telegram bot (user's own bot token OR shared bot with per-user routing)
- Claude Code agent (user's Anthropic API key)
- SQLite task scheduler
- Persistent memory system

### User Onboarding Flow

```
1. Sign up (email/Google)
2. Connect Telegram (scan QR / enter bot token)
3. Enter Anthropic API key (encrypted at rest, never stored in plaintext)
4. Choose plan → Stripe checkout
5. Server provisioned (~90 seconds)
6. Rachel says "Hello!" on Telegram
```

## What We Need to Build

### Phase 1: MVP (Weeks 1-4)

- [ ] **Landing page** — what Rachel is, demo video, pricing, sign up CTA
- [ ] **Auth** — email + Google OAuth (Clerk or Lucia)
- [ ] **Onboarding wizard** — Telegram setup, API key input, plan selection
- [ ] **Hetzner provisioner** — create/delete/monitor VPS via API
  - cloud-init script that installs Bun, clones Rachel8, configures env, starts service
  - SSH key injection for management access
  - Firewall setup (SSH + Telegram webhook port only)
- [ ] **Stripe integration** — subscription checkout, webhook handling, usage-based add-ons
- [ ] **Dashboard** — server status, logs viewer, memory browser, restart button
- [ ] **API key management** — encrypt user's Anthropic key, inject into their server securely

### Phase 2: Reliability (Weeks 5-8)

- [ ] **Health monitoring** — ping each Rachel instance every 60s, auto-restart if down
- [ ] **Auto-updates** — roll out new Rachel versions to all instances (rolling deploy)
- [ ] **Backup system** — daily backup of user's memory files to R2/S3
- [ ] **Usage dashboard** — Claude API spend tracking (proxy or estimate from logs)
- [ ] **Alerting** — notify user if their Rachel goes down or API key runs out of credits

### Phase 3: Growth (Weeks 9-12)

- [ ] **Shared bot mode** — users don't need their own Telegram bot; we route via one bot
- [ ] **Custom instructions** — users can customize Rachel's personality/system prompt from dashboard
- [ ] **Plugin marketplace** — community skills/plugins that extend Rachel's capabilities
- [ ] **Team/org support** — multiple users sharing one Rachel instance
- [ ] **Referral system** — give a month free, get a month free

### Phase 4: Scale (Weeks 13+)

- [ ] **Multi-region** — deploy in US (ash), EU (nbg1), Asia (sin) based on user location
- [ ] **Instance right-sizing** — auto-upgrade VPS if user needs more power
- [ ] **Custom domains** — users can access their Rachel dashboard at their own domain
- [ ] **API access** — programmatic access to Rachel for power users
- [ ] **SOC2 / security audit** — for enterprise customers

## Pricing Strategy

| Plan | Price | What You Get |
|------|-------|-------------|
| **Starter** | $9/mo | Dedicated Rachel instance, 24/7 uptime, basic memory |
| **Pro** | $19/mo | Everything + daily backups, priority support, custom instructions |
| **Team** | $39/mo | Everything + shared instance, 3 users, plugin access |

*Users bring their own Anthropic API key. We charge for infrastructure + platform only.*

### Unit Economics

| Item | Cost |
|------|------|
| Hetzner CX23 | €3.49/mo (~$3.80) |
| R2 backup storage | ~$0.15/mo |
| Monitoring/orchestration (amortized) | ~$0.50/mo |
| Stripe fees (2.9% + $0.30) | ~$0.56/mo |
| **Total COGS per user** | **~$5.00/mo** |
| **Margin at $9/mo** | **~44%** |
| **Margin at $19/mo** | **~74%** |

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 15, React 19, TailwindCSS, shadcn/ui |
| API | Hono on Bun |
| Auth | Clerk (or Lucia) |
| Database | PostgreSQL (Neon or Supabase) |
| Payments | Stripe |
| Infrastructure API | Hetzner Cloud REST API (raw fetch, no SDK needed) |
| Secrets | AES-256-GCM encryption for API keys at rest |
| Monitoring | Custom health checker + Uptime Kuma |
| CI/CD | GitHub Actions |
| Storage | Cloudflare R2 (backups) |

## Key Technical Decisions

### Why Hetzner?
- Cheapest VPS in the market (€3.49/mo for 2 vCPU, 4GB RAM)
- Clean REST API with cloud-init support
- Hourly billing with monthly cap — never overpay
- 20TB included traffic per server
- EU-based (GDPR-friendly)
- No vendor lock-in

### Why dedicated VPS per user (not shared)?
- **Security**: Each user's data is fully isolated
- **Reliability**: One user's workload can't affect another
- **Simplicity**: Rachel8 is designed to run on a single server
- **Trust**: Users know they have their own machine
- **Cost**: At €3.49/mo it's cheap enough to dedicate

### Why users bring their own API key?
- We don't eat Claude costs (which can be $50-200+/mo for heavy users)
- Users control their own spend
- No margin pressure on AI compute
- We charge purely for infrastructure + platform value

## Security

- User API keys encrypted with AES-256-GCM before storage
- Decryption only happens during server provisioning (injected via SSH, not cloud-init)
- Each server has its own firewall (SSH + bot webhook only)
- No shared resources between users
- Memory files are user-owned and can be exported anytime
- We never see message content (Telegram → user's server → Claude directly)

## Repository Structure (Planned)

```
rachel-cloud/
├── apps/
│   ├── web/              # Next.js dashboard + landing page
│   └── api/              # Hono API server
├── packages/
│   ├── provisioner/      # Hetzner VPS lifecycle management
│   ├── billing/          # Stripe integration
│   ├── monitoring/       # Health checks + alerting
│   ├── crypto/           # API key encryption/decryption
│   └── shared/           # Types, utils, constants
├── cloud-init/
│   └── rachel-setup.sh   # Cloud-init script for new instances
├── docker-compose.yml    # Local development
└── README.md
```

## Development

```bash
# Clone
git clone https://github.com/polly3223/rachel-cloud.git
cd rachel-cloud

# Install
bun install

# Set up env
cp .env.example .env
# Fill in: HETZNER_API_TOKEN, STRIPE_SECRET_KEY, DATABASE_URL, ENCRYPTION_KEY

# Run locally
bun dev
```

## Related

- [Rachel8](https://github.com/polly3223/Rachel8) — The open-source AI assistant (this is what gets deployed)
- [Claude Code](https://docs.anthropic.com/en/docs/claude-code) — The AI agent runtime Rachel is built on

## License

Proprietary. All rights reserved.
