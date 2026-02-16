<script lang="ts">
	let { data } = $props();

	const overview = $derived(data.overview);

	// -----------------------------------------------------------------------
	// Derived data
	// -----------------------------------------------------------------------

	/** Only users that have a provisioned container. */
	const provisionedUsers = $derived(
		overview.users.filter((u) => u.vpsProvisioned && u.containerId)
	);

	// Cost calculations (Docker shared model)
	const DOCKER_HOST_COST_EUR = 15;
	const AI_MAX_COST_EUR = 80;
	const totalMonthlyCost = $derived(DOCKER_HOST_COST_EUR + AI_MAX_COST_EUR);
	const perContainerCost = $derived(
		provisionedUsers.length > 0 ? totalMonthlyCost / provisionedUsers.length : 0
	);

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

	function provisioningStatusColor(status: string | null): string {
		switch (status) {
			case 'ready':
				return 'bg-green-100 text-green-800';
			case 'pending':
			case 'creating':
			case 'starting':
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
			case 'starting':
				return 'Starting';
			case 'failed':
				return 'Failed';
			default:
				return 'Unknown';
		}
	}
</script>

<div class="max-w-7xl mx-auto">
	<!-- Page header -->
	<div class="mb-8">
		<h1 class="text-3xl font-bold text-gray-900">Infrastructure</h1>
		<p class="mt-1 text-sm text-gray-500">Docker container fleet management and cost overview</p>
	</div>

	<!-- Section 1: Infrastructure Overview Cards -->
	<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
		<!-- Total Containers -->
		<div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
			<div class="flex items-center">
				<div class="flex-shrink-0 p-3 bg-indigo-50 rounded-lg">
					<svg class="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01"></path>
					</svg>
				</div>
				<div class="ml-4">
					<p class="text-sm font-medium text-gray-500">Total Containers</p>
					<p class="text-2xl font-bold text-gray-900">{provisionedUsers.length}</p>
				</div>
			</div>
		</div>

		<!-- Active Subscribers -->
		<div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
			<div class="flex items-center">
				<div class="flex-shrink-0 p-3 bg-green-50 rounded-lg">
					<svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
					</svg>
				</div>
				<div class="ml-4">
					<p class="text-sm font-medium text-gray-500">Active Subscribers</p>
					<p class="text-2xl font-bold text-green-600">{overview.activeSubscribers}</p>
				</div>
			</div>
		</div>

		<!-- Docker Host -->
		<div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
			<div class="flex items-center">
				<div class="flex-shrink-0 p-3 bg-purple-50 rounded-lg">
					<svg class="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path>
					</svg>
				</div>
				<div class="ml-4">
					<p class="text-sm font-medium text-gray-500">Docker Host</p>
					<p class="text-lg font-bold text-gray-900">1 shared server</p>
				</div>
			</div>
		</div>
	</div>

	<!-- Section 2: Monthly Cost Breakdown -->
	<div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
		<h2 class="text-lg font-semibold text-gray-900 mb-4">Monthly Infrastructure Cost</h2>
		<div class="space-y-4">
			<div class="flex items-baseline justify-between">
				<span class="text-sm text-gray-500">Total monthly cost</span>
				<span class="text-2xl font-bold text-purple-600">&euro;{totalMonthlyCost.toFixed(0)}</span>
			</div>
			<div class="border-t border-gray-100 pt-3 space-y-2">
				<div class="flex items-center justify-between text-sm">
					<span class="text-gray-500">Docker host (Hetzner shared)</span>
					<span class="font-medium text-gray-900">&euro;{DOCKER_HOST_COST_EUR}/mo</span>
				</div>
				<div class="flex items-center justify-between text-sm">
					<span class="text-gray-500">AI budget (Claude API cap)</span>
					<span class="font-medium text-gray-900">&euro;{AI_MAX_COST_EUR}/mo</span>
				</div>
				<div class="flex items-center justify-between text-sm">
					<span class="text-gray-500">Running containers</span>
					<span class="font-medium text-gray-900">{provisionedUsers.length}</span>
				</div>
				{#if provisionedUsers.length > 0}
					<div class="flex items-center justify-between text-sm border-t border-gray-100 pt-2">
						<span class="text-gray-500">Effective cost per container</span>
						<span class="font-mono text-xs text-gray-500">&euro;{perContainerCost.toFixed(2)}/mo</span>
					</div>
				{/if}
			</div>
		</div>
	</div>

	<!-- Section 3: Container Fleet Table -->
	<div class="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
		<div class="px-6 py-4 border-b border-gray-200">
			<h2 class="text-lg font-semibold text-gray-900">Container Fleet</h2>
			<p class="text-sm text-gray-500">
				{provisionedUsers.length} provisioned instance{provisionedUsers.length !== 1 ? 's' : ''}
			</p>
		</div>

		{#if provisionedUsers.length === 0}
			<!-- Empty state -->
			<div class="px-6 py-12 text-center">
				<svg class="mx-auto w-12 h-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01"></path>
				</svg>
				<p class="mt-2 text-sm text-gray-500">No containers provisioned yet</p>
			</div>
		{:else}
			<!-- Desktop table -->
			<div class="hidden md:block overflow-x-auto">
				<table class="min-w-full divide-y divide-gray-200">
					<thead class="bg-gray-50">
						<tr>
							<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
							<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Container</th>
							<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Image</th>
							<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
							<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Provisioned</th>
						</tr>
					</thead>
					<tbody class="bg-white divide-y divide-gray-200">
						{#each provisionedUsers as user}
							<tr class="hover:bg-gray-50 transition-colors">
								<td class="px-6 py-4 whitespace-nowrap">
									<p class="text-sm font-medium text-gray-900">{user.email}</p>
								</td>
								<td class="px-6 py-4 whitespace-nowrap">
									{#if user.containerName}
										<code class="text-sm font-mono text-gray-700 bg-gray-100 px-2 py-0.5 rounded">{user.containerName}</code>
									{:else}
										<span class="text-sm text-gray-400">&mdash;</span>
									{/if}
								</td>
								<td class="px-6 py-4 whitespace-nowrap">
									{#if user.currentImage}
										<code class="text-sm font-mono text-gray-700 bg-purple-50 px-2 py-0.5 rounded">{user.currentImage}</code>
									{:else}
										<span class="text-sm text-gray-400">&mdash;</span>
									{/if}
								</td>
								<td class="px-6 py-4 whitespace-nowrap">
									<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium {provisioningStatusColor(user.provisioningStatus)}">
										{provisioningStatusLabel(user.provisioningStatus)}
									</span>
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
				{#each provisionedUsers as user}
					<div class="px-4 py-4 space-y-2">
						<div class="flex items-center justify-between">
							<p class="text-sm font-medium text-gray-900">{user.email}</p>
							<span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium {provisioningStatusColor(user.provisioningStatus)}">
								{provisioningStatusLabel(user.provisioningStatus)}
							</span>
						</div>
						<div class="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
							{#if user.containerName}
								<span>Container: <code class="font-mono text-gray-700">{user.containerName}</code></span>
							{/if}
							{#if user.currentImage}
								<span>Image: <code class="font-mono text-gray-700">{user.currentImage}</code></span>
							{/if}
							<span>Provisioned: {formatDate(user.provisionedAt)}</span>
						</div>
					</div>
				{/each}
			</div>
		{/if}
	</div>
</div>
