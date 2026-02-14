import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

// Users table
export const users = sqliteTable('users', {
	id: text('id').primaryKey(),
	email: text('email').notNull().unique(),
	emailVerified: integer('email_verified', { mode: 'boolean' }),
	name: text('name'),
	image: text('image'),
	createdAt: integer('created_at', { mode: 'timestamp' })
		.$defaultFn(() => new Date())
		.notNull(),
	updatedAt: integer('updated_at', { mode: 'timestamp' })
		.$defaultFn(() => new Date())
		.$onUpdateFn(() => new Date())
		.notNull()
});

// Sessions table
export const sessions = sqliteTable('sessions', {
	id: text('id').primaryKey(),
	userId: text('user_id')
		.notNull()
		.references(() => users.id, { onDelete: 'cascade' }),
	expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
	ipAddress: text('ip_address'),
	userAgent: text('user_agent'),
	createdAt: integer('created_at', { mode: 'timestamp' })
		.$defaultFn(() => new Date())
		.notNull()
});

// Accounts table (for OAuth providers)
export const accounts = sqliteTable('accounts', {
	id: text('id').primaryKey(),
	userId: text('user_id')
		.notNull()
		.references(() => users.id, { onDelete: 'cascade' }),
	provider: text('provider').notNull(),
	providerAccountId: text('provider_account_id').notNull(),
	accessToken: text('access_token'),
	refreshToken: text('refresh_token'),
	expiresAt: integer('expires_at', { mode: 'timestamp' }),
	createdAt: integer('created_at', { mode: 'timestamp' })
		.$defaultFn(() => new Date())
		.notNull(),
	updatedAt: integer('updated_at', { mode: 'timestamp' })
		.$defaultFn(() => new Date())
		.$onUpdateFn(() => new Date())
		.notNull()
});

// Claude OAuth tokens table (encrypted storage)
export const claudeTokens = sqliteTable('claude_tokens', {
	id: text('id').primaryKey(),
	userId: text('user_id')
		.notNull()
		.unique()
		.references(() => users.id, { onDelete: 'cascade' }),
	encryptedAccessToken: text('encrypted_access_token').notNull(),
	encryptedRefreshToken: text('encrypted_refresh_token').notNull(),
	expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
	createdAt: integer('created_at', { mode: 'timestamp' })
		.$defaultFn(() => new Date())
		.notNull(),
	updatedAt: integer('updated_at', { mode: 'timestamp' })
		.$defaultFn(() => new Date())
		.$onUpdateFn(() => new Date())
		.notNull()
});

// Subscriptions table (Polar billing integration)
export const subscriptions = sqliteTable('subscriptions', {
	id: text('id').primaryKey(),
	userId: text('user_id')
		.notNull()
		.unique()
		.references(() => users.id, { onDelete: 'cascade' }),
	polarCustomerId: text('polar_customer_id'),
	polarSubscriptionId: text('polar_subscription_id'),
	status: text('status', { enum: ['none', 'active', 'grace_period', 'canceled'] })
		.notNull()
		.$defaultFn(() => 'none'),
	currentPeriodEnd: integer('current_period_end', { mode: 'timestamp' }),
	gracePeriodEndsAt: integer('grace_period_ends_at', { mode: 'timestamp' }),
	vpsProvisioned: integer('vps_provisioned', { mode: 'boolean' })
		.notNull()
		.$defaultFn(() => false),

	// VPS tracking fields (Phase 3)
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
	sshPrivateKey: text('ssh_private_key'),

	createdAt: integer('created_at', { mode: 'timestamp' })
		.$defaultFn(() => new Date())
		.notNull(),
	updatedAt: integer('updated_at', { mode: 'timestamp' })
		.$defaultFn(() => new Date())
		.$onUpdateFn(() => new Date())
		.notNull()
});

// Health checks table (health monitoring state per user VPS)
export const healthChecks = sqliteTable('health_checks', {
	id: text('id').primaryKey(),
	userId: text('user_id')
		.notNull()
		.unique()
		.references(() => users.id, { onDelete: 'cascade' }),
	status: text('status', { enum: ['healthy', 'unhealthy', 'down', 'circuit_open'] })
		.notNull()
		.$defaultFn(() => 'healthy'),
	consecutiveFailures: integer('consecutive_failures')
		.notNull()
		.$defaultFn(() => 0),
	circuitState: text('circuit_state', { enum: ['closed', 'open', 'half_open'] })
		.notNull()
		.$defaultFn(() => 'closed'),
	circuitOpenedAt: integer('circuit_opened_at', { mode: 'timestamp' }),
	lastCheckAt: integer('last_check_at', { mode: 'timestamp' }),
	lastHealthyAt: integer('last_healthy_at', { mode: 'timestamp' }),
	lastFailureAt: integer('last_failure_at', { mode: 'timestamp' }),
	lastRestartAttemptAt: integer('last_restart_attempt_at', { mode: 'timestamp' }),
	lastNotifiedDownAt: integer('last_notified_down_at', { mode: 'timestamp' }),
	lastNotifiedUpAt: integer('last_notified_up_at', { mode: 'timestamp' }),
	lastError: text('last_error'),
	totalChecks: integer('total_checks')
		.notNull()
		.$defaultFn(() => 0),
	totalFailures: integer('total_failures')
		.notNull()
		.$defaultFn(() => 0),
	totalRecoveries: integer('total_recoveries')
		.notNull()
		.$defaultFn(() => 0),
	createdAt: integer('created_at', { mode: 'timestamp' })
		.$defaultFn(() => new Date())
		.notNull(),
	updatedAt: integer('updated_at', { mode: 'timestamp' })
		.$defaultFn(() => new Date())
		.$onUpdateFn(() => new Date())
		.notNull()
});

// Telegram bots table (encrypted token storage)
export const telegramBots = sqliteTable('telegram_bots', {
	id: text('id').primaryKey(),
	userId: text('user_id')
		.notNull()
		.unique()
		.references(() => users.id, { onDelete: 'cascade' }),
	botUsername: text('bot_username'),
	encryptedToken: text('encrypted_token').notNull(),
	validated: integer('validated', { mode: 'boolean' })
		.notNull()
		.$defaultFn(() => false),
	createdAt: integer('created_at', { mode: 'timestamp' })
		.$defaultFn(() => new Date())
		.notNull(),
	updatedAt: integer('updated_at', { mode: 'timestamp' })
		.$defaultFn(() => new Date())
		.$onUpdateFn(() => new Date())
		.notNull()
});
