# Phase 2 Context: Billing & Onboarding

## Decisions (LOCKED — do not revisit)

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Payment provider | Polar (NOT Stripe) | Non-negotiable per Lorenzo |
| Language | TypeScript (strict) | Non-negotiable |
| Runtime | Bun | Non-negotiable |
| Database | SQLite via Drizzle ORM (bun:sqlite) | Non-negotiable |
| ORM | Drizzle ORM | Consistent with Phase 1 |
| Frontend | SvelteKit | Consistent with Phase 1 |
| Pricing | Single plan: $20/month | No tiers, keep simple |
| Telegram setup | User creates own bot via BotFather, pastes token | No shared bot |
| Auth | Better Auth (from Phase 1) | Already implemented |

## Claude's Discretion

- Polar integration approach (SDK vs API)
- Onboarding flow UI/UX design
- Telegram bot token validation implementation details
- Webhook handling patterns
- Email notification method for payment failures

## Deferred Ideas

- Multiple pricing tiers
- Annual billing discount
- Team/org subscriptions
- Usage-based billing
- Coupon/promo codes
