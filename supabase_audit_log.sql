-- TaxiSchild audit log foundation.
-- Run after supabase_security_patch.sql in the production Supabase SQL editor.

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  actor_id uuid references auth.users(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc'::text, now())
);

alter table public.audit_logs enable row level security;

create index if not exists audit_logs_company_created_at_idx
  on public.audit_logs (company_id, created_at desc);

create index if not exists audit_logs_company_entity_idx
  on public.audit_logs (company_id, entity_type, entity_id);

drop policy if exists "Admins can read company audit logs" on public.audit_logs;
create policy "Admins can read company audit logs"
  on public.audit_logs for select to authenticated
  using (public.is_company_admin() and company_id = public.current_user_company_id());

drop policy if exists "Members can append own audit logs" on public.audit_logs;
create policy "Members can append own audit logs"
  on public.audit_logs for insert to authenticated
  with check (actor_id = auth.uid() and company_id = public.current_user_company_id());
