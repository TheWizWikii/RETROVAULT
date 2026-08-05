-- Ejecuta este archivo UNA VEZ en Supabase > SQL Editor.
-- Guarda un único documento JSON por usuario y activa políticas RLS estrictas.

create table if not exists public.user_app_state (
  user_id uuid primary key references auth.users(id) on delete cascade,
  payload jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.user_app_state enable row level security;

revoke all on table public.user_app_state from anon;
grant select, insert, update, delete on table public.user_app_state to authenticated;

drop policy if exists "users_select_own_state" on public.user_app_state;
create policy "users_select_own_state"
on public.user_app_state for select
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "users_insert_own_state" on public.user_app_state;
create policy "users_insert_own_state"
on public.user_app_state for insert
to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists "users_update_own_state" on public.user_app_state;
create policy "users_update_own_state"
on public.user_app_state for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "users_delete_own_state" on public.user_app_state;
create policy "users_delete_own_state"
on public.user_app_state for delete
to authenticated
using ((select auth.uid()) = user_id);
