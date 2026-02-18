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
 * Resolve a container's IP address via Docker socket API.
 * Rachel Cloud runs on the host (not in Docker), so DNS resolution of
 * container names doesn't work. We query the Docker API directly.
 *
 * Results are cached briefly (30s) to avoid hitting Docker API on every message.
 */
const containerIpCache = new Map<string, { ip: string; expiresAt: number }>();

async function resolveContainerIp(containerName: string): Promise<string | null> {
	const cached = containerIpCache.get(containerName);
	if (cached && cached.expiresAt > Date.now()) {
		return cached.ip;
	}

	try {
		const resp = await fetch(
			`http://localhost/containers/${encodeURIComponent(containerName)}/json`,
			{ headers: { Host: 'docker' }, /* @ts-ignore */ unix: '/var/run/docker.sock' }
		);

		if (!resp.ok) return null;

		const info = (await resp.json()) as Record<string, unknown>;
		const networks = (info.NetworkSettings as Record<string, unknown>)?.Networks as
			| Record<string, Record<string, unknown>>
			| undefined;

		if (!networks) return null;

		// Find IP on any network (typically rachel-net)
		for (const net of Object.values(networks)) {
			const ip = net.IPAddress as string;
			if (ip) {
				containerIpCache.set(containerName, { ip, expiresAt: Date.now() + 30_000 });
				return ip;
			}
		}
	} catch (error) {
		console.error(`[router] Failed to resolve IP for ${containerName}:`, error);
	}

	return null;
}

/**
 * Forward a raw Telegram update to a user's container.
 *
 * Each Rachel8 container runs grammY in webhook mode and accepts
 * POST requests with the raw Telegram update JSON on its internal port.
 *
 * Since rachel-cloud runs on the host (not inside Docker), we resolve
 * the container IP via Docker API and connect directly.
 */
export async function forwardToContainer(
	containerName: string,
	update: Record<string, unknown>
): Promise<void> {
	const ip = await resolveContainerIp(containerName);
	if (!ip) {
		console.error(`[router] Could not resolve IP for container ${containerName}`);
		const telegramId = extractTelegramId(update);
		if (telegramId) {
			await sendMessage(telegramId, '⚠️ Rachel is temporarily unavailable. Try again in a moment.');
		}
		return;
	}

	const url = `http://${ip}:8443/webhook`;

	try {
		const response = await fetch(url, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(update),
		});

		if (!response.ok) {
			console.error(
				`[router] Forward to ${containerName} (${ip}) failed: ${response.status} ${response.statusText}`
			);
		}
	} catch (error) {
		console.error(`[router] Failed to reach container ${containerName} (${ip}):`, error);
		const telegramId = extractTelegramId(update);
		if (telegramId) {
			await sendMessage(telegramId, '⚠️ Rachel is temporarily unavailable. Try again in a moment.');
		}
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
