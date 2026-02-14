CREATE TABLE `subscriptions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`polar_customer_id` text,
	`polar_subscription_id` text,
	`status` text NOT NULL,
	`current_period_end` integer,
	`grace_period_ends_at` integer,
	`vps_provisioned` integer NOT NULL,
	`hetzner_server_id` integer,
	`hetzner_ssh_key_id` integer,
	`vps_ip_address` text,
	`vps_hostname` text,
	`provisioning_status` text,
	`provisioning_error` text,
	`provisioned_at` integer,
	`deprovisioned_at` integer,
	`ssh_private_key` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `subscriptions_user_id_unique` ON `subscriptions` (`user_id`);--> statement-breakpoint
CREATE TABLE `telegram_bots` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`bot_username` text,
	`encrypted_token` text NOT NULL,
	`validated` integer NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `telegram_bots_user_id_unique` ON `telegram_bots` (`user_id`);