# Phase 13 Research: Dead Code Cleanup

## What's Dead

After Phase 12 rewired the control plane to Docker, the following modules are **completely unused**:

### Provisioning (9 files, ~1,600 LOC)
| File | Purpose | Status |
|------|---------|--------|
| `src/lib/provisioning/hetzner-client.ts` | Hetzner Cloud API client | Dead — replaced by orchestrator |
| `src/lib/provisioning/provision-vps.ts` | VPS provisioning orchestrator (6-phase) | Dead |
| `src/lib/provisioning/deprovision-vps.ts` | Hetzner server + SSH key deletion | Dead — replaced by `orchestrator.deprovisionContainer()` |
| `src/lib/provisioning/cloud-init-builder.ts` | cloud-config YAML builder | Dead |
| `src/lib/provisioning/ssh-injector.ts` | SSH secret injection + service startup | Dead |
| `src/lib/provisioning/ssh-exec.ts` | Generic SSH command execution | Dead |
| `src/lib/provisioning/ssh-keys.ts` | RSA 4096 SSH key generation | Dead |
| `src/lib/provisioning/vps-status.ts` | VPS status via Hetzner API + SSH restart | Dead |
| `src/lib/provisioning/types.ts` | Hetzner API types | Dead |

### Monitoring (3 files, ~500 LOC)
| File | Purpose | Status |
|------|---------|--------|
| `src/lib/monitoring/health-checker.ts` | SSH-based health sweep | Dead — orchestrator has `healthSweep()` |
| `src/lib/monitoring/health-notifications.ts` | VPS-specific email notifications | Dead — references VPS IP, SSH |
| `src/lib/monitoring/circuit-breaker.ts` | Circuit breaker pattern | Dead — orchestrator handles restart logic |

### Updates (1 file, ~400 LOC)
| File | Purpose | Status |
|------|---------|--------|
| `src/lib/updates/update-engine.ts` | SSH-based per-VPS git pull + restart | Dead — replaced by `orchestrator.updateContainer()` |

### API Routes (1 endpoint)
| File | Purpose | Status |
|------|---------|--------|
| `src/routes/api/provision/callback/[userId]/+server.ts` | Cloud-init phone_home callback | Dead — Docker doesn't use cloud-init |

### Database
- `healthChecks` table definition in schema.ts — no longer written to or read
- Legacy VPS columns in `subscriptions`: `hetznerServerId`, `hetznerSshKeyId`, `vpsIpAddress`, `vpsHostname`, `sshPrivateKey`, `currentVersion`, `targetVersion`, `previousVersion`, `lastUpdateAt`

### Dependencies
- `ssh2` — SSH client library, only used by dead provisioning code
- Any Hetzner-specific env vars: `HETZNER_API_TOKEN`

## What Still References Dead Code

### `vpsProvisioned` Column
Used in 6+ places as a "is user provisioned?" flag. This column name is misleading but the *logic* is still needed. Options:
1. Rename to `provisioned` (breaking migration)
2. Keep the name, add a comment (pragmatic)

### Import References
Some files may still import from `provisioning/` — need to grep after deletion.

## Estimated Impact
- **~2,500 lines deleted**
- **14 files removed**
- **1 npm dependency removed** (ssh2)
- Zero runtime behavior change
