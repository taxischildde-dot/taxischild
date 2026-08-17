# TaxiSchild Production Scale Runbook

## Current architecture

TaxiSchild is a stateless Vite/React application deployed on Vercel with Supabase Auth, PostgreSQL, Row Level Security, Realtime subscriptions, and a local cache used for fast offline-first rendering. New trips, vehicles, daily logs, and profile changes are written to the local cache and synchronized to Supabase; the booking and daily-log screens now wait for the cloud write before showing a successful completion state.

Driver sessions use scoped hydration: a driver loads only the driver profile, assigned trips, assigned daily logs, and company vehicles needed for the driver workspace. Employer sessions retain company-wide access because the employer dashboard and reports require it. A bounded cloud timeout and a German recovery boundary prevent a slow request or render exception from becoming an indefinite loading state or an unexplained white page.

## Domain migration

The canonical public URL is controlled by `VITE_PUBLIC_APP_URL`. During the pilot it should remain `https://taxischild.vercel.app`. When the company purchases a domain, add the production domain in Vercel under **Project Settings → Domains**, complete the DNS record shown by Vercel, and then set `VITE_PUBLIC_APP_URL` in the Vercel Production environment to the final HTTPS origin without a trailing slash.

After the domain is live, update Supabase **Authentication → URL Configuration**. The Site URL and every production redirect URL must use the final domain, including `/auth/callback`, `/login`, and `/invite/*` as appropriate. Then send one fresh registration confirmation and one fresh driver invitation before onboarding customers; old emails can contain the previous domain.

## Database hardening

Run `supabase_performance_indexes.sql` once in the Supabase SQL editor. Every statement is idempotent. These indexes target the tenant, driver, vehicle, invitation-status, scheduled-trip, and daily-log filters used by the application.

Before opening paid onboarding, verify that every public table has RLS enabled and that policies constrain reads and writes by `company_id` and, for drivers, by their own profile or assignment. Keep service-role credentials server-side only. Do not place a Postgres password, service-role key, or private Supabase key in Vite client variables.

Supabase backups, retention, and point-in-time recovery depend on the selected Supabase plan and must be checked in the project dashboard. A backup is not considered operationally verified until a small restoration drill has been completed in a separate project or environment.

## Availability and load plan

The present Vercel Autoscale deployment is appropriate for a stateless web client and can scale request handling, but it does not remove database limits or inefficient client queries. The next scale milestone is to move employer reports and long-range trip history to paginated or server-side aggregate queries rather than downloading an entire company history into the browser. Do this before a company has a large multi-year trip archive.

Realtime should be enabled only for the tables and events required by the driver workspace. Run `supabase_realtime_dispatch.sql` once to publish `trips`, `vehicles`, and `profiles`. The application retains a 30-second polling fallback when Realtime is unavailable. If polling or Realtime traffic becomes material, centralize notifications through a server-side event path instead of increasing the polling frequency.

Validate capacity in stages: first two pilot companies, then ten companies, then a controlled load test with representative concurrent admin and driver sessions. Measure login latency, dashboard hydration time, trip-save latency, Supabase error rate, Realtime delivery delay, browser memory usage, and Vercel response errors. Do not invite hundreds of companies until the largest pilot dataset passes the agreed thresholds.

## Operational checklist

| Area | Required before paid onboarding |
|---|---|
| Domain | Final HTTPS domain configured in Vercel, Supabase Site URL, and redirect allow-list |
| Auth | Email confirmation, driver invitation, password setup, password recovery, and revocation tested |
| Data isolation | Two companies tested with non-overlapping data and RLS policies verified in Supabase |
| Backups | Automated backup policy confirmed and a restoration drill recorded |
| Monitoring | Vercel runtime/error monitoring and Supabase logs reviewed on a regular schedule |
| Performance | Pilot load measurements recorded; employer report pagination planned before large archives |
| Support | Incident contact, data-export process, and customer onboarding checklist documented |

## Important limitation

No deployment can promise that a distributed system will never experience an outage. The production goal is controlled failure: bounded requests, safe recovery screens, cloud persistence with visible errors, isolated tenants, backups, monitoring, and a staged rollout that exposes capacity problems before they affect a large customer base.
