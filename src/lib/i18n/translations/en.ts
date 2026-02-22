import type { Translations } from '../index';

const en: Translations = {
	whatIsRachel: {
		label: 'What is Rachel',
		title: 'An AI agent that controls a full computer in the cloud. For you.',
		subtitle: 'Rachel isn\u2019t a chatbot. She\u2019s an AI with full access to a dedicated server \u2014 she browses the web, creates files, manages data, and works for your business around the clock.',
		points: [
			{
				icon: '\uD83D\uDCBB',
				title: 'A real computer in the cloud',
				description: 'Rachel has full control of a dedicated server just for you. She can build websites, generate documents, analyze data \u2014 anything you\u2019d do on a computer, she does for you.'
			},
			{
				icon: '\uD83D\uDD0D',
				title: 'Find clients & contacts',
				description: 'Search for suppliers, analyze competitors, extract contacts from WhatsApp groups, find leads online \u2014 and get everything delivered straight to your Telegram.'
			},
			{
				icon: '\uD83D\uDCC8',
				title: 'Marketing & communication',
				description: 'Build landing pages, write follow-up emails, create social media posts, prepare presentations \u2014 all with a simple message.'
			},
			{
				icon: '\uD83D\uDCB0',
				title: 'Consulting & analysis',
				description: 'Analyze financial documents, compare offers, prepare reports, research markets \u2014 like having a consultant available 24/7.'
			}
		],
		bottomText: 'You talk to Rachel on Telegram. She does the heavy lifting on her cloud computer.',
		cta: 'Try it now \u2014 $20/mo'
	},
	hero: {
		badge: 'Your personal AI that works for you 24/7',
		h1Line1: 'Run your business',
		h1Line2: 'like a superhuman',
		subtitle:
			'Rachel is an AI assistant on Telegram that builds landing pages, tracks your leads, manages contacts, schedules reminders, creates documents, and handles research — so you can focus on closing deals.',
		cta1: 'Start for $20/mo',
		cta2: 'See how it works',
		subtext: 'Open source \u00B7 You own your data \u00B7 Cancel anytime'
	},

	howItWorks: {
		label: 'How it works',
		title: 'Ready in minutes. No tech skills needed.',
		step1: {
			title: 'Message Rachel on Telegram',
			description:
				'Open Telegram and send /start to @RachelAIBot. No downloads, no installs, no complicated setup.'
		},
		step2: {
			title: 'Subscribe for $20/mo',
			description:
				'Pick your plan and pay securely. Your personal Rachel instance spins up automatically in under 30 seconds.'
		},
		step3: {
			title: 'Start giving orders',
			description:
				"Tell Rachel what you need. Build a landing page, find leads, set reminders — she's ready to work for you 24/7."
		}
	},

	features: {
		label: 'What Rachel can do for you',
		title: 'Like hiring a full-time assistant for $20/mo',
		subtitle:
			'Rachel handles the work that eats up your day, so you can spend your time where it actually matters.',
		feature1: {
			title: 'Your personal CRM, built-in',
			description:
				'Import contacts from WhatsApp groups, enrich them by sending a LinkedIn screenshot or business card photo, and Rachel organizes everything. Search, filter, track relationships \u2014 no app to learn.'
		},
		feature2: {
			title: 'Smart follow-ups that never slip',
			description:
				'"Remind me to call Marco next Tuesday." Rachel doesn\u2019t just remind you \u2014 she briefs you: who Marco is, what you discussed, and suggests what to say. Zero context lost.'
		},
		feature3: {
			title: 'Build landing pages & collect leads',
			description:
				'Tell Rachel to create a web page for your offer. She builds it, tracks who fills in forms, and sends you the leads as Excel or CSV right on Telegram.'
		},
		feature4: {
			title: 'Documents, presentations & reports',
			description:
				'Need a proposal? A report? A pitch deck? Just describe what you need and Rachel generates it on the spot. Ready to send.'
		},
		feature5: {
			title: 'Research anything, instantly',
			description:
				'"Find me the best suppliers for packaging in Northern Italy." Rachel searches, compares, and gives you a summary \u2014 in minutes, not hours.'
		},
		feature6: {
			title: 'Social media content that isn\u2019t slop',
			description:
				'Rachel researches what\u2019s trending in your niche, combines it with your real experiences, and writes posts in your voice for LinkedIn, X, and Threads. She even coaches you to capture photos at events for killer content.'
		}
	},

	telegramDemo: {
		label: 'See it in action',
		title: 'Just open Telegram and ask',
		subtitle:
			'This is what running your business with Rachel actually looks like. No apps to learn. No dashboards. Just chat.',
		online: 'online',
		inputPlaceholder: 'Message',
		messages: {
			user1: 'How many people signed up on my landing page today?',
			rachel1:
				"You got 7 new signups today! Here's the breakdown:\n\n1. Marco Rossi \u2014 +39 342 881 2201\n2. Elena Bianchi \u2014 +39 331 554 6678\n3. Fabio Conti \u2014 +39 349 227 3345\n4. Sara De Luca \u2014 +39 320 991 4412\n5. Luca Moretti \u2014 +39 338 765 0093\n6. Anna Ferrari \u2014 +39 347 112 8856\n7. Giulia Greco \u2014 +39 333 448 7721\n\nWant me to send you the full list as an Excel file?",
			user2:
				'Yes, send the Excel. And remind me to call Marco Rossi tomorrow at 9am \u2014 he looks like a hot lead.',
			rachel2:
				"Done! Here's your file: signups_2026-02-14.xlsx\n\nReminder set: Call Marco Rossi \u2014 tomorrow (Saturday) at 9:00 AM.\n\nBy the way, Marco visited your page 3 times before signing up. Definitely interested.",
			user3:
				'Draft a follow-up email for all 7 signups. Professional but friendly, mention our free consultation offer.',
			rachel3:
				"Here's your draft:\n\nSubject: Thanks for your interest \u2014 let's chat!\n\nHi [Name],\n\nThanks for signing up! I'd love to offer you a free 15-minute consultation to see how we can help your business.\n\nJust reply to this email with a time that works for you, or pick a slot here: [your calendar link]\n\nLooking forward to it!\n\nWant me to adjust the tone or add anything?"
		}
	},

	whatsappDemo: {
		label: 'WhatsApp + CRM',
		title: 'From WhatsApp group to organized CRM in seconds',
		subtitle:
			'Import contacts from groups, enrich them with screenshots, track follow-ups \u2014 all from Telegram. Built for networkers.',
		online: 'online',
		inputPlaceholder: 'Message',
		messages: {
			user1: 'Add all contacts from the WhatsApp group "Turin Entrepreneurs Network" to my CRM',
			rachel1:
				'Done! Imported 47 contacts from Turin Entrepreneurs Network.\n\n\u2022 38 new contacts created\n\u2022 9 merged with existing (matched by phone)\n\u2022 3 group admins tagged\n\nAll tagged as #turin-entrepreneurs. Want me to find the ones without full names so you can enrich them?',
			user2: '[screenshot of a LinkedIn profile]\nThis is Marco Ferretti from that group',
			rachel2:
				'Got it! Updated Marco Ferretti in your CRM:\n\n\u2022 Role: Sales Director @ Piemonte Digital\n\u2022 Location: Turin, Italy\n\u2022 Education: Politecnico di Torino\n\u2022 LinkedIn linked\n\nWant me to schedule a follow-up or draft an outreach message?',
		}
	},

	socialMediaDemo: {
		label: 'Social Media + CRM',
		title: 'She writes your posts. You close deals.',
		subtitle:
			'Rachel researches what\u2019s trending in your niche, combines it with your real experience, and writes posts in your voice. She even coaches you to capture content-worthy moments.',
		online: 'online',
		inputPlaceholder: 'Message',
		messages: {
			user1: 'It\u2019s Monday, any content ideas for this week?',
			rachel1:
				'I found 3 angles for you this week:\n\n1. \uD83D\uDD25 AI agents are trending on LinkedIn \u2014 I\u2019d combine that with how you imported 200 contacts from a WhatsApp group last week. Angle: "Everyone builds AI agents. I use mine to do boring stuff in 10 seconds."\n\n2. A study says 80% of deals die from bad follow-ups \u2014 perfect match with your CRM workflow. Angle: "I never forget a follow-up. Here\u2019s my system."\n\n3. You\u2019re meeting 4 new people at TechCrunch Turin on Thursday \u2014 a "lessons from networking events" post always performs well.\n\nWhich ones do you like? I\u2019ll write full drafts for LinkedIn, X, and Threads.',
			rachel1b:
				'\uD83D\uDCF8 By the way \u2014 at TechCrunch Thursday, snap a photo at the venue or with a speaker. A real photo + your take on the event = your best-performing post this month. I\u2019ll have a draft ready when you send it.',
			user2: 'Love #1 and #3. Write the drafts, and yeah I\u2019ll grab a photo Thursday',
			rachel2:
				'Here\u2019s your LinkedIn draft for #1:\n\n"Everyone\u2019s talking about AI agents this week.\n\nMeanwhile, I imported 200 contacts from a WhatsApp group in 10 seconds. No code. No API. Just a message to my assistant.\n\nSometimes the best AI isn\u2019t the flashiest \u2014 it\u2019s the one that saves you 3 hours on a Tuesday."\n\nI also wrote the X thread and Threads versions. Want to see them, or post this one as-is?'
		}
	},

	pricing: {
		label: 'Pricing',
		title: 'Less than a coffee a day. Pays for itself in week one.',
		subtitle:
			'Think about how many hours you spend on admin, research, and follow-ups. Rachel gives you those hours back.',
		planBadge: 'Everything included',
		planName: 'Rachel Cloud',
		price: '$20',
		priceUnit: '/month',
		features: [
			'Your own AI assistant on Telegram \u2014 available 24/7',
			'Built-in CRM \u2014 import from WhatsApp, enrich with screenshots',
			'Smart follow-ups with full context \u2014 never lose track',
			'Social media ghostwriter \u2014 LinkedIn, X, Threads in your voice',
			'Build landing pages, track leads, export data',
			'Documents, research, translations \u2014 on demand',
			'Dedicated private server \u2014 your data stays yours',
			'Cancel anytime \u2014 no contracts, no tricks'
		],
		cta: 'Start now \u2014 $20/mo',
		subtext:
			'Everything included \u00B7 No hidden fees \u00B7 Pays for itself in hours saved',
	},

	openSource: {
		label: 'Transparent & trustworthy',
		title: 'Open source. You own everything.',
		paragraph1:
			"Rachel's code is 100% open source. Your data lives on your own private server \u2014 we never see it, we never sell it, we never touch it.",
		paragraph2:
			"Want to host it yourself? Go ahead \u2014 it's free. Want us to handle everything? That's Rachel Cloud for $20/mo.",
		starButton: 'Star',
		githubButton: 'View on GitHub'
	},

	faq: {
		label: 'FAQ',
		title: "Got questions? We've got answers.",
		items: [
			{
				question: 'Do I need to be technical to use Rachel?',
				answer:
					'Not at all. If you can send a text message, you can use Rachel. Everything happens through Telegram \u2014 just type what you need in plain language. No coding, no dashboards, no training required.'
			},
			{
				question: 'What exactly can Rachel do for my business?',
				answer:
					'Rachel has a built-in CRM: import contacts from WhatsApp groups, enrich them by sending a LinkedIn screenshot or business card photo, and track follow-ups with smart reminders that brief you with full context. She also builds landing pages, generates documents, researches suppliers, translates messages, drafts emails and social posts \u2014 and much more. Think of her as a personal assistant who never sleeps.'
			},
			{
				question: 'How does the landing page and lead tracking work?',
				answer:
					'Just tell Rachel what kind of page you need \u2014 she builds it and publishes it. When someone fills in a form, Rachel captures the data and notifies you. You can ask her anytime for a summary or export the full list as an Excel or CSV file, delivered right to your Telegram.'
			},
			{
				question: 'What do I need to get started?',
				answer:
					"Just a Telegram account. Open Telegram, message @RachelAIBot, subscribe, and you're ready to go. Rachel Cloud handles the server, the setup, and the monitoring."
			},
			{
				question: 'Is my data safe?',
				answer:
					'Yes. Rachel runs on your own private server \u2014 not shared with anyone else. Your conversations, contacts, and business data stay on your server. Rachel is also fully open source, so anyone can verify exactly what the software does. We never see or access your data.'
			},
			{
				question: 'Can I cancel anytime?',
				answer:
					'Absolutely. No contracts, no cancellation fees, no lock-in. Cancel whenever you want with one click.'
			},
		]
	},

	footer: {
		brandName: 'Rachel',
		tagline: 'Your personal AI that works for you 24/7',
		navGetStarted: 'Get Started',
		navLogin: 'Login',
		navGitHub: 'GitHub',
		copyright: 'Rachel Cloud \u00B7 Open source \u00B7 You own your data'
	}
};

export default en;
