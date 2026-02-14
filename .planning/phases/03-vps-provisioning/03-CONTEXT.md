# Phase 3 Context: VPS Provisioning & Deployment

## Decisions (LOCKED — do not revisit)

| Decision | Choice | Rationale |
|----------|--------|-----------|
| VPS provider | Hetzner Cloud API | Non-negotiable, already researched |
| VPS type | CX23 (2 vCPU, 4GB RAM, 40GB NVMe) | €3.49/mo, fits Rachel8's 1.6GB RAM usage |
| Runtime | Bun | Non-negotiable |
| Language | TypeScript (strict) | Non-negotiable |
| Database | SQLite via Drizzle ORM | Non-negotiable |
| Frontend | SvelteKit | Consistent with Phases 1-2 |
| Control plane | Same Hetzner VPS as Rachel (ubuntu-4gb-nbg1-2) | I manage everything directly |
| Hetzner API | Raw fetch (no SDK) | No official JS/TS SDK exists |
| Secret injection | Via SSH after cloud-init (NOT in user-data) | Security — tokens never in logs |

## Rachel8 Deployment Facts (from codebase analysis)

### What Gets Deployed
- Rachel8 repo: https://github.com/polly3223/Rachel8.git (will be open-sourced)
- Single-user per VPS, single bot process
- Entry point: `bun run src/index.ts`
- systemd service: rachel8.service
- Setup wizard: `bun run setup` (interactive, or can be scripted)

### VPS Requirements
- Ubuntu 24.04 LTS
- Bun runtime (curl install)
- Git + GitHub CLI (gh)
- Claude Code CLI (requires user's Claude OAuth token)
- No exposed ports needed (Telegram uses long polling, outbound only)
- Passwordless sudo for rachel user
- ~700MB disk for project + node_modules

### Per-Instance Configuration (.env)
- TELEGRAM_BOT_TOKEN: User's bot token (from BotFather)
- OWNER_TELEGRAM_USER_ID: User's Telegram ID
- SHARED_FOLDER_PATH: /home/rachel/shared
- NODE_ENV: production
- LOG_LEVEL: info

### Claude Authentication
- Claude Code CLI must be logged in (`claude login`)
- Uses OAuth 2.0 — we already have the user's Claude OAuth token from Phase 1
- Need to inject this token into the VPS's Claude CLI config (~/.claude/)
- The token format and storage needs investigation during research

### Critical Security Notes
- Claude tokens and Telegram bot token must NEVER appear in cloud-init user-data (visible in Hetzner API)
- Inject secrets via SSH after VPS is ready
- Rachel8 has full sudo — acceptable for single-user trusted deployment

## Claude's Discretion

- Cloud-init script structure and ordering
- SSH key management approach for control plane → user VPS
- Health check endpoint or mechanism for provisioning validation
- How to script Claude CLI auth without interactive login
- VPS naming convention
- Firewall rules via Hetzner API
- Error handling and retry strategy for API calls

## Deferred Ideas

- Multiple VPS sizes/tiers
- Custom Rachel configurations
- Multi-region deployment
- Container-based deployment (Docker/Podman)
- Terraform/Pulumi IaC
