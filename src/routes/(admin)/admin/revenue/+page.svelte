<script lang="ts">
	let { data } = $props();

	const overview = $derived(data.overview);

	// -----------------------------------------------------------------------
	// Derived metrics
	// -----------------------------------------------------------------------

	const annualRunRate = $derived(overview.totalMRR * 12);
	const revenuePerUser = $derived(
		overview.totalUsers > 0 ? overview.totalMRR / overview.totalUsers : 0
	);
	const costPerSubscriber = $derived(
		overview.activeSubscribers > 0
			? overview.estimatedMonthlyCost / overview.activeSubscribers
			: 0
	);
	const grossMarginPerSubscriber = $derived(40 - 3.49);
	const churned = $derived(overview.canceledUsers);
	const signupToActiveRate = $derived(
		overview.totalUsers > 0
			? (overview.activeSubscribers / overview.totalUsers) * 100
			: 0
	);
	const activeToChurnedRate = $derived(
		overview.activeSubscribers + overview.canceledUsers > 0
			? (overview.canceledUsers / (overview.activeSubscribers + overview.canceledUsers)) * 100
			: 0
	);

	// Users sorted by signup date (newest first)
	const sortedUsers = $derived(
		[...overview.users].sort((a, b) => {
			const dateA = typeof a.createdAt === 'string' ? new Date(a.createdAt) : a.createdAt;
			const dateB = typeof b.createdAt === 'string' ? new Date(b.createdAt) : b.createdAt;
			return dateB.getTime() - dateA.getTime();
		})
	);

	// -----------------------------------------------------------------------
	// Formatting helpers
	// -----------------------------------------------------------------------

	function formatCurrency(amount: number, currency: string = '€'): string {
		return `${currency}${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
	}

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
		return d.toLocaleDateString('en-US', {
			month: 'short',
			day: 'numeric',
			year: 'numeric',
			hour: 'numeric',
			minute: '2-digit',
		});
	}

	function profitMarginColor(margin: number): string {
		if (margin > 60) return 'text-green-600';
		if (margin >= 40) return 'text-yellow-600';
		return 'text-red-600';
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
</script>

<div class="max-w-7xl mx-auto">
	<!-- Page header -->
	<div class="mb-8">
		<h1 class="text-3xl font-bold text-gray-900">Revenue Analytics</h1>
		<p class="mt-1 text-sm text-gray-500">Financial metrics, unit economics, and subscriber growth</p>
	</div>

	<!-- Section 1: Revenue Summary Cards -->
	<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
		<!-- MRR -->
		<div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
			<div class="flex items-center">
				<div class="flex-shrink-0 p-3 bg-green-50 rounded-lg">
					<svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
					</svg>
				</div>
				<div class="ml-4">
					<p class="text-sm font-medium text-gray-500">Monthly Recurring Revenue</p>
					<p class="text-2xl font-bold text-green-600">{formatCurrency(overview.totalMRR)}</p>
					<p class="text-xs text-gray-400 mt-0.5">{overview.activeSubscribers} active subscriber{overview.activeSubscribers !== 1 ? 's' : ''}</p>
				</div>
			</div>
		</div>

		<!-- Annual Run Rate -->
		<div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
			<div class="flex items-center">
				<div class="flex-shrink-0 p-3 bg-green-50 rounded-lg">
					<svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path>
					</svg>
				</div>
				<div class="ml-4">
					<p class="text-sm font-medium text-gray-500">Annual Run Rate</p>
					<p class="text-2xl font-bold text-green-600">{formatCurrency(annualRunRate)}</p>
					<p class="text-xs text-gray-400 mt-0.5">MRR &times; 12</p>
				</div>
			</div>
		</div>

		<!-- Revenue per User -->
		<div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
			<div class="flex items-center">
				<div class="flex-shrink-0 p-3 bg-indigo-50 rounded-lg">
					<svg class="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
					</svg>
				</div>
				<div class="ml-4">
					<p class="text-sm font-medium text-gray-500">Revenue per User</p>
					<p class="text-2xl font-bold text-gray-900">{formatCurrency(revenuePerUser)}</p>
					<p class="text-xs text-gray-400 mt-0.5">MRR / total users</p>
				</div>
			</div>
		</div>

		<!-- Profit Margin -->
		<div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
			<div class="flex items-center">
				<div class="flex-shrink-0 p-3 {overview.profitMargin > 60 ? 'bg-green-50' : overview.profitMargin >= 40 ? 'bg-yellow-50' : 'bg-red-50'} rounded-lg">
					<svg class="w-6 h-6 {profitMarginColor(overview.profitMargin)}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z"></path>
					</svg>
				</div>
				<div class="ml-4">
					<p class="text-sm font-medium text-gray-500">Profit Margin</p>
					<p class="text-2xl font-bold {profitMarginColor(overview.profitMargin)}">{overview.profitMargin.toFixed(1)}%</p>
					<p class="text-xs text-gray-400 mt-0.5">(MRR &minus; cost) / MRR</p>
				</div>
			</div>
		</div>
	</div>

	<!-- Section 2: Cost Breakdown -->
	<div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
		<h2 class="text-lg font-semibold text-gray-900 mb-4">Cost Breakdown</h2>
		<div class="grid grid-cols-1 md:grid-cols-3 gap-6">
			<div class="border border-gray-100 rounded-lg p-4">
				<p class="text-sm text-gray-500 mb-1">Hetzner VPS Cost</p>
				<p class="text-xl font-semibold text-red-600">&euro;3.49<span class="text-sm font-normal text-gray-500"> / VPS / month</span></p>
				<p class="text-xs text-gray-400 mt-1">{overview.runningVPSCount} running VPS{overview.runningVPSCount !== 1 ? 's' : ''}</p>
			</div>
			<div class="border border-gray-100 rounded-lg p-4">
				<p class="text-sm text-gray-500 mb-1">Total Monthly Cost</p>
				<p class="text-xl font-semibold text-red-600">&euro;{overview.estimatedMonthlyCost.toFixed(2)}<span class="text-sm font-normal text-gray-500"> / month</span></p>
				<p class="text-xs text-gray-400 mt-1">{overview.runningVPSCount} &times; &euro;3.49</p>
			</div>
			<div class="border border-gray-100 rounded-lg p-4">
				<p class="text-sm text-gray-500 mb-1">Cost per Subscriber</p>
				<p class="text-xl font-semibold text-red-600">&euro;{costPerSubscriber.toFixed(2)}<span class="text-sm font-normal text-gray-500"> / subscriber</span></p>
				<p class="text-xs text-gray-400 mt-1">Total cost / {overview.activeSubscribers} active subscriber{overview.activeSubscribers !== 1 ? 's' : ''}</p>
			</div>
		</div>
	</div>

	<!-- Section 3: Unit Economics -->
	<div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
		<h2 class="text-lg font-semibold text-gray-900 mb-4">Unit Economics</h2>
		<div class="grid grid-cols-1 md:grid-cols-3 gap-6">
			<div class="border border-gray-100 rounded-lg p-4">
				<p class="text-sm text-gray-500 mb-1">Revenue per Subscriber</p>
				<p class="text-xl font-semibold text-green-600">&euro;40.00<span class="text-sm font-normal text-gray-500"> / month</span></p>
				<p class="text-xs text-gray-400 mt-1">Fixed subscription price</p>
			</div>
			<div class="border border-gray-100 rounded-lg p-4">
				<p class="text-sm text-gray-500 mb-1">Cost per Subscriber</p>
				<p class="text-xl font-semibold text-red-600">&euro;3.49<span class="text-sm font-normal text-gray-500"> / month</span></p>
				<p class="text-xs text-gray-400 mt-1">1 Hetzner VPS per subscriber</p>
			</div>
			<div class="border border-gray-100 rounded-lg p-4">
				<p class="text-sm text-gray-500 mb-1">Gross Margin per Subscriber</p>
				<p class="text-xl font-semibold text-green-600">&euro;{grossMarginPerSubscriber.toFixed(2)}<span class="text-sm font-normal text-gray-500"> / month</span></p>
				<p class="text-xs text-gray-400 mt-1">&euro;40.00 &minus; &euro;5.00 (approx.)</p>
			</div>
		</div>
	</div>

	<!-- Section 4: Subscriber Funnel -->
	<div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
		<h2 class="text-lg font-semibold text-gray-900 mb-4">Subscriber Funnel</h2>

		<div class="flex flex-col md:flex-row items-stretch md:items-center gap-4">
			<!-- Total Signups -->
			<div class="flex-1 border border-gray-100 rounded-lg p-4 text-center">
				<p class="text-sm text-gray-500 mb-1">Total Signups</p>
				<p class="text-3xl font-bold text-gray-900">{overview.totalUsers}</p>
			</div>

			<!-- Arrow with conversion rate -->
			<div class="flex flex-col items-center justify-center px-2">
				<svg class="w-6 h-6 text-indigo-400 hidden md:block" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6"></path>
				</svg>
				<svg class="w-6 h-6 text-indigo-400 md:hidden" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 14l-7 7m0 0l-7-7m7 7V3"></path>
				</svg>
				<span class="text-xs font-medium text-indigo-600 mt-0.5">{signupToActiveRate.toFixed(1)}%</span>
			</div>

			<!-- Active Subscribers -->
			<div class="flex-1 border-2 border-green-200 bg-green-50 rounded-lg p-4 text-center">
				<p class="text-sm text-green-700 mb-1">Active Subscribers</p>
				<p class="text-3xl font-bold text-green-700">{overview.activeSubscribers}</p>
				{#if overview.gracePeriodUsers > 0}
					<p class="text-xs text-yellow-600 mt-1">+{overview.gracePeriodUsers} in grace period</p>
				{/if}
			</div>

			<!-- Arrow with churn rate -->
			<div class="flex flex-col items-center justify-center px-2">
				<svg class="w-6 h-6 text-red-400 hidden md:block" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6"></path>
				</svg>
				<svg class="w-6 h-6 text-red-400 md:hidden" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 14l-7 7m0 0l-7-7m7 7V3"></path>
				</svg>
				<span class="text-xs font-medium text-red-600 mt-0.5">{activeToChurnedRate.toFixed(1)}%</span>
			</div>

			<!-- Churned -->
			<div class="flex-1 border border-red-200 bg-red-50 rounded-lg p-4 text-center">
				<p class="text-sm text-red-700 mb-1">Churned</p>
				<p class="text-3xl font-bold text-red-700">{churned}</p>
			</div>
		</div>
	</div>

	<!-- Section 5: Subscriber Timeline -->
	<div class="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
		<div class="px-6 py-4 border-b border-gray-200">
			<h2 class="text-lg font-semibold text-gray-900">Subscriber Timeline</h2>
			<p class="text-sm text-gray-500">All signups sorted by date (newest first)</p>
		</div>

		{#if sortedUsers.length === 0}
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
							<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Signed Up</th>
							<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
							<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Provisioned</th>
						</tr>
					</thead>
					<tbody class="bg-white divide-y divide-gray-200">
						{#each sortedUsers as user}
							<tr class="hover:bg-gray-50 transition-colors">
								<td class="px-6 py-4 whitespace-nowrap">
									<div>
										<p class="text-sm font-medium text-gray-900">{user.email}</p>
										{#if user.name}
											<p class="text-xs text-gray-500">{user.name}</p>
										{/if}
									</div>
								</td>
								<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
									{formatDateTime(user.createdAt)}
								</td>
								<td class="px-6 py-4 whitespace-nowrap">
									<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium {statusColor(user.subscriptionStatus)}">
										{statusLabel(user.subscriptionStatus)}
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
				{#each sortedUsers as user}
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
							<span>Signed up: {formatDateTime(user.createdAt)}</span>
							<span>Provisioned: {formatDate(user.provisionedAt)}</span>
						</div>
					</div>
				{/each}
			</div>
		{/if}
	</div>
</div>
