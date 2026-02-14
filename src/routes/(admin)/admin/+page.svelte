<script lang="ts">
	let { data } = $props();

	const overview = $derived(data.overview);

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
				return 'No Subscription';
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

	function profitMarginColor(margin: number): string {
		if (margin > 60) return 'text-green-600';
		if (margin >= 40) return 'text-yellow-600';
		return 'text-red-600';
	}

	function healthStatusColor(status: string | null): string {
		switch (status) {
			case 'healthy': return 'bg-green-100 text-green-800';
			case 'unhealthy': return 'bg-yellow-100 text-yellow-800';
			case 'down': return 'bg-red-100 text-red-800';
			case 'circuit_open': return 'bg-red-100 text-red-800 font-bold';
			default: return 'bg-gray-100 text-gray-600';
		}
	}

	function healthStatusLabel(status: string | null, failures: number): string {
		switch (status) {
			case 'healthy': return 'Healthy';
			case 'unhealthy': return `Unhealthy (${failures})`;
			case 'down': return 'Down';
			case 'circuit_open': return 'Circuit Open';
			default: return 'Not Monitored';
		}
	}
</script>

<div class="max-w-7xl mx-auto">
	<!-- Page header -->
	<div class="mb-8">
		<h1 class="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
		<p class="mt-1 text-sm text-gray-500">Business overview and user management</p>
	</div>

	<!-- Section 1: Overview Stats Cards -->
	<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
		<!-- Total Users -->
		<div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
			<div class="flex items-center">
				<div class="flex-shrink-0 p-3 bg-indigo-50 rounded-lg">
					<svg class="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path>
					</svg>
				</div>
				<div class="ml-4">
					<p class="text-sm font-medium text-gray-500">Total Users</p>
					<p class="text-2xl font-bold text-gray-900">{overview.totalUsers}</p>
				</div>
			</div>
		</div>

		<!-- Monthly Revenue (MRR) -->
		<div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
			<div class="flex items-center">
				<div class="flex-shrink-0 p-3 bg-green-50 rounded-lg">
					<svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
					</svg>
				</div>
				<div class="ml-4">
					<p class="text-sm font-medium text-gray-500">Monthly Revenue</p>
					<p class="text-2xl font-bold text-green-600">&euro;{overview.totalMRR}/mo</p>
				</div>
			</div>
		</div>

		<!-- Running VPSs -->
		<div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
			<div class="flex items-center">
				<div class="flex-shrink-0 p-3 bg-purple-50 rounded-lg">
					<svg class="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01"></path>
					</svg>
				</div>
				<div class="ml-4">
					<p class="text-sm font-medium text-gray-500">Running VPSs</p>
					<p class="text-2xl font-bold text-gray-900">{overview.runningVPSCount}</p>
				</div>
			</div>
		</div>

		<!-- Estimated Monthly Cost -->
		<div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
			<div class="flex items-center">
				<div class="flex-shrink-0 p-3 bg-orange-50 rounded-lg">
					<svg class="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z"></path>
					</svg>
				</div>
				<div class="ml-4">
					<p class="text-sm font-medium text-gray-500">Est. Monthly Cost</p>
					<div class="flex items-center gap-2">
						<p class="text-2xl font-bold text-gray-900">&euro;{overview.estimatedMonthlyCost.toFixed(2)}</p>
					</div>
				</div>
			</div>
		</div>
	</div>

	<!-- Section 1.5: Health Overview Cards -->
	<div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
		<!-- Healthy VPSs -->
		<div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
			<div class="flex items-center">
				<div class="flex-shrink-0 p-3 bg-green-50 rounded-lg">
					<svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
					</svg>
				</div>
				<div class="ml-4">
					<p class="text-sm font-medium text-gray-500">Healthy VPSs</p>
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

		<!-- Circuit Breakers Tripped -->
		<div class="rounded-lg shadow-sm border p-6 {overview.circuitOpenCount > 0 ? 'bg-red-50 border-red-300' : 'bg-white border-gray-200'}">
			<div class="flex items-center">
				<div class="flex-shrink-0 p-3 bg-red-50 rounded-lg">
					<svg class="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3"></path>
					</svg>
				</div>
				<div class="ml-4">
					<p class="text-sm font-medium text-gray-500">Circuit Breakers Tripped</p>
					<p class="text-2xl font-bold {overview.circuitOpenCount > 0 ? 'text-red-700' : 'text-gray-900'}">{overview.circuitOpenCount}</p>
					{#if overview.circuitOpenCount > 0}
						<p class="text-xs text-red-600 font-medium mt-1">Requires attention</p>
					{/if}
				</div>
			</div>
		</div>
	</div>

	<!-- Section 2: Revenue & Costs Summary -->
	<div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
		<h2 class="text-lg font-semibold text-gray-900 mb-4">Revenue & Costs</h2>
		<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
			<div>
				<p class="text-sm text-gray-500">Revenue</p>
				<p class="text-lg font-semibold text-gray-900">
					&euro;{overview.totalMRR}/mo
					<span class="text-sm font-normal text-gray-500">from {overview.activeSubscribers} active subscriber{overview.activeSubscribers !== 1 ? 's' : ''}</span>
				</p>
			</div>
			<div>
				<p class="text-sm text-gray-500">Infrastructure Costs</p>
				<p class="text-lg font-semibold text-gray-900">
					~&euro;{overview.estimatedMonthlyCost.toFixed(2)}/mo
					<span class="text-sm font-normal text-gray-500">from {overview.runningVPSCount} VPS{overview.runningVPSCount !== 1 ? 's' : ''} (&euro;3.49 ea.)</span>
				</p>
			</div>
			<div>
				<p class="text-sm text-gray-500">Profit Margin</p>
				<p class="text-lg font-semibold {profitMarginColor(overview.profitMargin)}">
					{overview.profitMargin.toFixed(1)}%
				</p>
			</div>
			<div>
				<p class="text-sm text-gray-500">Subscribers Breakdown</p>
				<div class="flex flex-wrap gap-2 mt-1">
					<span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
						{overview.activeSubscribers} active
					</span>
					<span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
						{overview.gracePeriodUsers} grace
					</span>
					<span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
						{overview.canceledUsers} canceled
					</span>
				</div>
			</div>
		</div>
	</div>

	<!-- Section 3: Users Table -->
	<div class="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
		<div class="px-6 py-4 border-b border-gray-200">
			<h2 class="text-lg font-semibold text-gray-900">All Users</h2>
			<p class="text-sm text-gray-500">{overview.totalUsers} user{overview.totalUsers !== 1 ? 's' : ''} total</p>
		</div>

		{#if overview.users.length === 0}
			<!-- Empty state -->
			<div class="px-6 py-12 text-center">
				<svg class="mx-auto w-12 h-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path>
				</svg>
				<p class="mt-2 text-sm text-gray-500">No users yet</p>
			</div>
		{:else}
			<!-- Desktop table -->
			<div class="hidden md:block overflow-x-auto">
				<table class="min-w-full divide-y divide-gray-200">
					<thead class="bg-gray-50">
						<tr>
							<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
							<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
							<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">VPS Status</th>
							<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Health</th>
							<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">IP Address</th>
							<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Provisioned</th>
							<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Member Since</th>
						</tr>
					</thead>
					<tbody class="bg-white divide-y divide-gray-200">
						{#each overview.users as user}
							<tr class="hover:bg-gray-50 transition-colors">
								<td class="px-6 py-4 whitespace-nowrap">
									<div>
										<p class="text-sm font-medium text-gray-900">{user.email}</p>
										{#if user.name}
											<p class="text-xs text-gray-500">{user.name}</p>
										{/if}
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
								<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
									{formatDate(user.provisionedAt)}
								</td>
								<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
									{formatDate(user.createdAt)}
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>

			<!-- Mobile card layout -->
			<div class="md:hidden divide-y divide-gray-200">
				{#each overview.users as user}
					<div class="px-4 py-4 space-y-2">
						<div class="flex items-center justify-between">
							<div>
								<p class="text-sm font-medium text-gray-900">{user.email}</p>
								{#if user.name}
									<p class="text-xs text-gray-500">{user.name}</p>
								{/if}
							</div>
							<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium {statusColor(user.subscriptionStatus)}">
								{statusLabel(user.subscriptionStatus)}
							</span>
						</div>
						<div class="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
							<span>
								VPS: <span class="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium {provisioningStatusColor(user.provisioningStatus)}">{provisioningStatusLabel(user.provisioningStatus, user.vpsProvisioned)}</span>
							</span>
							<span>
								Health: <span class="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium {healthStatusColor(user.healthStatus)}">{healthStatusLabel(user.healthStatus, user.consecutiveFailures)}</span>
							</span>
							{#if user.vpsIpAddress}
								<span>IP: <code class="font-mono text-gray-700">{user.vpsIpAddress}</code></span>
							{/if}
							<span>Joined: {formatDate(user.createdAt)}</span>
						</div>
					</div>
				{/each}
			</div>
		{/if}
	</div>
</div>
