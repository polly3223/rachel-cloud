import { json } from "@sveltejs/kit";
import { r as requireAuth } from "../../../../../chunks/session.js";
import { d as db, s as subscriptions, c as claudeTokens, t as telegramBots } from "../../../../../chunks/index3.js";
import { eq } from "drizzle-orm";
import { d as decryptToken, e as encryptToken } from "../../../../../chunks/encryption.js";
import { generateKeyPairSync } from "node:crypto";
import { H as HetznerClient } from "../../../../../chunks/subscription-manager.js";
import { Client } from "ssh2";
function generateSSHKeyPair() {
  const { publicKey, privateKey } = generateKeyPairSync("rsa", {
    modulusLength: 4096,
    publicKeyEncoding: {
      type: "spki",
      format: "der"
    },
    privateKeyEncoding: {
      type: "pkcs8",
      format: "pem"
    }
  });
  const sshPublicKey = derToOpenSSH(publicKey);
  return {
    publicKey: sshPublicKey,
    privateKey
  };
}
function derToOpenSSH(spkiDer) {
  const { n, e } = parseRSAPublicKeyDER(spkiDer);
  const keyType = Buffer.from("ssh-rsa");
  const parts = [
    encodeSSHString(keyType),
    encodeSSHMpint(e),
    encodeSSHMpint(n)
  ];
  const keyData = Buffer.concat(parts);
  return `ssh-rsa ${keyData.toString("base64")}`;
}
function encodeSSHString(data) {
  const lengthBuf = Buffer.alloc(4);
  lengthBuf.writeUInt32BE(data.length, 0);
  return Buffer.concat([lengthBuf, data]);
}
function encodeSSHMpint(data) {
  if (data.length > 0 && (data[0] & 128) !== 0) {
    const padded = Buffer.alloc(data.length + 1);
    padded[0] = 0;
    data.copy(padded, 1);
    data = padded;
  }
  return encodeSSHString(data);
}
function parseRSAPublicKeyDER(der) {
  let offset = 0;
  const outer = parseDERTag(der, offset);
  offset = outer.contentOffset;
  const algId = parseDERTag(der, offset);
  offset = algId.contentOffset + algId.length;
  const bitString = parseDERTag(der, offset);
  offset = bitString.contentOffset + 1;
  const inner = parseDERTag(der, offset);
  offset = inner.contentOffset;
  const nTag = parseDERTag(der, offset);
  let n = der.subarray(nTag.contentOffset, nTag.contentOffset + nTag.length);
  offset = nTag.contentOffset + nTag.length;
  const eTag = parseDERTag(der, offset);
  let e = der.subarray(eTag.contentOffset, eTag.contentOffset + eTag.length);
  if (n.length > 0 && n[0] === 0) {
    n = n.subarray(1);
  }
  if (e.length > 0 && e[0] === 0) {
    e = e.subarray(1);
  }
  return { n, e };
}
function parseDERTag(buf, offset) {
  const tag = buf[offset];
  offset += 1;
  let length = buf[offset];
  offset += 1;
  if (length & 128) {
    const numLengthBytes = length & 127;
    length = 0;
    for (let i = 0; i < numLengthBytes; i++) {
      length = length << 8 | buf[offset];
      offset += 1;
    }
  }
  return { tag, length, contentOffset: offset };
}
const MAX_USERDATA_BYTES = 30 * 1024;
function buildCloudInitUserData(config) {
  const { username, sshPublicKey, callbackUrl } = config;
  const yaml = buildYaml(username, sshPublicKey, callbackUrl);
  const fullUserData = `#cloud-config
${yaml}`;
  const byteLength = new TextEncoder().encode(fullUserData).length;
  if (byteLength > MAX_USERDATA_BYTES) {
    throw new Error(
      `Cloud-init user-data exceeds size limit: ${byteLength} bytes (max ${MAX_USERDATA_BYTES} bytes, Hetzner limit is 32768 bytes)`
    );
  }
  return fullUserData;
}
function buildYaml(username, sshPublicKey, callbackUrl) {
  const lines = [];
  lines.push("users:");
  lines.push(`  - name: ${username}`);
  lines.push("    groups: [sudo]");
  lines.push('    sudo: "ALL=(ALL) NOPASSWD:ALL"');
  lines.push("    shell: /bin/bash");
  lines.push("    ssh_authorized_keys:");
  lines.push(`      - ${sshPublicKey}`);
  lines.push("");
  lines.push("package_update: true");
  lines.push("packages:");
  lines.push("  - git");
  lines.push("  - curl");
  lines.push("  - unzip");
  lines.push("");
  lines.push("runcmd:");
  lines.push("  # Install Bun runtime");
  lines.push(`  - ["bash", "-c", "curl -fsSL https://bun.sh/install | bash -s -- --install-dir /home/${username}/.bun"]`);
  lines.push(`  - ["bash", "-c", "chown -R ${username}:${username} /home/${username}/.bun"]`);
  lines.push("  # Add Bun to PATH");
  lines.push(
    `  - ["bash", "-c", "echo 'export BUN_INSTALL=\\"/home/${username}/.bun\\"' >> /home/${username}/.bashrc"]`
  );
  lines.push(
    `  - ["bash", "-c", "echo 'export PATH=\\"$BUN_INSTALL/bin:$PATH\\"' >> /home/${username}/.bashrc"]`
  );
  lines.push("  # Install GitHub CLI");
  lines.push(
    '  - ["bash", "-c", "curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg | dd of=/usr/share/keyrings/githubcli-archive-keyring.gpg"]'
  );
  lines.push(
    '  - ["bash", "-c", "echo \\"deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main\\" | tee /etc/apt/sources.list.d/github-cli.list > /dev/null"]'
  );
  lines.push('  - ["bash", "-c", "apt update && apt install -y gh"]');
  lines.push("  # Install Claude Code CLI");
  lines.push(
    `  - ["su", "-", "${username}", "-c", "/home/${username}/.bun/bin/bun install -g @anthropic-ai/claude-code"]`
  );
  lines.push("  # Clone Rachel repository");
  lines.push(
    `  - ["su", "-", "${username}", "-c", "git clone https://github.com/polly3223/rachel.git /home/${username}/rachel8"]`
  );
  lines.push("  # Install Rachel8 dependencies");
  lines.push(
    `  - ["su", "-", "${username}", "-c", "cd /home/${username}/rachel8 && /home/${username}/.bun/bin/bun install"]`
  );
  lines.push("  # Create shared folder");
  lines.push(`  - ["mkdir", "-p", "/home/${username}/shared"]`);
  lines.push(`  - ["chown", "-R", "${username}:${username}", "/home/${username}/shared"]`);
  lines.push("");
  lines.push("phone_home:");
  lines.push(`  url: ${callbackUrl}`);
  lines.push("  post:");
  lines.push("    - instance_id");
  lines.push("    - hostname");
  lines.push("  tries: 10");
  return lines.join("\n") + "\n";
}
const SSH_CONNECT_TIMEOUT_MS = 3e4;
const SSH_COMMAND_TIMEOUT_MS = 3e4;
async function injectSecrets(config) {
  const conn = new Client();
  try {
    await connectSSH(conn, config);
    const home = `/home/${config.username}`;
    await execCommand(
      conn,
      `mkdir -p ${home}/.claude`,
      "create .claude directory"
    );
    const credentials = JSON.stringify(
      {
        claudeAiOauth: {
          accessToken: config.claudeAccessToken,
          refreshToken: config.claudeRefreshToken,
          expiresAt: config.claudeExpiresAt,
          scopes: ["user:inference", "user:profile"]
        }
      },
      null,
      2
    );
    await execCommand(
      conn,
      `cat > ${home}/.claude/.credentials.json << 'CREDENTIALS_EOF'
${credentials}
CREDENTIALS_EOF`,
      "write Claude credentials"
    );
    await execCommand(
      conn,
      `chmod 600 ${home}/.claude/.credentials.json`,
      "set credentials permissions"
    );
    const envContent = [
      "# Rachel8 Configuration (auto-generated by Rachel Cloud)",
      `TELEGRAM_BOT_TOKEN=${config.telegramBotToken}`,
      `OWNER_TELEGRAM_USER_ID=${config.ownerTelegramUserId}`,
      `SHARED_FOLDER_PATH=${home}/shared`,
      "NODE_ENV=production",
      "LOG_LEVEL=info"
    ].join("\n");
    await execCommand(
      conn,
      `cat > ${home}/rachel8/.env << 'ENV_EOF'
${envContent}
ENV_EOF`,
      "write .env file"
    );
    await execCommand(
      conn,
      `chmod 600 ${home}/rachel8/.env`,
      "set .env permissions"
    );
    await execCommand(
      conn,
      `sudo cp ${home}/rachel8/rachel8.service /etc/systemd/system/`,
      "copy systemd service file"
    );
    await execCommand(
      conn,
      "sudo systemctl daemon-reload",
      "reload systemd daemon"
    );
    await execCommand(
      conn,
      "sudo systemctl enable rachel8",
      "enable rachel8 service"
    );
    await execCommand(
      conn,
      "sudo systemctl start rachel8",
      "start rachel8 service"
    );
    await validateServiceRunning(conn);
  } finally {
    conn.end();
  }
}
function connectSSH(conn, config) {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      conn.end();
      reject(
        new Error(
          `SSH connection to ${config.host} timed out after ${SSH_CONNECT_TIMEOUT_MS}ms`
        )
      );
    }, SSH_CONNECT_TIMEOUT_MS);
    conn.on("ready", () => {
      clearTimeout(timeout);
      resolve();
    });
    conn.on("error", (err) => {
      clearTimeout(timeout);
      reject(
        new Error(`SSH connection to ${config.host} failed: ${err.message}`)
      );
    });
    conn.connect({
      host: config.host,
      port: 22,
      username: config.username,
      privateKey: config.privateKey,
      readyTimeout: SSH_CONNECT_TIMEOUT_MS
    });
  });
}
function execCommand(conn, command, stepName) {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(
        new Error(
          `SSH command timed out during "${stepName}" after ${SSH_COMMAND_TIMEOUT_MS}ms`
        )
      );
    }, SSH_COMMAND_TIMEOUT_MS);
    conn.exec(command, (err, stream) => {
      if (err) {
        clearTimeout(timeout);
        return reject(
          new Error(`SSH exec failed during "${stepName}": ${err.message}`)
        );
      }
      let stdout = "";
      let stderr = "";
      stream.on("data", (data) => {
        stdout += data.toString();
      });
      stream.stderr.on("data", (data) => {
        stderr += data.toString();
      });
      stream.on("close", (code) => {
        clearTimeout(timeout);
        if (code !== 0) {
          reject(
            new Error(
              `Command failed during "${stepName}" (exit code ${code}):
  Command: ${command}
  Stderr: ${stderr.trim() || "(empty)"}`
            )
          );
        } else {
          resolve(stdout.trim());
        }
      });
    });
  });
}
async function validateServiceRunning(conn) {
  const status = await execCommand(
    conn,
    "sudo systemctl is-active rachel8",
    "check service status"
  );
  if (status.trim() !== "active") {
    let logs = "";
    try {
      logs = await execCommand(
        conn,
        "journalctl -u rachel8 -n 50 --no-pager 2>/dev/null",
        "read service logs"
      );
    } catch {
      logs = "(unable to read journal logs)";
    }
    throw new Error(
      `Rachel8 service is not active (status: "${status.trim()}").
Journal logs:
${logs}`
    );
  }
}
const PROVISIONING_TIMEOUT_MS = 12e4;
const CLOUD_INIT_POLL_INTERVAL_MS = 5e3;
const CLOUD_INIT_TIMEOUT_MS = 11e4;
const FIREWALL_NAME = "rachel-cloud-ssh-only";
const BASE_URL = process.env.BASE_URL || "http://localhost:5173";
async function provisionVPS(userId) {
  const startTime = Date.now();
  let decryptedClaudeAccess = null;
  let decryptedClaudeRefresh = null;
  let decryptedTelegramToken = null;
  let decryptedSshPrivateKey = null;
  try {
    console.log(`[provision-vps] Starting provisioning for userId=${userId}`);
    await updateProvisioningStatus(userId, "pending");
    const subscription = await db.query.subscriptions.findFirst({
      where: eq(subscriptions.userId, userId)
    });
    if (!subscription) {
      throw new Error(`No subscription found for userId=${userId}`);
    }
    if (subscription.status !== "active") {
      throw new Error(`Subscription is not active for userId=${userId} (status=${subscription.status})`);
    }
    const claudeToken = await db.query.claudeTokens.findFirst({
      where: eq(claudeTokens.userId, userId)
    });
    if (!claudeToken) {
      throw new Error(`No Claude tokens found for userId=${userId}`);
    }
    const telegramBot = await db.query.telegramBots.findFirst({
      where: eq(telegramBots.userId, userId)
    });
    if (!telegramBot) {
      throw new Error(`No Telegram bot found for userId=${userId}`);
    }
    decryptedClaudeAccess = decryptToken(claudeToken.encryptedAccessToken);
    decryptedClaudeRefresh = decryptToken(claudeToken.encryptedRefreshToken);
    decryptedTelegramToken = decryptToken(telegramBot.encryptedToken);
    await updateProvisioningStatus(userId, "creating");
    const hetznerClient = new HetznerClient({
      apiToken: process.env.HETZNER_API_TOKEN
    });
    const sshKeyPair = generateSSHKeyPair();
    const sshKeyResponse = await hetznerClient.createSSHKey({
      name: `rachel-cloud-${userId}`,
      public_key: sshKeyPair.publicKey
    });
    const sshKeyId = sshKeyResponse.ssh_key.id;
    const firewallId = await getOrCreateFirewall(hetznerClient);
    const encryptedPrivateKey = encryptToken(sshKeyPair.privateKey);
    await db.update(subscriptions).set({
      hetznerSshKeyId: sshKeyId,
      sshPrivateKey: encryptedPrivateKey,
      updatedAt: /* @__PURE__ */ new Date()
    }).where(eq(subscriptions.userId, userId));
    const cloudInitYaml = buildCloudInitUserData({
      username: "rachel",
      sshPublicKey: sshKeyPair.publicKey,
      callbackUrl: `${BASE_URL}/api/provision/callback/${userId}`
    });
    const serverResponse = await hetznerClient.createServer({
      name: `rachel-cloud-${userId}`,
      server_type: "cx22",
      image: "ubuntu-24.04",
      location: "nbg1",
      ssh_keys: [sshKeyId],
      user_data: cloudInitYaml,
      firewalls: [{ firewall: firewallId }],
      start_after_create: true
    });
    const serverId = serverResponse.server.id;
    const serverIp = serverResponse.server.public_net.ipv4.ip;
    await db.update(subscriptions).set({
      hetznerServerId: serverId,
      vpsIpAddress: serverIp,
      provisioningStatus: "cloud_init",
      updatedAt: /* @__PURE__ */ new Date()
    }).where(eq(subscriptions.userId, userId));
    console.log(
      `[provision-vps] Server created for userId=${userId}: serverId=${serverId}, ip=${serverIp} (${Date.now() - startTime}ms elapsed)`
    );
    await waitForCloudInitCallback(userId);
    console.log(
      `[provision-vps] Cloud-init completed for userId=${userId} (${Date.now() - startTime}ms elapsed)`
    );
    decryptedSshPrivateKey = decryptToken(encryptedPrivateKey);
    const ownerTelegramUserId = telegramBot.botUsername ?? "";
    await injectSecrets({
      host: serverIp,
      username: "rachel",
      privateKey: decryptedSshPrivateKey,
      claudeAccessToken: decryptedClaudeAccess,
      claudeRefreshToken: decryptedClaudeRefresh,
      claudeExpiresAt: claudeToken.expiresAt.getTime(),
      telegramBotToken: decryptedTelegramToken,
      ownerTelegramUserId
    });
    console.log(
      `[provision-vps] Secrets injected for userId=${userId} (${Date.now() - startTime}ms elapsed)`
    );
    await db.update(subscriptions).set({
      vpsProvisioned: true,
      provisioningStatus: "ready",
      provisionedAt: /* @__PURE__ */ new Date(),
      provisioningError: null,
      updatedAt: /* @__PURE__ */ new Date()
    }).where(eq(subscriptions.userId, userId));
    const elapsed = Date.now() - startTime;
    console.log(`[provision-vps] VPS provisioned for userId=${userId} in ${elapsed}ms`);
    if (elapsed > PROVISIONING_TIMEOUT_MS) {
      console.warn(
        `[provision-vps] SLA miss: provisioning took ${elapsed}ms (target: ${PROVISIONING_TIMEOUT_MS}ms) for userId=${userId}`
      );
    }
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    console.error(`[provision-vps] Provisioning failed for userId=${userId}:`, err);
    await cleanupFailedProvision(userId);
    await db.update(subscriptions).set({
      provisioningStatus: "failed",
      provisioningError: err.message,
      vpsProvisioned: false,
      updatedAt: /* @__PURE__ */ new Date()
    }).where(eq(subscriptions.userId, userId));
    throw error;
  } finally {
    decryptedClaudeAccess = null;
    decryptedClaudeRefresh = null;
    decryptedTelegramToken = null;
    decryptedSshPrivateKey = null;
  }
}
async function updateProvisioningStatus(userId, status) {
  await db.update(subscriptions).set({
    provisioningStatus: status,
    updatedAt: /* @__PURE__ */ new Date()
  }).where(eq(subscriptions.userId, userId));
}
async function waitForCloudInitCallback(userId) {
  const deadline = Date.now() + CLOUD_INIT_TIMEOUT_MS;
  while (Date.now() < deadline) {
    const subscription = await db.query.subscriptions.findFirst({
      where: eq(subscriptions.userId, userId)
    });
    if (subscription?.provisioningStatus === "injecting_secrets") {
      return;
    }
    if (subscription?.provisioningStatus === "failed") {
      throw new Error("Provisioning was marked as failed during cloud-init");
    }
    await sleep(CLOUD_INIT_POLL_INTERVAL_MS);
  }
  throw new Error(
    `Cloud-init callback not received within ${CLOUD_INIT_TIMEOUT_MS}ms for userId=${userId}`
  );
}
async function getOrCreateFirewall(hetznerClient) {
  try {
    const response = await hetznerClient.listFirewalls();
    const existing = response.firewalls.find(
      (fw) => fw.name === FIREWALL_NAME
    );
    if (existing) {
      console.log(`[provision-vps] Reusing existing firewall: ${existing.id}`);
      return existing.id;
    }
  } catch {
    console.warn("[provision-vps] Failed to list firewalls, will create new one");
  }
  const firewallResponse = await hetznerClient.createFirewall({
    name: FIREWALL_NAME,
    rules: [
      {
        direction: "in",
        protocol: "tcp",
        port: "22",
        source_ips: ["0.0.0.0/0", "::/0"],
        description: "Allow SSH from anywhere"
      }
    ]
  });
  console.log(`[provision-vps] Created new firewall: ${firewallResponse.firewall.id}`);
  return firewallResponse.firewall.id;
}
async function cleanupFailedProvision(userId) {
  try {
    const subscription = await db.query.subscriptions.findFirst({
      where: eq(subscriptions.userId, userId)
    });
    if (!subscription) {
      console.warn(`[provision-vps] No subscription found during cleanup for userId=${userId}`);
      return;
    }
    const hetznerClient = new HetznerClient({
      apiToken: process.env.HETZNER_API_TOKEN
    });
    if (subscription.hetznerServerId) {
      try {
        await hetznerClient.deleteServer(subscription.hetznerServerId);
        console.log(
          `[provision-vps] Deleted server ${subscription.hetznerServerId} during cleanup`
        );
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        if (message.includes("404") || message.includes("not found")) {
          console.log(
            `[provision-vps] Server ${subscription.hetznerServerId} already deleted`
          );
        } else {
          console.error(
            `[provision-vps] Failed to delete server ${subscription.hetznerServerId}:`,
            err
          );
        }
      }
    }
    if (subscription.hetznerSshKeyId) {
      try {
        await hetznerClient.deleteSSHKey(subscription.hetznerSshKeyId);
        console.log(
          `[provision-vps] Deleted SSH key ${subscription.hetznerSshKeyId} during cleanup`
        );
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        if (message.includes("404") || message.includes("not found")) {
          console.log(
            `[provision-vps] SSH key ${subscription.hetznerSshKeyId} already deleted`
          );
        } else {
          console.error(
            `[provision-vps] Failed to delete SSH key ${subscription.hetznerSshKeyId}:`,
            err
          );
        }
      }
    }
    await db.update(subscriptions).set({
      hetznerServerId: null,
      hetznerSshKeyId: null,
      vpsIpAddress: null,
      vpsHostname: null,
      sshPrivateKey: null,
      vpsProvisioned: false,
      updatedAt: /* @__PURE__ */ new Date()
    }).where(eq(subscriptions.userId, userId));
    console.log(`[provision-vps] Cleanup completed for userId=${userId}`);
  } catch (error) {
    console.error(`[provision-vps] Cleanup failed for userId=${userId}:`, error);
  }
}
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
const POST = async (event) => {
  const session = await requireAuth(event);
  const userId = session.user.id;
  try {
    const subscription = await db.query.subscriptions.findFirst({
      where: eq(subscriptions.userId, userId)
    });
    if (!subscription) {
      return json(
        { error: "No subscription found. Please subscribe first." },
        { status: 400 }
      );
    }
    if (subscription.status !== "active") {
      return json(
        { error: "Subscription is not active. Please subscribe or reactivate." },
        { status: 400 }
      );
    }
    if (subscription.vpsProvisioned) {
      return json(
        { error: "VPS already provisioned." },
        { status: 400 }
      );
    }
    if (subscription.provisioningStatus === "pending" || subscription.provisioningStatus === "creating" || subscription.provisioningStatus === "cloud_init" || subscription.provisioningStatus === "injecting_secrets") {
      return json(
        { error: "Provisioning is already in progress." },
        { status: 400 }
      );
    }
    const telegramBot = await db.query.telegramBots.findFirst({
      where: eq(telegramBots.userId, userId)
    });
    if (!telegramBot || !telegramBot.validated) {
      return json(
        { error: "Please complete Telegram bot setup in onboarding first." },
        { status: 400 }
      );
    }
    void provisionVPS(userId).catch((err) => {
      console.error(`[deploy] Background provisioning failed for userId=${userId}:`, err);
    });
    return json(
      { message: "Provisioning started" },
      { status: 202 }
    );
  } catch (error) {
    console.error(`[deploy] Error for userId=${userId}:`, error);
    return json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
};
export {
  POST
};
