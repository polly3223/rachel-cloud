<script lang="ts">
	import { invalidateAll } from '$app/navigation';

	let { data } = $props();

	const rollout = $derived(data.rolloutStatus);
	const activeVPSCount = $derived(data.activeVPSCount);

	// Auto-refresh when rollout is in progress
	let pollInterval: ReturnType<typeof setInterval> | null = null;

	$effect(() => {
		if (rollout.inProgress) {
			pollInterval = setInterval(() => {
				invalidateAll();
			}, 3000);
		}

		return () => {
			if (pollInterval) {
				clearInterval(pollInterval);
				pollInterval = null;
			}
		};
	});

	// -----------------------------------------------------------------------
	// Helpers
	// -----------------------------------------------------------------------

	function stageLabel(stage: string): string {
		switch (stage) {
			case 'idle': return 'Idle';
			case 'stage_10': return 'Stage 1: 10%';
			case 'stage_50': return 'Stage 2: 50%';
			case 'stage_100': return 'Stage 3: 100%';
			case 'completed': return 'Completed';
			case 'failed': return 'Failed';
			case 'halted': return 'Halted';
			default: return stage;
		}
	}

	function stageColor(stage: string): string {
		switch (stage) {
			case 'idle': return 'bg-gray-100 text-gray-700';
			case 'stage_10':
			case 'stage_50':
			case 'stage_100': return 'bg-blue-100 text-blue-700';
			case 'completed': return 'bg-green-100 text-green-700';
			case 'failed': return 'bg-red-100 text-red-700';
			case 'halted': return 'bg-orange-100 text-orange-700';
			default: return 'bg-gray-100 text-gray-700';
		}
	}

	function vpsStatusColor(status: string): string {
		switch (status) {
			case 'pending': return 'bg-gray-100 text-gray-700';
			case 'updating': return 'bg-yellow-100 text-yellow-700';
			case 'success': return 'bg-green-100 text-green-700';
			case 'failed': return 'bg-red-100 text-red-700';
			case 'rolled_back': return 'bg-orange-100 text-orange-700';
			case 'skipped': return 'bg-gray-100 text-gray-500';
			default: return 'bg-gray-100 text-gray-700';
		}
	}

	function vpsStatusLabel(status: string): string {
		switch (status) {
			case 'pending': return 'Pending';
			case 'updating': return 'Updating...';
			case 'success': return 'Success';
			case 'failed': return 'Failed';
			case 'rolled_back': return 'Rolled Back';
			case 'skipped': return 'Skipped';
			default: return status;
		}
	}

	function shortHash(hash: string | null): string {
		if (!hash) return '\u2014';
		return hash.slice(0, 7);
	}

	function formatTime(iso: string | null): string {
		if (!iso) return '\u2014';
		return new Date(iso).toLocaleTimeString('en-US', {
			hour: '2-digit',
			minute: '2-digit',
			second: '2-digit'
		});
	}
</script>

<div class="max-w-7xl mx-auto">
	<!-- Page header -->
	<div class="mb-8">
		<h1 class="text-3xl font-bold text-gray-900">Update Rollout</h1>
		<p class="mt-1 text-sm text-gray-500">
			Deploy new Rachel8 versions to user instances with gradual rollout
		</p>
	</div>

	<!-- Status & Trigger Card -->
	<div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
		<div class="flex items-center justify-between flex-wrap gap-4">
			<div>
				<h2 class="text-lg font-semibold text-gray-900">Rollout Status</h2>
				<div class="mt-2 flex items-center gap-3">
					<span class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium {stageColor(rollout.stage)}">
						{stageLabel(rollout.stage)}
					</span>
					{#if rollout.inProgress}
						<span class="text-sm text-gray-500">
							Stage progress: {rollout.currentStageProgress}%
						</span>
					{/if}
				</div>
				{#if rollout.startedAt}
					<p class="mt-1 text-xs text-gray-500">
						Started: {formatTime(rollout.startedAt)}
						{#if rollout.completedAt}
							&middot; Completed: {formatTime(rollout.completedAt)}
						{/if}
					</p>
				{/if}
			</div>

			<div class="flex items-center gap-4">
				<p class="text-sm text-gray-500">
					{activeVPSCount} active VPS{activeVPSCount !== 1 ? 's' : ''}
				</p>
				<form method="POST" action="?/trigger">
					<button
						type="submit"
						disabled={rollout.inProgress || activeVPSCount === 0}
						class="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
					>
						{#if rollout.inProgress}
							<svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
								<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
								<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
							</svg>
							Rollout In Progress...
						{:else}
							<svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
							</svg>
							Start Rollout
						{/if}
					</button>
				</form>
			</div>
		</div>

		{#if rollout.error}
			<div class="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
				<p class="text-sm text-red-700">{rollout.error}</p>
			</div>
		{/if}
	</div>

	<!-- Stats Cards (visible when rollout started) -->
	{#if rollout.stage !== 'idle'}
		<div class="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
			<div class="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
				<p class="text-sm text-gray-500">Total VPSs</p>
				<p class="text-2xl font-bold text-gray-900">{rollout.totalVPSs}</p>
			</div>
			<div class="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
				<p class="text-sm text-gray-500">Updated</p>
				<p class="text-2xl font-bold text-green-600">{rollout.updatedCount}</p>
			</div>
			<div class="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
				<p class="text-sm text-gray-500">Failed</p>
				<p class="text-2xl font-bold {rollout.failedCount > 0 ? 'text-red-600' : 'text-gray-900'}">{rollout.failedCount}</p>
			</div>
			<div class="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
				<p class="text-sm text-gray-500">Rolled Back</p>
				<p class="text-2xl font-bold {rollout.rolledBackCount > 0 ? 'text-orange-600' : 'text-gray-900'}">{rollout.rolledBackCount}</p>
			</div>
		</div>

		<!-- Stage Progress Bar -->
		<div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
			<h3 class="text-sm font-semibold text-gray-900 mb-3">Rollout Stages</h3>
			<div class="flex items-center gap-2">
				{#each ['stage_10', 'stage_50', 'stage_100'] as stage, i}
					{@const isActive = rollout.stage === stage}
					{@const isPast = ['stage_50', 'stage_100', 'completed'].includes(rollout.stage) && i === 0
						|| ['stage_100', 'completed'].includes(rollout.stage) && i === 1
						|| rollout.stage === 'completed' && i === 2}
					{@const isHalted = rollout.stage === 'halted' || rollout.stage === 'failed'}
					<div class="flex-1">
						<div class="flex items-center justify-between mb-1">
							<span class="text-xs font-medium {isActive ? 'text-indigo-600' : isPast ? 'text-green-600' : 'text-gray-400'}">
								{['10%', '50%', '100%'][i]}
							</span>
						</div>
						<div class="w-full bg-gray-200 rounded-full h-2">
							<div
								class="h-2 rounded-full transition-all duration-500 {isPast ? 'bg-green-500' : isActive ? 'bg-indigo-500' : isHalted && !isPast ? 'bg-red-300' : 'bg-gray-200'}"
								style="width: {isPast ? '100' : isActive ? rollout.currentStageProgress : '0'}%"
							></div>
						</div>
					</div>
					{#if i < 2}
						<div class="flex-shrink-0 w-6 flex items-center justify-center pt-4">
							<svg class="w-4 h-4 {isPast ? 'text-green-500' : 'text-gray-300'}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
							</svg>
						</div>
					{/if}
				{/each}
			</div>
		</div>

		<!-- Per-VPS Status Table -->
		{#if rollout.vpsStatuses.length > 0}
			<div class="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
				<div class="px-6 py-4 border-b border-gray-200">
					<h3 class="text-lg font-semibold text-gray-900">Instance Details</h3>
					<p class="text-sm text-gray-500">{rollout.vpsStatuses.length} instance{rollout.vpsStatuses.length !== 1 ? 's' : ''}</p>
				</div>

				<!-- Desktop table -->
				<div class="hidden md:block overflow-x-auto">
					<table class="min-w-full divide-y divide-gray-200">
						<thead class="bg-gray-50">
							<tr>
								<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
								<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">IP Address</th>
								<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
								<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Previous</th>
								<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">New</th>
								<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Error</th>
							</tr>
						</thead>
						<tbody class="bg-white divide-y divide-gray-200">
							{#each rollout.vpsStatuses as vps}
								<tr class="hover:bg-gray-50 transition-colors">
									<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{vps.email}</td>
									<td class="px-6 py-4 whitespace-nowrap">
										<code class="text-sm font-mono text-gray-700 bg-gray-100 px-2 py-0.5 rounded">{vps.ipAddress}</code>
									</td>
									<td class="px-6 py-4 whitespace-nowrap">
										<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium {vpsStatusColor(vps.status)}">
											{#if vps.status === 'updating'}
												<svg class="animate-spin -ml-0.5 mr-1.5 h-3 w-3" fill="none" viewBox="0 0 24 24">
													<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
													<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
												</svg>
											{/if}
											{vpsStatusLabel(vps.status)}
										</span>
									</td>
									<td class="px-6 py-4 whitespace-nowrap">
										<code class="text-xs font-mono text-gray-500">{shortHash(vps.previousVersion)}</code>
									</td>
									<td class="px-6 py-4 whitespace-nowrap">
										<code class="text-xs font-mono text-gray-500">{shortHash(vps.newVersion)}</code>
									</td>
									<td class="px-6 py-4 max-w-xs truncate text-xs text-red-600">
										{vps.error ?? ''}
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>

				<!-- Mobile card layout -->
				<div class="md:hidden divide-y divide-gray-200">
					{#each rollout.vpsStatuses as vps}
						<div class="px-4 py-4 space-y-2">
							<div class="flex items-center justify-between">
								<p class="text-sm font-medium text-gray-900">{vps.email}</p>
								<span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium {vpsStatusColor(vps.status)}">
									{vpsStatusLabel(vps.status)}
								</span>
							</div>
							<div class="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
								<span>IP: <code class="font-mono">{vps.ipAddress}</code></span>
								<span>
									{shortHash(vps.previousVersion)} &rarr; {shortHash(vps.newVersion)}
								</span>
							</div>
							{#if vps.error}
								<p class="text-xs text-red-600 truncate">{vps.error}</p>
							{/if}
						</div>
					{/each}
				</div>
			</div>
		{/if}
	{:else}
		<!-- Empty state when no rollout has been triggered -->
		<div class="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
			<svg class="mx-auto w-12 h-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
			</svg>
			<h3 class="mt-4 text-lg font-medium text-gray-900">No rollout in progress</h3>
			<p class="mt-2 text-sm text-gray-500">
				Click "Start Rollout" to deploy the latest Rachel8 version to all active instances.
				Updates roll out gradually: 10% &rarr; 50% &rarr; 100%.
			</p>
		</div>
	{/if}
</div>
