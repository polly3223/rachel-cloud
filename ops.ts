#!/usr/bin/env bun
/**
 * Rachel Cloud Ops CLI
 *
 * Internal tool for managing customer VPSs. NOT part of the public repo.
 * Used by the main Rachel instance to diagnose and fix customer issues.
 *
 * Usage:
 *   bun run ops.ts list                       — List all active VPSs
 *   bun run ops.ts status <email>             — Check VPS + service status
 *   bun run ops.ts logs <email> [lines]       — Fetch Rachel8 service logs
 *   bun run ops.ts restart <email>            — Restart Rachel8 service
 *   bun run ops.ts ssh <email> "<command>"    — Run arbitrary command on VPS
 *   bun run ops.ts diagnose <email>           — Full diagnostic report
 */

import { Database } from "bun:sqlite";
import { createDecipheriv } from "node:crypto";
import { Client } from "ssh2";

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const DB_PATH = "/home/rachel/rachel-cloud/data/rachel-cloud.db";

// Load ENCRYPTION_KEY from rachel-cloud .env
const envFile = await Bun.file("/home/rachel/rachel-cloud/.env").text();
const encryptionKey = envFile
  .split("\n")
  .find((l) => l.startsWith("ENCRYPTION_KEY="))
  ?.split("=")[1]
  ?.trim();

if (!encryptionKey) {
  console.error("ERROR: ENCRYPTION_KEY not found in rachel-cloud .env");
  process.exit(1);
}

// Set it so the decrypt function works
process.env.ENCRYPTION_KEY = encryptionKey;

// ---------------------------------------------------------------------------
// Crypto (inline to avoid SvelteKit import issues)
// ---------------------------------------------------------------------------

function decryptToken(ciphertext: string): string {
  const key = Buffer.from(encryptionKey!, "base64");
  const parsed = JSON.parse(
    Buffer.from(ciphertext, "base64").toString("utf8"),
  );
  const iv = Buffer.from(parsed.iv, "base64");
  const encrypted = Buffer.from(parsed.encrypted, "base64");
  const authTag = Buffer.from(parsed.authTag, "base64");

  const decipher = createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(authTag);
  const decrypted = Buffer.concat([
    decipher.update(encrypted),
    decipher.final(),
  ]);
  return decrypted.toString("utf8");
}

// ---------------------------------------------------------------------------
// SSH (inline to avoid SvelteKit import issues)
// ---------------------------------------------------------------------------

interface SSHResult {
  stdout: string;
  stderr: string;
  exitCode: number;
}

async function sshExec(
  host: string,
  privateKey: string,
  command: string,
  timeoutMs = 30_000,
): Promise<SSHResult> {
  const conn = new Client();

  try {
    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => {
        conn.end();
        reject(new Error(`SSH connection to ${host} timed out`));
      }, timeoutMs);

      conn.on("ready", () => {
        clearTimeout(timeout);
        resolve();
      });
      conn.on("error", (err) => {
        clearTimeout(timeout);
        reject(new Error(`SSH connection failed: ${err.message}`));
      });
      conn.connect({
        host,
        port: 22,
        username: "rachel",
        privateKey,
        readyTimeout: timeoutMs,
      });
    });

    return await new Promise<SSHResult>((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error(`SSH command timed out: ${command}`));
      }, timeoutMs);

      conn.exec(command, (err, stream) => {
        if (err) {
          clearTimeout(timeout);
          return reject(new Error(`SSH exec failed: ${err.message}`));
        }

        let stdout = "";
        let stderr = "";
        stream.on("data", (data: Buffer) => {
          stdout += data.toString();
        });
        stream.stderr.on("data", (data: Buffer) => {
          stderr += data.toString();
        });
        stream.on("close", (code: number) => {
          clearTimeout(timeout);
          resolve({ stdout: stdout.trim(), stderr: stderr.trim(), exitCode: code ?? 0 });
        });
      });
    });
  } finally {
    conn.end();
  }
}

// ---------------------------------------------------------------------------
// Database
// ---------------------------------------------------------------------------

const sqlite = new Database(DB_PATH, { readonly: true });

interface Subscription {
  id: string;
  userId: string;
  status: string;
  vpsIpAddress: string | null;
  sshPrivateKey: string | null;
  vpsProvisioned: number;
  provisioningStatus: string | null;
  hetznerServerId: number | null;
}

interface UserInfo {
  email: string;
  name: string;
}

function getSubByEmail(email: string): {
  sub: Subscription;
  user: UserInfo;
} {
  const row = sqlite
    .query(
      `SELECT s.*, u.email, u.name
       FROM subscriptions s
       JOIN user u ON s.user_id = u.id
       WHERE u.email = ?`,
    )
    .get(email) as (Subscription & UserInfo) | null;

  if (!row) {
    console.error(`No subscription found for email: ${email}`);
    process.exit(1);
  }

  return {
    sub: row,
    user: { email: row.email, name: row.name },
  };
}

function getDecryptedKey(sub: Subscription): string {
  if (!sub.sshPrivateKey) {
    console.error("No SSH key stored for this subscription");
    process.exit(1);
  }
  return decryptToken(sub.sshPrivateKey);
}

// ---------------------------------------------------------------------------
// Commands
// ---------------------------------------------------------------------------

async function cmdList() {
  const rows = sqlite
    .query(
      `SELECT s.vps_ip_address, s.provisioning_status, s.vps_provisioned, s.status,
              u.email, u.name
       FROM subscriptions s
       JOIN user u ON s.user_id = u.id
       ORDER BY s.created_at DESC`,
    )
    .all() as Array<Record<string, unknown>>;

  if (rows.length === 0) {
    console.log("No subscriptions found.");
    return;
  }

  console.log(`\n${"Email".padEnd(35)} ${"Status".padEnd(12)} ${"VPS IP".padEnd(18)} Provisioning`);
  console.log("-".repeat(85));
  for (const r of rows) {
    console.log(
      `${String(r.email).padEnd(35)} ${String(r.status).padEnd(12)} ${String(r.vps_ip_address ?? "—").padEnd(18)} ${r.provisioning_status ?? "—"}`,
    );
  }
  console.log(`\nTotal: ${rows.length} subscription(s)`);
}

async function cmdStatus(email: string) {
  const { sub, user } = getSubByEmail(email);

  console.log(`\n📋 Status for ${user.email} (${user.name})`);
  console.log(`   Subscription: ${sub.status}`);
  console.log(`   VPS IP: ${sub.vpsIpAddress ?? "not provisioned"}`);
  console.log(`   Provisioning: ${sub.provisioningStatus ?? "—"}`);
  console.log(`   Hetzner Server ID: ${sub.hetznerServerId ?? "—"}`);

  if (!sub.vpsIpAddress || !sub.sshPrivateKey) {
    console.log("\n   ⚠️  No VPS or SSH key — cannot check remote status");
    return;
  }

  const key = getDecryptedKey(sub);

  try {
    const serviceResult = await sshExec(sub.vpsIpAddress, key, "systemctl --user is-active rachel8");
    const uptimeResult = await sshExec(sub.vpsIpAddress, key, "uptime -p");
    const diskResult = await sshExec(sub.vpsIpAddress, key, "df -h / | tail -1");
    const memResult = await sshExec(sub.vpsIpAddress, key, "free -h | grep Mem");

    console.log(`\n   🖥️  Remote Status:`);
    console.log(`   Service: ${serviceResult.stdout === "active" ? "✅ active" : "❌ " + serviceResult.stdout}`);
    console.log(`   Uptime: ${uptimeResult.stdout}`);
    console.log(`   Disk: ${diskResult.stdout}`);
    console.log(`   Memory: ${memResult.stdout}`);
  } catch (err) {
    console.log(`\n   ❌ SSH failed: ${err instanceof Error ? err.message : String(err)}`);
  }
}

async function cmdLogs(email: string, lines = 50) {
  const { sub } = getSubByEmail(email);
  if (!sub.vpsIpAddress || !sub.sshPrivateKey) {
    console.error("No VPS or SSH key available");
    process.exit(1);
  }

  const key = getDecryptedKey(sub);
  const result = await sshExec(
    sub.vpsIpAddress,
    key,
    `journalctl --user -u rachel8 -n ${lines} --no-pager 2>/dev/null || sudo journalctl -u rachel8 -n ${lines} --no-pager`,
    60_000,
  );

  console.log(result.stdout);
  if (result.stderr) console.error(result.stderr);
}

async function cmdRestart(email: string) {
  const { sub, user } = getSubByEmail(email);
  if (!sub.vpsIpAddress || !sub.sshPrivateKey) {
    console.error("No VPS or SSH key available");
    process.exit(1);
  }

  const key = getDecryptedKey(sub);
  console.log(`Restarting Rachel8 for ${user.email} (${sub.vpsIpAddress})...`);

  const result = await sshExec(
    sub.vpsIpAddress,
    key,
    "systemctl --user restart rachel8 2>/dev/null || sudo systemctl restart rachel8",
  );

  if (result.exitCode === 0) {
    // Wait and verify
    await Bun.sleep(3000);
    const check = await sshExec(sub.vpsIpAddress, key, "systemctl --user is-active rachel8 2>/dev/null || sudo systemctl is-active rachel8");
    console.log(`Service status: ${check.stdout === "active" ? "✅ active" : "❌ " + check.stdout}`);
  } else {
    console.error(`Restart failed (exit ${result.exitCode}): ${result.stderr}`);
  }
}

async function cmdSsh(email: string, command: string) {
  const { sub } = getSubByEmail(email);
  if (!sub.vpsIpAddress || !sub.sshPrivateKey) {
    console.error("No VPS or SSH key available");
    process.exit(1);
  }

  const key = getDecryptedKey(sub);
  const result = await sshExec(sub.vpsIpAddress, key, command, 60_000);

  if (result.stdout) console.log(result.stdout);
  if (result.stderr) console.error(result.stderr);
  process.exit(result.exitCode);
}

async function cmdDiagnose(email: string) {
  const { sub, user } = getSubByEmail(email);

  console.log(`\n🔍 Full Diagnostic for ${user.email}`);
  console.log("=".repeat(60));

  console.log(`\n📋 Subscription:`);
  console.log(`   Status: ${sub.status}`);
  console.log(`   Provisioning: ${sub.provisioningStatus}`);
  console.log(`   VPS IP: ${sub.vpsIpAddress ?? "none"}`);
  console.log(`   Has SSH key: ${sub.sshPrivateKey ? "yes" : "no"}`);

  if (!sub.vpsIpAddress || !sub.sshPrivateKey) {
    console.log("\n⚠️  Cannot run remote checks — no VPS or SSH key");
    return;
  }

  const key = getDecryptedKey(sub);

  const checks = [
    { name: "Service status", cmd: "systemctl --user is-active rachel8 2>/dev/null || sudo systemctl is-active rachel8" },
    { name: "Service uptime", cmd: "systemctl --user show rachel8 --property=ActiveEnterTimestamp 2>/dev/null || sudo systemctl show rachel8 --property=ActiveEnterTimestamp" },
    { name: "System uptime", cmd: "uptime -p" },
    { name: "Disk usage", cmd: "df -h / | tail -1" },
    { name: "Memory", cmd: "free -h | grep Mem" },
    { name: "Bun version", cmd: "/home/rachel/.bun/bin/bun --version 2>/dev/null || echo 'not installed'" },
    { name: "Rachel8 repo", cmd: "ls /home/rachel/rachel8/package.json 2>/dev/null && echo 'present' || echo 'missing'" },
    { name: ".env exists", cmd: "ls /home/rachel/rachel8/.env 2>/dev/null && echo 'present' || echo 'missing'" },
    { name: "Last 5 log lines", cmd: "journalctl --user -u rachel8 -n 5 --no-pager 2>/dev/null || sudo journalctl -u rachel8 -n 5 --no-pager" },
  ];

  for (const check of checks) {
    try {
      const result = await sshExec(sub.vpsIpAddress, key, check.cmd);
      console.log(`\n${check.name}:`);
      console.log(`   ${result.stdout || result.stderr || "(empty)"}`);
    } catch (err) {
      console.log(`\n${check.name}: ❌ ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  console.log("\n" + "=".repeat(60));
  console.log("Diagnostic complete.\n");
}

async function cmdUpdate(email: string) {
  const { sub, user } = getSubByEmail(email);
  if (!sub.vpsIpAddress || !sub.sshPrivateKey) {
    console.error("No VPS or SSH key available");
    process.exit(1);
  }

  const key = getDecryptedKey(sub);
  console.log(`🔄 Updating Rachel8 for ${user.email} (${sub.vpsIpAddress})...\n`);

  // Step 1: Check for local uncommitted changes and commit them
  console.log("Step 1: Saving local changes...");
  const statusResult = await sshExec(
    sub.vpsIpAddress, key,
    "cd /home/rachel/rachel8 && git status --porcelain",
    30_000,
  );

  if (statusResult.stdout.trim()) {
    console.log("   Local changes detected, committing...");
    const commitResult = await sshExec(
      sub.vpsIpAddress, key,
      'cd /home/rachel/rachel8 && git add -A && git commit -m "Local changes (auto-saved before update)"',
      30_000,
    );
    console.log(`   ${commitResult.exitCode === 0 ? "✅ Committed" : "⚠️ " + commitResult.stderr}`);
  } else {
    console.log("   No local changes to save.");
  }

  // Step 2: Pull with rebase
  console.log("\nStep 2: Pulling latest from public repo...");
  const pullResult = await sshExec(
    sub.vpsIpAddress, key,
    "cd /home/rachel/rachel8 && git pull --rebase origin main",
    60_000,
  );

  if (pullResult.exitCode !== 0) {
    // Check if it's a merge conflict
    if (pullResult.stderr.includes("CONFLICT") || pullResult.stdout.includes("CONFLICT")) {
      console.log("   ⚠️ Merge conflict detected. Aborting rebase and keeping current state.");
      await sshExec(sub.vpsIpAddress, key, "cd /home/rachel/rachel8 && git rebase --abort", 15_000);
      console.log("   Rebase aborted. Manual intervention needed.");
      console.log(`   Run: bun run ops.ts ssh ${email} "cd /home/rachel/rachel8 && git diff"`);
      return;
    }
    console.log(`   ❌ Pull failed: ${pullResult.stderr || pullResult.stdout}`);
    return;
  }
  console.log("   ✅ Pull successful");

  // Step 3: Install deps (in case package.json changed)
  console.log("\nStep 3: Installing dependencies...");
  const installResult = await sshExec(
    sub.vpsIpAddress, key,
    "cd /home/rachel/rachel8 && /home/rachel/.bun/bin/bun install",
    60_000,
  );
  console.log(`   ${installResult.exitCode === 0 ? "✅ Dependencies installed" : "⚠️ " + installResult.stderr}`);

  // Step 4: Restart service
  console.log("\nStep 4: Restarting service...");
  const restartResult = await sshExec(
    sub.vpsIpAddress, key,
    "export XDG_RUNTIME_DIR=/run/user/$(id -u) DBUS_SESSION_BUS_ADDRESS=unix:path=/run/user/$(id -u)/bus && systemctl --user restart rachel8",
    30_000,
  );

  if (restartResult.exitCode !== 0) {
    // Fall back to sudo systemctl
    await sshExec(sub.vpsIpAddress, key, "sudo systemctl restart rachel8", 30_000);
  }

  // Step 5: Verify
  await Bun.sleep(3000);
  const verifyResult = await sshExec(
    sub.vpsIpAddress, key,
    "export XDG_RUNTIME_DIR=/run/user/$(id -u) DBUS_SESSION_BUS_ADDRESS=unix:path=/run/user/$(id -u)/bus && systemctl --user is-active rachel8 2>/dev/null || sudo systemctl is-active rachel8",
    15_000,
  );

  console.log(`\n${verifyResult.stdout === "active" ? "✅ Update complete — service is running!" : "❌ Service not active: " + verifyResult.stdout}`);

  // Get version
  const versionResult = await sshExec(
    sub.vpsIpAddress, key,
    "cd /home/rachel/rachel8 && git log --oneline -1",
    15_000,
  );
  console.log(`   Version: ${versionResult.stdout}`);
}

async function cmdUpdateAll() {
  const rows = sqlite
    .query(
      `SELECT s.id, s.user_id, s.vps_ip_address, s.ssh_private_key, s.vps_provisioned,
              s.provisioning_status, u.email, u.name
       FROM subscriptions s
       JOIN user u ON s.user_id = u.id
       WHERE s.vps_provisioned = 1 AND s.provisioning_status = 'ready'
       ORDER BY s.created_at ASC`,
    )
    .all() as Array<Record<string, unknown>>;

  if (rows.length === 0) {
    console.log("No active VPSs to update.");
    return;
  }

  console.log(`\n🔄 Rolling out update to ${rows.length} VPS(es)...\n`);

  let success = 0;
  let failed = 0;

  for (const row of rows) {
    const email = String(row.email);
    console.log(`\n${"─".repeat(60)}`);
    try {
      await cmdUpdate(email);
      success++;
    } catch (err) {
      console.error(`❌ Failed to update ${email}: ${err instanceof Error ? err.message : String(err)}`);
      failed++;
    }
  }

  console.log(`\n${"═".repeat(60)}`);
  console.log(`Rollout complete: ${success} succeeded, ${failed} failed out of ${rows.length} total`);
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

const [command, ...args] = process.argv.slice(2);

switch (command) {
  case "list":
    await cmdList();
    break;
  case "status":
    if (!args[0]) { console.error("Usage: ops.ts status <email>"); process.exit(1); }
    await cmdStatus(args[0]);
    break;
  case "logs":
    if (!args[0]) { console.error("Usage: ops.ts logs <email> [lines]"); process.exit(1); }
    await cmdLogs(args[0], args[1] ? parseInt(args[1]) : 50);
    break;
  case "restart":
    if (!args[0]) { console.error("Usage: ops.ts restart <email>"); process.exit(1); }
    await cmdRestart(args[0]);
    break;
  case "ssh":
    if (!args[0] || !args[1]) { console.error('Usage: ops.ts ssh <email> "<command>"'); process.exit(1); }
    await cmdSsh(args[0], args[1]);
    break;
  case "diagnose":
    if (!args[0]) { console.error("Usage: ops.ts diagnose <email>"); process.exit(1); }
    await cmdDiagnose(args[0]);
    break;
  case "update":
    if (!args[0]) { console.error("Usage: ops.ts update <email>"); process.exit(1); }
    await cmdUpdate(args[0]);
    break;
  case "update-all":
    await cmdUpdateAll();
    break;
  default:
    console.log(`
Rachel Cloud Ops CLI

Usage:
  bun run ops.ts list                       List all subscriptions
  bun run ops.ts status <email>             Check VPS + service status
  bun run ops.ts logs <email> [lines]       Fetch Rachel8 service logs
  bun run ops.ts restart <email>            Restart Rachel8 service
  bun run ops.ts ssh <email> "<command>"    Run command on customer VPS
  bun run ops.ts diagnose <email>           Full diagnostic report
  bun run ops.ts update <email>             Update Rachel8 on customer VPS
  bun run ops.ts update-all                 Roll out update to all active VPSs
`);
}

sqlite.close();
