-- Run this in the Supabase SQL editor AFTER `prisma migrate deploy`.
-- 1. Keep a public.users row in sync with auth.users.
-- 2. Enable RLS so the anon/authenticated API keys can only read/write own rows.

-- ── Sync trigger ──────────────────────────────────────
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public."User" (id, email, "createdAt", "updatedAt")
  values (new.id, new.email, now(), now())
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ── Row Level Security ────────────────────────────────
alter table public."User"         enable row level security;
alter table public."Collection"   enable row level security;
alter table public."Certificate"  enable row level security;
alter table public."RoyaltySplit" enable row level security;

create policy "own user row" on public."User"
  for all using (auth.uid() = id) with check (auth.uid() = id);

create policy "own collections" on public."Collection"
  for all using (auth.uid() = "ownerId") with check (auth.uid() = "ownerId");

-- Owners manage their certificates; anyone may read non-private ones.
create policy "own certificates" on public."Certificate"
  for all using (auth.uid() = "ownerId") with check (auth.uid() = "ownerId");

create policy "public certificates readable" on public."Certificate"
  for select using (privacy <> 'PRIVATE');

create policy "own royalty splits" on public."RoyaltySplit"
  for all using (
    exists (
      select 1 from public."Certificate" c
      where c.id = "certificateId" and c."ownerId" = auth.uid()
    )
  );

-- Storage bucket for artwork originals (optional; Pinata is primary).
insert into storage.buckets (id, name, public)
values ('artwork', 'artwork', false)
on conflict (id) do nothing;
