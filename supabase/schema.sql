-- Artwall 3.0 lives in a dedicated `artwall` Postgres schema so it can share a
-- Supabase project with other apps. The table DDL is managed by Prisma
-- (`prisma migrate` / `prisma db push`). This file holds the extras Prisma
-- does not manage: the auth→User sync trigger.
--
-- Already applied to project cfyesjrdhyxrjbrffajn via the Supabase connector
-- (migration `artwall_init`). Re-run only if you recreate the schema.
--
-- NOTE on RLS: the app talks to Postgres directly through Prisma using the
-- `postgres` role, which bypasses RLS. Access control is enforced in the API
-- routes (ownerId checks). If you later expose `artwall` tables through
-- PostgREST / the Supabase client, add RLS policies here first.

create or replace function artwall.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = artwall
as $$
begin
  insert into artwall."User" (id, email, "createdAt", "updatedAt")
  values (new.id, new.email, now(), now())
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_artwall on auth.users;
create trigger on_auth_user_created_artwall
  after insert on auth.users
  for each row execute function artwall.handle_new_user();
