# Phase 9: Dockerfile & Image Build - Research

**Researched:** 2026-02-16
**Domain:** Docker, Bun Runtime, Container Security, Multi-Stage Builds
**Confidence:** HIGH

## Summary

Phase 9 establishes production-ready Docker containerization for Rachel8, a Telegram bot built with Bun runtime + Claude Agent SDK. Research reveals that **multi-stage builds with Alpine-based images** provide the optimal balance of size, security, and functionality for per-user container deployment.

The recommended approach uses `oven/bun:alpine` as the base image, implements multi-stage builds to separate build and runtime dependencies, runs as a non-root user with dropped capabilities, uses named volumes for SQLite persistence, and implements network isolation with outbound-only access. Resource limits (512MB RAM, 0.5 CPU) are enforced via Docker runtime flags with `unless-stopped` restart policy for production resilience.

**Primary recommendation:** Use `oven/bun:1.1.10-alpine` (pinned version) as base, multi-stage build pattern, non-root user (`bun` uid 1000), named volumes for `/data`, resource limits via `--memory=512m --cpus=0.5`, network isolation via custom bridge networks per container, and `unless-stopped` restart policy.

## Standard Stack

### Core Technologies
| Component | Version | Purpose | Why Standard |
|-----------|---------|---------|--------------|
| oven/bun:alpine | 1.1.10-alpine | Base image | Official Bun image on Alpine (~100MB); glibc compatibility issues resolved; smaller than Debian-based (290MB) |
| Alpine Linux | 3.19+ | OS layer | ~5MB base size; musl libc; comprehensive package repository; industry standard for minimal containers |
| Docker Multi-Stage | Native | Build optimization | Separates build-time from runtime dependencies; reduces final image size by 60-90%; industry best practice |
| Named Volumes | Native | Data persistence | Docker-managed, portable, easier backups than bind mounts; recommended for production databases |
| SQLite | 3.x | Database | Embedded database; no network overhead; works well with volume persistence; perfect for per-user isolation |

### System Dependencies (Runtime)
| Package | Alpine Package | Purpose | Size Impact |
|---------|---------------|---------|-------------|
| git | `git` | Claude Agent SDK requirement | ~12MB |
| ffmpeg | `ffmpeg` | Media processing (audio/video) | ~50MB |
| Python 3 | `python3 py3-pip` | Pillow dependency | ~60MB |
| Pillow | `py3-pillow` | Image processing | ~20MB (via Alpine package, not pip) |

### Alternative Base Images Considered
| Base Image | Size | Pros | Cons | Verdict |
|------------|------|------|------|---------|
| `oven/bun:alpine` | ~100MB | Official support, glibc compatible, smallest Bun image | Requires manual dependency installation | **RECOMMENDED** |
| `oven/bun:debian` | ~290MB | Easier dependency installation, wider compatibility | 3x larger, more attack surface | Use only if Alpine fails |
| `node:alpine` + bun install | ~80MB | Smaller base | Unofficial Bun installation, maintenance burden | Not recommended for production |
| `debian:slim` + bun install | ~150MB | Better than full Debian | Still larger than official Bun Alpine | Only if custom base needed |

## Multi-Stage Build Architecture

### Pattern 1: Build Stage vs Runtime Stage
**What:** Separate dependency installation and compilation from final runtime environment
**When to use:** Always in production to minimize image size and attack surface
**Size reduction:** 60-90% smaller final images

**Example Dockerfile Structure:**
```dockerfile
# ==============================================================================
# STAGE 1: Builder
# ==============================================================================
FROM oven/bun:1.1.10-alpine AS builder

WORKDIR /build

# Copy dependency files first (layer caching optimization)
COPY package.json bun.lock ./

# Install dependencies with frozen lockfile (reproducible builds)
RUN bun install --frozen-lockfile --production

# Copy application source
COPY . .

# Optional: Bundle to standalone executable (if needed for smaller image)
# RUN bun build src/index.ts --compile --outfile rachel8

# ==============================================================================
# STAGE 2: Runtime
# ==============================================================================
FROM oven/bun:1.1.10-alpine AS runtime

# Install runtime dependencies only
RUN apk add --no-cache \
    git \
    ffmpeg \
    python3 \
    py3-pip \
    py3-pillow

# Create non-root user (security best practice)
RUN addgroup -g 1000 rachel && \
    adduser -D -u 1000 -G rachel rachel

# Create data directory for SQLite and memory files
RUN mkdir -p /data && chown rachel:rachel /data

WORKDIR /app

# Copy only production files from builder
COPY --from=builder --chown=rachel:rachel /build/node_modules ./node_modules
COPY --from=builder --chown=rachel:rachel /build/package.json .
COPY --chown=rachel:rachel ./src ./src
COPY --chown=rachel:rachel ./skills ./skills

# Switch to non-root user
USER rachel

# Volume for persistent data (SQLite DB, memory files)
VOLUME ["/data"]

# Environment variables (overridden at runtime)
ENV NODE_ENV=production
ENV SHARED_FOLDER_PATH=/data

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD pgrep -f "bun.*index.ts" || exit 1

# Start application
CMD ["bun", "run", "src/index.ts"]
```

### Key Optimizations

**1. Layer Caching (Critical for Build Speed)**
- Copy `package.json` and `bun.lock` BEFORE copying source code
- Dependencies are cached unless lockfile changes
- Result: 70% faster rebuilds during development

**2. Frozen Lockfile (Reproducible Builds)**
```dockerfile
RUN bun install --frozen-lockfile --production
```
- `--frozen-lockfile`: Fails if lockfile doesn't match package.json (prevents drift)
- `--production`: Excludes devDependencies (smaller node_modules)
- Result: 100% reproducible builds, smaller images

**3. Pillow Installation Strategy**
```dockerfile
# CORRECT: Use Alpine package (pre-compiled)
RUN apk add --no-cache py3-pillow

# WRONG: Install via pip (requires build tools, 10x slower)
RUN pip install Pillow  # Don't do this on Alpine!
```
- Alpine's `py3-pillow` is pre-compiled (~20MB)
- pip installation requires gcc, musl-dev, jpeg-dev (~200MB build tools)
- Result: 180MB savings, 10x faster builds

## Security Best Practices

### Pattern 2: Non-Root User with Dropped Capabilities
**What:** Run container process as unprivileged user with minimal Linux capabilities
**When to use:** Always in production (CRITICAL security requirement)
**Security impact:** Prevents privilege escalation attacks, limits container breakout impact

**Implementation:**
```dockerfile
# In Dockerfile
RUN addgroup -g 1000 rachel && \
    adduser -D -u 1000 -G rachel rachel

USER rachel
```

**At runtime:**
```bash
docker run \
  --user 1000:1000 \
  --cap-drop=ALL \
  --security-opt=no-new-privileges \
  --read-only \
  --tmpfs /tmp:rw,noexec,nosuid,size=100m \
  -v rachel-user-123-data:/data:rw \
  rachel8:latest
```

**Flags Explained:**
- `--user 1000:1000`: Enforce non-root UID/GID (even if Dockerfile specifies root)
- `--cap-drop=ALL`: Remove all Linux capabilities (no raw sockets, no net admin, etc.)
- `--security-opt=no-new-privileges`: Prevent privilege escalation via setuid binaries
- `--read-only`: Filesystem is read-only except volumes (prevents malware persistence)
- `--tmpfs /tmp`: Writable temp dir in memory (required for Bun)

**Why This Matters:**
- Container breakout via kernel exploit is limited to UID 1000 (not root)
- Stolen credentials can't install backdoors (read-only filesystem)
- Network exploits can't bind privileged ports or capture packets

### Pattern 3: Read-Only Root Filesystem
**What:** Mount root filesystem as read-only, provide writable volumes only where needed
**When to use:** Production deployments (prevents malware persistence)
**Tradeoff:** Requires explicit tmpfs mounts for `/tmp`, `/var/log`, etc.

**Writable Locations for Rachel8:**
- `/data`: SQLite database, memory files (named volume)
- `/tmp`: Bun temp files, Claude SDK cache (tmpfs)
- `/app/.sessions.json`: Telegram session storage (tmpfs or volume)

**Implementation:**
```bash
docker run \
  --read-only \
  --tmpfs /tmp:rw,noexec,nosuid,size=100m \
  --tmpfs /app/.sessions.json:rw,noexec,nosuid,size=1m \
  -v rachel-user-123-data:/data:rw \
  rachel8:latest
```

## Data Persistence Strategy

### Pattern 4: Named Volumes vs Bind Mounts
**Recommendation: Named Volumes for Production**

| Feature | Named Volumes | Bind Mounts |
|---------|---------------|-------------|
| **Management** | Docker-managed | Host filesystem-dependent |
| **Portability** | Portable across hosts | Requires identical host paths |
| **Backups** | `docker volume backup` | Manual tar/rsync |
| **Permissions** | Automatic UID/GID mapping | Manual chown required |
| **Performance** | Optimized for container I/O | Host filesystem performance |
| **Use Case** | Production databases | Development code hot-reload |

**Per-User Volume Naming:**
```bash
# Create volume for user ID 12345
docker volume create rachel-user-12345-data

# Run container with volume
docker run \
  --name rachel-user-12345 \
  -v rachel-user-12345-data:/data \
  rachel8:latest
```

**Volume Backup Strategy:**
```bash
# Backup SQLite database from running container
docker run --rm \
  -v rachel-user-12345-data:/source:ro \
  -v /backup:/backup \
  alpine tar czf /backup/user-12345-$(date +%Y%m%d).tar.gz -C /source .

# Restore volume
docker run --rm \
  -v rachel-user-12345-data:/target \
  -v /backup:/backup \
  alpine tar xzf /backup/user-12345-20260216.tar.gz -C /target
```

**Why Named Volumes:**
- Docker handles UID/GID mapping automatically
- `docker volume ls` shows all user data volumes
- Built-in tools for backup/restore/migration
- Works identically on any Docker host

**When to Use Bind Mounts:**
- Development only (hot-reload code changes)
- Accessing host files that must be shared (e.g., `/var/log` aggregation)
- Not recommended for production SQLite databases

## Resource Limits & OOM Behavior

### Pattern 5: Memory and CPU Limits
**Requirement: 512MB RAM, 0.5 CPU per container**

**Implementation:**
```bash
docker run \
  --memory=512m \
  --memory-swap=512m \
  --memory-reservation=384m \
  --cpus=0.5 \
  --cpu-shares=512 \
  --oom-kill-disable=false \
  rachel8:latest
```

**Flags Explained:**
- `--memory=512m`: Hard limit (OOM killer triggers at 512MB)
- `--memory-swap=512m`: Disable swap (swap = memory + swap, so 512m - 512m = 0 swap)
- `--memory-reservation=384m`: Soft limit (75% of hard limit, allows bursts)
- `--cpus=0.5`: Container can use max 50% of one CPU core
- `--cpu-shares=512`: Relative CPU weight (default 1024, so 512 = 50% priority)
- `--oom-kill-disable=false`: Allow OOM killer (don't hang container on OOM)

**OOM Killer Behavior:**
- Container process receives `SIGKILL` when exceeding 512MB
- Exit code 137 (128 + 9 = SIGKILL)
- Docker restart policy handles automatic restart
- No data corruption (SQLite journaling protects writes)

**Memory Budget Breakdown (Rachel8):**
- Bun runtime: ~30MB
- Claude Agent SDK: ~50MB
- Telegram bot (grammY): ~20MB
- SQLite in-memory cache: ~50MB
- Node modules (loaded): ~100MB
- Headroom for Claude responses: ~250MB
- **Total: ~500MB (fits in 512MB with margin)**

**Monitoring Memory Usage:**
```bash
# Real-time memory stats
docker stats rachel-user-12345

# Check OOM kills in logs
docker inspect rachel-user-12345 | jq '.[0].State.OOMKilled'

# Memory usage history
docker logs rachel-user-12345 | grep -i "memory\|oom"
```

**Best Practice Recommendations:**
1. Load test with realistic Claude responses (some responses can be 100KB+)
2. Set memory reservation to 75% of hard limit (384MB of 512MB)
3. Monitor OOM kills in first 48 hours of production
4. If OOM kills occur, increase to 768MB (not 1GB—doubling is wasteful)
5. SQLite with 512MB is safe (Claude SDK memory is the variable)

## Restart Policies

### Pattern 6: Restart Policy Selection
**Recommendation: `unless-stopped` for Production**

| Policy | Behavior | Use Case | Rachel8 Fit |
|--------|----------|----------|-------------|
| `no` | Never restart | Development/testing | ❌ |
| `on-failure` | Restart on non-zero exit | Experimental apps | ❌ |
| `always` | Always restart, even if manually stopped | Critical system services | ⚠️ |
| `unless-stopped` | Restart unless explicitly stopped | **Production services** | ✅ |

**Why `unless-stopped`:**
- Auto-restarts on crash, host reboot, or Docker daemon restart
- Respects manual `docker stop` commands (won't restart after user stops)
- Prevents restart loops if service is intentionally stopped for maintenance
- Standard for production microservices

**Implementation:**
```bash
docker run \
  --restart=unless-stopped \
  --name rachel-user-12345 \
  rachel8:latest
```

**Startup Debouncing:**
Rachel8 already implements startup message debouncing (30-second lockfile):
```typescript
// From src/index.ts
const STARTUP_LOCK = "/tmp/rachel8-startup.lock";
if (elapsed < 30_000) {
  shouldSendStartup = false;
  logger.info("Skipping startup message (sent recently)");
}
```

This prevents Telegram spam during crash loops, which pairs well with `unless-stopped` policy.

**Alternative: `on-failure` with Max Retries**
If you want to prevent infinite restart loops on persistent errors:
```bash
docker run \
  --restart=on-failure:3 \  # Max 3 restart attempts
  --name rachel-user-12345 \
  rachel8:latest
```

**Why NOT `on-failure` for Rachel8:**
- Exit code 0 doesn't always mean "success" (could be graceful shutdown)
- Exit code 1 might be transient (network blip, API rate limit)
- 3 retries might not cover Telegram API downtime (can last 10+ minutes)

## Network Isolation

### Pattern 7: Outbound-Only with No Inter-Container Communication
**Requirement:** Containers only talk outbound (Telegram API, Claude API), no container-to-container communication

**Implementation:**
```bash
# Create isolated bridge network per user
docker network create \
  --driver=bridge \
  --internal=false \
  --opt com.docker.network.bridge.enable_icc=false \
  rachel-user-12345-net

# Run container on isolated network
docker run \
  --network=rachel-user-12345-net \
  --name=rachel-user-12345 \
  rachel8:latest
```

**Network Flags Explained:**
- `--driver=bridge`: Standard bridge network (NAT to host)
- `--internal=false`: Allow outbound internet access (not internal-only)
- `--opt com.docker.network.bridge.enable_icc=false`: Disable inter-container communication

**Why Per-User Networks:**
- Even with ICC disabled, containers on same network can see each other's IPs
- Separate network per user provides defense-in-depth
- Prevents cross-tenant data leaks via network attacks
- Each network has its own IP subnet (172.18.0.0/16, 172.19.0.0/16, etc.)

**Outbound Access Verification:**
```bash
# Test outbound HTTPS (should work)
docker exec rachel-user-12345 wget -q -O- https://api.telegram.org

# Test inter-container (should fail)
docker exec rachel-user-12345 ping 172.18.0.2  # Another container's IP
# Result: Network unreachable or timeout
```

**Alternative: Default Bridge with ICC Disabled**
If managing 1000s of networks is too complex:
```bash
# Configure default bridge to disable ICC
cat > /etc/docker/daemon.json <<EOF
{
  "icc": false,
  "iptables": true
}
EOF

sudo systemctl restart docker

# All containers on default bridge now have ICC disabled
docker run --name rachel-user-12345 rachel8:latest
```

**Tradeoff:**
- Default bridge with ICC disabled is simpler (one network for all)
- Per-user networks provide stronger isolation (separate broadcast domains)
- **Recommendation:** Start with default bridge + ICC disabled, migrate to per-user networks if security audit requires it

## Image Size Optimization

### Pattern 8: .dockerignore for Minimal Context
**What:** Exclude unnecessary files from Docker build context
**Impact:** 50-90% faster builds, smaller layer cache

**Recommended `.dockerignore`:**
```
# Version control
.git
.gitignore

# Dependencies (installed inside container)
node_modules

# Environment files (secrets should NEVER be in image)
.env
.env.*
!.env.example

# Logs and temp files
*.log
logs/
tmp/
.sessions.json

# Development files
.planning/
*.md
!README.md

# Test files
test/
*.test.ts
*.spec.ts

# IDE and OS files
.vscode/
.idea/
*.swp
.DS_Store

# Build artifacts
dist/
build/
```

**Why This Matters:**
- `.git` directory can be 50MB+ (excluded = 50MB saved in build context)
- `node_modules` is installed inside container (no need to copy from host)
- `.env` contains secrets (must NEVER be in image—use runtime env vars)

**Build Context Size Comparison:**
```bash
# Without .dockerignore
Sending build context to Docker daemon: 245.3MB

# With .dockerignore
Sending build context to Docker daemon: 1.2MB
```

### Pattern 9: Layer Caching Strategy
**What:** Order Dockerfile commands to maximize layer reuse
**Impact:** 10x faster rebuilds during development

**Optimal Ordering:**
1. Base image (`FROM`)
2. System dependencies (`RUN apk add`)—changes rarely
3. Application dependencies (`COPY package.json`, `RUN bun install`)—changes occasionally
4. Application code (`COPY src/`)—changes frequently

**Example (Optimized):**
```dockerfile
FROM oven/bun:1.1.10-alpine

# Layer 1: System deps (rarely changes)
RUN apk add --no-cache git ffmpeg python3 py3-pillow

# Layer 2: Package deps (changes occasionally)
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile --production

# Layer 3: Application code (changes frequently)
COPY src/ ./src/
COPY skills/ ./skills/
```

**Why This Order:**
- System dependencies change once per month → cached 99% of builds
- Package dependencies change once per week → cached 90% of builds
- Application code changes every commit → rebuilt every time

**Anti-Pattern (Slow Rebuilds):**
```dockerfile
FROM oven/bun:1.1.10-alpine

# WRONG: Copy everything first
COPY . .

# WRONG: Install deps after code copy
RUN bun install

# Result: Every code change invalidates bun install layer
# Build time: 2-3 minutes per rebuild
```

### Pattern 10: Minimize Installed Packages
**What:** Install only runtime dependencies, exclude build tools
**Impact:** 50-200MB savings per image

**Rachel8 Dependency Analysis:**

| Dependency | Required at Runtime? | Size | Install Method |
|------------|---------------------|------|----------------|
| git | ✅ Yes (Claude SDK) | 12MB | `apk add git` |
| ffmpeg | ✅ Yes (media) | 50MB | `apk add ffmpeg` |
| python3 | ✅ Yes (Pillow) | 40MB | `apk add python3` |
| py3-pillow | ✅ Yes (images) | 20MB | `apk add py3-pillow` |
| gcc | ❌ No (build only) | 50MB | Don't install |
| musl-dev | ❌ No (build only) | 30MB | Don't install |
| make | ❌ No (build only) | 5MB | Don't install |

**Total Runtime Size:**
- Base image (oven/bun:alpine): 100MB
- Runtime deps: 122MB
- Node modules: 50MB (production only)
- Application code: 5MB
- **Final image: ~280MB**

**Comparison to Debian:**
- Debian base: 290MB
- Runtime deps: 200MB
- **Final image: ~550MB (2x larger)**

## Bun-Specific Considerations

### Pattern 11: Bun Lockfile and Install
**Critical:** Use `--frozen-lockfile` in Docker builds for reproducibility

```dockerfile
# CORRECT: Frozen lockfile (reproducible builds)
RUN bun install --frozen-lockfile --production

# WRONG: Allow lockfile changes (non-reproducible)
RUN bun install --production
```

**Why `--frozen-lockfile`:**
- Fails build if `package.json` doesn't match `bun.lock`
- Prevents dependency drift between dev and production
- Ensures exact versions are installed (no surprises)

**Known Issues (2026):**
- `--frozen-lockfile` can fail in workspaces with platform-specific deps
- Workaround: Commit lockfile from Linux (not macOS)
- Issue tracker: https://github.com/oven-sh/bun/issues/12252

### Pattern 12: Bun Binary Compilation (Optional)
**What:** Bundle app + Bun runtime into a single executable
**Impact:** 50% smaller image, faster startup, no node_modules

```dockerfile
# In builder stage
RUN bun build src/index.ts --compile --outfile rachel8

# In runtime stage
FROM alpine:3.19
COPY --from=builder /build/rachel8 /app/rachel8
CMD ["/app/rachel8"]
```

**Tradeoff:**
- **Pros:** 50% smaller image (~150MB), no node_modules, faster cold starts
- **Cons:** Can't modify code without rebuilding image, debugging is harder
- **Recommendation:** Test in staging first (not critical for Rachel8)

### Pattern 13: Bun's Native HTTP Server
**Not Applicable for Rachel8** (uses Telegram bot, not HTTP server)

For web services, Bun's built-in HTTP server is faster than Node.js:
```typescript
// Bun native server (faster than Express/Hono)
Bun.serve({
  port: 3000,
  fetch(req) {
    return new Response("Hello World");
  },
});
```

Rachel8 uses grammY for Telegram polling, so no HTTP server is needed.

## Complete Production Dockerfile

```dockerfile
# ==============================================================================
# Production-Ready Dockerfile for Rachel8
# ==============================================================================
# Features:
# - Multi-stage build (builder + runtime)
# - Alpine Linux base (~280MB final image)
# - Non-root user (UID 1000)
# - Frozen lockfile for reproducible builds
# - Layer caching optimized
# - Health check included
# - Volume for SQLite persistence
# ==============================================================================

# ==============================================================================
# STAGE 1: Builder
# ==============================================================================
FROM oven/bun:1.1.10-alpine AS builder

WORKDIR /build

# Copy dependency files first (optimize layer caching)
COPY package.json bun.lock ./

# Install dependencies with frozen lockfile
# --frozen-lockfile: Fail if lockfile doesn't match package.json
# --production: Exclude devDependencies
RUN bun install --frozen-lockfile --production

# Copy application source
COPY src/ ./src/
COPY skills/ ./skills/
COPY tsconfig.json ./

# ==============================================================================
# STAGE 2: Runtime
# ==============================================================================
FROM oven/bun:1.1.10-alpine AS runtime

# Install runtime dependencies
# git: Required by Claude Agent SDK
# ffmpeg: Media processing (audio/video)
# python3: Required for Pillow
# py3-pillow: Image processing (pre-compiled, don't use pip!)
RUN apk add --no-cache \
    git \
    ffmpeg \
    python3 \
    py3-pillow

# Create non-root user
RUN addgroup -g 1000 rachel && \
    adduser -D -u 1000 -G rachel rachel

# Create data directory for SQLite and memory files
RUN mkdir -p /data && chown rachel:rachel /data

WORKDIR /app

# Copy dependencies and source from builder
COPY --from=builder --chown=rachel:rachel /build/node_modules ./node_modules
COPY --from=builder --chown=rachel:rachel /build/package.json .
COPY --from=builder --chown=rachel:rachel /build/src ./src
COPY --from=builder --chown=rachel:rachel /build/skills ./skills
COPY --from=builder --chown=rachel:rachel /build/tsconfig.json .

# Switch to non-root user
USER rachel

# Volume for persistent data
VOLUME ["/data"]

# Environment variables (override at runtime)
ENV NODE_ENV=production \
    SHARED_FOLDER_PATH=/data \
    LOG_LEVEL=info

# Health check
# Check if Bun process is running
# Interval: 30s, Timeout: 10s, Start period: 5s, Retries: 3
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD pgrep -f "bun.*index.ts" || exit 1

# Expose no ports (Telegram bot uses outbound polling)
# EXPOSE directive omitted intentionally

# Start application
CMD ["bun", "run", "src/index.ts"]
```

## Complete Docker Run Command

```bash
#!/bin/bash
# Production deployment script for Rachel8 per-user container

USER_ID="12345"
CONTAINER_NAME="rachel-user-${USER_ID}"
VOLUME_NAME="rachel-user-${USER_ID}-data"
NETWORK_NAME="rachel-user-${USER_ID}-net"

# Create isolated network
docker network create \
  --driver=bridge \
  --opt com.docker.network.bridge.enable_icc=false \
  "${NETWORK_NAME}" 2>/dev/null || true

# Create named volume
docker volume create "${VOLUME_NAME}"

# Run container
docker run -d \
  --name="${CONTAINER_NAME}" \
  --restart=unless-stopped \
  --network="${NETWORK_NAME}" \
  --memory=512m \
  --memory-swap=512m \
  --memory-reservation=384m \
  --cpus=0.5 \
  --user=1000:1000 \
  --cap-drop=ALL \
  --security-opt=no-new-privileges \
  --read-only \
  --tmpfs /tmp:rw,noexec,nosuid,size=100m \
  --tmpfs /app/.sessions.json:rw,noexec,nosuid,size=1m \
  -v "${VOLUME_NAME}:/data:rw" \
  -e TELEGRAM_BOT_TOKEN="${TELEGRAM_BOT_TOKEN}" \
  -e OWNER_TELEGRAM_USER_ID="${USER_ID}" \
  -e ANTHROPIC_BASE_URL="https://proxy.example.com" \
  -e ANTHROPIC_AUTH_TOKEN="${USER_ANTHROPIC_TOKEN}" \
  -e GROQ_API_KEY="${GROQ_API_KEY}" \
  rachel8:latest

echo "Container ${CONTAINER_NAME} started successfully"
docker logs -f "${CONTAINER_NAME}"
```

## Build and Deployment Workflow

```bash
# 1. Build image
docker build -t rachel8:latest .

# 2. Test locally
docker run --rm \
  -e TELEGRAM_BOT_TOKEN="${TELEGRAM_BOT_TOKEN}" \
  -e OWNER_TELEGRAM_USER_ID="${USER_ID}" \
  -e ANTHROPIC_AUTH_TOKEN="${ANTHROPIC_AUTH_TOKEN}" \
  rachel8:latest

# 3. Tag for registry
docker tag rachel8:latest registry.example.com/rachel8:1.0.0

# 4. Push to registry
docker push registry.example.com/rachel8:1.0.0

# 5. Deploy per-user container (see script above)
./deploy-user.sh 12345
```

## Summary of Recommendations

| Aspect | Recommendation | Justification |
|--------|----------------|---------------|
| **Base Image** | `oven/bun:1.1.10-alpine` (pinned) | Smallest official Bun image; glibc compatible; ~100MB |
| **Build Pattern** | Multi-stage (builder + runtime) | Separates build deps from runtime; 60-90% size reduction |
| **Final Image Size** | ~280MB | Alpine + git + ffmpeg + python + Pillow + node_modules |
| **User** | Non-root (UID 1000) | Security best practice; prevents privilege escalation |
| **Capabilities** | `--cap-drop=ALL` | Remove all Linux capabilities; minimal attack surface |
| **Filesystem** | Read-only root + writable volumes | Prevents malware persistence; defense-in-depth |
| **Data Persistence** | Named volumes (`/data`) | Docker-managed; easier backups; portable |
| **Memory Limit** | 512MB hard, 384MB soft | Fits Rachel8 + Claude SDK with headroom; OOM protection |
| **CPU Limit** | 0.5 CPUs | Fair share per user; prevents single user hogging resources |
| **Restart Policy** | `unless-stopped` | Auto-restart on crash/reboot; respects manual stops |
| **Network Isolation** | Per-user bridge network, ICC disabled | Outbound-only access; no inter-container communication |
| **Health Check** | Process check every 30s | Detects hung processes; integrates with orchestrators |
| **Secrets** | Runtime env vars only | Never bake secrets into image layers |

## Sources

- [How to Deploy Bun Applications to Production](https://oneuptime.com/blog/post/2026-01-31-bun-production-deployment/view)
- [Containerize a Bun application with Docker - Bun](https://bun.com/docs/guides/ecosystem/docker)
- [Docker Production Best Practices: Security, Optimization & Monitoring](http://www.mykolaaleksandrov.dev/posts/2026/02/docker-production-best-practices/)
- [Running Bun with Docker | flori.dev](https://flori.dev/reads/running-bun-with-docker/)
- [How to Dockerize a Bun App](https://sliplane.io/blog/how-to-dockerize-a-bun-app)
- [Using Bun as the Package Manager in Production-Ready Docker Images](https://andrekoenig.de/articles/using-bun-as-the-package-manager-in-production-ready-docker-images)
- [Multi-stage | Docker Docs](https://docs.docker.com/build/building/multi-stage/)
- [Container Images Deep Dive: Alpine, Slim, Distroless, and Oven.sh](https://www.ykira.com/blog/container-images-guide)
- [How I created the smallest docker bun image](https://blog.dejangegic.com/smallest-bun-docker-image)
- [The 3 Biggest Wins When Using Alpine as a Base Docker Image](https://nickjanetakis.com/blog/the-3-biggest-wins-when-using-alpine-as-a-base-docker-image)
- [How to sandbox AI agents in 2026: MicroVMs, gVisor & isolation strategies](https://northflank.com/blog/how-to-sandbox-ai-agents)
- [How to Implement Docker Container Resource Limits](https://oneuptime.com/blog/post/2026-01-30-docker-container-resource-limits/view)
- [Docker Security Best Practices (2026)](https://thelinuxcode.com/docker-security-best-practices-2026-hardening-the-host-images-and-runtime-without-slowing-teams-down/)
- [How to Handle Docker Security Best Practices](https://oneuptime.com/blog/post/2026-02-02-docker-security-best-practices/view)
- [Enhanced Container Isolation - Docker Desktop](https://docs.docker.com/enterprise/security/hardened-desktop/enhanced-container-isolation/)
- [Security | Docker Docs](https://docs.docker.com/engine/security/)
- [Volumes | Docker Docs](https://docs.docker.com/engine/storage/volumes/)
- [Persistent Storage: Docker Bind Mounts and Named Volumes](https://www.portainer.io/blog/persistent-storage-docker-bind-mounts-and-named-volumes)
- [How to Choose Between Docker Bind Mounts and Named Volumes](https://oneuptime.com/blog/post/2026-01-16-docker-bind-mounts-vs-volumes/view)
- [Docker Volumes vs Bind Mounts: The Definitive Guide](https://mihirpopat.medium.com/docker-volumes-vs-bind-mounts-the-definitive-guide-for-scalable-containers-76c90eb4f248)
- [Understanding Docker Restart Policies: always, unless-stopped, and on-failure](https://oneuptime.com/blog/post/2026-01-16-docker-restart-policies/view)
- [Ensuring Containers Are Always Running with Docker's Restart Policy](https://www.cloudbees.com/blog/ensuring-containers-are-always-running-with-dockers-restart-policy)
- [Start containers automatically | Docker Docs](https://docs.docker.com/engine/containers/start-containers-automatically/)
- [How to Run Docker Containers as Non-Root Users](https://oneuptime.com/blog/post/2026-01-16-docker-run-non-root-user/view)
- [Securing Dockerized Applications: User Permissions and Capabilities Explained](https://medium.com/@vasanthancomrads/securing-dockerized-applications-user-permissions-and-capabilities-explained-54841c5bed9e)
- [Docker Image Security Best Practices: SBOM, Non-Root, Provenance](https://bell-sw.com/blog/docker-image-security-best-practices-for-production/)
- [Lockfile - Bun](https://bun.com/docs/pm/lockfile)
- [Reducing Docker Image Sizes: From 1.2GB to 150MB](https://betterstack.com/community/guides/scaling-docker/reducing-docker-image-size/)
- [How to Reduce Docker Image Size: 6 Optimization Methods](https://devopscube.com/reduce-docker-image-size/)
- [How to reduce your Docker image size](https://depot.dev/blog/how-to-reduce-your-docker-image-size)
- [Optimization | Docker Docs](https://docs.docker.com/build-cloud/optimization/)
- [Optimize cache usage in builds | Docker Docs](https://docs.docker.com/build/cache/optimize/)
- [Docker Build Speed: 70% Faster Builds with Layer Caching](https://www.devopsroles.com/boost-docker-build-speed-with-layer-caching/)
- [Bridge network driver | Docker Docs](https://docs.docker.com/engine/network/drivers/bridge/)
- [Understanding Docker Networks: A Comprehensive Guide](https://betterstack.com/community/guides/scaling-docker/docker-networks/)
- [Docker Bridge Network: Your Powerful Networking Guide 2026](https://cyberpanel.net/blog/docker-bridge-network)
- [DevOps Scenario #11: Why Your Docker Container Exceeds Memory Limits](https://medium.com/@mdmarjanrafi/devops-scenario-11-why-your-docker-container-exceeds-memory-limits-deep-dive-into-cgroups-7c4930633d2c)
- [Docker CPU & Memory Limits: Prevent Container Resource Exhaustion](https://oneuptime.com/blog/post/2026-01-16-docker-limit-cpu-memory/view)
- [The Complete Guide to Docker Resource Limits](https://eastondev.com/blog/en/posts/dev/20251218-docker-resource-limits-guide/)
- [Resource constraints | Docker Docs](https://docs.docker.com/engine/containers/resource_constraints/)
- [Small 49mb ffmpeg Docker images for Alpine Linux](https://github.com/sitkevij/ffmpeg)
- [Alpine Based Docker Images Make a Difference in Real World Apps](https://www.cloudbees.com/blog/alpine-based-docker-images-make-difference-real-world-apps)
- [Using Alpine, Distroless, and Multi-Stage Builds for Smaller Docker Images](https://oneuptime.com/blog/post/2026-01-16-docker-reduce-image-size/view)
- [Solved: How to Successfully Install Pillow on Alpine Linux with Docker](https://sqlpey.com/python/solved-how-to-successfully-install-pillow-on-alpine-linux-with-docker/)
