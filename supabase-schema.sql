-- iPhone Guardian authenticated cloud progress. Run in Supabase SQL Editor.
create table if not exists public.guardian_progress (
 user_id uuid primary key references auth.users(id) on delete cascade,
 tasks jsonb not null default '{}'::jsonb,
 updated_at timestamptz not null default now()
);
alter table public.guardian_progress enable row level security;
revoke all on public.guardian_progress from anon;
grant select, insert, update on public.guardian_progress to authenticated;
drop policy if exists "Users can read own Guardian progress" on public.guardian_progress;
create policy "Users can read own Guardian progress" on public.guardian_progress for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists "Users can create own Guardian progress" on public.guardian_progress;
create policy "Users can create own Guardian progress" on public.guardian_progress for insert to authenticated with check ((select auth.uid()) = user_id);
drop policy if exists "Users can update own Guardian progress" on public.guardian_progress;
create policy "Users can update own Guardian progress" on public.guardian_progress for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
