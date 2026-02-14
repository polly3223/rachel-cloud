<script lang="ts">
	import { t } from '$lib/i18n';

	let openIndex = $state<number | null>(null);

	function toggle(index: number) {
		openIndex = openIndex === index ? null : index;
	}
</script>

<section class="py-24 bg-[#0a0a0f] border-t border-white/5">
	<div class="max-w-2xl mx-auto px-6">
		<p class="text-sm font-medium text-rose-400 text-center mb-3 tracking-wide uppercase">{$t.faq.label}</p>
		<h2 class="text-3xl sm:text-4xl font-bold text-center text-white mb-16">
			{$t.faq.title}
		</h2>

		<div class="space-y-3">
			{#each $t.faq.items as faq, i}
				<div class="rounded-xl border border-white/5 bg-white/[0.02] overflow-hidden transition-colors duration-200 {openIndex === i ? 'border-white/10' : ''}">
					<button
						onclick={() => toggle(i)}
						class="w-full px-5 py-4 text-left flex items-center justify-between gap-4 hover:bg-white/[0.02] transition-colors cursor-pointer"
						aria-expanded={openIndex === i}
					>
						<span class="text-[15px] font-medium text-gray-200">{faq.question}</span>
						<svg
							class="w-4 h-4 text-gray-600 flex-shrink-0 transition-transform duration-200 {openIndex === i ? 'rotate-180' : ''}"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
							stroke-width="2"
						>
							<path stroke-linecap="round" stroke-linejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
						</svg>
					</button>
					{#if openIndex === i}
						<div class="px-5 pb-4">
							<p class="text-sm text-gray-500 leading-relaxed">{faq.answer}</p>
						</div>
					{/if}
				</div>
			{/each}
		</div>
	</div>
</section>
