<script lang="ts">
	let { data } = $props();

	const users = $derived(data.users);

	// -----------------------------------------------------------------------
	// Client-side filter state
	// -----------------------------------------------------------------------

	let searchQuery = $state('');
	let statusFilter = $state<'all' | 'active' | 'grace_period' | 'canceled' | 'none'>('all');
	let expandedUserId = $state<string | null>(null);
	let copiedEmail = $state<string | null>(null);

	// -----------------------------------------------------------------------
	// Filtered users (client-side)
	// -----------------------------------------------------------------------

	const filteredUsers = $derived.by(() => {
		let result = users;

		// Filter by subscription status
		if (statusFilter !== 'all') {
			result = result.filter((u) => {
				if (statusFilter === 'none') {
					return !u.subscriptionStatus || u.subscriptionStatus === 'none';
				}
				return u.subscriptionStatus === statusFilter;
			});
		}

		// Filter by search query (email or name)
		if (searchQuery.trim()) {
			const q = searchQuery.trim().toLowerCase();
			result = result.filter(
				(u) =>
					u.email.toLowerCase().includes(q) ||
					(u.name && u.name.toLowerCase().includes(q))
			);
		}

		return result;
	});

	// -----------------------------------------------------------------------
	// Actions
	// -----------------------------------------------------------------------

	function toggleExpanded(userId: string) {
		expandedUserId = expandedUserId === userId ? null : userId;
	}

	async function copyEmail(email: string) {
		try {
			await navigator.clipboard.writeText(email);
			copiedEmail = email;
			setTimeout(() => {
				copiedEmail = null;
			}, 2000);
		} catch {
			// Fallback: no-op if clipboard not available
		}
	}

	// -----------------------------------------------------------------------
	// Formatting helpers
	// -----------------------------------------------------------------------

	function formatDate(date: Date | string | null): string {
		if (!date) return '\u2014';
		const d = typeof date === 'string' ? new Date(date) : date;
		return d.toLocaleDateString('en-US', {
			month: 'short',
			day: 'numeric',
			year: 'numeric'
		});
	}

	function formatDateTime(date: Date | string | null): string {
		if (!date) return '\u2014';
		const d = typeof date === 'string' ? new Date(date) : date;
		return d.toLocaleString('en-US', {
			month: 'short',
			day: 'numeric',
			year: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	}

	function statusColor(status: string | null): string {
		switch (status) {
			case 'active':
				return 'bg-green-100 text-green-800';
			case 'grace_period':
				return 'bg-yellow-100 text-yellow-800';
			case 'canceled':
				return 'bg-red-100 text-red-800';
			default:
				return 'bg-gray-100 text-gray-600';
		}
	}

	function statusLabel(status: string | null): string {
		switch (status) {
			case 'active':
				return 'Active';
			case 'grace_period':
				return 'Grace Period';
			case 'canceled':
				return 'Canceled';
			case 'none':
				return 'None';
			default:
				return 'No Sub';
		}
	}

	function provisioningStatusColor(status: string | null): string {
		switch (status) {
			case 'ready':
				return 'bg-green-100 text-green-800';
			case 'pending':
			case 'creating':
			case 'cloud_init':
			case 'injecting_secrets':
				return 'bg-yellow-100 text-yellow-800';
			case 'failed':
				return 'bg-red-100 text-red-800';
			default:
				return 'bg-gray-100 text-gray-600';
		}
	}

	function provisioningStatusLabel(status: string | null, provisioned: boolean): string {
		if (!provisioned && !status) return 'Not Provisioned';
		switch (status) {
			case 'ready':
				return 'Ready';
			case 'pending':
				return 'Pending';
			case 'creating':
				return 'Creating';
			case 'cloud_init':
				return 'Cloud Init';
			case 'injecting_secrets':
				return 'Injecting Secrets';
			case 'failed':
				return 'Failed';
			default:
				return 'Unknown';
		}
	}

	function healthStatusColor(status: string | null): string {
		switch (status) {
			case 'healthy':
				return 'bg-green-100 text-green-800';
			case 'unhealthy':
				return 'bg-yellow-100 text-yellow-800';
			case 'down':
				return 'bg-red-100 text-red-800';
			case 'circuit_open':
				return 'bg-red-100 text-red-800 font-bold';
			default:
				return 'bg-gray-100 text-gray-600';
		}
	}

	function healthStatusLabel(status: string | null, failures: number): string {
		switch (status) {
			case 'healthy':
				return 'Healthy';
			case 'unhealthy':
				return `Unhealthy (${failures})`;
			case 'down':
				return 'Down';
			case 'circuit_open':
				return 'Circuit Open';
			default:
				return 'N/A';
		}
	}

	function circuitStateLabel(state: string | null): string {
		switch (state) {
			case 'closed':
				return 'Closed';
			case 'open':
				return 'Open';
			case 'half_open':
				return 'Half Open';
			default:
				return '\u2014';
		}
	}

	function circuitStateColor(state: string | null): string {
		switch (state) {
			case 'closed':
				return 'text-green-700 bg-green-100';
			case 'open':
				return 'text-red-700 bg-red-100';
			case 'half_open':
				return 'text-yellow-700 bg-yellow-100';
			default:
				return 'text-gray-500 bg-gray-100';
		}
	}

	// Status filter options
	const statusOptions = [
		{ value: 'all', label: 'All' },
		{ value: 'active', label: 'Active' },
		{ value: 'grace_period', label: 'Grace Period' },
		{ value: 'canceled', label: 'Canceled' },
		{ value: 'none', label: 'No Sub' }
	] as const;
</script>

<div class="max-w-7xl mx-auto">
	<!-- Page header -->
	<div class="mb-8">
		<h1 class="text-3xl font-bold text-gray-900">Users</h1>
		<p class="mt-1 text-sm text-gray-500">Manage and inspect all registered users</p>
	</div>

	<!-- Search & Filter Bar -->
	<div class="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
		<div class="flex flex-col sm:flex-row gap-4">
			<!-- Search input -->
			<div class="relative flex-1">
				<div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
					<svg class="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
					</svg>
				</div>
				<input
					type="text"
					bind:value={searchQuery}
					placeholder="Search by email or name..."
					class="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
				/>
				{#if searchQuery}
					<button
						type="button"
						onclick={() => (searchQuery = '')}
						class="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
					>
						<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
						</svg>
					</button>
				{/if}
			</div>

			<!-- Status filter pills -->
			<div class="flex flex-wrap gap-2 items-center">
				{#each statusOptions as option}
					<button
						type="button"
						onclick={() => (statusFilter = option.value)}
						class="px-3 py-1.5 text-xs font-medium rounded-full transition-colors {statusFilter === option.value
							? 'bg-indigo-600 text-white'
							: 'bg-gray-100 text-gray-600 hover:bg-gray-200'}"
					>
						{option.label}
					</button>
				{/each}
			</div>
		</div>

		<!-- Result count -->
		<div class="mt-3 text-sm text-gray-500">
			Showing {filteredUsers.length} of {users.length} user{users.length !== 1 ? 's' : ''}
			{#if statusFilter !== 'all' || searchQuery.trim()}
				<button
					type="button"
					onclick={() => {
						searchQuery = '';
						statusFilter = 'all';
					}}
					class="ml-2 text-indigo-600 hover:text-indigo-800 font-medium"
				>
					Clear filters
				</button>
			{/if}
		</div>
	</div>

	<!-- Users Table / Cards -->
	<div class="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
		{#if filteredUsers.length === 0}
			<!-- Empty state -->
			<div class="px-6 py-12 text-center">
				<svg class="mx-auto w-12 h-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path>
				</svg>
				{#if users.length === 0}
					<p class="mt-2 text-sm text-gray-500">No users yet</p>
				{:else}
					<p class="mt-2 text-sm text-gray-500">No users match your filters</p>
					<button
						type="button"
						onclick={() => {
							searchQuery = '';
							statusFilter = 'all';
						}}
						class="mt-3 text-sm text-indigo-600 hover:text-indigo-800 font-medium"
					>
						Clear all filters
					</button>
				{/if}
			</div>
		{:else}
			<!-- Desktop table -->
			<div class="hidden lg:block overflow-x-auto">
				<table class="min-w-full divide-y divide-gray-200">
					<thead class="bg-gray-50">
						<tr>
							<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
							<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subscription</th>
							<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">VPS</th>
							<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Health</th>
							<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">IP</th>
							<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hetzner ID</th>
							<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Joined</th>
							<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"><span class="sr-only">Actions</span></th>
						</tr>
					</thead>
					<tbody class="bg-white divide-y divide-gray-200">
						{#each filteredUsers as user (user.id)}
							<!-- Main row -->
							<tr class="hover:bg-gray-50 transition-colors">
								<td class="px-6 py-4 whitespace-nowrap">
									<div class="flex items-center gap-2">
										<div>
											<button
												type="button"
												onclick={() => copyEmail(user.email)}
												class="text-sm font-medium text-gray-900 hover:text-indigo-600 transition-colors text-left cursor-pointer"
												title="Click to copy email"
											>
												{user.email}
											</button>
											{#if copiedEmail === user.email}
												<span class="ml-1 text-xs text-green-600">Copied!</span>
											{/if}
											{#if user.name}
												<p class="text-xs text-gray-500">{user.name}</p>
											{/if}
										</div>
									</div>
								</td>
								<td class="px-6 py-4 whitespace-nowrap">
									<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium {statusColor(user.subscriptionStatus)}">
										{statusLabel(user.subscriptionStatus)}
									</span>
								</td>
								<td class="px-6 py-4 whitespace-nowrap">
									<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium {provisioningStatusColor(user.provisioningStatus)}">
										{provisioningStatusLabel(user.provisioningStatus, user.vpsProvisioned)}
									</span>
								</td>
								<td class="px-6 py-4 whitespace-nowrap">
									<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium {healthStatusColor(user.healthStatus)}">
										{healthStatusLabel(user.healthStatus, user.consecutiveFailures)}
									</span>
								</td>
								<td class="px-6 py-4 whitespace-nowrap">
									{#if user.vpsIpAddress}
										<code class="text-sm font-mono text-gray-700 bg-gray-100 px-2 py-0.5 rounded">{user.vpsIpAddress}</code>
									{:else}
										<span class="text-sm text-gray-400">&mdash;</span>
									{/if}
								</td>
								<td class="px-6 py-4 whitespace-nowrap">
									{#if user.hetznerServerId}
										<code class="text-sm font-mono text-gray-700 bg-gray-100 px-2 py-0.5 rounded">{user.hetznerServerId}</code>
									{:else}
										<span class="text-sm text-gray-400">&mdash;</span>
									{/if}
								</td>
								<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
									{formatDate(user.createdAt)}
								</td>
								<td class="px-6 py-4 whitespace-nowrap text-right">
									<button
										type="button"
										onclick={() => toggleExpanded(user.id)}
										class="text-indigo-600 hover:text-indigo-800 text-sm font-medium transition-colors inline-flex items-center gap-1"
									>
										{expandedUserId === user.id ? 'Hide' : 'Details'}
										<svg
											class="w-4 h-4 transition-transform duration-200 {expandedUserId === user.id ? 'rotate-180' : ''}"
											fill="none"
											stroke="currentColor"
											viewBox="0 0 24 24"
										>
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
										</svg>
									</button>
								</td>
							</tr>

							<!-- Expanded details row -->
							{#if expandedUserId === user.id}
								<tr class="bg-gray-50">
									<td colspan="8" class="px-6 py-4">
										<div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
											<div>
												<p class="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Provisioning Status</p>
												<span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium {provisioningStatusColor(user.provisioningStatus)}">
													{provisioningStatusLabel(user.provisioningStatus, user.vpsProvisioned)}
												</span>
											</div>
											<div>
												<p class="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Circuit State</p>
												{#if user.circuitState}
													<span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium {circuitStateColor(user.circuitState)}">
														{circuitStateLabel(user.circuitState)}
													</span>
												{:else}
													<span class="text-gray-400">&mdash;</span>
												{/if}
											</div>
											<div>
												<p class="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Last Health Check</p>
												<p class="text-gray-700">{formatDateTime(user.lastCheckAt)}</p>
											</div>
											<div>
												<p class="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Consecutive Failures</p>
												<p class="{user.consecutiveFailures > 0 ? 'text-red-600 font-semibold' : 'text-gray-700'}">
													{user.consecutiveFailures}
												</p>
											</div>
											<div>
												<p class="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Provisioned At</p>
												<p class="text-gray-700">{formatDateTime(user.provisionedAt)}</p>
											</div>
											<div>
												<p class="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">User ID</p>
												<code class="text-xs font-mono text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">{user.id}</code>
											</div>
										</div>
									</td>
								</tr>
							{/if}
						{/each}
					</tbody>
				</table>
			</div>

			<!-- Mobile card layout -->
			<div class="lg:hidden divide-y divide-gray-200">
				{#each filteredUsers as user (user.id)}
					<div class="px-4 py-4 space-y-3">
						<!-- Header: email + subscription badge -->
						<div class="flex items-start justify-between gap-2">
							<div class="min-w-0 flex-1">
								<button
									type="button"
									onclick={() => copyEmail(user.email)}
									class="text-sm font-medium text-gray-900 hover:text-indigo-600 transition-colors text-left cursor-pointer truncate block max-w-full"
									title="Click to copy email"
								>
									{user.email}
								</button>
								{#if copiedEmail === user.email}
									<span class="text-xs text-green-600">Copied!</span>
								{/if}
								{#if user.name}
									<p class="text-xs text-gray-500">{user.name}</p>
								{/if}
							</div>
							<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium flex-shrink-0 {statusColor(user.subscriptionStatus)}">
								{statusLabel(user.subscriptionStatus)}
							</span>
						</div>

						<!-- Status badges row -->
						<div class="flex flex-wrap gap-2">
							<span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium {provisioningStatusColor(user.provisioningStatus)}">
								VPS: {provisioningStatusLabel(user.provisioningStatus, user.vpsProvisioned)}
							</span>
							<span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium {healthStatusColor(user.healthStatus)}">
								{healthStatusLabel(user.healthStatus, user.consecutiveFailures)}
							</span>
						</div>

						<!-- Metadata row -->
						<div class="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
							{#if user.vpsIpAddress}
								<span>IP: <code class="font-mono text-gray-700">{user.vpsIpAddress}</code></span>
							{/if}
							{#if user.hetznerServerId}
								<span>Hetzner: <code class="font-mono text-gray-700">{user.hetznerServerId}</code></span>
							{/if}
							<span>Joined: {formatDate(user.createdAt)}</span>
						</div>

						<!-- Expand details -->
						<button
							type="button"
							onclick={() => toggleExpanded(user.id)}
							class="text-indigo-600 hover:text-indigo-800 text-xs font-medium transition-colors inline-flex items-center gap-1"
						>
							{expandedUserId === user.id ? 'Hide details' : 'View details'}
							<svg
								class="w-3 h-3 transition-transform duration-200 {expandedUserId === user.id ? 'rotate-180' : ''}"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
							</svg>
						</button>

						{#if expandedUserId === user.id}
							<div class="bg-gray-50 rounded-lg p-3 space-y-2 text-xs">
								<div class="grid grid-cols-2 gap-3">
									<div>
										<p class="font-medium text-gray-500 uppercase tracking-wider mb-0.5">Provisioning</p>
										<span class="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium {provisioningStatusColor(user.provisioningStatus)}">
											{provisioningStatusLabel(user.provisioningStatus, user.vpsProvisioned)}
										</span>
									</div>
									<div>
										<p class="font-medium text-gray-500 uppercase tracking-wider mb-0.5">Circuit State</p>
										{#if user.circuitState}
											<span class="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium {circuitStateColor(user.circuitState)}">
												{circuitStateLabel(user.circuitState)}
											</span>
										{:else}
											<span class="text-gray-400">&mdash;</span>
										{/if}
									</div>
									<div>
										<p class="font-medium text-gray-500 uppercase tracking-wider mb-0.5">Last Check</p>
										<p class="text-gray-700">{formatDateTime(user.lastCheckAt)}</p>
									</div>
									<div>
										<p class="font-medium text-gray-500 uppercase tracking-wider mb-0.5">Failures</p>
										<p class="{user.consecutiveFailures > 0 ? 'text-red-600 font-semibold' : 'text-gray-700'}">
											{user.consecutiveFailures}
										</p>
									</div>
									<div class="col-span-2">
										<p class="font-medium text-gray-500 uppercase tracking-wider mb-0.5">Provisioned At</p>
										<p class="text-gray-700">{formatDateTime(user.provisionedAt)}</p>
									</div>
									<div class="col-span-2">
										<p class="font-medium text-gray-500 uppercase tracking-wider mb-0.5">User ID</p>
										<code class="font-mono text-gray-500 bg-gray-100 px-1 py-0.5 rounded break-all">{user.id}</code>
									</div>
								</div>
							</div>
						{/if}
					</div>
				{/each}
			</div>
		{/if}
	</div>
</div>
