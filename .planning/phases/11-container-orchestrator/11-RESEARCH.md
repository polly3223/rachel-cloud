# Phase 11 Research: Container Orchestrator

## 1. Docker API Access from Bun/TypeScript

### Approach A: Bun fetch() over Unix Socket (RECOMMENDED)

Bun v1.0.31+ natively supports `fetch()` over Unix domain sockets. The Docker Engine API is a standard REST/JSON API at `/var/run/docker.sock`.

```typescript
const DOCKER_SOCK = "/var/run/docker.sock";

async function listContainers(all = false) {
  const res = await fetch(`http://localhost/v1.45/containers/json?all=${all}`, {
    unix: DOCKER_SOCK,
  });
  return res.json();
}

async function createContainer(name: string, config: object) {
  const res = await fetch(`http://localhost/v1.45/containers/create?name=${name}`, {
    unix: DOCKER_SOCK,
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(config),
  });
  return res.json();
}
```

**Pros:** Zero dependencies, native Bun support, full Docker API access, matches proxy pattern (JSON over HTTP).
**Cons:** Must define TypeScript types manually for Docker API payloads.

### Approach B: Dockerode (Node.js Library) — NOT RECOMMENDED

Known compatibility issues with Bun's Unix socket implementation. Requires `socat` workaround to bridge socket to TCP. Heavy dependency tree. Not worth the complexity.

### Approach C: Shell Out via Bun.spawn() — NOT RECOMMENDED

Simple but fragile. Subprocess overhead (~50-100ms per call), parsing JSON output from CLI is error-prone, shell injection risk.

### Decision: Approach A

Zero-dependency `fetch()` over Unix socket is the clear winner. Maps 1:1 to Docker Engine API.

### Docker Engine API Endpoints Needed

| Operation | Method | Endpoint |
|-----------|--------|----------|
| List containers | GET | /v1.45/containers/json |
| Create container | POST | /v1.45/containers/create?name={name} |
| Start container | POST | /v1.45/containers/{id}/start |
| Stop container | POST | /v1.45/containers/{id}/stop |
| Restart container | POST | /v1.45/containers/{id}/restart |
| Inspect container | GET | /v1.45/containers/{id}/json |
| Remove container | DELETE | /v1.45/containers/{id} |
| Get container logs | GET | /v1.45/containers/{id}/logs |
| Create volume | POST | /v1.45/volumes/create |
| Remove volume | DELETE | /v1.45/volumes/{name} |
| Create network | POST | /v1.45/networks/create |
| List networks | GET | /v1.45/networks |

---

## 2. Container Lifecycle Management

### Idempotent Provisioning

1. Check if container exists (inspect)
2. If exists + running with correct image → no-op
3. If exists + wrong image → stop, remove, recreate
4. If exists + stopped → start
5. If not exists → ensure volume, ensure network, create, start

### Container Config (run-container.sh → Docker API)

```typescript
{
  Image: "rachel8:latest",
  Env: [
    `TELEGRAM_BOT_TOKEN=${env.telegramBotToken}`,
    `OWNER_TELEGRAM_USER_ID=${env.ownerTelegramUserId}`,
    `ANTHROPIC_BASE_URL=http://host.docker.internal:9999`,
    `ANTHROPIC_AUTH_TOKEN=rachel-user-${userId}`,
    // ...
  ],
  User: "1001:1001",
  HostConfig: {
    Memory: 512 * 1024 * 1024,       // 512MB
    MemorySwap: 512 * 1024 * 1024,   // no swap
    NanoCpus: 500_000_000,           // 0.5 CPUs
    Binds: [`rachel-user-${userId}-data:/data:rw`],
    Tmpfs: { "/tmp": "rw,noexec,nosuid,size=100m" },
    NetworkMode: "rachel-net",
    RestartPolicy: { Name: "unless-stopped" },
    CapDrop: ["ALL"],
    SecurityOpt: ["no-new-privileges"],
    ReadonlyRootfs: true,
    PidsLimit: 100,    // prevent fork bombs
  },
}
```

### Named Volumes

Named volumes persist independently of containers. `docker rm` does NOT remove volumes unless `-v` flag is used. Safe for rolling updates — stop, remove, recreate with same volume name.

### Rolling Updates

Sequential per container: stop → remove → create (new image) → start → wait for healthy. Volume persists. If health check fails, mark container as failed and alert admin.

---

## 3. Health Checking

### Docker HEALTHCHECK (already in Dockerfile)

```dockerfile
HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
  CMD pgrep -f "bun.*index.ts" || exit 1
```

Docker tracks health status: starting → healthy → unhealthy.

### Monitoring via Docker API

`GET /containers/{id}/json` returns `State.Health.Status` = "healthy" | "unhealthy" | "starting".

Docker does NOT auto-restart on unhealthy (only on exit). The orchestrator must poll and restart.

### Health Sweep Pattern

Every 30-60 seconds:
1. List all `rachel-user-*` containers
2. Inspect each for health status
3. Restart any `unhealthy` containers (with circuit breaker)
4. Update status in database

**Speed vs v1.0:** Docker API inspect = ~5-20ms per container. SSH-based check = ~2-5s per VPS. Orders of magnitude faster.

---

## 4. Architecture: Standalone Server

The orchestrator should be a **standalone Bun.serve()** on port 9998 (matching the proxy pattern), not a library imported by SvelteKit.

Reasons:
- Docker socket access requires host-level process
- Health monitoring needs persistent background process
- Separation of concerns: control plane = users/billing, orchestrator = containers
- Independent restart cycle from web app

### File Structure

```
rachel-cloud/src/orchestrator/
  config.ts             — Docker socket path, defaults, API version
  types.ts              — TypeScript interfaces for Docker API + internal types
  docker-client.ts      — Low-level Docker Engine API (fetch over Unix socket)
  container-manager.ts  — High-level lifecycle (provision, deprovision, update, restart)
  health-monitor.ts     — Periodic health sweep, circuit breaker, auto-restart
  server.ts             — HTTP API for control plane (Bun.serve on port 9998)
```

### HTTP API Endpoints (for control plane)

| Method | Path | Purpose |
|--------|------|---------|
| POST | /containers | Provision new user container |
| DELETE | /containers/:userId | Deprovision (stop + remove + optional volume cleanup) |
| POST | /containers/:userId/restart | Restart container |
| POST | /containers/:userId/update | Update to new image |
| GET | /containers | List all containers with status |
| GET | /containers/:userId | Single container status |
| POST | /update-all | Rolling update all containers |
| GET | /health | Orchestrator health |

### v1.0 Modules Replaced

- `provision-vps.ts` → `container-manager.ts` provisionContainer()
- `deprovision-vps.ts` → `container-manager.ts` deprovisionContainer()
- `hetzner-client.ts` → `docker-client.ts`
- `cloud-init-builder.ts` → not needed
- `ssh-*.ts` (all 4 modules) → not needed
- `vps-status.ts` → Docker API inspect
- `health-checker.ts` → `health-monitor.ts`
- `update-engine.ts` → `container-manager.ts` updateContainer()
- `rollout-orchestrator.ts` → `container-manager.ts` updateAllContainers()

### v1.0 Modules Reused

- `circuit-breaker.ts` — pure logic, no SSH dependency
- `health-notifications.ts` — email sending, no SSH dependency
- `schema.ts` — needs new container columns replacing Hetzner fields

---

## 5. Security

### Docker Socket Access
- `/var/run/docker.sock` provides root-equivalent access
- Orchestrator runs as rachel user in `docker` group on host
- HTTP API binds to `127.0.0.1` only — no external access
- Shared secret between control plane and orchestrator for auth

### Container Isolation (already implemented in run-container.sh)
- `--cap-drop=ALL`: no special kernel privileges
- `--security-opt=no-new-privileges`: no setuid/setgid
- `--read-only`: immutable container filesystem
- `--tmpfs /tmp:noexec,nosuid,size=100m`: restricted temp
- `--user=1001:1001`: non-root process
- `--memory=512m --memory-swap=512m`: no swap, hard limit
- `--cpus=0.5`: fair CPU sharing
- Network ICC disabled: no cross-container communication
- Docker socket NEVER mounted into user containers

### Additional Hardening
- `--pids-limit=100`: prevent fork bombs
- `--log-opt max-size=10m --log-opt max-file=3`: prevent log disk exhaustion
- Consider `--ulimit nofile=1024:1024` for file descriptor limits

---

## Sources

- Bun fetch() Unix sockets: https://bun.com/docs/guides/http/fetch-unix
- Docker Engine API v1.45: https://docs.docker.com/reference/api/engine/version/v1.45/
- Dockerode Bun issue: https://github.com/apocas/dockerode/issues/747
- Docker volumes: https://docs.docker.com/engine/storage/volumes/
- Docker Security (OWASP): https://cheatsheetseries.owasp.org/cheatsheets/Docker_Security_Cheat_Sheet.html
