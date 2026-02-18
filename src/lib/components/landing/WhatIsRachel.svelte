<script lang="ts">
	import { t } from '$lib/i18n';
</script>

<section id="what-is-rachel" class="py-24 bg-[#0a0a0f] border-t border-white/5">
	<div class="max-w-4xl mx-auto px-6">
		<p class="text-sm font-medium text-[#0086EE] text-center mb-3 tracking-wide uppercase">{$t.whatIsRachel.label}</p>
		<h2 class="text-3xl sm:text-4xl lg:text-5xl font-bold text-center text-white mb-6 leading-tight">
			{$t.whatIsRachel.title}
		</h2>
		<p class="text-center text-gray-400 text-lg sm:text-xl mb-16 max-w-2xl mx-auto leading-relaxed">
			{$t.whatIsRachel.subtitle}
		</p>

		<!-- Key points -->
		<div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
			{#each $t.whatIsRachel.points as point, i}
				<div class="flex gap-4 p-5 rounded-2xl border border-white/5 bg-white/[0.02]">
					<div class="text-3xl flex-shrink-0">{point.icon}</div>
					<div>
						<h3 class="text-white font-semibold mb-1">{point.title}</h3>
						<p class="text-gray-500 text-sm leading-relaxed">{point.description}</p>
					</div>
				</div>
			{/each}
		</div>

		<!-- Bottom CTA -->
		<div class="text-center">
			<p class="text-gray-500 text-sm mb-6">{$t.whatIsRachel.bottomText}</p>
			<a
				href="/login"
				class="inline-flex px-8 py-3.5 rounded-xl font-medium text-white bg-[#0086EE] hover:bg-[#1a94f0] transition-all duration-300 shadow-lg shadow-[#0086EE]/25 hover:shadow-[#0086EE]/40"
			>
				{$t.whatIsRachel.cta}
			</a>
		</div>
	</div>
</section>
