# Phase 3: VPS Provisioning & Deployment - Research

**Researched:** 2026-02-14
**Domain:** VPS automation, cloud-init, SSH orchestration, Hetzner Cloud API
**Confidence:** HIGH

## Summary

Phase 3 implements automated VPS provisioning on Hetzner Cloud with cloud-init for base setup and SSH-based secret injection for security. The technical foundation is solid: Hetzner's API is well-documented with clear error codes and rate limiting, cloud-init supports all required automation tasks, and the Rachel8 deployment requirements are fully specified in the codebase.

**Key architectural decision:** Secrets (Claude OAuth tokens, Telegram bot token) must be injected via SSH after cloud-init completes, NOT via user-data, because Hetzner's user-data is visible in API responses and logs. This two-phase approach (cloud-init for infrastructure, SSH for secrets) is standard security practice.

**Critical timing constraint:** Sub-2-minute provisioning is achievable. Hetzner CX23 creation takes ~20-60 seconds, cloud-init completes in ~30-60 seconds (package installation, git clone, service setup), leaving adequate buffer. Polling should use exponential backoff starting at 2-second intervals to avoid rate limits while maintaining responsiveness.

**Primary recommendation:** Use raw TypeScript fetch with exponential backoff for Hetzner API calls (no official SDK exists), cloud-init's `phone_home` module for completion callbacks, and the `ssh2` library for TypeScript SSH automation. Store Hetzner server IDs in database for tracking and deprovisioning.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
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

### Rachel8 Deployment Facts (from codebase analysis)
- Rachel8 repo: https://github.com/polly3223/Rachel8.git (will be open-sourced)
- Single-user per VPS, single bot process
- Entry point: `bun run src/index.ts`
- systemd service: rachel8.service (template with placeholders)
- Setup wizard: `bun run setup` (interactive — must be bypassed for automation)
- VPS Requirements:
  - Ubuntu 24.04 LTS
  - Bun runtime (curl install)
  - Git + GitHub CLI (gh)
  - Claude Code CLI (requires user's Claude OAuth token)
  - No exposed ports needed (Telegram uses long polling, outbound only)
  - Passwordless sudo for rachel user
  - ~700MB disk for project + node_modules
- Per-Instance Configuration (.env):
  - TELEGRAM_BOT_TOKEN: User's bot token (from BotFather)
  - OWNER_TELEGRAM_USER_ID: User's Telegram ID
  - SHARED_FOLDER_PATH: /home/rachel/shared
  - NODE_ENV: production
  - LOG_LEVEL: info
- Claude Authentication:
  - Claude Code CLI must be logged in (`claude login`)
  - Uses OAuth 2.0 — we already have the user's Claude OAuth token from Phase 1
  - Need to inject this token into the VPS's Claude CLI config (~/.claude/)
- Critical Security Notes:
  - Claude tokens and Telegram bot token must NEVER appear in cloud-init user-data (visible in Hetzner API)
  - Inject secrets via SSH after VPS is ready
  - Rachel8 has full sudo — acceptable for single-user trusted deployment

### Claude's Discretion
- Cloud-init script structure and ordering
- SSH key management approach for control plane → user VPS
- Health check endpoint or mechanism for provisioning validation
- How to script Claude CLI auth without interactive login
- VPS naming convention
- Firewall rules via Hetzner API
- Error handling and retry strategy for API calls

### Deferred Ideas (OUT OF SCOPE)
- Multiple VPS sizes/tiers
- Custom Rachel configurations
- Multi-region deployment
- Container-based deployment (Docker/Podman)
- Terraform/Pulumi IaC
</user_constraints>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| (none) | - | Hetzner API | Raw `fetch()` — no official JS/TS SDK exists |
| ssh2 | ^1.15.0 | SSH automation | De facto standard for Node.js SSH, 11k+ stars, mature |
| exponential-backoff | ^3.1.1 | Retry with backoff | Purpose-built utility for resilient API calls |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| node-scp | ^2.0.0 | SCP file transfer | For injecting .credentials.json and .env files via SSH |
| @types/ssh2 | ^1.15.0 | TypeScript types for ssh2 | Development |

### No Additional Dependencies Needed
- **Cloud-init:** Pre-installed on Ubuntu 24.04 cloud images
- **Bun installation:** Official curl script
- **Database:** Already using Drizzle + SQLite from Phases 1-2
- **Encryption:** Already using crypto for token storage from Phase 1

**Installation:**
```bash
bun add ssh2 exponential-backoff node-scp
bun add -d @types/ssh2
```

## Architecture Patterns

### Recommended Project Structure
```
src/lib/provisioning/
├── hetzner-client.ts      # Hetzner API wrapper with retry logic
├── cloud-init-builder.ts  # Generate user-data YAML
├── ssh-injector.ts        # Inject secrets via SSH after provisioning
├── provision-vps.ts       # Main orchestration: create server + wait + inject
├── deprovision-vps.ts     # Delete server + cleanup
└── types.ts               # Hetzner API types
```

### Pattern 1: Hetzner API Client with Exponential Backoff

**What:** Wrapper around fetch() for Hetzner API calls with automatic retry on rate limits and transient errors.

**When to use:** All Hetzner API operations (create server, delete server, poll actions).

**Example:**
```typescript
// Source: Hetzner API docs + exponential-backoff pattern
import { backOff } from 'exponential-backoff';

interface HetznerConfig {
  apiToken: string;
  baseUrl?: string;
}

export class HetznerClient {
  private apiToken: string;
  private baseUrl: string;

  constructor(config: HetznerConfig) {
    this.apiToken = config.apiToken;
    this.baseUrl = config.baseUrl || 'https://api.hetzner.cloud/v1';
  }

  private async request<T>(
    endpoint: string,
    options?: RequestInit
  ): Promise<T> {
    return backOff(
      async () => {
        const response = await fetch(`${this.baseUrl}${endpoint}`, {
          ...options,
          headers: {
            'Authorization': `Bearer ${this.apiToken}`,
            'Content-Type': 'application/json',
            ...options?.headers,
          },
        });

        // Handle rate limiting
        if (response.status === 429) {
          const resetHeader = response.headers.get('RateLimit-Reset');
          const resetTime = resetHeader ? parseInt(resetHeader, 10) * 1000 : Date.now() + 60000;
          const waitMs = resetTime - Date.now();
          throw new Error(`Rate limited. Retry after ${waitMs}ms`);
        }

        // Handle other errors
        if (!response.ok) {
          const errorBody = await response.json();
          throw new Error(`Hetzner API error: ${errorBody.error?.message || response.statusText}`);
        }

        return response.json();
      },
      {
        numOfAttempts: 5,
        startingDelay: 1000,
        timeMultiple: 2,
        maxDelay: 30000,
        jitter: 'full',
      }
    );
  }

  async createServer(params: CreateServerRequest): Promise<CreateServerResponse> {
    return this.request<CreateServerResponse>('/servers', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  async deleteServer(serverId: number): Promise<void> {
    await this.request(`/servers/${serverId}`, { method: 'DELETE' });
  }

  async getServerActions(serverId: number): Promise<ActionsResponse> {
    return this.request<ActionsResponse>(`/servers/${serverId}/actions`);
  }
}
```

### Pattern 2: Cloud-Init User-Data Builder

**What:** Generate cloud-init YAML for VPS initialization (non-secret setup only).

**When to use:** During VPS creation to prepare infrastructure before secret injection.

**Example:**
```typescript
// Source: cloud-init documentation
interface CloudInitConfig {
  username: string;
  sshPublicKey: string;
  callbackUrl: string;
}

export function buildCloudInitUserData(config: CloudInitConfig): string {
  // IMPORTANT: 32KiB limit on user-data
  const cloudConfig = {
    '#cloud-config': null,
    users: [
      {
        name: config.username,
        groups: ['sudo'],
        sudo: 'ALL=(ALL) NOPASSWD:ALL',
        shell: '/bin/bash',
        ssh_authorized_keys: [config.sshPublicKey],
      },
    ],
    packages: [
      'git',
      'curl',
      'unzip',
    ],
    runcmd: [
      // Install Bun
      'curl -fsSL https://bun.sh/install | bash',
      `echo 'export BUN_INSTALL="/home/${config.username}/.bun"' >> /home/${config.username}/.bashrc`,
      `echo 'export PATH="$BUN_INSTALL/bin:$PATH"' >> /home/${config.username}/.bashrc`,

      // Install GitHub CLI
      'curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg | sudo dd of=/usr/share/keyrings/githubcli-archive-keyring.gpg',
      'echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" | sudo tee /etc/apt/sources.list.d/github-cli.list > /dev/null',
      'apt update && apt install -y gh',

      // Install Claude Code CLI (assuming it's available via curl or npm)
      // This needs verification — may need to be done via SSH after provisioning
      'curl -fsSL https://code.claude.com/install.sh | bash',

      // Clone Rachel8 repo (public after open-sourcing)
      `su - ${config.username} -c 'cd ~ && git clone https://github.com/polly3223/Rachel8.git rachel8'`,

      // Install dependencies
      `su - ${config.username} -c 'cd ~/rachel8 && /home/${config.username}/.bun/bin/bun install'`,

      // Create shared folder
      `mkdir -p /home/${config.username}/shared`,
      `chown -R ${config.username}:${config.username} /home/${config.username}/shared`,

      // Signal completion to control plane
      `curl -X POST -H "Content-Type: application/json" -d '{"status":"ready","hostname":"$(hostname)"}' ${config.callbackUrl}`,
    ],
  };

  return `#cloud-config\n${JSON.stringify(cloudConfig, null, 2)}`;
}
```

### Pattern 3: SSH Secret Injection

**What:** Connect via SSH after cloud-init completes to inject secrets (Claude tokens, Telegram bot token, .env file).

**When to use:** After VPS reports ready status, before starting Rachel8 service.

**Example:**
```typescript
// Source: ssh2 + node-scp documentation
import { Client } from 'ssh2';
import { Client as ScpClient } from 'node-scp';
import fs from 'fs/promises';
import path from 'path';

interface SecretInjectionConfig {
  host: string;
  username: string;
  privateKey: string;
  claudeAccessToken: string; // Decrypted from DB
  claudeRefreshToken: string; // Decrypted from DB
  claudeExpiresAt: number;
  telegramBotToken: string; // Decrypted from DB
  ownerTelegramUserId: string;
}

export async function injectSecrets(config: SecretInjectionConfig): Promise<void> {
  const conn = new Client();

  await new Promise<void>((resolve, reject) => {
    conn.on('ready', async () => {
      try {
        // 1. Create .claude directory
        await execCommand(conn, `mkdir -p /home/${config.username}/.claude`);

        // 2. Write .credentials.json for Claude CLI
        const claudeCredentials = {
          claudeAiOauth: {
            accessToken: config.claudeAccessToken,
            refreshToken: config.claudeRefreshToken,
            expiresAt: config.claudeExpiresAt,
            scopes: ['user:inference', 'user:profile'],
          },
        };

        const credentialsJson = JSON.stringify(claudeCredentials, null, 2);
        await execCommand(conn, `cat > /home/${config.username}/.claude/.credentials.json << 'EOF'\n${credentialsJson}\nEOF`);
        await execCommand(conn, `chmod 600 /home/${config.username}/.claude/.credentials.json`);

        // 3. Write .env file for Rachel8
        const envContent = [
          '# Rachel8 Configuration (auto-generated by Rachel Cloud)',
          `TELEGRAM_BOT_TOKEN=${config.telegramBotToken}`,
          `OWNER_TELEGRAM_USER_ID=${config.ownerTelegramUserId}`,
          `SHARED_FOLDER_PATH=/home/${config.username}/shared`,
          'NODE_ENV=production',
          'LOG_LEVEL=info',
        ].join('\n');

        await execCommand(conn, `cat > /home/${config.username}/rachel8/.env << 'EOF'\n${envContent}\nEOF`);
        await execCommand(conn, `chmod 600 /home/${config.username}/rachel8/.env`);

        // 4. Install systemd service (substitute placeholders in rachel8.service template)
        const bunPath = `/home/${config.username}/.bun/bin/bun`;
        const workingDir = `/home/${config.username}/rachel8`;

        await execCommand(conn, `cd ${workingDir} && sed -i 's|__USER__|${config.username}|g' rachel8.service`);
        await execCommand(conn, `cd ${workingDir} && sed -i 's|__WORKING_DIR__|${workingDir}|g' rachel8.service`);
        await execCommand(conn, `cd ${workingDir} && sed -i 's|__BUN_PATH__|${bunPath}|g' rachel8.service`);
        await execCommand(conn, `sudo cp ${workingDir}/rachel8.service /etc/systemd/system/`);

        // 5. Enable and start service
        await execCommand(conn, 'sudo systemctl daemon-reload');
        await execCommand(conn, 'sudo systemctl enable rachel8');
        await execCommand(conn, 'sudo systemctl start rachel8');

        // 6. Verify service started
        const status = await execCommand(conn, 'sudo systemctl is-active rachel8');
        if (!status.includes('active')) {
          throw new Error(`Service failed to start. Status: ${status}`);
        }

        resolve();
      } catch (err) {
        reject(err);
      } finally {
        conn.end();
      }
    });

    conn.on('error', reject);

    conn.connect({
      host: config.host,
      port: 22,
      username: config.username,
      privateKey: config.privateKey,
      readyTimeout: 30000,
    });
  });
}

function execCommand(conn: Client, command: string): Promise<string> {
  return new Promise((resolve, reject) => {
    conn.exec(command, (err, stream) => {
      if (err) return reject(err);

      let stdout = '';
      let stderr = '';

      stream.on('data', (data: Buffer) => {
        stdout += data.toString();
      });

      stream.stderr.on('data', (data: Buffer) => {
        stderr += data.toString();
      });

      stream.on('close', (code: number) => {
        if (code !== 0) {
          reject(new Error(`Command failed with code ${code}: ${stderr}`));
        } else {
          resolve(stdout.trim());
        }
      });
    });
  });
}
```

### Pattern 4: Main Provisioning Orchestrator

**What:** Top-level function that coordinates: create server → wait for ready → inject secrets → validate.

**When to use:** Called after user completes onboarding + payment (from payment webhook or manual trigger).

**Example:**
```typescript
// Source: Integration of all patterns above
interface ProvisionVPSParams {
  userId: string;
  userEmail: string;
  telegramUserId: string;
}

export async function provisionVPS(params: ProvisionVPSParams): Promise<void> {
  const startTime = Date.now();

  try {
    // 1. Get user's encrypted tokens from database
    const claudeTokens = await getClaudeTokens(params.userId);
    const telegramToken = await getTelegramBotToken(params.userId);

    // 2. Decrypt tokens
    const decryptedClaudeAccess = decrypt(claudeTokens.encryptedAccessToken);
    const decryptedClaudeRefresh = decrypt(claudeTokens.encryptedRefreshToken);
    const decryptedTelegramToken = decrypt(telegramToken.encryptedToken);

    // 3. Generate SSH key pair for this VPS
    const { publicKey, privateKey } = await generateSSHKeyPair();

    // 4. Upload SSH key to Hetzner
    const sshKeyResponse = await hetznerClient.createSSHKey({
      name: `rachel-cloud-${params.userId}`,
      public_key: publicKey,
    });

    // 5. Build cloud-init user-data
    const userData = buildCloudInitUserData({
      username: 'rachel',
      sshPublicKey: publicKey,
      callbackUrl: `${process.env.BASE_URL}/api/provision/callback/${params.userId}`,
    });

    // 6. Create server
    const serverResponse = await hetznerClient.createServer({
      name: `rachel-cloud-${params.userId}`,
      server_type: 'cx23',
      image: 'ubuntu-24.04',
      location: 'nbg1', // Nuremberg (same as control plane)
      ssh_keys: [sshKeyResponse.ssh_key.id],
      user_data: userData,
      firewalls: [{ firewall: await getOrCreateFirewallId() }],
      start_after_create: true,
    });

    const serverId = serverResponse.server.id;
    const serverIp = serverResponse.server.public_net.ipv4.ip;

    // 7. Store server info in database
    await updateSubscription(params.userId, {
      vpsProvisioned: true,
      hetznerServerId: serverId,
      vpsIpAddress: serverIp,
    });

    // 8. Poll for server ready (cloud-init completion callback sets flag in DB)
    await waitForCloudInitReady(params.userId, 120000); // 2-minute timeout

    // 9. Inject secrets via SSH
    await injectSecrets({
      host: serverIp,
      username: 'rachel',
      privateKey,
      claudeAccessToken: decryptedClaudeAccess,
      claudeRefreshToken: decryptedClaudeRefresh,
      claudeExpiresAt: claudeTokens.expiresAt.getTime(),
      telegramBotToken: decryptedTelegramToken,
      ownerTelegramUserId: params.telegramUserId,
    });

    // 10. Validate Rachel8 is running
    await validateRachel8Running(serverIp, privateKey);

    const elapsed = Date.now() - startTime;
    console.log(`VPS provisioned in ${elapsed}ms`);
  } catch (error) {
    // Clean up failed provision
    await cleanupFailedProvision(params.userId);
    throw error;
  }
}
```

### Anti-Patterns to Avoid

- **Secrets in cloud-init user-data:** User-data is visible in Hetzner API responses and logs. Always use SSH for secret injection.
- **Synchronous polling without backoff:** Hammering the Hetzner API will trigger rate limits (3600 req/hour). Use exponential backoff starting at 2s.
- **No timeout on cloud-init:** Cloud-init can hang on package installation failures. Implement 2-minute hard timeout.
- **Storing decrypted tokens in memory longer than needed:** Decrypt just before SSH injection, clear from memory immediately after.
- **Not cleaning up on failure:** Zombie VPSs cost money. Always delete server if provisioning fails after server creation.
- **Using interactive commands in cloud-init:** Commands like `bun run setup` that prompt for input will hang. Bypass with direct file writes.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| SSH connection management | Custom socket wrapper | `ssh2` library | Handles auth methods, keep-alives, session management, edge cases like network interruptions |
| Retry logic | Custom setTimeout loops | `exponential-backoff` library | Handles jitter, max attempts, configurable backoff strategies, proven algorithms |
| Cloud-init YAML generation | String concatenation | Typed object → YAML | Type safety prevents syntax errors, easier to test, catches mistakes at compile time |
| SSH key generation | Shell out to ssh-keygen | Node crypto module | Cross-platform, no external dependencies, type-safe |
| Hetzner API types | any everywhere | Codegen from OpenAPI spec or hand-written types | Type safety prevents runtime errors, autocomplete improves DX |

**Key insight:** VPS provisioning has many failure modes (network timeouts, API rate limits, package installation failures, SSH connection drops). Use battle-tested libraries for low-level operations and focus custom code on business logic (provisioning flow, database updates, error recovery).

## Common Pitfalls

### Pitfall 1: Cloud-Init User-Data Size Exceeded

**What goes wrong:** Hetzner has a 32KiB limit on user-data. Embedding large scripts or files exceeds this limit and provisioning fails silently.

**Why it happens:** Developers inline entire setup scripts or configuration files directly in cloud-init YAML.

**How to avoid:**
- Keep user-data minimal: install packages, clone repo, run setup from repo.
- Use `write_files` for small configs only (<1KB each).
- For larger files, use `runcmd` to download from control plane or inject via SSH.

**Warning signs:**
- User-data over 25KB (leaves no safety margin).
- Embedding multi-line scripts inline instead of downloading them.

### Pitfall 2: Race Condition Between Cloud-Init and SSH Injection

**What goes wrong:** SSH injection attempts to connect before cloud-init finishes, leading to connection refused or SSH key not yet authorized.

**Why it happens:** Polling server status returns "running" before cloud-init completes.

**How to avoid:**
- Use cloud-init's `phone_home` module to POST to a callback URL when cloud-init finishes.
- Set a flag in the database when callback is received.
- SSH injection only proceeds after flag is set OR after a safety timeout (90 seconds).

**Warning signs:**
- SSH connection errors in first 60 seconds after server creation.
- Retry logic attempting SSH immediately after Hetzner reports server as "running".

### Pitfall 3: Hetzner Rate Limit Exhaustion During Bulk Operations

**What goes wrong:** Polling multiple server actions concurrently triggers rate limits (3600 req/hour = 60 req/min = 1 req/sec sustained).

**Why it happens:** Naive polling at 1-second intervals for multiple servers quickly exhausts the limit.

**How to avoid:**
- Use exponential backoff: start at 2s, increase to 4s, 8s, 16s, max 30s.
- Add jitter to prevent thundering herd.
- Batch multiple provisioning operations with staggered start times.

**Warning signs:**
- 429 Too Many Requests errors.
- RateLimit-Remaining header approaching zero.

### Pitfall 4: systemd Service Fails to Start Due to Missing .env

**What goes wrong:** systemd service starts before SSH injection completes, .env file doesn't exist, service crashes immediately.

**Why it happens:** Service file doesn't have `ConditionPathExists=.env` or service is enabled during cloud-init.

**How to avoid:**
- Include `ConditionPathExists=/home/rachel/rachel8/.env` in systemd service file.
- Only enable/start service during SSH injection phase, NOT in cloud-init.
- Add validation: check systemd status after starting service.

**Warning signs:**
- Service status shows "activating" then "failed" in journalctl.
- Error message: "TELEGRAM_BOT_TOKEN is required".

### Pitfall 5: Claude CLI Authentication Fails After Token Injection

**What goes wrong:** Injecting .credentials.json doesn't authenticate Claude CLI; commands fail with "not logged in".

**Why it happens:** Claude CLI might use keychain/system credential manager on Linux, not just file-based config.

**How to avoid:**
- Test token injection on a clean Ubuntu 24.04 VM before production.
- Check if Claude CLI has a non-interactive auth method (environment variable, stdin).
- Fallback: use Claude API directly with access token instead of relying on CLI.

**Warning signs:**
- .credentials.json exists with correct format but `claude --version` shows "not authenticated".
- Need to run `claude login` manually after provisioning.

### Pitfall 6: Zombie VPS After Provisioning Failure

**What goes wrong:** Provisioning fails halfway (e.g., cloud-init times out), server is created but not cleaned up, billing continues.

**Why it happens:** No cleanup logic in error handling, or cleanup fails silently.

**How to avoid:**
- Wrap provisioning in try-catch with guaranteed cleanup in catch block.
- Store server ID in database IMMEDIATELY after creation, before waiting for ready status.
- Implement reconciliation cron job: find servers in "provisioning" state for >5 minutes and clean up.
- Log all cleanup attempts with outcome.

**Warning signs:**
- Database shows vpsProvisioned=false but Hetzner console shows active server.
- Monthly bill shows more servers than active users.

## Code Examples

Verified patterns from official sources:

### Hetzner API: Create Server with All Parameters

```typescript
// Source: https://docs.hetzner.cloud/reference/cloud
interface CreateServerRequest {
  name: string; // Unique per project, valid hostname per RFC 1123
  server_type: string; // e.g., "cx23"
  image: string; // e.g., "ubuntu-24.04"
  location?: string; // e.g., "nbg1" (Nuremberg)
  ssh_keys?: number[]; // Array of SSH key IDs
  user_data?: string; // Cloud-init script (max 32KiB)
  firewalls?: Array<{ firewall: number }>; // Firewall IDs to apply
  start_after_create?: boolean; // Default: true
  public_net?: {
    enable_ipv4: boolean;
    enable_ipv6: boolean;
  };
}

interface CreateServerResponse {
  server: {
    id: number;
    name: string;
    status: string; // "initializing" | "running" | "off"
    public_net: {
      ipv4: {
        ip: string;
        blocked: boolean;
      };
      ipv6: {
        ip: string;
        blocked: boolean;
      };
    };
    created: string; // ISO 8601 timestamp
  };
  action: {
    id: number;
    command: string;
    status: string; // "running" | "success" | "error"
    progress: number; // 0-100
    started: string;
    finished: string | null;
  };
  next_actions: Array<{
    id: number;
    command: string;
    status: string;
  }>;
}

// Example request
const createRequest: CreateServerRequest = {
  name: 'rachel-cloud-user123',
  server_type: 'cx23',
  image: 'ubuntu-24.04',
  location: 'nbg1',
  ssh_keys: [12345], // SSH key ID from createSSHKey
  user_data: cloudInitYaml,
  firewalls: [{ firewall: 67890 }],
  start_after_create: true,
};
```

### Hetzner API: Poll Action Status

```typescript
// Source: https://docs.hetzner.cloud/reference/cloud
interface Action {
  id: number;
  command: string; // e.g., "create_server", "start_server"
  status: 'running' | 'success' | 'error';
  progress: number; // 0-100
  started: string; // ISO 8601
  finished: string | null; // ISO 8601
  error: {
    code: string;
    message: string;
  } | null;
  resources: Array<{
    id: number;
    type: string; // e.g., "server"
  }>;
}

async function pollActionUntilComplete(
  client: HetznerClient,
  serverId: number,
  actionId: number,
  timeoutMs: number = 120000
): Promise<Action> {
  const startTime = Date.now();
  let delay = 2000; // Start at 2 seconds

  while (Date.now() - startTime < timeoutMs) {
    const response = await client.getServerActions(serverId);
    const action = response.actions.find(a => a.id === actionId);

    if (!action) {
      throw new Error(`Action ${actionId} not found`);
    }

    if (action.status === 'success') {
      return action;
    }

    if (action.status === 'error') {
      throw new Error(`Action failed: ${action.error?.message}`);
    }

    // Exponential backoff with jitter
    const jitter = Math.random() * 1000;
    await new Promise(resolve => setTimeout(resolve, delay + jitter));
    delay = Math.min(delay * 2, 30000); // Max 30 seconds
  }

  throw new Error(`Action ${actionId} timed out after ${timeoutMs}ms`);
}
```

### Cloud-Init: phone_home Module for Completion Callback

```yaml
# Source: https://cloudinit.readthedocs.io/en/latest/reference/yaml_examples/phone_home.html
#cloud-config
phone_home:
  url: https://rachel-cloud.example.com/api/provision/callback/$INSTANCE_ID
  post:
    - pub_key_rsa
    - pub_key_ecdsa
    - pub_key_ed25519
    - instance_id
    - hostname
  tries: 10
```

Equivalent in TypeScript builder:

```typescript
const cloudConfig = {
  phone_home: {
    url: `${process.env.BASE_URL}/api/provision/callback/${userId}`,
    post: ['instance_id', 'hostname'],
    tries: 10,
  },
};
```

### SSH2: Execute Commands and Handle Errors

```typescript
// Source: https://github.com/mscdex/ssh2
import { Client } from 'ssh2';

async function execSSHCommand(
  host: string,
  username: string,
  privateKey: string,
  command: string
): Promise<string> {
  return new Promise((resolve, reject) => {
    const conn = new Client();

    conn.on('ready', () => {
      conn.exec(command, (err, stream) => {
        if (err) {
          conn.end();
          return reject(err);
        }

        let stdout = '';
        let stderr = '';

        stream.on('data', (data: Buffer) => {
          stdout += data.toString();
        });

        stream.stderr.on('data', (data: Buffer) => {
          stderr += data.toString();
        });

        stream.on('close', (code: number) => {
          conn.end();

          if (code !== 0) {
            reject(new Error(`Command exited with code ${code}: ${stderr}`));
          } else {
            resolve(stdout.trim());
          }
        });
      });
    });

    conn.on('error', (err) => {
      reject(err);
    });

    conn.connect({
      host,
      port: 22,
      username,
      privateKey,
      readyTimeout: 30000, // 30 second connection timeout
    });
  });
}
```

### Systemd Service File Generation (from Rachel8 codebase)

```typescript
// Source: /home/rachel/rachel8/src/setup/install.ts
function generateSystemdService(config: {
  user: string;
  workingDir: string;
  bunPath: string;
}): string {
  return `[Unit]
Description=Rachel8 Personal AI Assistant
After=network.target

# Only start if .env exists (prevents crash loop on missing config)
ConditionPathExists=${config.workingDir}/.env

# Rate limiting: max 5 restarts in 300s window
StartLimitIntervalSec=300
StartLimitBurst=5

[Service]
Type=simple
User=${config.user}
WorkingDirectory=${config.workingDir}
ExecStart=${config.bunPath} run src/index.ts
Restart=always
RestartSec=5s
RestartSteps=5
RestartMaxDelaySec=60s

# Graceful shutdown
TimeoutStopSec=10
KillMode=mixed
KillSignal=SIGTERM

# Environment
Environment="NODE_ENV=production"

# Rachel needs full sudo access for shell commands
# NoNewPrivileges intentionally omitted — required for sudo escalation
PrivateTmp=true

# Logging: stdout/stderr go to journalctl
StandardOutput=journal
StandardError=journal
SyslogIdentifier=rachel8

[Install]
WantedBy=multi-user.target
`;
}
```

### Claude CLI .credentials.json Format

```typescript
// Source: Search results + GitHub issues
interface ClaudeCredentials {
  claudeAiOauth: {
    accessToken: string; // e.g., "sk-ant-oat01-..."
    refreshToken: string; // e.g., "sk-ant-ort01-..."
    expiresAt: number; // Unix timestamp in milliseconds
    scopes: string[]; // e.g., ["user:inference", "user:profile"]
  };
}

// Example
const credentials: ClaudeCredentials = {
  claudeAiOauth: {
    accessToken: 'sk-ant-oat01-AbCdEf123...',
    refreshToken: 'sk-ant-ort01-XyZ789...',
    expiresAt: 1748658860401,
    scopes: ['user:inference', 'user:profile'],
  },
};

// Write to ~/.claude/.credentials.json
await fs.writeFile(
  '/home/rachel/.claude/.credentials.json',
  JSON.stringify(credentials, null, 2),
  { mode: 0o600 } // rw------- (owner only)
);
```

### Database Schema Extension for VPS Tracking

```typescript
// Source: /tmp/rachel-cloud/src/lib/db/schema.ts
// Extend existing subscriptions table with VPS fields
export const subscriptions = sqliteTable('subscriptions', {
  // ... existing fields from Phase 2 ...
  vpsProvisioned: integer('vps_provisioned', { mode: 'boolean' })
    .notNull()
    .$defaultFn(() => false),

  // New fields for Phase 3
  hetznerServerId: integer('hetzner_server_id'),
  hetznerSshKeyId: integer('hetzner_ssh_key_id'),
  vpsIpAddress: text('vps_ip_address'),
  vpsHostname: text('vps_hostname'),
  provisioningStatus: text('provisioning_status', {
    enum: ['pending', 'creating', 'cloud_init', 'injecting_secrets', 'ready', 'failed']
  }),
  provisioningError: text('provisioning_error'),
  provisionedAt: integer('provisioned_at', { mode: 'timestamp' }),
  deprovisionedAt: integer('deprovisioned_at', { mode: 'timestamp' }),
});
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| cloud-config v1 | cloud-config v2 (network config) | cloud-init 18+ | Network setup requires YAML v2 syntax |
| Manual SSH key upload | Hetzner SSH keys API | 2020 | Keys reusable across servers, managed via API |
| systemd RestartSec fixed | RestartSteps exponential backoff | systemd 254 (2023) | Graceful degradation on failures |
| Bun via npm | Bun native install script | 2023 | Faster installation, no Node.js dependency |
| GitHub token in env | gh auth login --with-token | gh CLI 2.0 (2021) | Non-interactive auth for CI/CD |

**Deprecated/outdated:**
- **chef/puppet for VPS config:** Cloud-init is now standard for cloud VMs, simpler for single-purpose VMs
- **Docker on single-user VPS:** Adds complexity without multi-tenancy benefits, systemd is sufficient
- **Python-based Hetzner libraries:** No official JS/TS SDK, raw fetch is more maintainable than community wrappers

## Open Questions

### 1. Claude Code CLI Non-Interactive Authentication

**What we know:**
- .credentials.json format is confirmed (claudeAiOauth object with accessToken, refreshToken, expiresAt, scopes)
- File location: ~/.claude/.credentials.json on Linux/Windows
- macOS uses Keychain instead of file

**What's unclear:**
- Does Claude CLI automatically detect and use .credentials.json on Linux?
- Is there an environment variable fallback (e.g., CLAUDE_ACCESS_TOKEN)?
- Does the CLI validate/refresh tokens on first use, or trust the file?

**Recommendation:**
- **Test on Ubuntu 24.04 VM before production:** Create .credentials.json with known valid tokens, verify `claude --version` and agent commands work
- **Fallback plan:** If file injection doesn't work, use Claude API directly with access token (bypass CLI entirely)
- **Phase 3 validation task:** Confirm authentication mechanism works end-to-end

### 2. GitHub CLI Authentication for Rachel8's Git Operations

**What we know:**
- Rachel8 clones from public repo (no auth needed for clone)
- gh CLI can authenticate with `gh auth login --with-token`
- GITHUB_TOKEN environment variable is respected

**What's unclear:**
- Does Rachel8 need to push commits back to GitHub? (Check Phase 6 requirements)
- If yes, do we need a user-specific GitHub token or a service account?

**Recommendation:**
- **For Phase 3 (MVP):** Rachel8 only needs to clone (no auth required) — defer GitHub auth to Phase 6
- **If push required later:** Inject GITHUB_TOKEN via .env or use gh auth login during SSH injection

### 3. Optimal Timeout Values for 2-Minute SLA

**What we know:**
- Hetzner server creation: ~20-60 seconds
- Cloud-init package installation + git clone + bun install: ~30-60 seconds
- SSH injection: ~5-10 seconds
- Total theoretical: 55-130 seconds

**What's unclear:**
- What's the 99th percentile timing in production?
- Should we fail fast at 120 seconds or retry with degraded UX?

**Recommendation:**
- **Initial timeout:** 120 seconds (hard limit for "under 2 minutes" promise)
- **Instrumentation:** Log timing for each phase (server create, cloud-init, SSH inject)
- **Phase 3 validation:** Run 50 test provisions, measure p50/p95/p99 timings
- **If >5% exceed 120s:** Optimize slowest step (likely package installation — consider pre-baked image)

### 4. Firewall Rules and VPS Security

**What we know:**
- Requirement: "Each VPS has a firewall (SSH only)"
- Hetzner supports firewalls via API
- No inbound ports needed for Telegram bot (uses long polling)

**What's unclear:**
- Should firewall allow SSH from anywhere, or only from control plane IP?
- Do we need egress rules (block certain outbound traffic)?

**Recommendation:**
- **Inbound rules:** Allow SSH (port 22) from control plane IP only (lockdown after initial setup)
- **Outbound rules:** Allow all (Rachel8 needs to reach Telegram API, Claude API, arbitrary URLs for agent tasks)
- **Phase 3 implementation:** Create firewall resource on first provision, reuse for all subsequent VPSs
- **Future hardening (Phase 7+):** Disable SSH after initial setup, use Hetzner console for emergency access

## Sources

### Primary (HIGH confidence)

**Hetzner Cloud API:**
- [Hetzner API Overview](https://docs.hetzner.cloud/) - API structure, authentication
- [Hetzner Cloud API Reference](https://docs.hetzner.cloud/reference/cloud) - POST /servers, error codes, rate limiting
- [Hetzner Cloud Python Docs](https://hcloud-python.readthedocs.io/en/stable/api.html) - API patterns, polling intervals

**Cloud-Init:**
- [cloud-init Examples](https://cloudinit.readthedocs.io/en/latest/reference/examples.html) - write_files, runcmd, packages, users
- [cloud-init phone_home](https://cloudinit.readthedocs.io/en/latest/reference/yaml_examples/phone_home.html) - Completion callbacks
- [Cloud-Init Troubleshooting](https://amf3.github.io/articles/cloudinit/troubleshooting/) - Validation, debugging

**Rachel8 Codebase:**
- /home/rachel/rachel8/rachel8.service - systemd service template
- /home/rachel/rachel8/src/setup/install.ts - Service installation logic
- /home/rachel/rachel8/.env.example - Required environment variables
- /tmp/rachel-cloud/src/lib/db/schema.ts - Database schema with vpsProvisioned field

**Bun Runtime:**
- [Bun Installation](https://bun.sh/docs/installation) - Official curl install script
- [Bun systemd Guide](https://bun.com/docs/guides/ecosystem/systemd) - systemd service configuration

### Secondary (MEDIUM confidence)

**SSH & Node.js:**
- [ssh2 GitHub](https://github.com/mscdex/ssh2) - SSH client library
- [node-scp npm](https://www.npmjs.com/package/node-scp) - SCP file transfer
- [ssh2-promise GitHub](https://github.com/sanketbajoria/ssh2-promise) - Promise wrapper for ssh2

**Retry & Error Handling:**
- [exponential-backoff npm](https://www.npmjs.com/package/exponential-backoff) - Retry utility
- [React Error Handling: Exponential Backoff](https://medium.com/@vnkelkar11/react-error-handling-best-practices-exponential-backoff-for-fetch-requests-9c24d119dcda) - Retry patterns

**GitHub CLI:**
- [GitHub CLI Manual](https://cli.github.com/manual/gh_auth_login) - Authentication methods
- [Install GitHub CLI on Ubuntu 24.04](https://linuxcapable.com/how-to-install-github-cli-on-ubuntu-linux/) - Installation steps

**Claude Code CLI:**
- [Claude Code Authentication Docs](https://code.claude.com/docs/en/authentication) - Credential storage
- [Claude Code Settings](https://code.claude.com/docs/en/settings) - Configuration files
- [Claude Code Config Locations](https://inventivehq.com/knowledge-base/claude/where-configuration-files-are-stored) - ~/.claude structure

**Systemd:**
- [Setting Environment Variables in systemd](https://www.baeldung.com/linux/systemd-services-environment-variables) - EnvironmentFile usage
- [How to Create a systemd Service on Ubuntu 24.04](https://wiki.fascinated.cc/wiki/systemd/creating-a-systemd-service/) - Service creation guide

### Tertiary (LOW confidence - marked for validation)

**Claude OAuth Schema:**
- [Setup Container Authentication](https://claude-did-this.com/claude-hub/getting-started/setup-container-guide) - .credentials.json format
- [OAuth Refresh Token Issue](https://github.com/anthropics/claude-code/issues/21765) - Token refresh mechanics

**Hetzner Community:**
- [Hetzner Cloud Deploy Action](https://github.com/TimDaub/hetzner-cloud-deploy-server-action) - VPS automation patterns
- [Hetzner Cloud Init Example](https://github.com/tech-otaku/hetzner-cloud-init) - User-data examples

## Metadata

**Confidence breakdown:**
- **Hetzner API:** HIGH - Official docs, well-documented error codes and rate limits
- **Cloud-init:** HIGH - Official docs, mature technology (10+ years), examples verified
- **SSH automation:** HIGH - ssh2 is de facto standard, 11k stars, mature
- **Rachel8 deployment:** HIGH - Direct codebase analysis, requirements are explicit
- **Claude CLI auth:** MEDIUM-LOW - .credentials.json format confirmed from multiple sources, but non-interactive auth not officially documented (needs validation)
- **Timing estimates:** MEDIUM - Based on community reports, needs production validation

**Research date:** 2026-02-14
**Valid until:** 2026-03-31 (45 days - Hetzner API is stable, cloud-init is mature, main risk is Claude CLI changes)

**Next steps for planner:**
1. Create database migration to add VPS tracking fields to subscriptions table
2. Build hetzner-client.ts with retry logic and rate limit handling
3. Build cloud-init-builder.ts with 32KiB size validation
4. Build ssh-injector.ts with timeout and error handling
5. Create provision-vps.ts orchestrator with cleanup on failure
6. Implement deprovisionVPS() to replace stub from Phase 2
7. Add /api/provision/callback endpoint for cloud-init phone_home
8. Test end-to-end on staging Hetzner account before production
9. **CRITICAL:** Validate Claude CLI .credentials.json authentication on clean Ubuntu 24.04 VM
