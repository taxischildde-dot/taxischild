-- TaxiSchild production performance indexes.
-- Safe to run more than once in the Supabase SQL editor.

create index if not exists idx_profiles_company_id
  on public.profiles (company_id);

create index if not exists idx_driver_invites_company_status
  on public.driver_invites (company_id, status, created_at desc);

create index if not exists idx_vehicles_company_id
  on public.vehicles (company_id);

create index if not exists idx_trips_company_scheduled_at
  on public.trips (company_id, scheduled_at desc);

create index if not exists idx_trips_company_driver_scheduled_at
  on public.trips (company_id, driver_id, scheduled_at desc);

create index if not exists idx_daily_logs_company_driver_date
  on public.daily_logs (company_id, driver_id, date desc);
