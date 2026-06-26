-- 0004_rls_hardening.sql
-- 1) Move role-check helpers out of the PostgREST-exposed `public` schema so they
--    are no longer callable as /rest/v1/rpc/* , while staying usable inside RLS.
-- 2) Rewrite every auth.uid()/is_staff() policy to (select …) form so the auth
--    expression is evaluated once per query, not once per row.
-- 3) Collapse the duplicate "admin ALL" + "own row" permissive policies into a
--    single SELECT/INSERT/UPDATE/DELETE policy per table.

create schema if not exists private;
grant usage on schema private to anon, authenticated;

-- Helpers (same bodies/role literals as the public versions they replace).
create or replace function private.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
$$;

create or replace function private.is_staff()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role in ('admin','director'))
$$;

grant execute on function private.is_admin() to anon, authenticated;
grant execute on function private.is_staff() to anon, authenticated;

-- ---- orders ----
drop policy if exists admin_all_orders     on public.orders;
drop policy if exists user_read_own_orders on public.orders;
drop policy if exists orders_insert_own    on public.orders;

create policy orders_select on public.orders for select to authenticated
  using ((select auth.uid()) = user_id or (select private.is_staff()));
create policy orders_insert on public.orders for insert to authenticated
  with check ((select auth.uid()) = user_id or (select private.is_staff()));
create policy orders_update_staff on public.orders for update to authenticated
  using ((select private.is_staff())) with check ((select private.is_staff()));
create policy orders_delete_staff on public.orders for delete to authenticated
  using ((select private.is_staff()));

-- ---- profiles ----
drop policy if exists admin_read_all_profiles on public.profiles;
drop policy if exists user_read_own_profile   on public.profiles;
drop policy if exists user_update_own_profile  on public.profiles;

create policy profiles_select on public.profiles for select to authenticated
  using ((select auth.uid()) = id or (select private.is_staff()));
create policy profiles_update_own on public.profiles for update to authenticated
  using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

-- ---- promo_codes (staff-only admin policy; switch to private helper) ----
drop policy if exists admin_all_promos on public.promo_codes;
create policy admin_all_promos on public.promo_codes for all to authenticated
  using ((select private.is_staff())) with check ((select private.is_staff()));

-- ---- reviews (anon may read published; staff may write) ----
drop policy if exists reviews_public_read on public.reviews;
drop policy if exists reviews_staff_all   on public.reviews;

create policy reviews_select on public.reviews for select to anon, authenticated
  using (is_published or (select private.is_staff()));
create policy reviews_insert_staff on public.reviews for insert to authenticated
  with check ((select private.is_staff()));
create policy reviews_update_staff on public.reviews for update to authenticated
  using ((select private.is_staff())) with check ((select private.is_staff()));
create policy reviews_delete_staff on public.reviews for delete to authenticated
  using ((select private.is_staff()));

-- Drop the now-unused public helpers (RLS no longer references them).
drop function if exists public.is_admin();
drop function if exists public.is_staff();
