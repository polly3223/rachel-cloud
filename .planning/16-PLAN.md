# Phase 16: Infrastructure Go-Live — Execution Plan

## Research Findings

### Current State
- **Docker**: v28.2.2 installed, rachel user in `docker` group (needs `sg docker` or re-login)
- **Rachel8 image**: Already built (`rachel8:latest`, 509MB, 28h ago)
- **nginx**: NOT installed
- **socat**: NOT installed
- **Cloudflared config**: Named tunnel already routes `get-rachel.com` and `*.get-rachel.com` → localhost:5173
- **SvelteKit**: Using `adapter-auto` (needs `adapter-node` for production)
- **DB**: SQLite at `data/rachel-cloud.db`, Drizzle ORM
- **Orchestrator**: Port 9998, requires `ORCHESTRATOR_API_KEY` env var
- **LLM Proxy**: Port 9999, requires `ZAI_API_KEY` env var
- **Docker socket permission**: `rachel` user is in `docker` group but current shell session doesn't have it active (needs `newgrp docker` or re-login)

### Architecture (5 services)
```
                                    ┌─ SvelteKit (5173) ← get-rachel.com
Internet → Cloudflare Tunnel ──────┤
                                    └─ nginx (80) ← *.get-rachel.com

Orchestrator (9998) ── manages ──→ Docker containers (rachel-user-*)
LLM Proxy (9999) ── forwards ──→ Z.ai API
```

### Key Files
- Orchestrator: `src/orchestrator/server.ts` (Bun.serve, port 9998)
- LLM Proxy: `src/proxy/server.ts` (Bun.serve, port 9999)
- Container manager: `src/orchestrator/container-manager.ts`
- Page manager: `src/orchestrator/page-manager.ts`
- Docker build: `scripts/build.sh` (rachel8 repo)
- Docker run: `scripts/run-container.sh` (rachel8 repo)
- Dockerfile: Multi-stage Alpine, Bun, git, ffmpeg, python3
- Cloudflared: `/etc/cloudflared/config.yml` (systemd service, root)

## Execution Plan

### Wave 1: Foundation (can be done now)

#### 1.1 Install nginx + socat
```bash
sudo apt install -y nginx socat
```
Configure nginx as wildcard reverse proxy:
- Default server block for `*.get-rachel.com` → dynamic port lookup
- Page manager generates nginx config snippets per registered page
- Reload nginx on page register/deregister

#### 1.2 Switch SvelteKit to adapter-node
- Install `@sveltejs/adapter-node`
- Update `svelte.config.js` to use `adapter-node`
- Build produces standalone Node/Bun server in `build/`
- Run with: `bun build/index.js` (or `node build`)
- Configure: `PORT=5173 HOST=0.0.0.0`

#### 1.3 Update Cloudflared config
Current config routes `*.get-rachel.com` → localhost:5173 (SvelteKit).
Need to route `*.get-rachel.com` → localhost:80 (nginx) for page serving.
Keep `get-rachel.com` → localhost:5173.

```yaml
ingress:
  - hostname: get-rachel.com
    service: http://localhost:5173
  - hostname: "*.get-rachel.com"
    service: http://localhost:80
  - service: http_status:404
```

#### 1.4 Create systemd user services

Three services in `~/.config/systemd/user/`:

**rachel-cloud.service** (SvelteKit control plane):
```
ExecStart=bun /home/rachel/rachel-cloud/build/index.js
Environment=PORT=5173 HOST=0.0.0.0
WorkingDirectory=/home/rachel/rachel-cloud
```

**rachel-orchestrator.service** (container orchestrator):
```
ExecStart=bun run /home/rachel/rachel-cloud/src/orchestrator/server.ts
Environment=ORCHESTRATOR_API_KEY=<generated>
Environment=GROQ_API_KEY=<from rachel8 .env>
WorkingDirectory=/home/rachel/rachel-cloud
```

**rachel-proxy.service** (LLM proxy):
```
ExecStart=bun run /home/rachel/rachel-cloud/src/proxy/server.ts
Environment=ZAI_API_KEY=<need from Lorenzo>
WorkingDirectory=/home/rachel/rachel-cloud
```

All use `loginctl enable-linger rachel` (already enabled).

#### 1.5 Run DB migration
```bash
cd /home/rachel/rachel-cloud && bun drizzle-kit push
```

### Wave 2: Integration & Testing

#### 2.1 Rebuild Rachel8 Docker image
Current image is 28h old — should rebuild with latest code:
```bash
cd /home/rachel/rachel8 && sg docker -c "./scripts/build.sh"
```

#### 2.2 Add missing env vars to rachel-cloud/.env
- `ORCHESTRATOR_API_KEY` — generate random string
- `ZAI_API_KEY` — NEED FROM LORENZO (Z.ai API key)
- `GROQ_API_KEY` — copy from rachel8/.env

#### 2.3 Verify Polar webhook
- Polar webhook URL should be `https://get-rachel.com/api/webhooks/polar`
- Must be accessible (SvelteKit must be running)
- Check Polar dashboard for webhook config

#### 2.4 End-to-end test flow
1. Visit get-rachel.com → click "Sign In"
2. Telegram Login Widget → authenticate
3. Dashboard → Subscribe → Polar checkout
4. Polar webhook → orchestrator provisions container
5. Send message to @rachelcloud_bot → bot routes to container → response

### Blockers / Questions for Lorenzo
1. **Z.ai API key** — needed for LLM proxy. Where does the current Z.ai key live?
2. **Polar production mode** — is it already live? Need to confirm webhook URL in Polar dashboard
3. **Docker socket** — `rachel` user is in `docker` group but current session needs `newgrp docker`. Services will work fine since they start fresh sessions.
4. **nginx needs sudo** — need root access to install nginx and configure it. Lorenzo may need to run `sudo apt install nginx socat`.

### Risk Assessment
- **Low risk**: Docker image build, systemd services, DB migration, SvelteKit adapter change
- **Medium risk**: Cloudflared config change (brief downtime when restarting tunnel)
- **High risk**: End-to-end flow — many moving parts (Telegram webhook → SvelteKit → orchestrator → Docker → LLM proxy → Z.ai). Need careful testing.

### Order of Operations
1. ✅ Docker image already built (can rebuild later)
2. Install nginx + socat (needs sudo)
3. Switch SvelteKit to adapter-node + build
4. Update cloudflared config + restart
5. Create systemd services
6. Add env vars
7. Run DB migration
8. Start all services
9. End-to-end test
