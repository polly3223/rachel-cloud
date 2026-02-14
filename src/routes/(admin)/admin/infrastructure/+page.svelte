<script lang="ts">
	let { data } = $props();

	const overview = $derived(data.overview);

	// -----------------------------------------------------------------------
	// Filter state
	// -----------------------------------------------------------------------

	type HealthFilter = 'all' | 'healthy' | 'unhealthy' | 'down' | 'circuit_open';

	let healthFilter: HealthFilter = $state('all');

	// -----------------------------------------------------------------------
	// Derived data
	// -----------------------------------------------------------------------

	/** Only users that have a provisioned VPS. */
	const provisionedUsers = $derived(
		overview.users.filter((u) => u.vpsProvisioned)
	);

	/** Filtered fleet based on health filter selection. */
	const filteredUsers = $derived(
		healthFilter === 'all'
			? provisionedUsers
			: provisionedUsers.filter((u) => {
					switch (healthFilter) {
						case 'healthy':
							return u.healthStatus === 'healthy';
						case 'unhealthy':
							return u.healthStatus === 'unhealthy';
						case 'down':
							return u.healthStatus === 'down';
						case 'circuit_open':
							return u.circuitState === 'open' || u.healthStatus === 'circuit_open';
						default:
							return true;
					}
				})
	);

	// Fleet health summary
	const healthyCount = $derived(
		provisionedUsers.filter((u) => u.healthStatus === 'healthy').length
	);
	const healthyPercent = $derived(
		provisionedUsers.length > 0
			? ((healthyCount / provisionedUsers.length) * 100).toFixed(1)
			: '0.0'
	);
	const avgConsecutiveFailures = $derived(
		provisionedUsers.length > 0
			? (
					provisionedUsers.reduce((sum, u) => sum + u.consecutiveFailures, 0) /
					provisionedUsers.length
				).toFixed(1)
			: '0.0'
	);

	// Cost calculations
	const COST_PER_VPS_EUR = 3.49;
	const totalMonthlyCost = $derived(provisionedUsers.length * COST_PER_VPS_EUR);

	// -----------------------------------------------------------------------
	// Formatting helpers
	// -----------------------------------------------------------------------

	function formatDate(date: Date | string | null): string {
		if (!date) return '\u2014';
		const d = typeof date === 'string' ? new Date(date) : date;
		return d.toLocaleDateString('en-US', {
			month: 'short',
			day: 'numeric',
			year: 'numeric',
		});
	}

	function formatDateTime(date: Date | string | null): string {
		if (!date) return '\u2014';
		const d = typeof date === 'string' ? new Date(date) : date;
		return d.toLocaleString('en-US', {
			month: 'short',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit',
		});
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

	function provisioningStatusLabel(status: string | null): string {
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
				return 'Not Monitored';
		}
	}

	function circuitStateColor(state: string | null): string {
		switch (state) {
			case 'closed':
				return 'bg-green-100 text-green-800';
			case 'half_open':
				return 'bg-yellow-100 text-yellow-800';
			case 'open':
				return 'bg-red-100 text-red-800 font-bold';
			default:
				return 'bg-gray-100 text-gray-600';
		}
	}

	function circuitStateLabel(state: string | null): string {
		switch (state) {
			case 'closed':
				return 'Closed';
			case 'half_open':
				return 'Half Open';
			case 'open':
				return 'Open';
			default:
				return '\u2014';
		}
	}

	// Health dot indicator for visual scanning
	function healthDotColor(status: string | null): string {
		switch (status) {
			case 'healthy':
				return 'bg-green-500';
			case 'unhealthy':
				return 'bg-yellow-500';
			case 'down':
				return 'bg-red-500';
			case 'circuit_open':
				return 'bg-red-600 ring-2 ring-red-300';
			default:
				return 'bg-gray-400';
		}
	}

	const filterOptions: { value: HealthFilter; label: string; count: number }[] = $derived([
		{ value: 'all', label: 'All', count: provisionedUsers.length },
		{
			value: 'healthy',
			label: 'Healthy',
			count: provisionedUsers.filter((u) => u.healthStatus === 'healthy').length,
		},
		{
			value: 'unhealthy',
			label: 'Unhealthy',
			count: provisionedUsers.filter((u) => u.healthStatus === 'unhealthy').length,
		},
		{
			value: 'down',
			label: 'Down',
			count: provisionedUsers.filter((u) => u.healthStatus === 'down').length,
		},
		{
			value: 'circuit_open',
			label: 'Circuit Open',
			count: provisionedUsers.filter(
				(u) => u.circuitState === 'open' || u.healthStatus === 'circuit_open'
			).length,
		},
	]);
</script>

<div class="max-w-7xl mx-auto">
	<!-- Page header -->
	<div class="mb-8">
		<h1 class="text-3xl font-bold text-gray-900">Infrastructure</h1>
		<p class="mt-1 text-sm text-gray-500">VPS fleet management, health monitoring, and cost overview</p>
	</div>

	<!-- Section 1: Infrastructure Overview Cards -->
	<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
		<!-- Total VPSs -->
		<div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
			<div class="flex items-center">
				<div class="flex-shrink-0 p-3 bg-indigo-50 rounded-lg">
					<svg class="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01"></path>
					</svg>
				</div>
				<div class="ml-4">
					<p class="text-sm font-medium text-gray-500">Total VPSs</p>
					<p class="text-2xl font-bold text-gray-900">{provisionedUsers.length}</p>
				</div>
			</div>
		</div>

		<!-- Healthy -->
		<div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
			<div class="flex items-center">
				<div class="flex-shrink-0 p-3 bg-green-50 rounded-lg">
					<svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
					</svg>
				</div>
				<div class="ml-4">
					<p class="text-sm font-medium text-gray-500">Healthy</p>
					<p class="text-2xl font-bold text-green-600">{overview.healthyVPSCount}</p>
				</div>
			</div>
		</div>

		<!-- Unhealthy / Down -->
		<div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
			<div class="flex items-center">
				<div class="flex-shrink-0 p-3 {overview.unhealthyVPSCount > 0 ? 'bg-red-50' : 'bg-yellow-50'} rounded-lg">
					<svg class="w-6 h-6 {overview.unhealthyVPSCount > 0 ? 'text-red-600' : 'text-yellow-600'}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
					</svg>
				</div>
				<div class="ml-4">
					<p class="text-sm font-medium text-gray-500">Unhealthy / Down</p>
					<p class="text-2xl font-bold {overview.unhealthyVPSCount > 0 ? 'text-red-600' : 'text-gray-900'}">{overview.unhealthyVPSCount}</p>
				</div>
			</div>
		</div>

		<!-- Circuit Breakers Open -->
		<div class="rounded-lg shadow-sm border p-6 {overview.circuitOpenCount > 0 ? 'bg-red-50 border-red-300' : 'bg-white border-gray-200'}">
			<div class="flex items-center">
				<div class="flex-shrink-0 p-3 bg-red-50 rounded-lg">
					<svg class="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3"></path>
					</svg>
				</div>
				<div class="ml-4">
					<p class="text-sm font-medium text-gray-500">Circuit Breakers Open</p>
					<p class="text-2xl font-bold {overview.circuitOpenCount > 0 ? 'text-red-700' : 'text-gray-900'}">{overview.circuitOpenCount}</p>
					{#if overview.circuitOpenCount > 0}
						<p class="text-xs text-red-600 font-medium mt-1">Requires attention</p>
					{/if}
				</div>
			</div>
		</div>
	</div>

	<!-- Section 2: Fleet Health Summary + Monthly Cost -->
	<div class="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
		<!-- Fleet Health Summary -->
		<div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
			<h2 class="text-lg font-semibold text-gray-900 mb-4">Fleet Health Summary</h2>
			{#if provisionedUsers.length === 0}
				<p class="text-sm text-gray-500">No provisioned VPSs to report on.</p>
			{:else}
				<div class="space-y-4">
					<!-- Health percentage bar -->
					<div>
						<div class="flex items-center justify-between mb-1">
							<span class="text-sm font-medium text-gray-700">Fleet health</span>
							<span class="text-sm font-semibold {Number(healthyPercent) >= 90 ? 'text-green-600' : Number(healthyPercent) >= 70 ? 'text-yellow-600' : 'text-red-600'}">
								{healthyPercent}% healthy
							</span>
						</div>
						<div class="w-full bg-gray-200 rounded-full h-2.5">
							<div
								class="h-2.5 rounded-full transition-all duration-500 {Number(healthyPercent) >= 90 ? 'bg-green-500' : Number(healthyPercent) >= 70 ? 'bg-yellow-500' : 'bg-red-500'}"
								style="width: {healthyPercent}%"
							></div>
						</div>
					</div>
					<!-- Stats -->
					<div class="grid grid-cols-2 gap-4">
						<div>
							<p class="text-sm text-gray-500">Healthy VPSs</p>
							<p class="text-lg font-semibold text-green-600">{healthyCount} / {provisionedUsers.length}</p>
						</div>
						<div>
							<p class="text-sm text-gray-500">Avg Consecutive Failures</p>
							<p class="text-lg font-semibold {Number(avgConsecutiveFailures) > 0 ? 'text-yellow-600' : 'text-gray-900'}">{avgConsecutiveFailures}</p>
						</div>
					</div>
				</div>
			{/if}
		</div>

		<!-- Monthly Cost Breakdown -->
		<div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
			<h2 class="text-lg font-semibold text-gray-900 mb-4">Monthly Infrastructure Cost</h2>
			<div class="space-y-4">
				<div class="flex items-baseline justify-between">
					<span class="text-sm text-gray-500">Total monthly cost</span>
					<span class="text-2xl font-bold text-purple-600">&euro;{totalMonthlyCost.toFixed(2)}</span>
				</div>
				<div class="border-t border-gray-100 pt-3 space-y-2">
					<div class="flex items-center justify-between text-sm">
						<span class="text-gray-500">Per-VPS cost (Hetzner CX22)</span>
						<span class="font-medium text-gray-900">&euro;{COST_PER_VPS_EUR.toFixed(2)}/mo</span>
					</div>
					<div class="flex items-center justify-between text-sm">
						<span class="text-gray-500">Provisioned instances</span>
						<span class="font-medium text-gray-900">{provisionedUsers.length}</span>
					</div>
					<div class="flex items-center justify-between text-sm">
						<span class="text-gray-500">Cost formula</span>
						<span class="font-mono text-xs text-gray-500">{provisionedUsers.length} x &euro;{COST_PER_VPS_EUR.toFixed(2)} = &euro;{totalMonthlyCost.toFixed(2)}</span>
					</div>
				</div>
			</div>
		</div>
	</div>

	<!-- Section 3: VPS Fleet Table -->
	<div class="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
		<div class="px-6 py-4 border-b border-gray-200">
			<div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
				<div>
					<h2 class="text-lg font-semibold text-gray-900">VPS Fleet</h2>
					<p class="text-sm text-gray-500">
						{filteredUsers.length} of {provisionedUsers.length} provisioned instance{provisionedUsers.length !== 1 ? 's' : ''}
						{#if healthFilter !== 'all'}
							<span class="text-indigo-600">(filtered)</span>
						{/if}
					</p>
				</div>

				<!-- Health filter buttons -->
				<div class="flex flex-wrap gap-1.5">
					{#each filterOptions as opt}
						<button
							type="button"
							onclick={() => (healthFilter = opt.value)}
							class="inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-full transition-colors {healthFilter === opt.value
								? 'bg-indigo-600 text-white'
								: 'bg-gray-100 text-gray-600 hover:bg-gray-200'}"
						>
							{opt.label}
							<span class="ml-1.5 inline-flex items-center justify-center px-1.5 py-0.5 text-xs rounded-full {healthFilter === opt.value
								? 'bg-indigo-500 text-white'
								: 'bg-gray-200 text-gray-500'}">
								{opt.count}
							</span>
						</button>
					{/each}
				</div>
			</div>
		</div>

		{#if provisionedUsers.length === 0}
			<!-- Empty state: no VPSs at all -->
			<div class="px-6 py-12 text-center">
				<svg class="mx-auto w-12 h-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01"></path>
				</svg>
				<p class="mt-2 text-sm text-gray-500">No VPSs provisioned yet</p>
			</div>
		{:else if filteredUsers.length === 0}
			<!-- Empty state: filter has no results -->
			<div class="px-6 py-12 text-center">
				<svg class="mx-auto w-12 h-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"></path>
				</svg>
				<p class="mt-2 text-sm text-gray-500">No VPSs match the current filter</p>
				<button
					type="button"
					onclick={() => (healthFilter = 'all')}
					class="mt-3 text-sm font-medium text-indigo-600 hover:text-indigo-500"
				>
					Clear filter
				</button>
			</div>
		{:else}
			<!-- Desktop table -->
			<div class="hidden md:block overflow-x-auto">
				<table class="min-w-full divide-y divide-gray-200">
					<thead class="bg-gray-50">
						<tr>
							<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
							<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">IP Address</th>
							<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hetzner ID</th>
							<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
							<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Health</th>
							<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Circuit</th>
							<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Check</th>
							<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Provisioned</th>
						</tr>
					</thead>
					<tbody class="bg-white divide-y divide-gray-200">
						{#each filteredUsers as user}
							<tr class="hover:bg-gray-50 transition-colors">
								<td class="px-6 py-4 whitespace-nowrap">
									<div class="flex items-center">
										<span class="flex-shrink-0 w-2 h-2 rounded-full {healthDotColor(user.healthStatus)}"></span>
										<p class="ml-2 text-sm font-medium text-gray-900">{user.email}</p>
									</div>
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
										<code class="text-sm font-mono text-gray-700 bg-purple-50 px-2 py-0.5 rounded">{user.hetznerServerId}</code>
									{:else}
										<span class="text-sm text-gray-400">&mdash;</span>
									{/if}
								</td>
								<td class="px-6 py-4 whitespace-nowrap">
									<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium {provisioningStatusColor(user.provisioningStatus)}">
										{provisioningStatusLabel(user.provisioningStatus)}
									</span>
								</td>
								<td class="px-6 py-4 whitespace-nowrap">
									<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium {healthStatusColor(user.healthStatus)}">
										{healthStatusLabel(user.healthStatus, user.consecutiveFailures)}
									</span>
								</td>
								<td class="px-6 py-4 whitespace-nowrap">
									<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium {circuitStateColor(user.circuitState)}">
										{circuitStateLabel(user.circuitState)}
									</span>
								</td>
								<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
									{formatDateTime(user.lastCheckAt)}
								</td>
								<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
									{formatDate(user.provisionedAt)}
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>

			<!-- Mobile card layout -->
			<div class="md:hidden divide-y divide-gray-200">
				{#each filteredUsers as user}
					<div class="px-4 py-4 space-y-2">
						<div class="flex items-center justify-between">
							<div class="flex items-center">
								<span class="flex-shrink-0 w-2.5 h-2.5 rounded-full {healthDotColor(user.healthStatus)}"></span>
								<p class="ml-2 text-sm font-medium text-gray-900">{user.email}</p>
							</div>
							<span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium {healthStatusColor(user.healthStatus)}">
								{healthStatusLabel(user.healthStatus, user.consecutiveFailures)}
							</span>
						</div>
						<div class="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
							{#if user.vpsIpAddress}
								<span>IP: <code class="font-mono text-gray-700">{user.vpsIpAddress}</code></span>
							{/if}
							{#if user.hetznerServerId}
								<span>Hetzner: <code class="font-mono text-gray-700">{user.hetznerServerId}</code></span>
							{/if}
							<span>
								Status: <span class="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium {provisioningStatusColor(user.provisioningStatus)}">{provisioningStatusLabel(user.provisioningStatus)}</span>
							</span>
							<span>
								Circuit: <span class="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium {circuitStateColor(user.circuitState)}">{circuitStateLabel(user.circuitState)}</span>
							</span>
							<span>Last check: {formatDateTime(user.lastCheckAt)}</span>
							<span>Provisioned: {formatDate(user.provisionedAt)}</span>
						</div>
					</div>
				{/each}
			</div>
		{/if}
	</div>
</div>
