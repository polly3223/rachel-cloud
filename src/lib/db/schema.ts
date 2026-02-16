import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { relations } from 'drizzle-orm';

// Users table — keyed on Telegram user ID
export const users = sqliteTable('users', {
	telegramId: integer('telegram_id').primaryKey(),
	firstName: text('first_name'),
	lastName: text('last_name'),
	username: text('username'), // @username on Telegram
	photoUrl: text('photo_url'),
	languageCode: text('language_code'),
	email: text('email'), // Optional — from Polar if available
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
	telegramId: integer('telegram_id')
		.notNull()
		.unique()
		.references(() => users.telegramId, { onDelete: 'cascade' }),
	polarCustomerId: text('polar_customer_id'),
	polarSubscriptionId: text('polar_subscription_id'),
	status: text('status', { enum: ['none', 'active', 'grace_period', 'canceled'] })
		.notNull()
		.$defaultFn(() => 'none'),
	currentPeriodEnd: integer('current_period_end', { mode: 'timestamp' }),
	gracePeriodEndsAt: integer('grace_period_ends_at', { mode: 'timestamp' }),
	// Container provisioned flag
	containerProvisioned: integer('container_provisioned', { mode: 'boolean' })
		.notNull()
		.$defaultFn(() => false),

	// Docker container fields
	containerId: text('container_id'),
	containerName: text('container_name'),

	// Provisioning status
	provisioningStatus: text('provisioning_status', {
		enum: ['pending', 'creating', 'starting', 'ready', 'failed']
	}),
	provisioningError: text('provisioning_error'),
	provisionedAt: integer('provisioned_at', { mode: 'timestamp' }),
	deprovisionedAt: integer('deprovisioned_at', { mode: 'timestamp' }),

	// Docker image tracking
	currentImage: text('current_image'),
	targetImage: text('target_image'),
	previousImage: text('previous_image'),

	createdAt: integer('created_at', { mode: 'timestamp' })
		.$defaultFn(() => new Date())
		.notNull(),
	updatedAt: integer('updated_at', { mode: 'timestamp' })
		.$defaultFn(() => new Date())
		.$onUpdateFn(() => new Date())
		.notNull()
});

// Relations
export const usersRelations = relations(users, ({ one }) => ({
	subscription: one(subscriptions, {
		fields: [users.telegramId],
		references: [subscriptions.telegramId]
	})
}));

export const subscriptionsRelations = relations(subscriptions, ({ one }) => ({
	user: one(users, {
		fields: [subscriptions.telegramId],
		references: [users.telegramId]
	})
}));
