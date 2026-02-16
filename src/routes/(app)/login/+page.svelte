<script lang="ts">
	import { goto } from '$app/navigation';

	let error = $state('');
	let loading = $state(false);

	const BOT_USERNAME = 'RachelAIBot'; // TODO: make configurable via env

	/**
	 * Called by the Telegram Login Widget when auth succeeds.
	 * Sends the auth data to our backend for verification + session creation.
	 */
	async function onTelegramAuth(user: Record<string, string>) {
		loading = true;
		error = '';

		try {
			const response = await fetch('/api/auth/telegram', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(user),
			});

			if (!response.ok) {
				const data = await response.json();
				error = data.error || 'Authentication failed. Please try again.';
				loading = false;
				return;
			}

			// Session cookie is set — redirect to dashboard
			goto('/dashboard');
		} catch {
			error = 'An error occurred. Please try again.';
			loading = false;
		}
	}

	// Expose the callback globally for the Telegram widget
	if (typeof window !== 'undefined') {
		(window as unknown as Record<string, unknown>).onTelegramAuth = onTelegramAuth;
	}
</script>

<svelte:head>
	<title>Sign In - Rachel Cloud</title>
	<script async src="https://telegram.org/js/telegram-widget.js?22"
		data-telegram-login={BOT_USERNAME}
		data-size="large"
		data-onauth="onTelegramAuth(user)"
		data-request-access="write"
	></script>
</svelte:head>

<div class="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gray-50">
	<div class="max-w-md w-full space-y-8">
		<!-- Logo / Header -->
		<div class="text-center">
			<h1 class="text-4xl font-bold text-gray-900">Rachel Cloud</h1>
			<p class="mt-3 text-lg text-gray-600">
				Sign in with your Telegram account
			</p>
		</div>

		{#if error}
			<div class="rounded-md bg-red-50 p-4">
				<div class="flex">
					<div class="flex-shrink-0">
						<svg class="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
							<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
						</svg>
					</div>
					<div class="ml-3">
						<p class="text-sm font-medium text-red-800">{error}</p>
					</div>
				</div>
			</div>
		{/if}

		{#if loading}
			<div class="text-center py-8">
				<div class="inline-flex items-center gap-2 text-gray-600">
					<svg class="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
						<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
						<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
					</svg>
					Signing you in...
				</div>
			</div>
		{:else}
			<!-- Telegram Login Widget renders here -->
			<div class="flex justify-center py-6" id="telegram-login-widget">
				<!-- The widget script auto-renders a button here -->
				<noscript>
					<p class="text-gray-500">JavaScript is required to sign in with Telegram.</p>
				</noscript>
			</div>
		{/if}

		<!-- Info -->
		<div class="text-center text-sm text-gray-500 space-y-2">
			<p>
				Don't have Telegram?
				<a href="https://telegram.org/dl" target="_blank" rel="noopener" class="text-blue-600 hover:text-blue-500 font-medium">
					Download it here
				</a>
			</p>
			<p>
				<a href="/" class="text-gray-400 hover:text-gray-600">
					&larr; Back to homepage
				</a>
			</p>
		</div>
	</div>
</div>
