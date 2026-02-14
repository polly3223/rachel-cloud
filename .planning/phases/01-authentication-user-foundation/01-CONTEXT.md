# Phase 1 Context: Authentication & User Foundation

## Decisions (LOCKED — do not revisit)

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Auth library | Better Auth | Non-negotiable per Lorenzo |
| Language | TypeScript (strict) | Non-negotiable |
| Runtime | Bun | Non-negotiable |
| Database | SQLite via Drizzle ORM (bun:sqlite) | Non-negotiable. No PostgreSQL. |
| ORM | Drizzle ORM | For both app data and Better Auth adapter |
| Payments | Polar (NOT Stripe) | Non-negotiable |
| Frontend | SvelteKit | Decided during discussion |
| Hosting | Same Hetzner VPS as Rachel (ubuntu-4gb-nbg1-2) | Rachel manages everything directly |
| Session storage | HTTP-only cookies | Standard Better Auth pattern |
| Token encryption | AES-256-GCM at application level | For Claude OAuth tokens |
| Claude OAuth | Full OAuth flow (not paste-API-key) | Uses Claude Code auth flow (OAuth 2.0 + PKCE) |

## Claude's Discretion

- Project structure / folder organization
- Rate limiting implementation details
- Error handling patterns
- Testing approach

## Deferred Ideas

- Team/org support
- Multiple pricing tiers
- Plugin marketplace
- Multi-LLM support
