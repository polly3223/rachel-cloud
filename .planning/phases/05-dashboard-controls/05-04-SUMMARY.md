---
phase: 05-dashboard-controls
plan: 04
subsystem: ui
tags: [svelte, drizzle, admin, dashboard, tailwind]

# Dependency graph
requires:
  - phase: 05-01
    provides: Admin route group, layout, guard, hooks middleware
  - phase: 05-02
    provides: VPS status checking utilities
provides:
  - Admin data aggregation layer (getAdminOverview)
  - Admin dashboard overview page with revenue, costs, users table
affects: [05-dashboard-controls]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Admin data aggregation with single LEFT JOIN query"
    - "Responsive table/card layout for admin pages"

key-files:
  created:
    - src/lib/admin/data.ts
  modified:
    - src/routes/(admin)/admin/+page.server.ts
    - src/routes/(admin)/admin/+page.svelte

key-decisions:
  - "All metrics computed from DB, no Hetzner API calls for dashboard load speed"
  - "MRR = $20 * active subscribers, cost = EUR 3.49 * running VPSs"
  - "Profit margin color-coded: green >60%, yellow 40-60%, red <40%"
  - "Mobile-responsive with card layout on small screens, table on desktop"

patterns-established:
  - "AdminOverview pattern: single query + in-memory aggregation for dashboard metrics"
  - "Status badge pattern: color-coded rounded-full badges for subscription and VPS states"

# Metrics
duration: 2min
completed: 2026-02-14
---

# Phase 5 Plan 04: Admin Dashboard Overview Summary

**Admin dashboard with MRR/cost overview cards, profit margin tracking, subscriber breakdown, and full users table with subscription and VPS status badges**

## Performance

- **Duration:** 2 min
- **Started:** 2026-02-14T10:41:02Z
- **Completed:** 2026-02-14T10:43:12Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments
- Data aggregation layer querying all users with subscription data via single LEFT JOIN
- 4 overview stat cards (Total Users, Monthly Revenue, Running VPSs, Est. Monthly Cost)
- Revenue & Costs summary with profit margin percentage and subscriber breakdown badges
- Full users table with email, subscription status, VPS status, IP, provisioned date, member since
- Mobile-responsive layout switching between table and card views

## Task Commits

Each task was committed atomically:

1. **Task 1: Create admin data aggregation functions** - `16cd1e4f` (feat)
2. **Task 2: Build admin dashboard overview page** - `1303bfd6` (feat)

## Files Created/Modified
- `src/lib/admin/data.ts` - AdminUser/AdminOverview types and getAdminOverview() function with LEFT JOIN query and metric aggregation
- `src/routes/(admin)/admin/+page.server.ts` - Updated load function to call getAdminOverview() and return overview data
- `src/routes/(admin)/admin/+page.svelte` - Full dashboard page with overview cards, revenue/costs summary, and users table

## Decisions Made
- All data from local DB only (no Hetzner API calls) to keep dashboard load fast and avoid rate limits
- Revenue calculated as $20 per active subscriber, costs as EUR 3.49 per running VPS
- Profit margin color thresholds: green (>60%), yellow (40-60%), red (<40%)
- Responsive design: full table on desktop (md+), card layout on mobile
- Used indigo/purple accent for VPS card, green for revenue, orange for costs (consistent with admin layout theme)

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Admin dashboard overview is complete with all requested metrics and user data
- Ready for additional admin features (users detail pages, infrastructure management) if planned

---
*Phase: 05-dashboard-controls*
*Completed: 2026-02-14*
