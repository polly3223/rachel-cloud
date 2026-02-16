/**
 * Shared bot message router.
 *
 * Routes incoming Telegram updates to the correct user's container.
 * Intercepts management commands (/start, /status, etc.) before forwarding.
 * Users without an active subscription get a friendly message.
 *
 * @module telegram/router
 */

import { db } from '$lib/db';
import { users, subscriptions } from '$lib/db/schema';
import { eq } from 'drizzle-orm';
import { sendMessage } from './bot-api';
import {
	parseCommand,
	handleStart,
	handleStatus,
	handleRestart,
	handleLogs,
	handleBilling,
	handleHelp,
} from './commands';

const BASE_URL = process.env.PUBLIC_BASE_URL || 'https://get-rachel.com';

/**
 * Management commands that are handled by the platform, not forwarded to containers.
 */
const PLATFORM_COMMANDS: Record<string, (telegramId: number) => Promise<void>> = {
	start: handleStart,
	status: handleStatus,
	restart: handleRestart,
	logs: handleLogs,
	billing: handleBilling,
	help: handleHelp,
};

/**
 * Extract the sender's Telegram ID from any supported update type.
 */
export function extractTelegramId(update: Record<string, unknown>): number | null {
	const message = update.message as Record<string, unknown> | undefined;
	const callbackQuery = update.callback_query as Record<string, unknown> | undefined;
	const editedMessage = update.edited_message as Record<string, unknown> | undefined;

	const from =
		(message?.from as Record<string, unknown>) ??
		(callbackQuery?.from as Record<string, unknown>) ??
		(editedMessage?.from as Record<string, unknown>);

	if (!from?.id) return null;
	return from.id as number;
}

/**
 * Extract the message text from an update (if any).
 */
function extractMessageText(update: Record<string, unknown>): string | undefined {
	const message = update.message as Record<string, unknown> | undefined;
	return message?.text as string | undefined;
}

/**
 * Look up a user and their subscription/container info.
 */
async function getUserWithSubscription(telegramId: number) {
	const user = await db.query.users.findFirst({
		where: eq(users.telegramId, telegramId),
		with: {
			subscription: true,
		},
	});
	return user ?? null;
}

/**
 * Forward a raw Telegram update to a user's container.
 *
 * Each Rachel8 container runs grammY in webhook mode and accepts
 * POST requests with the raw Telegram update JSON on its internal port.
 */
export async function forwardToContainer(
	containerName: string,
	update: Record<string, unknown>
): Promise<void> {
	// Containers are on the same Docker network, reachable by name
	const url = `http://${containerName}:8443/webhook`;

	try {
		const response = await fetch(url, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(update),
		});

		if (!response.ok) {
			console.error(
				`[router] Forward to ${containerName} failed: ${response.status} ${response.statusText}`
			);
		}
	} catch (error) {
		console.error(`[router] Failed to reach container ${containerName}:`, error);
		// TODO: Send a "Rachel is temporarily unavailable" message to the user
	}
}

/**
 * Handle a message from a user without an active subscription/container.
 */
export async function handleUnsubscribedUser(
	telegramId: number,
	update: Record<string, unknown>
): Promise<void> {
	const text = extractMessageText(update);
	const command = parseCommand(text);

	// Even unsubscribed users can use /start and /help
	if (command === 'start') {
		await handleStart(telegramId);
		return;
	}

	if (command === 'help') {
		await handleHelp(telegramId);
		return;
	}

	await sendMessage(
		telegramId,
		`You don't have an active subscription yet.\n\n` +
			`Get started at ${BASE_URL}/subscribe?tg=${telegramId}`
	);
}

/**
 * Main routing function — called by the webhook endpoint.
 *
 * 1. Extract telegram_id from update
 * 2. Check for platform commands (intercept before forwarding)
 * 3. Look up user + container
 * 4. Forward to container or handle unsubscribed user
 */
export async function routeUpdate(update: Record<string, unknown>): Promise<void> {
	const telegramId = extractTelegramId(update);
	if (!telegramId) {
		// Unsupported update type — ignore
		return;
	}

	// Check for platform management commands
	const text = extractMessageText(update);
	const command = parseCommand(text);

	// Look up user and their container
	const user = await getUserWithSubscription(telegramId);

	if (
		!user?.subscription ||
		user.subscription.status !== 'active' ||
		!user.subscription.containerProvisioned ||
		!user.subscription.containerName
	) {
		// No active container — handle with limited command set
		await handleUnsubscribedUser(telegramId, update);
		return;
	}

	// Intercept platform commands for subscribed users
	if (command && command in PLATFORM_COMMANDS) {
		await PLATFORM_COMMANDS[command](telegramId);
		return;
	}

	// Forward the raw update to the user's container
	await forwardToContainer(user.subscription.containerName, update);
}
