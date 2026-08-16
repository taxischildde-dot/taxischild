-- TaxiSchild Supabase security hardening
-- Run this after supabase_schema.sql in the Supabase SQL Editor.

create or replace function public.current_user_company_id()
returns uuid
language sql
security definer
stable
set search_path = public
as $$
  select company_id from public.profiles where id = auth.uid();
$$;

create or replace function public.is_company_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

revoke all on function public.current_user_company_id() from public;
grant execute on function public.current_user_company_id() to authenticated;
revoke all on function public.is_company_admin() from public;
grant execute on function public.is_company_admin() to authenticated;

-- Companies: members can view only their own tenant.
drop policy if exists "Users can view their own company" on public.companies;
create policy "Members can view their own company"
  on public.companies for select to authenticated
  using (id = public.current_user_company_id());

-- Profiles: users can read colleagues in their tenant; only admins can manage membership.
drop policy if exists "Users can view profiles in their company" on public.profiles;
drop policy if exists "Admins can insert profiles in their company" on public.profiles;
create policy "Members can view profiles in their company"
  on public.profiles for select to authenticated
  using (company_id = public.current_user_company_id());
create policy "Admins can insert profiles in their company"
  on public.profiles for insert to authenticated
  with check (public.is_company_admin() and company_id = public.current_user_company_id());
create policy "Admins can update profiles in their company"
  on public.profiles for update to authenticated
  using (public.is_company_admin() and company_id = public.current_user_company_id())
  with check (company_id = public.current_user_company_id());
create policy "Admins can delete profiles in their company"
  on public.profiles for delete to authenticated
  using (public.is_company_admin() and company_id = public.current_user_company_id());

-- Driver invites: only company admins can read or manage invites.
alter table public.driver_invites enable row level security;
drop policy if exists "Admins can manage company invites" on public.driver_invites;
create policy "Admins can manage company invites"
  on public.driver_invites for all to authenticated
  using (public.is_company_admin() and company_id = public.current_user_company_id())
  with check (public.is_company_admin() and company_id = public.current_user_company_id());

-- Vehicles: all members may view company vehicles; only admins may change them.
drop policy if exists "Users can view and manage company vehicles" on public.vehicles;
create policy "Members can view company vehicles"
  on public.vehicles for select to authenticated
  using (company_id = public.current_user_company_id());
create policy "Admins can manage company vehicles"
  on public.vehicles for all to authenticated
  using (public.is_company_admin() and company_id = public.current_user_company_id())
  with check (public.is_company_admin() and company_id = public.current_user_company_id());

-- Trips: admins see all company trips; drivers see only their assigned trips.
drop policy if exists "Users can view and manage company trips" on public.trips;
create policy "Admins can view company trips"
  on public.trips for select to authenticated
  using (public.is_company_admin() and company_id = public.current_user_company_id());
create policy "Drivers can view assigned trips"
  on public.trips for select to authenticated
  using (driver_id = auth.uid() and company_id = public.current_user_company_id());
create policy "Admins can manage company trips"
  on public.trips for all to authenticated
  using (public.is_company_admin() and company_id = public.current_user_company_id())
  with check (public.is_company_admin() and company_id = public.current_user_company_id());
create policy "Drivers can create phone trips"
  on public.trips for insert to authenticated
  with check (
    driver_id = auth.uid()
    and created_by = auth.uid()
    and entry_source = 'driver_phone'
    and company_id = public.current_user_company_id()
  );
create policy "Drivers can update assigned trips"
  on public.trips for update to authenticated
  using (driver_id = auth.uid() and company_id = public.current_user_company_id())
  with check (driver_id = auth.uid() and company_id = public.current_user_company_id());

-- Daily logs: admins manage company logs; drivers manage only their own logs.
drop policy if exists "Users can view and manage company daily logs" on public.daily_logs;
create policy "Admins can manage company daily logs"
  on public.daily_logs for all to authenticated
  using (public.is_company_admin() and company_id = public.current_user_company_id())
  with check (public.is_company_admin() and company_id = public.current_user_company_id());
create policy "Drivers can view own daily logs"
  on public.daily_logs for select to authenticated
  using (driver_id = auth.uid() and company_id = public.current_user_company_id());
create policy "Drivers can insert own daily logs"
  on public.daily_logs for insert to authenticated
  with check (driver_id = auth.uid() and company_id = public.current_user_company_id());
create policy "Drivers can update own daily logs"
  on public.daily_logs for update to authenticated
  using (driver_id = auth.uid() and company_id = public.current_user_company_id())
  with check (driver_id = auth.uid() and company_id = public.current_user_company_id());

-- Helpful indexes for tenant-scoped queries.
create index if not exists profiles_company_id_idx on public.profiles(company_id);
create index if not exists trips_company_id_idx on public.trips(company_id);
create index if not exists trips_driver_id_idx on public.trips(driver_id);
create index if not exists daily_logs_company_driver_date_idx on public.daily_logs(company_id, driver_id, date);
