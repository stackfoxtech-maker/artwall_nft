-- Artwall 3.0 lives in a dedicated `artwall` Postgres schema. Table DDL is
-- managed by Prisma (prisma/migrations/). This file records the extras Prisma
-- does not manage. Everything here has ALREADY been applied to project
-- cfyesjrdhyxrjbrffajn — re-run only if you recreate the schema.

-- 1. Keep artwall."User" in sync with auth.users  (migration: artwall_init)
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

-- 2. RLS policies  (migration: artwall_rls_policies_and_constraints)
-- RLS is auto-enabled on new tables in this project. The app reaches Postgres
-- as a superuser via Prisma and bypasses RLS, so these are defense in depth for
-- any future PostgREST exposure.
--   artwall."User"         own_rows      : authenticated, auth.uid() = id
--   artwall."Collection"   own_rows      : authenticated, auth.uid() = "ownerId"
--   artwall."Certificate"  own_rows      : authenticated, auth.uid() = "ownerId"
--   artwall."Certificate"  public_read   : anon+authenticated, privacy <> 'PRIVATE'
--   artwall."RoyaltySplit" own_rows      : authenticated, via parent Certificate

-- 3. Check constraints  (migration: artwall_rls_policies_and_constraints)
--   RoyaltySplit.royalty_bps_range   : "basisPoints" between 0 and 10000
--   Certificate.chain_id_positive    : "chainId" is null or > 0

-- 4. Shared-project auth patch  (migration: harden_public_handle_new_user_for_shared_auth)
-- This project's OTHER app (exam-prep) also has an on_auth_users trigger,
-- public.handle_new_user, that inserts into public."User" (email + name both
-- NOT NULL). Artwall wallet/phone signups have no email, which made that
-- trigger throw -> "Database error saving new user". Both trigger functions are
-- now wrapped in `BEGIN ... EXCEPTION WHEN OTHERS THEN RAISE WARNING; END` so a
-- failure in one never aborts the auth.users insert, and public.handle_new_user
-- got a non-null `name` fallback. Verified: an emailless signup creates only an
-- artwall."User" row, no exam-app rows.
-- NOTE: email signups still create (harmless) rows in the exam app's tables.
-- The real fix is a dedicated Supabase project for Artwall.

-- 5. NOT YET APPLIED — see supabase/least-privilege.sql for the dedicated
--    application DB role. Run that, then repoint DATABASE_URL / DIRECT_URL.
