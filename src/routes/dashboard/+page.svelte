<script lang="ts">
	let { data } = $props();

	// State for deployment
	let deploying = $state(false);
	let error = $state<string | null>(null);
	let pollingStatus = $state<string | null>(data.subscription?.provisioningStatus ?? null);
	let pollingIp = $state<string | null>(data.subscription?.vpsIpAddress ?? null);
	let pollingError = $state<string | null>(data.subscription?.provisioningError ?? null);
	let pollTimer = $state<ReturnType<typeof setInterval> | null>(null);

	// Status display messages
	const statusMessages: Record<string, { label: string; description: string }> = {
		pending: {
			label: 'Preparing',
			description: 'Preparing your VPS...',
		},
		creating: {
			label: 'Creating Server',
			description: 'Creating server on Hetzner...',
		},
		cloud_init: {
			label: 'Installing Software',
			description: 'Installing software and configuring system...',
		},
		injecting_secrets: {
			label: 'Connecting Accounts',
			description: 'Connecting your Claude and Telegram accounts...',
		},
		ready: {
			label: 'Running',
			description: 'Rachel is running on Telegram!',
		},
		failed: {
			label: 'Failed',
			description: 'Provisioning failed.',
		},
	};

	// Progress step tracking
	const provisioningSteps = ['pending', 'creating', 'cloud_init', 'injecting_secrets'] as const;
	let currentStepIndex = $derived(provisioningSteps.indexOf((pollingStatus ?? 'pending') as typeof provisioningSteps[number]));

	// Check if provisioning is in an active (in-progress) state
	function isProvisioning(status: string | null): boolean {
		return status === 'pending' || status === 'creating' || status === 'cloud_init' || status === 'injecting_secrets';
	}

	// Start polling for provisioning status updates
	function startPolling() {
		if (pollTimer) return;
		pollTimer = setInterval(async () => {
			try {
				// Reload page data by fetching the current page
				const response = await fetch(window.location.href, {
					headers: { 'Accept': 'application/json' },
				});

				if (!response.ok) return;

				// SvelteKit returns JSON when Accept: application/json
				const result = await response.json();
				const sub = result.data?.subscription ?? result.subscription;

				if (sub) {
					pollingStatus = sub.provisioningStatus;
					pollingIp = sub.vpsIpAddress;
					pollingError = sub.provisioningError;

					// Stop polling when provisioning completes or fails
					if (pollingStatus === 'ready' || pollingStatus === 'failed' || !isProvisioning(pollingStatus)) {
						stopPolling();
						// Reload page to get fresh server data
						if (pollingStatus === 'ready') {
							setTimeout(() => window.location.reload(), 1000);
						}
					}
				}
			} catch {
				// Silently ignore polling errors
			}
		}, 3000);
	}

	function stopPolling() {
		if (pollTimer) {
			clearInterval(pollTimer);
			pollTimer = null;
		}
	}

	// Deploy button click handler
	async function handleDeploy() {
		error = null;
		deploying = true;

		try {
			const response = await fetch('/api/provision/deploy', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
			});

			const result = await response.json();

			if (!response.ok) {
				error = result.error || 'Failed to start provisioning';
				deploying = false;
				return;
			}

			// Provisioning started — begin polling
			pollingStatus = 'pending';
			startPolling();
		} catch (err) {
			error = 'An error occurred. Please try again.';
			deploying = false;
			console.error('Deploy error:', err);
		}
	}

	// Retry deployment after failure
	async function handleRetry() {
		pollingStatus = null;
		pollingError = null;
		error = null;
		await handleDeploy();
	}

	// Auto-start polling if page loads with an in-progress status
	$effect(() => {
		if (isProvisioning(pollingStatus)) {
			startPolling();
		}
		return () => stopPolling();
	});
</script>

<svelte:head>
	<title>Dashboard - Rachel Cloud</title>
</svelte:head>

<div class="max-w-4xl mx-auto">
	<div class="mb-6">
		<h1 class="text-3xl font-bold text-gray-900">Dashboard</h1>
		<p class="text-gray-600 mt-2">Manage your Rachel AI instance</p>
	</div>

	<!-- Error Message -->
	{#if error}
		<div class="mb-6 rounded-md bg-red-50 p-4 border border-red-200">
			<div class="flex">
				<svg class="h-5 w-5 text-red-400 mr-2 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
					<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
				</svg>
				<span class="text-sm font-medium text-red-800">{error}</span>
			</div>
		</div>
	{/if}

	<!-- VPS Status Card -->
	<div class="bg-white shadow rounded-lg mb-6">
		<div class="px-6 py-5 border-b border-gray-200">
			<h2 class="text-xl font-semibold text-gray-900">Rachel Instance</h2>
		</div>
		<div class="px-6 py-5">
			{#if data.subscription?.vpsProvisioned && (pollingStatus === 'ready' || pollingStatus === null)}
				<!-- VPS is running -->
				<div class="flex items-start justify-between">
					<div class="flex-1">
						<div class="flex items-center mb-3">
							<span class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
								<svg class="w-4 h-4 mr-1.5" fill="currentColor" viewBox="0 0 20 20">
									<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
								</svg>
								Running
							</span>
						</div>
						<h3 class="text-lg font-medium text-gray-900 mb-2">Rachel is running on Telegram!</h3>
						<p class="text-sm text-gray-600 mb-4">
							Your personal AI assistant is active and ready to chat. Open Telegram and send a message to your bot.
						</p>
						{#if data.subscription?.vpsIpAddress}
							<div class="text-sm text-gray-500">
								<span class="font-medium">Server IP:</span>
								<code class="ml-1 px-2 py-0.5 bg-gray-100 rounded text-gray-700">
									{data.subscription.vpsIpAddress}
								</code>
							</div>
						{/if}
					</div>
				</div>

			{:else if isProvisioning(pollingStatus)}
				<!-- Provisioning in progress -->
				<div class="flex items-start">
					<div class="flex-1">
						<div class="flex items-center mb-3">
							<span class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
								<svg class="animate-spin w-4 h-4 mr-1.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
									<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
									<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
								</svg>
								{statusMessages[pollingStatus ?? 'pending']?.label ?? 'Provisioning'}
							</span>
						</div>
						<h3 class="text-lg font-medium text-gray-900 mb-2">Setting up your Rachel instance</h3>
						<p class="text-sm text-gray-600 mb-4">
							{statusMessages[pollingStatus ?? 'pending']?.description ?? 'Working on it...'}
						</p>

						<!-- Progress steps -->
						<div class="space-y-3">
							{#each provisioningSteps as step, i}
								<div class="flex items-center">
									{#if i < currentStepIndex}
										<!-- Completed step -->
										<svg class="w-5 h-5 text-green-500 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
											<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
										</svg>
									{:else if i === currentStepIndex}
										<!-- Current step -->
										<svg class="animate-spin w-5 h-5 text-blue-500 mr-3 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
											<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
											<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
										</svg>
									{:else}
										<!-- Pending step -->
										<div class="w-5 h-5 rounded-full border-2 border-gray-300 mr-3 flex-shrink-0"></div>
									{/if}
									<span class="text-sm {i <= currentStepIndex ? 'text-gray-900 font-medium' : 'text-gray-400'}">
										{statusMessages[step]?.description ?? step}
									</span>
								</div>
							{/each}
						</div>
					</div>
				</div>

			{:else if pollingStatus === 'failed'}
				<!-- Provisioning failed -->
				<div class="flex items-start">
					<div class="flex-1">
						<div class="flex items-center mb-3">
							<span class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
								<svg class="w-4 h-4 mr-1.5" fill="currentColor" viewBox="0 0 20 20">
									<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
								</svg>
								Failed
							</span>
						</div>
						<h3 class="text-lg font-medium text-gray-900 mb-2">Provisioning Failed</h3>
						{#if pollingError || data.subscription?.provisioningError}
							<div class="bg-red-50 border-l-4 border-red-400 p-4 mb-4">
								<p class="text-sm text-red-700">
									{pollingError || data.subscription?.provisioningError}
								</p>
							</div>
						{/if}
						<p class="text-sm text-gray-600 mb-4">
							Something went wrong during setup. Any resources have been cleaned up automatically. You can try again.
						</p>
						<button
							type="button"
							onclick={handleRetry}
							disabled={deploying}
							class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
						>
							{#if deploying}
								<svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
									<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
									<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
								</svg>
								Retrying...
							{:else}
								Retry Deployment
							{/if}
						</button>
					</div>
				</div>

			{:else if data.hasActiveSubscription}
				<!-- Ready to deploy -->
				<div class="flex items-start">
					<div class="flex-1">
						<div class="flex items-center mb-3">
							<span class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
								Not Deployed
							</span>
						</div>
						<h3 class="text-lg font-medium text-gray-900 mb-2">Deploy Rachel</h3>
						<p class="text-sm text-gray-600 mb-4">
							Your subscription is active. Click the button below to create your dedicated server and start Rachel on Telegram. Setup takes about 90 seconds.
						</p>
						<button
							type="button"
							onclick={handleDeploy}
							disabled={deploying}
							class="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
						>
							{#if deploying}
								<svg class="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
									<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
									<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
								</svg>
								Starting...
							{:else}
								<svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 3l14 9-14 9V3z"></path>
								</svg>
								Deploy Rachel
							{/if}
						</button>
					</div>
				</div>

			{:else}
				<!-- No subscription -->
				<div class="flex items-start">
					<div class="flex-1">
						<div class="flex items-center mb-3">
							<span class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
								Inactive
							</span>
						</div>
						<h3 class="text-lg font-medium text-gray-900 mb-2">Get Started with Rachel</h3>
						<p class="text-sm text-gray-600 mb-4">
							Subscribe to get your own personal AI assistant on Telegram. Setup takes less than 2 minutes.
						</p>
						<a
							href="/onboarding"
							class="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors shadow-sm"
						>
							Subscribe Now — $20/month
						</a>
					</div>
				</div>
			{/if}
		</div>
	</div>

	<!-- Quick Links Card -->
	{#if data.hasActiveSubscription || data.subscription?.vpsProvisioned}
		<div class="bg-white shadow rounded-lg">
			<div class="px-6 py-5 border-b border-gray-200">
				<h2 class="text-xl font-semibold text-gray-900">Quick Links</h2>
			</div>
			<div class="px-6 py-5">
				<div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
					<a
						href="/dashboard/billing"
						class="flex items-center p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
					>
						<svg class="w-5 h-5 text-gray-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"></path>
						</svg>
						<span class="text-sm font-medium text-gray-700">Billing</span>
					</a>
					<a
						href="/dashboard/claude"
						class="flex items-center p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
					>
						<svg class="w-5 h-5 text-gray-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"></path>
						</svg>
						<span class="text-sm font-medium text-gray-700">Claude Connection</span>
					</a>
					<a
						href="/dashboard/logs"
						class="flex items-center p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
					>
						<svg class="w-5 h-5 text-gray-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
						</svg>
						<span class="text-sm font-medium text-gray-700">Logs</span>
					</a>
				</div>
			</div>
		</div>
	{/if}
</div>
