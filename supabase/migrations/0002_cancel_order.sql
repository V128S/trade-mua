-- Customer-initiated order cancellation.
--
-- The orders table has no UPDATE policy for customers (only SELECT/INSERT own,
-- plus is_staff() ALL). This SECURITY DEFINER function lets a customer cancel
-- their OWN order while it is still 'pending' — and nothing else: it only ever
-- flips status to 'cancelled' for a row owned by auth.uid() in 'pending'.
-- Returns true when a row was cancelled, false otherwise.
create or replace function public.cancel_order(p_order_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_updated int;
begin
  update public.orders
     set status = 'cancelled'
   where id = p_order_id
     and user_id = auth.uid()
     and status = 'pending';
  get diagnostics v_updated = row_count;
  return v_updated > 0;
end;
$$;

revoke all on function public.cancel_order(uuid) from public;
grant execute on function public.cancel_order(uuid) to authenticated;
