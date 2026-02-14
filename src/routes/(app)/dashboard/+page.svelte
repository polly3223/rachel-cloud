<script lang="ts">
	let { data } = $props();

	// ─── Deployment state ───────────────────────────────────────────
	let deploying = $state(false);
	let error = $state<string | null>(null);
	let pollingStatus = $state<string | null>(data.subscription?.provisioningStatus ?? null);
	let pollingIp = $state<string | null>(data.subscription?.vpsIpAddress ?? null);
	let pollingError = $state<string | null>(data.subscription?.provisioningError ?? null);
	let pollTimer = $state<ReturnType<typeof setInterval> | null>(null);

	// ─── VPS dashboard state (for running instances) ────────────────
	let serverStatus = $state<string>(data.vpsStatus?.status ?? 'unknown');
	let serverIp = $state<string>(data.vpsStatus?.ip ?? data.subscription?.vpsIpAddress ?? '');
	let serverDatacenter = $state<string>(data.vpsStatus?.datacenter ?? '');
	let serverCreated = $state<string>(data.vpsStatus?.created ?? '');
	let serverUptime = $state<string>('');
	let statusLoading = $state(false);

	// Restart state
	let restarting = $state(false);
	let restartMessage = $state<{ type: 'success' | 'error'; text: string } | null>(null);

	// Logs state
	let logs = $state<string>('');
	let logsLoading = $state(false);
	let logsError = $state<string | null>(null);
	let logLines = $state(100);
	let autoRefreshLogs = $state(false);

	// Copy-to-clipboard state
	let copied = $state(false);

	// ─── Status display messages ────────────────────────────────────
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

	// VPS is provisioned and ready
	let isVPSReady = $derived(
		data.subscription?.vpsProvisioned && (pollingStatus === 'ready' || pollingStatus === null)
	);

	// Status indicator colors
	let statusColor = $derived.by(() => {
		switch (serverStatus) {
			case 'running':
				return { bg: 'bg-green-500', ring: 'ring-green-300', label: 'Running', badge: 'bg-green-100 text-green-800' };
			case 'off':
			case 'stopping':
				return { bg: 'bg-red-500', ring: 'ring-red-300', label: 'Stopped', badge: 'bg-red-100 text-red-800' };
			case 'starting':
			case 'initializing':
				return { bg: 'bg-yellow-500', ring: 'ring-yellow-300', label: 'Starting', badge: 'bg-yellow-100 text-yellow-800' };
			default:
				return { bg: 'bg-gray-400', ring: 'ring-gray-300', label: serverStatus || 'Unknown', badge: 'bg-gray-100 text-gray-800' };
		}
	});

	// ─── Provisioning polling ───────────────────────────────────────

	function isProvisioning(status: string | null): boolean {
		return status === 'pending' || status === 'creating' || status === 'cloud_init' || status === 'injecting_secrets';
	}

	function startPolling() {
		if (pollTimer) return;
		pollTimer = setInterval(async () => {
			try {
				const response = await fetch(window.location.href, {
					headers: { 'Accept': 'application/json' },
				});
				if (!response.ok) return;
				const result = await response.json();
				const sub = result.data?.subscription ?? result.subscription;
				if (sub) {
					pollingStatus = sub.provisioningStatus;
					pollingIp = sub.vpsIpAddress;
					pollingError = sub.provisioningError;
					if (pollingStatus === 'ready' || pollingStatus === 'failed' || !isProvisioning(pollingStatus)) {
						stopPolling();
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

	// ─── Deploy handler ─────────────────────────────────────────────

	async function handleDeploy() {
		error = null;
		deploying = true;
		try {
			const response = await fetch('/api/provision/deploy', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
			});
			const result = await response.json();
			if (!response.ok) {
				error = result.error || 'Failed to start provisioning';
				deploying = false;
				return;
			}
			pollingStatus = 'pending';
			startPolling();
		} catch (err) {
			error = 'An error occurred. Please try again.';
			deploying = false;
			console.error('Deploy error:', err);
		}
	}

	async function handleRetry() {
		pollingStatus = null;
		pollingError = null;
		error = null;
		await handleDeploy();
	}

	// ─── VPS status refresh ─────────────────────────────────────────

	async function refreshStatus() {
		statusLoading = true;
		try {
			const response = await fetch('/api/vps/status');
			if (!response.ok) throw new Error('Failed to fetch status');
			const result = await response.json();
			serverStatus = result.status;
			serverIp = result.ip || serverIp;
			serverDatacenter = result.datacenter || serverDatacenter;
			serverUptime = result.uptime || '';
			serverCreated = result.created || serverCreated;
		} catch (err) {
			console.error('Status refresh failed:', err);
		} finally {
			statusLoading = false;
		}
	}

	// ─── Restart handler ────────────────────────────────────────────

	async function handleRestart() {
		restarting = true;
		restartMessage = null;
		try {
			const response = await fetch('/api/vps/restart', { method: 'POST' });
			const result = await response.json();
			if (result.success) {
				restartMessage = { type: 'success', text: 'Rachel service restarted successfully.' };
				// Refresh status after a short delay to let the service come back up
				setTimeout(() => refreshStatus(), 5000);
			} else {
				restartMessage = { type: 'error', text: result.message || 'Failed to restart service.' };
			}
		} catch (err) {
			restartMessage = { type: 'error', text: 'Failed to connect to server. Please try again.' };
			console.error('Restart error:', err);
		} finally {
			restarting = false;
		}
	}

	// ─── Logs handler ───────────────────────────────────────────────

	async function fetchLogs() {
		logsLoading = true;
		logsError = null;
		try {
			const response = await fetch(`/api/vps/logs?lines=${logLines}`);
			if (!response.ok) throw new Error('Failed to fetch logs');
			const result = await response.json();
			if (result.success) {
				logs = result.logs;
			} else {
				logsError = result.message || 'Failed to fetch logs.';
			}
		} catch (err) {
			logsError = 'Failed to fetch logs. Server may be unreachable.';
			console.error('Logs error:', err);
		} finally {
			logsLoading = false;
		}
	}

	// ─── Copy to clipboard ─────────────────────────────────────────

	async function copyIp() {
		try {
			await navigator.clipboard.writeText(serverIp);
			copied = true;
			setTimeout(() => (copied = false), 2000);
		} catch {
			// Fallback for older browsers
			const textArea = document.createElement('textarea');
			textArea.value = serverIp;
			document.body.appendChild(textArea);
			textArea.select();
			document.execCommand('copy');
			document.body.removeChild(textArea);
			copied = true;
			setTimeout(() => (copied = false), 2000);
		}
	}

	// ─── Effects ────────────────────────────────────────────────────

	// Auto-start provisioning polling if page loads with in-progress status
	$effect(() => {
		if (isProvisioning(pollingStatus)) {
			startPolling();
		}
		return () => stopPolling();
	});

	// Auto-refresh VPS status every 30 seconds when running
	$effect(() => {
		if (!isVPSReady) return;
		// Fetch initial uptime/status client-side
		refreshStatus();
		const interval = setInterval(() => refreshStatus(), 30000);
		return () => clearInterval(interval);
	});

	// Fetch logs on mount when VPS is ready
	$effect(() => {
		if (!isVPSReady) return;
		fetchLogs();
	});

	// Auto-refresh logs when toggle is enabled
	$effect(() => {
		if (!autoRefreshLogs || !isVPSReady) return;
		const interval = setInterval(() => fetchLogs(), 10000);
		return () => clearInterval(interval);
	});

	// Clear restart message after 8 seconds
	$effect(() => {
		if (!restartMessage) return;
		const timeout = setTimeout(() => (restartMessage = null), 8000);
		return () => clearTimeout(timeout);
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

	{#if isVPSReady}
		<!-- ═══════ ENHANCED RUNNING DASHBOARD ═══════ -->

		<!-- Section 1: Server Status Card -->
		<div class="bg-white shadow rounded-lg mb-6">
			<div class="px-6 py-5 border-b border-gray-200">
				<div class="flex items-center justify-between">
					<h2 class="text-xl font-semibold text-gray-900">Server Status</h2>
					<button
						onclick={refreshStatus}
						disabled={statusLoading}
						class="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1 disabled:opacity-50"
					>
						<svg class="w-4 h-4 {statusLoading ? 'animate-spin' : ''}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
						</svg>
						Refresh
					</button>
				</div>
			</div>
			<div class="px-6 py-5">
				<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
					<!-- Status -->
					<div>
						<p class="text-sm font-medium text-gray-500 mb-1">Status</p>
						<div class="flex items-center gap-2">
							<span class="relative flex h-3 w-3">
								{#if serverStatus === 'running'}
									<span class="animate-ping absolute inline-flex h-full w-full rounded-full {statusColor.bg} opacity-75"></span>
								{/if}
								<span class="relative inline-flex rounded-full h-3 w-3 {statusColor.bg}"></span>
							</span>
							<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium {statusColor.badge}">
								{statusColor.label}
							</span>
						</div>
					</div>

					<!-- IP Address -->
					<div>
						<p class="text-sm font-medium text-gray-500 mb-1">IP Address</p>
						<div class="flex items-center gap-2">
							<code class="text-sm font-mono text-gray-900">{serverIp || 'N/A'}</code>
							{#if serverIp}
								<button
									onclick={copyIp}
									class="text-gray-400 hover:text-gray-600 transition-colors"
									title="Copy IP address"
								>
									{#if copied}
										<svg class="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
										</svg>
									{:else}
										<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
										</svg>
									{/if}
								</button>
							{/if}
						</div>
					</div>

					<!-- Datacenter -->
					<div>
						<p class="text-sm font-medium text-gray-500 mb-1">Datacenter</p>
						<p class="text-sm text-gray-900">{serverDatacenter || 'N/A'}</p>
					</div>

					<!-- Uptime -->
					<div>
						<p class="text-sm font-medium text-gray-500 mb-1">Uptime</p>
						<p class="text-sm text-gray-900">{serverUptime || 'Loading...'}</p>
					</div>
				</div>
			</div>
		</div>

		<!-- Section 2: Actions Card -->
		<div class="bg-white shadow rounded-lg mb-6">
			<div class="px-6 py-5 border-b border-gray-200">
				<h2 class="text-xl font-semibold text-gray-900">Actions</h2>
			</div>
			<div class="px-6 py-5">
				<!-- Restart message banner -->
				{#if restartMessage}
					<div class="mb-4 rounded-md p-4 border {restartMessage.type === 'success' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}">
						<div class="flex items-center">
							{#if restartMessage.type === 'success'}
								<svg class="h-5 w-5 text-green-400 mr-2 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
									<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
								</svg>
							{:else}
								<svg class="h-5 w-5 text-red-400 mr-2 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
									<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
								</svg>
							{/if}
							<span class="text-sm font-medium {restartMessage.type === 'success' ? 'text-green-800' : 'text-red-800'}">{restartMessage.text}</span>
						</div>
					</div>
				{/if}

				<div class="flex items-center gap-4">
					<button
						onclick={handleRestart}
						disabled={restarting}
						class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
					>
						{#if restarting}
							<svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
								<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
								<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
							</svg>
							Restarting...
						{:else}
							<svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
							</svg>
							Restart Rachel
						{/if}
					</button>
					<p class="text-sm text-gray-500">
						Restarts the Rachel service on your server. This takes about 10 seconds.
					</p>
				</div>
			</div>
		</div>

		<!-- Section 3: Recent Logs Card -->
		<div class="bg-white shadow rounded-lg mb-6">
			<div class="px-6 py-5 border-b border-gray-200">
				<div class="flex items-center justify-between flex-wrap gap-3">
					<h2 class="text-xl font-semibold text-gray-900">Recent Logs</h2>
					<div class="flex items-center gap-3">
						<!-- Line count selector -->
						<select
							bind:value={logLines}
							onchange={() => fetchLogs()}
							class="text-sm border border-gray-300 rounded-md px-2 py-1 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
						>
							<option value={50}>50 lines</option>
							<option value={100}>100 lines</option>
							<option value={200}>200 lines</option>
							<option value={500}>500 lines</option>
						</select>

						<!-- Auto-refresh toggle -->
						<label class="flex items-center gap-1.5 text-sm text-gray-600 cursor-pointer">
							<input
								type="checkbox"
								bind:checked={autoRefreshLogs}
								class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
							/>
							Auto-refresh
						</label>

						<!-- Refresh button -->
						<button
							onclick={fetchLogs}
							disabled={logsLoading}
							class="inline-flex items-center px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
						>
							<svg class="w-4 h-4 mr-1 {logsLoading ? 'animate-spin' : ''}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
							</svg>
							Refresh
						</button>
					</div>
				</div>
			</div>
			<div class="px-0">
				{#if logsLoading && !logs}
					<!-- Loading skeleton -->
					<div class="bg-gray-900 rounded-b-lg p-4 space-y-2" style="max-height: 400px;">
						{#each Array(8) as _}
							<div class="h-4 bg-gray-800 rounded animate-pulse" style="width: {60 + Math.random() * 40}%"></div>
						{/each}
					</div>
				{:else if logsError}
					<div class="bg-gray-900 rounded-b-lg p-6 text-center">
						<p class="text-red-400 text-sm">{logsError}</p>
						<button
							onclick={fetchLogs}
							class="mt-3 text-sm text-blue-400 hover:text-blue-300 underline"
						>
							Try again
						</button>
					</div>
				{:else if !logs}
					<div class="bg-gray-900 rounded-b-lg p-6 text-center">
						<p class="text-gray-500 text-sm">No logs available.</p>
					</div>
				{:else}
					<div class="bg-gray-900 rounded-b-lg overflow-y-auto" style="max-height: 400px;">
						<pre class="p-4 text-xs font-mono text-green-400 whitespace-pre-wrap break-words leading-relaxed">{logs}</pre>
					</div>
				{/if}
			</div>
		</div>

		<!-- Section 4: Connection Info Card -->
		<div class="bg-white shadow rounded-lg mb-6">
			<div class="px-6 py-5 border-b border-gray-200">
				<h2 class="text-xl font-semibold text-gray-900">Connection Info</h2>
			</div>
			<div class="px-6 py-5">
				<dl class="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
					<div>
						<dt class="text-sm font-medium text-gray-500">Server IP</dt>
						<dd class="mt-1 flex items-center gap-2">
							<code class="text-sm font-mono text-gray-900 bg-gray-100 px-2 py-0.5 rounded">{serverIp || 'N/A'}</code>
							{#if serverIp}
								<button
									onclick={copyIp}
									class="text-xs text-blue-600 hover:text-blue-800 transition-colors"
								>
									{copied ? 'Copied!' : 'Copy'}
								</button>
							{/if}
						</dd>
					</div>
					{#if data.subscription?.vpsHostname}
						<div>
							<dt class="text-sm font-medium text-gray-500">Hostname</dt>
							<dd class="mt-1 text-sm text-gray-900">{data.subscription.vpsHostname}</dd>
						</div>
					{/if}
					<div>
						<dt class="text-sm font-medium text-gray-500">Datacenter</dt>
						<dd class="mt-1 text-sm text-gray-900">{serverDatacenter || 'N/A'}</dd>
					</div>
					{#if serverCreated}
						<div>
							<dt class="text-sm font-medium text-gray-500">Provisioned</dt>
							<dd class="mt-1 text-sm text-gray-900">
								{new Date(serverCreated).toLocaleDateString('en-US', {
									year: 'numeric',
									month: 'long',
									day: 'numeric',
								})}
							</dd>
						</div>
					{/if}
					{#if data.subscription?.provisionedAt}
						<div>
							<dt class="text-sm font-medium text-gray-500">Service Started</dt>
							<dd class="mt-1 text-sm text-gray-900">
								{new Date(data.subscription.provisionedAt).toLocaleDateString('en-US', {
									year: 'numeric',
									month: 'long',
									day: 'numeric',
								})}
							</dd>
						</div>
					{/if}
				</dl>
			</div>
		</div>

	{:else}
		<!-- ═══════ EXISTING PROVISIONING / DEPLOY / NO-SUB STATES ═══════ -->

		<div class="bg-white shadow rounded-lg mb-6">
			<div class="px-6 py-5 border-b border-gray-200">
				<h2 class="text-xl font-semibold text-gray-900">Rachel Instance</h2>
			</div>
			<div class="px-6 py-5">
				{#if isProvisioning(pollingStatus)}
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
											<svg class="w-5 h-5 text-green-500 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
												<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
											</svg>
										{:else if i === currentStepIndex}
											<svg class="animate-spin w-5 h-5 text-blue-500 mr-3 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
												<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
												<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
											</svg>
										{:else}
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
	{/if}

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
