-- TaxiSchild live dispatch updates.
-- Run once in Supabase SQL Editor. Safe to run again.
-- This enables Postgres Changes subscriptions for the tables used by the app.

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'trips'
  ) then
    execute 'alter publication supabase_realtime add table public.trips';
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'vehicles'
  ) then
    execute 'alter publication supabase_realtime add table public.vehicles';
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'profiles'
  ) then
    execute 'alter publication supabase_realtime add table public.profiles';
  end if;
end $$;

-- Verification: expect three rows (trips, vehicles, profiles).
select schemaname, tablename
from pg_publication_tables
where pubname = 'supabase_realtime'
  and schemaname = 'public'
  and tablename in ('trips', 'vehicles', 'profiles')
order by tablename;
