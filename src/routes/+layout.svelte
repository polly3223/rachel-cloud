<script lang="ts">
	import { page } from '$app/stores';

	let { children } = $props();
</script>

<svelte:head>
	<script src="https://cdn.tailwindcss.com"></script>
</svelte:head>

<div class="min-h-screen bg-gray-50">
	{@render children()}
</div>
