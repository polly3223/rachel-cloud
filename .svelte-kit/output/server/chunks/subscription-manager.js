import { Polar } from "@polar-sh/sdk";
import { d as db, s as subscriptions } from "./index3.js";
import { eq } from "drizzle-orm";
import schedule from "node-schedule";
import { backOff } from "exponential-backoff";
if (!process.env.POLAR_ACCESS_TOKEN) {
  throw new Error("POLAR_ACCESS_TOKEN environment variable is required");
}
const polarClient = new Polar({
  accessToken: process.env.POLAR_ACCESS_TOKEN,
  server: process.env.POLAR_MODE === "production" ? "production" : "sandbox"
});
const DEFAULT_BASE_URL = "https://api.hetzner.cloud/v1";
const RATE_LIMIT_WARNING_THRESHOLD = 100;
class HetznerClient {
  apiToken;
  baseUrl;
  constructor(config) {
    if (!config.apiToken) {
      throw new Error("HetznerClient: apiToken is required");
    }
    this.apiToken = config.apiToken;
    this.baseUrl = config.baseUrl ?? DEFAULT_BASE_URL;
  }
  // -------------------------------------------------------------------------
  // Private: core request with retry & rate-limit handling
  // -------------------------------------------------------------------------
  /**
   * Execute an HTTP request against the Hetzner Cloud API with automatic
   * exponential backoff retry on transient failures and rate limits.
   *
   * @param endpoint  - API path, e.g. "/servers"
   * @param options   - Standard RequestInit (method, body, headers, etc.)
   * @returns Parsed JSON response of type T
   * @throws Error with descriptive message including endpoint and status code
   */
  async request(endpoint, options) {
    const url = `${this.baseUrl}${endpoint}`;
    return backOff(
      async () => {
        const response = await fetch(url, {
          ...options,
          headers: {
            Authorization: `Bearer ${this.apiToken}`,
            "Content-Type": "application/json",
            ...options?.headers
          }
        });
        const remainingHeader = response.headers.get("RateLimit-Remaining");
        if (remainingHeader !== null) {
          const remaining = parseInt(remainingHeader, 10);
          if (!Number.isNaN(remaining) && remaining < RATE_LIMIT_WARNING_THRESHOLD) {
            console.warn(
              `[HetznerClient] Rate limit warning: ${remaining} requests remaining (endpoint: ${options?.method ?? "GET"} ${endpoint})`
            );
          }
        }
        if (response.status === 429) {
          const resetHeader = response.headers.get("RateLimit-Reset");
          let waitMs = 6e4;
          if (resetHeader) {
            const resetEpochSeconds = parseInt(resetHeader, 10);
            if (!Number.isNaN(resetEpochSeconds)) {
              waitMs = Math.max(resetEpochSeconds * 1e3 - Date.now(), 1e3);
            }
          }
          console.warn(
            `[HetznerClient] Rate limited on ${options?.method ?? "GET"} ${endpoint}. Retry after ${waitMs}ms`
          );
          throw new Error(
            `Rate limited on ${options?.method ?? "GET"} ${endpoint}. Retry after ${waitMs}ms`
          );
        }
        if (response.status === 204) {
          return void 0;
        }
        if (!response.ok) {
          let errorMessage = response.statusText;
          try {
            const errorBody = await response.json();
            if (errorBody.error?.message) {
              errorMessage = errorBody.error.message;
            }
          } catch {
          }
          const err = new Error(
            `Hetzner API error on ${options?.method ?? "GET"} ${endpoint}: ${response.status} ${errorMessage}`
          );
          if (response.status >= 500) {
            throw err;
          }
          err.isRetriable = false;
          throw err;
        }
        return await response.json();
      },
      {
        numOfAttempts: 5,
        startingDelay: 1e3,
        timeMultiple: 2,
        maxDelay: 3e4,
        jitter: "full",
        retry: (err) => {
          if ("isRetriable" in err && err.isRetriable === false) {
            return false;
          }
          console.debug(
            `[HetznerClient] Retrying after error: ${err.message}`
          );
          return true;
        }
      }
    );
  }
  // -------------------------------------------------------------------------
  // Public API: Servers
  // -------------------------------------------------------------------------
  /**
   * Create a new server (VPS).
   *
   * @see https://docs.hetzner.cloud/#servers-create-a-server
   */
  async createServer(params) {
    return this.request("/servers", {
      method: "POST",
      body: JSON.stringify(params)
    });
  }
  /**
   * Get details of a specific server.
   *
   * @see https://docs.hetzner.cloud/#servers-get-a-server
   */
  async getServer(serverId) {
    return this.request(`/servers/${serverId}`);
  }
  /**
   * Delete a server permanently.
   *
   * @see https://docs.hetzner.cloud/#servers-delete-a-server
   */
  async deleteServer(serverId) {
    await this.request(`/servers/${serverId}`, {
      method: "DELETE"
    });
  }
  /**
   * Get all actions for a specific server.
   *
   * @see https://docs.hetzner.cloud/#server-actions-get-all-actions-for-a-server
   */
  async getServerActions(serverId) {
    return this.request(`/servers/${serverId}/actions`);
  }
  // -------------------------------------------------------------------------
  // Public API: Actions
  // -------------------------------------------------------------------------
  /**
   * Get details of a specific action.
   *
   * @see https://docs.hetzner.cloud/#actions-get-an-action
   */
  async getAction(actionId) {
    return this.request(`/actions/${actionId}`);
  }
  // -------------------------------------------------------------------------
  // Public API: SSH Keys
  // -------------------------------------------------------------------------
  /**
   * Create an SSH key resource.
   *
   * @see https://docs.hetzner.cloud/#ssh-keys-create-an-ssh-key
   */
  async createSSHKey(params) {
    return this.request("/ssh_keys", {
      method: "POST",
      body: JSON.stringify(params)
    });
  }
  /**
   * Delete an SSH key resource.
   *
   * @see https://docs.hetzner.cloud/#ssh-keys-delete-an-ssh-key
   */
  async deleteSSHKey(keyId) {
    await this.request(`/ssh_keys/${keyId}`, {
      method: "DELETE"
    });
  }
  // -------------------------------------------------------------------------
  // Public API: Firewalls
  // -------------------------------------------------------------------------
  /**
   * Create a firewall with rules.
   *
   * @see https://docs.hetzner.cloud/#firewalls-create-a-firewall
   */
  async createFirewall(params) {
    return this.request("/firewalls", {
      method: "POST",
      body: JSON.stringify(params)
    });
  }
  /**
   * Get details of a specific firewall.
   *
   * @see https://docs.hetzner.cloud/#firewalls-get-a-firewall
   */
  async getFirewall(firewallId) {
    return this.request(`/firewalls/${firewallId}`);
  }
  /**
   * List all firewalls in the project.
   *
   * @see https://docs.hetzner.cloud/#firewalls-get-all-firewalls
   */
  async listFirewalls() {
    return this.request("/firewalls");
  }
}
async function deprovisionVPS(userId) {
  console.log(`[deprovision-vps] Starting deprovisioning for userId=${userId}`);
  const subscription = await db.query.subscriptions.findFirst({
    where: eq(subscriptions.userId, userId)
  });
  if (!subscription) {
    console.warn(`[deprovision-vps] No subscription found for userId=${userId}, skipping`);
    return;
  }
  if (!subscription.vpsProvisioned && !subscription.hetznerServerId) {
    console.warn(
      `[deprovision-vps] VPS not provisioned for userId=${userId}, skipping`
    );
    return;
  }
  const hetznerClient = new HetznerClient({
    apiToken: process.env.HETZNER_API_TOKEN
  });
  if (subscription.hetznerServerId) {
    try {
      await hetznerClient.deleteServer(subscription.hetznerServerId);
      console.log(
        `[deprovision-vps] Deleted server ${subscription.hetznerServerId} for userId=${userId}`
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      if (message.includes("404") || message.includes("not found")) {
        console.log(
          `[deprovision-vps] Server ${subscription.hetznerServerId} already deleted for userId=${userId}`
        );
      } else {
        console.error(
          `[deprovision-vps] Failed to delete server ${subscription.hetznerServerId} for userId=${userId}:`,
          err
        );
      }
    }
  }
  if (subscription.hetznerSshKeyId) {
    try {
      await hetznerClient.deleteSSHKey(subscription.hetznerSshKeyId);
      console.log(
        `[deprovision-vps] Deleted SSH key ${subscription.hetznerSshKeyId} for userId=${userId}`
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      if (message.includes("404") || message.includes("not found")) {
        console.log(
          `[deprovision-vps] SSH key ${subscription.hetznerSshKeyId} already deleted for userId=${userId}`
        );
      } else {
        console.error(
          `[deprovision-vps] Failed to delete SSH key ${subscription.hetznerSshKeyId} for userId=${userId}:`,
          err
        );
      }
    }
  }
  await db.update(subscriptions).set({
    vpsProvisioned: false,
    hetznerServerId: null,
    hetznerSshKeyId: null,
    vpsIpAddress: null,
    vpsHostname: null,
    provisioningStatus: null,
    sshPrivateKey: null,
    deprovisionedAt: /* @__PURE__ */ new Date(),
    updatedAt: /* @__PURE__ */ new Date()
  }).where(eq(subscriptions.userId, userId));
  console.log(`[deprovision-vps] Deprovisioning completed for userId=${userId}`);
}
async function scheduleGracePeriodDeprovision(userId, subscriptionId) {
  try {
    const gracePeriodEnd = /* @__PURE__ */ new Date();
    gracePeriodEnd.setDate(gracePeriodEnd.getDate() + 3);
    await db.update(subscriptions).set({
      status: "grace_period",
      gracePeriodEndsAt: gracePeriodEnd,
      updatedAt: /* @__PURE__ */ new Date()
    }).where(eq(subscriptions.userId, userId));
    const jobName = `deprovision-${userId}`;
    const job = schedule.scheduleJob(jobName, gracePeriodEnd, async () => {
      console.log(`Grace period job running for user ${userId}`);
      try {
        const subscription = await db.query.subscriptions.findFirst({
          where: eq(subscriptions.userId, userId)
        });
        if (!subscription) {
          console.error(`No subscription found for user ${userId}`);
          return;
        }
        if (subscription.status === "grace_period") {
          console.log(`Deprovisioning VPS for user ${userId} (grace period expired)`);
          await deprovisionVPS(userId);
          await db.update(subscriptions).set({
            status: "canceled",
            vpsProvisioned: false,
            updatedAt: /* @__PURE__ */ new Date()
          }).where(eq(subscriptions.userId, userId));
          console.log(`VPS deprovisioned for user ${userId}`);
        } else {
          console.log(
            `Skipping deprovisioning for user ${userId} - subscription status is ${subscription.status} (not grace_period)`
          );
        }
      } catch (error) {
        console.error(`Failed to deprovision VPS for user ${userId}:`, error);
      }
    });
    console.log(`Grace period deprovisioning job scheduled for user ${userId} at ${gracePeriodEnd.toISOString()}`);
    return job;
  } catch (error) {
    console.error(`Failed to schedule grace period job for user ${userId}:`, error);
    throw error;
  }
}
function cancelGracePeriodJob(userId) {
  const jobName = `deprovision-${userId}`;
  const job = schedule.scheduledJobs[jobName];
  if (job) {
    job.cancel();
    console.log(`Canceled grace period job for user ${userId}`);
    return true;
  }
  console.log(`No grace period job found for user ${userId}`);
  return false;
}
async function updateSubscriptionStatus(params) {
  const { userId, polarCustomerId, polarSubscriptionId, status, currentPeriodEnd, gracePeriodEndsAt } = params;
  try {
    const existing = await db.query.subscriptions.findFirst({
      where: eq(subscriptions.userId, userId)
    });
    if (existing) {
      await db.update(subscriptions).set({
        polarCustomerId: polarCustomerId ?? existing.polarCustomerId,
        polarSubscriptionId: polarSubscriptionId ?? existing.polarSubscriptionId,
        status,
        currentPeriodEnd: currentPeriodEnd ?? existing.currentPeriodEnd,
        gracePeriodEndsAt: gracePeriodEndsAt === null ? null : gracePeriodEndsAt ?? existing.gracePeriodEndsAt,
        updatedAt: /* @__PURE__ */ new Date()
      }).where(eq(subscriptions.userId, userId));
    } else {
      await db.insert(subscriptions).values({
        id: crypto.randomUUID(),
        userId,
        polarCustomerId: polarCustomerId ?? null,
        polarSubscriptionId: polarSubscriptionId ?? null,
        status,
        currentPeriodEnd: currentPeriodEnd ?? null,
        gracePeriodEndsAt: gracePeriodEndsAt ?? null,
        vpsProvisioned: false,
        createdAt: /* @__PURE__ */ new Date(),
        updatedAt: /* @__PURE__ */ new Date()
      });
    }
    console.log(`Subscription updated for user ${userId}: status=${status}`);
  } catch (error) {
    console.error("Failed to update subscription status:", error);
    throw error;
  }
}
async function getSubscription(userId) {
  try {
    const subscription = await db.query.subscriptions.findFirst({
      where: eq(subscriptions.userId, userId)
    });
    return subscription ?? null;
  } catch (error) {
    console.error("Failed to get subscription:", error);
    return null;
  }
}
async function scheduleGracePeriod(userId, subscriptionId) {
  try {
    const gracePeriodEnd = /* @__PURE__ */ new Date();
    gracePeriodEnd.setDate(gracePeriodEnd.getDate() + 3);
    await db.update(subscriptions).set({
      status: "grace_period",
      gracePeriodEndsAt: gracePeriodEnd,
      updatedAt: /* @__PURE__ */ new Date()
    }).where(eq(subscriptions.userId, userId));
    await scheduleGracePeriodDeprovision(userId, subscriptionId);
    console.log(`Grace period scheduled for user ${userId}, ends at ${gracePeriodEnd.toISOString()}`);
    return gracePeriodEnd;
  } catch (error) {
    console.error("Failed to schedule grace period:", error);
    throw error;
  }
}
export {
  HetznerClient as H,
  cancelGracePeriodJob as c,
  getSubscription as g,
  polarClient as p,
  scheduleGracePeriod as s,
  updateSubscriptionStatus as u
};
