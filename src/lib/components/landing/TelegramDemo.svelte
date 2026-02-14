<script lang="ts">
	interface Message {
		text: string;
		sender: 'user' | 'rachel';
		time: string;
	}

	const messages: Message[] = [
		{
			text: "What's on my calendar today?",
			sender: 'user',
			time: '9:15 AM'
		},
		{
			text: "You have 3 things today:\n\n10:00 AM -- Team standup\n1:00 PM -- Lunch with Sarah\n4:00 PM -- Dentist appointment\n\nYour morning is free until standup.",
			sender: 'rachel',
			time: '9:15 AM'
		},
		{
			text: 'Remind me to call the dentist tomorrow at 10am',
			sender: 'user',
			time: '9:16 AM'
		},
		{
			text: "Done! I'll remind you tomorrow (Wednesday) at 10:00 AM to call the dentist.",
			sender: 'rachel',
			time: '9:16 AM'
		},
		{
			text: 'What did we talk about last week?',
			sender: 'user',
			time: '9:17 AM'
		},
		{
			text: "Last week we covered:\n\n-- Your trip planning for Portland in March\n-- The new project proposal you were drafting\n-- Setting up weekly meal prep reminders\n\nWant me to pull up details on any of these?",
			sender: 'rachel',
			time: '9:17 AM'
		}
	];
</script>

<section id="demo" class="py-20 sm:py-24 bg-gray-950">
	<div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
		<h2 class="text-3xl sm:text-4xl font-bold text-center text-white mb-4">
			See Rachel in Action
		</h2>
		<p class="text-center text-gray-400 mb-12 max-w-2xl mx-auto">
			This is what chatting with your personal AI assistant looks like -- right in Telegram.
		</p>

		<div class="max-w-sm mx-auto">
			<!-- Chat window frame -->
			<div class="rounded-2xl shadow-2xl overflow-hidden border border-gray-700/50">
				<!-- Telegram-style header -->
				<div class="bg-[#242F3D] px-4 py-3 flex items-center gap-3">
					<div
						class="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-lg font-bold"
					>
						R
					</div>
					<div class="flex-1">
						<div class="font-semibold text-white text-sm">Rachel</div>
						<div class="text-xs text-blue-400 flex items-center gap-1">
							<span class="inline-block w-1.5 h-1.5 bg-blue-400 rounded-full"></span>
							online
						</div>
					</div>
					<!-- Header icons (decorative) -->
					<div class="flex items-center gap-3 text-gray-400">
						<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
							/>
						</svg>
						<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								d="M12 6.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5ZM12 12.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5ZM12 18.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5Z"
							/>
						</svg>
					</div>
				</div>

				<!-- Message area -->
				<div class="px-3 py-4 space-y-2 bg-[#0E1621] min-h-[360px]">
					{#each messages as msg}
						<div class="flex {msg.sender === 'user' ? 'justify-end' : 'justify-start'}">
							<div
								class="max-w-[80%] px-3 py-2 text-sm leading-relaxed {msg.sender === 'user'
									? 'bg-[#2B5278] text-white rounded-2xl rounded-br-sm'
									: 'bg-[#182533] text-gray-100 rounded-2xl rounded-bl-sm'}"
							>
								<p class="whitespace-pre-line">{msg.text}</p>
								<p
									class="text-[10px] mt-1 text-right {msg.sender === 'user'
										? 'text-blue-300/60'
										: 'text-gray-500'}"
								>
									{msg.time}
								</p>
							</div>
						</div>
					{/each}

					<!-- Typing indicator -->
					<div class="flex justify-start">
						<div class="bg-[#182533] rounded-2xl rounded-bl-sm px-4 py-3">
							<div class="flex items-center gap-1">
								<span class="typing-dot w-1.5 h-1.5 bg-gray-400 rounded-full"></span>
								<span class="typing-dot w-1.5 h-1.5 bg-gray-400 rounded-full delay-150"></span>
								<span class="typing-dot w-1.5 h-1.5 bg-gray-400 rounded-full delay-300"></span>
							</div>
						</div>
					</div>
				</div>

				<!-- Input bar (decorative) -->
				<div class="bg-[#17212B] px-3 py-2 flex items-center gap-2 border-t border-gray-700/30">
					<svg
						class="w-6 h-6 text-gray-500 flex-shrink-0"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
						stroke-width="1.5"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							d="M15.182 15.182a4.5 4.5 0 0 1-6.364 0M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0ZM9.75 9.75c0 .414-.168.75-.375.75S9 10.164 9 9.75 9.168 9 9.375 9s.375.336.375.75Zm-.375 0h.008v.015h-.008V9.75Zm5.625 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75Zm-.375 0h.008v.015h-.008V9.75Z"
						/>
					</svg>
					<div class="flex-1 bg-[#242F3D] rounded-full px-4 py-2 text-sm text-gray-500">
						Message
					</div>
					<svg
						class="w-6 h-6 text-gray-500 flex-shrink-0"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
						stroke-width="1.5"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							d="M12 18.75a6 6 0 0 0 6-6v-1.5m-6 7.5a6 6 0 0 1-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 0 1-3-3V4.5a3 3 0 1 1 6 0v8.25a3 3 0 0 1-3 3Z"
						/>
					</svg>
				</div>
			</div>
		</div>
	</div>
</section>

<style>
	@keyframes typing {
		0%,
		60%,
		100% {
			opacity: 0.3;
			transform: translateY(0);
		}
		30% {
			opacity: 1;
			transform: translateY(-2px);
		}
	}

	.typing-dot {
		animation: typing 1.4s ease-in-out infinite;
	}

	.delay-150 {
		animation-delay: 0.15s;
	}

	.delay-300 {
		animation-delay: 0.3s;
	}
</style>
