<script lang="ts">
	import { t } from '$lib/i18n';
</script>

<section class="py-24 bg-[#0a0a0f] border-t border-white/5">
	<div class="max-w-5xl mx-auto px-6">
		<p class="text-sm font-medium text-blue-400 text-center mb-3 tracking-wide uppercase">{$t.features.label}</p>
		<h2 class="text-3xl sm:text-4xl font-bold text-center text-white mb-4">
			{$t.features.title}
		</h2>
		<p class="text-center text-gray-500 mb-16 max-w-lg mx-auto">
			{$t.features.subtitle}
		</p>

		<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
			<div class="group rounded-2xl border border-white/5 bg-white/[0.02] p-6 hover:border-violet-500/30 hover:bg-violet-500/[0.03] transition-all duration-300">
				<div class="text-2xl mb-4">🌐</div>
				<h3 class="text-base font-semibold text-white mb-2">{$t.features.feature1.title}</h3>
				<p class="text-gray-500 text-sm leading-relaxed">{$t.features.feature1.description}</p>
			</div>

			<div class="group rounded-2xl border border-white/5 bg-white/[0.02] p-6 hover:border-blue-500/30 hover:bg-blue-500/[0.03] transition-all duration-300">
				<div class="text-2xl mb-4">📇</div>
				<h3 class="text-base font-semibold text-white mb-2">{$t.features.feature2.title}</h3>
				<p class="text-gray-500 text-sm leading-relaxed">{$t.features.feature2.description}</p>
			</div>

			<div class="group rounded-2xl border border-white/5 bg-white/[0.02] p-6 hover:border-cyan-500/30 hover:bg-cyan-500/[0.03] transition-all duration-300">
				<div class="text-2xl mb-4">📄</div>
				<h3 class="text-base font-semibold text-white mb-2">{$t.features.feature3.title}</h3>
				<p class="text-gray-500 text-sm leading-relaxed">{$t.features.feature3.description}</p>
			</div>

			<div class="group rounded-2xl border border-white/5 bg-white/[0.02] p-6 hover:border-emerald-500/30 hover:bg-emerald-500/[0.03] transition-all duration-300">
				<div class="text-2xl mb-4">🔔</div>
				<h3 class="text-base font-semibold text-white mb-2">{$t.features.feature4.title}</h3>
				<p class="text-gray-500 text-sm leading-relaxed">{$t.features.feature4.description}</p>
			</div>

			<div class="group rounded-2xl border border-white/5 bg-white/[0.02] p-6 hover:border-amber-500/30 hover:bg-amber-500/[0.03] transition-all duration-300">
				<div class="text-2xl mb-4">🔍</div>
				<h3 class="text-base font-semibold text-white mb-2">{$t.features.feature5.title}</h3>
				<p class="text-gray-500 text-sm leading-relaxed">{$t.features.feature5.description}</p>
			</div>

			<div class="group rounded-2xl border border-white/5 bg-white/[0.02] p-6 hover:border-rose-500/30 hover:bg-rose-500/[0.03] transition-all duration-300">
				<div class="text-2xl mb-4">🌍</div>
				<h3 class="text-base font-semibold text-white mb-2">{$t.features.feature6.title}</h3>
				<p class="text-gray-500 text-sm leading-relaxed">{$t.features.feature6.description}</p>
			</div>
		</div>
	</div>
</section>
