-- TaxiSchild Supabase Auth onboarding and driver invitation flow
-- Run after supabase_schema.sql and supabase_security_patch.sql.

create or replace function public.handle_new_admin_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  new_company_id uuid;
  invite_company_id uuid;
  invited_email text;
  invited_name text;
  invite_token text;
  requested_company_name text;
  requested_name text;
begin
  invite_token := nullif(trim(new.raw_user_meta_data ->> 'invite_token'), '');

  if invite_token is not null then
    select company_id, email, name
      into invite_company_id, invited_email, invited_name
      from public.driver_invites
     where token = invite_token
       and status = 'pending'
       and created_at > timezone('utc'::text, now()) - interval '30 days';

    if invite_company_id is null then
      raise exception 'Die Fahrereinladung ist ungültig oder abgelaufen';
    end if;
    if lower(invited_email) <> lower(new.email) then
      raise exception 'Die E-Mail-Adresse stimmt nicht mit der Einladung überein';
    end if;

    insert into public.profiles (id, company_id, name, email, role)
    values (
      new.id,
      invite_company_id,
      coalesce(nullif(trim(new.raw_user_meta_data ->> 'name'), ''), invited_name),
      new.email,
      'driver'
    );
    update public.driver_invites set status = 'accepted' where token = invite_token;
    return new;
  end if;

  requested_company_name := nullif(trim(new.raw_user_meta_data ->> 'company_name'), '');
  requested_name := nullif(trim(new.raw_user_meta_data ->> 'name'), '');
  if requested_company_name is null then requested_company_name := 'TaxiSchild Unternehmen'; end if;
  if requested_name is null then requested_name := coalesce(nullif(split_part(new.email, '@', 1), ''), 'Geschäftsführung'); end if;

  insert into public.companies (name)
  values (requested_company_name)
  returning id into new_company_id;

  insert into public.profiles (id, company_id, name, email, role)
  values (new.id, new_company_id, requested_name, new.email, 'admin');
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_taxischild on auth.users;
create trigger on_auth_user_created_taxischild
after insert on auth.users
for each row execute procedure public.handle_new_admin_user();

create or replace function public.get_driver_invite(invite_token text)
returns table (driver_name text, driver_email text, company_name text)
language sql
security definer
stable
set search_path = public
as $$
  select di.name, di.email, c.name
    from public.driver_invites di
    join public.companies c on c.id = di.company_id
   where di.token = invite_token
     and di.status = 'pending'
     and di.created_at > timezone('utc'::text, now()) - interval '30 days';
$$;

revoke all on function public.handle_new_admin_user() from public;
grant execute on function public.get_driver_invite(text) to anon, authenticated;
