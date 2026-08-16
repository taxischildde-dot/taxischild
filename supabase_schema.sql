-- TaxiSchild Production Supabase Schema & Security (PostgreSQL)

create extension if not exists "uuid-ossp";

-- Companies (Tenants)
create table if not exists public.companies (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  address text,
  phone text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Users / Profiles (Admins and Drivers bound to a company)
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  company_id uuid references public.companies(id) on delete cascade not null,
  name text not null,
  email text not null unique,
  role text not null check (role in ('admin', 'driver')),
  driver_number text,
  license_type text,
  working_days text[],
  availability_status text default 'available' check (availability_status in ('available', 'break', 'sick', 'leave', 'holiday')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Driver Invites
create table if not exists public.driver_invites (
  id uuid default uuid_generate_v4() primary key,
  company_id uuid references public.companies(id) on delete cascade not null,
  email text not null,
  name text not null,
  token text not null unique,
  status text default 'pending' check (status in ('pending', 'accepted', 'expired')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Vehicles
create table if not exists public.vehicles (
  id uuid default uuid_generate_v4() primary key,
  company_id uuid references public.companies(id) on delete cascade not null,
  plate_number text not null,
  model text not null,
  status text not null check (status in ('active', 'maintenance', 'out_of_service')),
  assigned_driver_ids text[] default '{}',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Trips
create table if not exists public.trips (
  id uuid default uuid_generate_v4() primary key,
  company_id uuid references public.companies(id) on delete cascade not null,
  customer_name text not null,
  customer_phone text,
  pickup_address text not null,
  destination_address text not null,
  scheduled_at timestamp with time zone not null,
  due_at timestamp with time zone,
  destination_code text,
  price numeric(10, 2),
  currency text default 'EUR' not null,
  status text not null check (status in ('planned', 'ongoing', 'completed', 'cancelled')),
  payment_method text not null check (payment_method in ('cash', 'card', 'invoice', 'krankenkasse', 'gemeinde', 'schulfahrt', 'sozialamt')),
  entry_source text not null check (entry_source in ('central', 'driver_phone')),
  driver_id uuid references public.profiles(id) on delete set null,
  created_by uuid references public.profiles(id) on delete set null,
  cancellation_reason text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Daily Logs (Odometer & Work Hours)
create table if not exists public.daily_logs (
  id uuid default uuid_generate_v4() primary key,
  company_id uuid references public.companies(id) on delete cascade not null,
  driver_id uuid references public.profiles(id) on delete cascade not null,
  date date not null,
  odometer_start numeric(10, 1),
  odometer_end numeric(10, 1),
  work_start text,
  work_end text,
  break_minutes integer default 0,
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique (company_id, driver_id, date)
);

-- Enable Row Level Security (RLS) on all tables
alter table public.companies enable row level security;
alter table public.profiles enable row level security;
alter table public.driver_invites enable row level security;
alter table public.vehicles enable row level security;
alter table public.trips enable row level security;
alter table public.daily_logs enable row level security;

-- RLS Policies (Tenant Isolation)
create policy "Users can view their own company"
  on public.companies for select
  using (id in (select company_id from public.profiles where id = auth.uid()));

create policy "Users can view profiles in their company"
  on public.profiles for select
  using (company_id in (select company_id from public.profiles where id = auth.uid()));

create policy "Admins can insert profiles in their company"
  on public.profiles for insert
  with check (company_id in (select company_id from public.profiles where id = auth.uid() and role = 'admin'));

create policy "Users can view and manage company vehicles"
  on public.vehicles for all
  using (company_id in (select company_id from public.profiles where id = auth.uid()));

create policy "Users can view and manage company trips"
  on public.trips for all
  using (company_id in (select company_id from public.profiles where id = auth.uid()));

create policy "Users can view and manage company daily logs"
  on public.daily_logs for all
  using (company_id in (select company_id from public.profiles where id = auth.uid()));
