/**
 * Telegram bot command handlers.
 *
 * These commands are intercepted by the router BEFORE forwarding to containers.
 * They provide quick management actions without opening the web dashboard.
 *
 * @module telegram/commands
 */

import { db } from '$lib/db';
import { users, subscriptions } from '$lib/db/schema';
import { eq } from 'drizzle-orm';
import { sendMessage } from './bot-api';
import { orchestrator } from '$lib/orchestrator/client';

const BASE_URL = process.env.PUBLIC_BASE_URL || 'https://get-rachel.com';

/**
 * Check if a message is a command (starts with /).
 * Returns the command name without the slash, or null.
 */
export function parseCommand(text: string | undefined): string | null {
	if (!text?.startsWith('/')) return null;
	return text.split(' ')[0].replace('@', '').substring(1).toLowerCase();
}

/**
 * Handle /start — welcome message based on subscription status.
 */
export async function handleStart(telegramId: number): Promise<void> {
	// Look up user
	const user = await db.query.users.findFirst({
		where: eq(users.telegramId, telegramId),
		with: { subscription: true },
	});

	if (!user) {
		// Brand new user — create account
		await db.insert(users).values({
			telegramId,
			createdAt: new Date(),
			updatedAt: new Date(),
		});

		await sendMessage(
			telegramId,
			`👋 Welcome to Rachel!\n\n` +
				`I'm your personal AI assistant. Subscribe for $20/mo to get started:\n` +
				`${BASE_URL}/subscribe?tg=${telegramId}\n\n` +
				`Once you subscribe, I'll be ready to chat!`
		);
		return;
	}

	const sub = user.subscription;

	if (!sub || sub.status !== 'active') {
		await sendMessage(
			telegramId,
			`👋 Welcome back!\n\n` +
				`You don't have an active subscription. Subscribe at:\n` +
				`${BASE_URL}/subscribe?tg=${telegramId}`
		);
		return;
	}

	if (!sub.containerProvisioned || sub.provisioningStatus !== 'ready') {
		await sendMessage(
			telegramId,
			`👋 Welcome back! Your instance is being set up...\n\n` +
				`This usually takes about 30 seconds. Just send me a message when it's ready!`
		);
		return;
	}

	await sendMessage(
		telegramId,
		`👋 Welcome back! Just message me anything and I'll help you out.`
	);
}

/**
 * Handle /status — show container status.
 */
export async function handleStatus(telegramId: number): Promise<void> {
	const sub = await db.query.subscriptions.findFirst({
		where: eq(subscriptions.telegramId, telegramId),
	});

	if (!sub || !sub.containerProvisioned || !sub.containerId) {
		await sendMessage(telegramId, '🔴 Your Rachel instance is not deployed.');
		return;
	}

	try {
		const result = await orchestrator.getContainerStatus(String(telegramId));
		if (result) {
			const uptime = result.container.uptime;
			const days = Math.floor(uptime / 86400);
			const hours = Math.floor((uptime % 86400) / 3600);

			await sendMessage(
				telegramId,
				`🟢 Your Rachel instance is running\n` +
					`Uptime: ${days}d ${hours}h\n` +
					`Image: ${result.container.image}`
			);
		} else {
			await sendMessage(telegramId, '🟡 Container status unknown.');
		}
	} catch {
		await sendMessage(telegramId, '⚠️ Could not check container status.');
	}
}

/**
 * Handle /restart — restart the user's container.
 */
export async function handleRestart(telegramId: number): Promise<void> {
	const sub = await db.query.subscriptions.findFirst({
		where: eq(subscriptions.telegramId, telegramId),
	});

	if (!sub || !sub.containerProvisioned || !sub.containerId) {
		await sendMessage(telegramId, '🔴 No instance to restart.');
		return;
	}

	await sendMessage(telegramId, '♻️ Restarting your Rachel instance...');

	try {
		await orchestrator.restartContainer(String(telegramId));
		await sendMessage(telegramId, '✅ Restart complete! Rachel is back online.');
	} catch {
		await sendMessage(telegramId, '⚠️ Failed to restart. Please try again or visit the dashboard.');
	}
}

/**
 * Handle /logs — show last 20 log lines.
 */
export async function handleLogs(telegramId: number): Promise<void> {
	const sub = await db.query.subscriptions.findFirst({
		where: eq(subscriptions.telegramId, telegramId),
	});

	if (!sub || !sub.containerProvisioned || !sub.containerId) {
		await sendMessage(telegramId, '🔴 No instance running.');
		return;
	}

	try {
		const result = await orchestrator.getContainerLogs(String(telegramId), { tail: 20 });
		const logs = result.logs?.trim();

		if (!logs) {
			await sendMessage(telegramId, '📋 No logs available.');
			return;
		}

		// Truncate to Telegram's message limit (4096 chars)
		const truncated = logs.length > 3500 ? '...\n' + logs.slice(-3500) : logs;
		await sendMessage(telegramId, `📋 Recent logs:\n\n<pre>${escapeHtml(truncated)}</pre>`, {
			parseMode: 'HTML',
		});
	} catch {
		await sendMessage(telegramId, '⚠️ Could not fetch logs.');
	}
}

/**
 * Handle /billing — show subscription info.
 */
export async function handleBilling(telegramId: number): Promise<void> {
	const sub = await db.query.subscriptions.findFirst({
		where: eq(subscriptions.telegramId, telegramId),
	});

	if (!sub) {
		await sendMessage(
			telegramId,
			`📋 No subscription found.\n\nSubscribe at: ${BASE_URL}/subscribe?tg=${telegramId}`
		);
		return;
	}

	const statusEmoji = sub.status === 'active' ? '✅' : sub.status === 'grace_period' ? '⏳' : '❌';
	const statusText = sub.status === 'active'
		? 'Active'
		: sub.status === 'grace_period'
			? 'Grace Period'
			: 'Canceled';

	let msg = `📋 Subscription: ${statusEmoji} ${statusText}`;

	if (sub.currentPeriodEnd) {
		msg += `\nNext billing: ${sub.currentPeriodEnd.toLocaleDateString('en-US', {
			month: 'long',
			day: 'numeric',
			year: 'numeric',
		})}`;
	}

	msg += `\n\n💳 Manage billing: ${BASE_URL}/dashboard/billing`;

	await sendMessage(telegramId, msg);
}

/**
 * Handle /help — list available commands.
 */
export async function handleHelp(telegramId: number): Promise<void> {
	await sendMessage(
		telegramId,
		`📖 Available commands:\n\n` +
			`/start — Welcome message\n` +
			`/status — Check your instance status\n` +
			`/restart — Restart your Rachel instance\n` +
			`/logs — View recent logs\n` +
			`/billing — Subscription & billing info\n` +
			`/help — This message\n\n` +
			`Just send any other message and I'll respond as your AI assistant!`
	);
}

/**
 * Escape HTML special characters for Telegram HTML parse mode.
 */
function escapeHtml(text: string): string {
	return text
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;');
}
