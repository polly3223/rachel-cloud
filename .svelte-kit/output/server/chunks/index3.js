import { Database } from "bun:sqlite";
import { drizzle } from "drizzle-orm/bun-sqlite";
import { sqliteTable, integer, text } from "drizzle-orm/sqlite-core";
import { existsSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";
const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  emailVerified: integer("email_verified", { mode: "boolean" }),
  name: text("name"),
  image: text("image"),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => /* @__PURE__ */ new Date()).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => /* @__PURE__ */ new Date()).$onUpdateFn(() => /* @__PURE__ */ new Date()).notNull()
});
const sessions = sqliteTable("sessions", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => /* @__PURE__ */ new Date()).notNull()
});
const accounts = sqliteTable("accounts", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  provider: text("provider").notNull(),
  providerAccountId: text("provider_account_id").notNull(),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  expiresAt: integer("expires_at", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => /* @__PURE__ */ new Date()).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => /* @__PURE__ */ new Date()).$onUpdateFn(() => /* @__PURE__ */ new Date()).notNull()
});
const claudeTokens = sqliteTable("claude_tokens", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().unique().references(() => users.id, { onDelete: "cascade" }),
  encryptedAccessToken: text("encrypted_access_token").notNull(),
  encryptedRefreshToken: text("encrypted_refresh_token").notNull(),
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => /* @__PURE__ */ new Date()).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => /* @__PURE__ */ new Date()).$onUpdateFn(() => /* @__PURE__ */ new Date()).notNull()
});
const subscriptions = sqliteTable("subscriptions", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().unique().references(() => users.id, { onDelete: "cascade" }),
  polarCustomerId: text("polar_customer_id"),
  polarSubscriptionId: text("polar_subscription_id"),
  status: text("status", { enum: ["none", "active", "grace_period", "canceled"] }).notNull().$defaultFn(() => "none"),
  currentPeriodEnd: integer("current_period_end", { mode: "timestamp" }),
  gracePeriodEndsAt: integer("grace_period_ends_at", { mode: "timestamp" }),
  vpsProvisioned: integer("vps_provisioned", { mode: "boolean" }).notNull().$defaultFn(() => false),
  // VPS tracking fields (Phase 3)
  hetznerServerId: integer("hetzner_server_id"),
  hetznerSshKeyId: integer("hetzner_ssh_key_id"),
  vpsIpAddress: text("vps_ip_address"),
  vpsHostname: text("vps_hostname"),
  provisioningStatus: text("provisioning_status", {
    enum: ["pending", "creating", "cloud_init", "injecting_secrets", "ready", "failed"]
  }),
  provisioningError: text("provisioning_error"),
  provisionedAt: integer("provisioned_at", { mode: "timestamp" }),
  deprovisionedAt: integer("deprovisioned_at", { mode: "timestamp" }),
  sshPrivateKey: text("ssh_private_key"),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => /* @__PURE__ */ new Date()).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => /* @__PURE__ */ new Date()).$onUpdateFn(() => /* @__PURE__ */ new Date()).notNull()
});
const telegramBots = sqliteTable("telegram_bots", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().unique().references(() => users.id, { onDelete: "cascade" }),
  botUsername: text("bot_username"),
  encryptedToken: text("encrypted_token").notNull(),
  validated: integer("validated", { mode: "boolean" }).notNull().$defaultFn(() => false),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => /* @__PURE__ */ new Date()).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => /* @__PURE__ */ new Date()).$onUpdateFn(() => /* @__PURE__ */ new Date()).notNull()
});
const schema = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  accounts,
  claudeTokens,
  sessions,
  subscriptions,
  telegramBots,
  users
}, Symbol.toStringTag, { value: "Module" }));
const dbPath = "data/rachel-cloud.db";
const dataDir = dirname(dbPath);
if (!existsSync(dataDir)) {
  mkdirSync(dataDir, { recursive: true });
}
const sqlite = new Database(dbPath, { create: true });
sqlite.exec("PRAGMA foreign_keys = ON;");
const db = drizzle(sqlite, { schema });
export {
  accounts as a,
  sessions as b,
  claudeTokens as c,
  db as d,
  subscriptions as s,
  telegramBots as t,
  users as u
};
