<script lang="ts">
	import type { PageData } from './$types';

	export let data: PageData;

	let refreshing = false;
	let disconnecting = false;
	let errorMessage = '';
	let successMessage = '';

	// Check for success message from OAuth callback
	if (typeof window !== 'undefined') {
		const params = new URLSearchParams(window.location.search);
		if (params.get('success') === 'true') {
			successMessage = 'Claude account connected successfully!';
			// Clean up URL
			window.history.replaceState({}, '', '/dashboard/claude');
		}
	}

	async function handleRefresh() {
		refreshing = true;
		errorMessage = '';
		successMessage = '';

		try {
			const response = await fetch('/api/claude/refresh', {
				method: 'POST'
			});

			const result = await response.json();

			if (result.success) {
				successMessage = 'Token refreshed successfully!';
				// Reload page data
				window.location.reload();
			} else {
				errorMessage = result.error || 'Failed to refresh token';
			}
		} catch (err) {
			errorMessage = 'Network error: Failed to refresh token';
		} finally {
			refreshing = false;
		}
	}

	async function handleDisconnect() {
		if (!confirm('Are you sure you want to disconnect your Claude account?')) {
			return;
		}

		disconnecting = true;
		errorMessage = '';
		successMessage = '';

		try {
			const response = await fetch('/api/claude/disconnect', {
				method: 'POST'
			});

			if (response.ok) {
				successMessage = 'Claude account disconnected';
				// Reload page data
				window.location.reload();
			} else {
				errorMessage = 'Failed to disconnect account';
			}
		} catch (err) {
			errorMessage = 'Network error: Failed to disconnect';
		} finally {
			disconnecting = false;
		}
	}

	function formatDate(isoDate: string | null): string {
		if (!isoDate) return 'Unknown';
		return new Date(isoDate).toLocaleString();
	}
</script>

<svelte:head>
	<title>Claude Connection - Rachel Cloud</title>
</svelte:head>

<div class="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
	<div class="max-w-3xl mx-auto">
		<div class="bg-white shadow rounded-lg p-6">
			<h1 class="text-3xl font-bold text-gray-900 mb-6">Claude Connection</h1>

			<!-- Status Messages -->
			{#if successMessage}
				<div class="mb-4 bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded">
					{successMessage}
				</div>
			{/if}

			{#if errorMessage}
				<div class="mb-4 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded">
					{errorMessage}
				</div>
			{/if}

			<!-- Connection Status -->
			{#if !data.connected}
				<div class="mb-6">
					<div class="flex items-center mb-4">
						<svg class="w-6 h-6 text-gray-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
						</svg>
						<h2 class="text-xl font-semibold text-gray-700">Not Connected</h2>
					</div>
					<p class="text-gray-600 mb-6">
						Connect your Claude account to enable AI-powered features. Your tokens will be stored
						securely with AES-256-GCM encryption.
					</p>
					<a
						href="/api/claude/connect"
						class="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded transition-colors"
					>
						Connect Claude Account
					</a>
				</div>
			{:else}
				<div class="mb-6">
					<div class="flex items-center mb-4">
						<svg class="w-6 h-6 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
						</svg>
						<h2 class="text-xl font-semibold text-green-700">Connected</h2>
					</div>

					<div class="bg-gray-50 rounded p-4 mb-4">
						<p class="text-sm text-gray-600">
							<strong>Token Expires:</strong> {formatDate(data.expiresAt)}
						</p>
						<p class="text-xs text-gray-500 mt-2">
							Tokens are automatically refreshed when they expire.
						</p>
					</div>

					<div class="flex gap-3">
						<button
							on:click={handleRefresh}
							disabled={refreshing}
							class="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-2 px-4 rounded transition-colors"
						>
							{refreshing ? 'Refreshing...' : 'Refresh Token'}
						</button>
						<button
							on:click={handleDisconnect}
							disabled={disconnecting}
							class="bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white font-semibold py-2 px-4 rounded transition-colors"
						>
							{disconnecting ? 'Disconnecting...' : 'Disconnect'}
						</button>
					</div>
				</div>
			{/if}

			<!-- Security Information -->
			<div class="mt-8 border-t pt-6">
				<h3 class="text-lg font-semibold text-gray-900 mb-3">Security & Privacy</h3>
				<ul class="space-y-2 text-sm text-gray-600">
					<li class="flex items-start">
						<svg class="w-5 h-5 text-green-500 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
						</svg>
						OAuth 2.0 + PKCE flow for secure authorization
					</li>
					<li class="flex items-start">
						<svg class="w-5 h-5 text-green-500 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
						</svg>
						AES-256-GCM encryption for token storage
					</li>
					<li class="flex items-start">
						<svg class="w-5 h-5 text-green-500 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
						</svg>
						Automatic token refresh when expired
					</li>
					<li class="flex items-start">
						<svg class="w-5 h-5 text-green-500 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
						</svg>
						HTTP-only cookies for PKCE verifier storage
					</li>
				</ul>
			</div>
		</div>
	</div>
</div>
