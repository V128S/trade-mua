-- 0009_rate_limits.sql
-- IP-based rate limiting for auth and checkout paths.
-- Table is exclusively accessed via rate_limit_check() — no direct RLS policies.

create table if not exists public.rate_limits (
  ip          text        not null,
  path_group  text        not null,
  window_start timestamptz not null,
  count       int         not null default 1,
  primary key (ip, path_group, window_start)
);

alter table public.rate_limits enable row level security;
-- No SELECT/INSERT/UPDATE/DELETE policies: table is only reachable
-- through the SECURITY DEFINER function below.

-- Atomically increments the counter for (ip, path_group, 1-minute window)
-- and returns true if the count is within the limit (request allowed),
-- false if the limit is exceeded (request should be blocked).
-- Old windows are cleaned up lazily on each call.
create or replace function public.rate_limit_check(
  p_ip         text,
  p_path_group text,
  p_limit      int
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_window timestamptz := date_trunc('minute', now());
  v_count  int;
begin
  -- Lazy cleanup: remove windows older than 5 minutes.
  delete from public.rate_limits
  where window_start < now() - interval '5 minutes';

  -- Atomic upsert: insert 1 or bump existing count.
  insert into public.rate_limits (ip, path_group, window_start, count)
  values (p_ip, p_path_group, v_window, 1)
  on conflict (ip, path_group, window_start)
  do update set count = rate_limits.count + 1
  returning count into v_count;

  return v_count <= p_limit;
end;
$$;

-- Callable by anon and authenticated (middleware uses the anon key).
grant execute on function public.rate_limit_check(text, text, int) to anon, authenticated;
