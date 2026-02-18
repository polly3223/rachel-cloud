<script lang="ts">
	import { goto } from '$app/navigation';

	let error = $state('');
	let loading = $state(false);

	const BOT_USERNAME = 'rachelcloud_bot';

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

	function mountTelegramWidget(node: HTMLElement) {
		const script = document.createElement('script');
		script.async = true;
		script.src = 'https://telegram.org/js/telegram-widget.js?22';
		script.setAttribute('data-telegram-login', BOT_USERNAME);
		script.setAttribute('data-size', 'large');
		script.setAttribute('data-auth-url', '/api/auth/telegram');
		script.setAttribute('data-request-access', 'write');
		node.appendChild(script);
		return { destroy() { node.removeChild(script); } };
	}
</script>

<svelte:head>
	<title>Sign In - Rachel Cloud</title>
</svelte:head>

<div class="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-[#0a0a0f] relative overflow-hidden">
	<!-- Glow orbs matching landing page -->
	<div class="absolute top-1/4 -left-32 w-96 h-96 bg-[#0086EE]/20 rounded-full blur-[120px]"></div>
	<div class="absolute bottom-1/4 -right-32 w-80 h-80 bg-[#0086EE]/15 rounded-full blur-[100px]"></div>

	<div class="relative max-w-md w-full space-y-8">
		<!-- Logo / Header -->
		<div class="text-center">
			<a href="/" class="inline-block mb-6">
				<span class="text-sm text-gray-500 hover:text-gray-400 transition-colors">&larr; Back to homepage</span>
			</a>
			<h1 class="text-4xl font-bold text-white">Rachel Cloud</h1>
			<p class="mt-3 text-lg text-gray-400">
				Sign in with your Telegram account
			</p>
		</div>

		{#if error}
			<div class="rounded-xl bg-red-500/10 border border-red-500/20 p-4">
				<div class="flex">
					<div class="flex-shrink-0">
						<svg class="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
							<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
						</svg>
					</div>
					<div class="ml-3">
						<p class="text-sm font-medium text-red-300">{error}</p>
					</div>
				</div>
			</div>
		{/if}

		{#if loading}
			<div class="text-center py-8">
				<div class="inline-flex items-center gap-2 text-gray-400">
					<svg class="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
						<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
						<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
					</svg>
					Signing you in...
				</div>
			</div>
		{:else}
			<!-- Telegram Login Widget renders here -->
			<div class="flex justify-center py-6" id="telegram-login-widget" use:mountTelegramWidget>
				<noscript>
					<p class="text-gray-500">JavaScript is required to sign in with Telegram.</p>
				</noscript>
			</div>
		{/if}

		<!-- Info -->
		<div class="text-center text-sm text-gray-500 space-y-2">
			<p>
				Don't have Telegram?
				<a href="https://telegram.org/dl" target="_blank" rel="noopener" class="text-[#0086EE] hover:text-[#1a94f0] font-medium">
					Download it here
				</a>
			</p>
		</div>
	</div>
</div>
