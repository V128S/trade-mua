-- Snapshot the customer's email onto the order at checkout, mirroring the
-- existing recipient_* snapshot columns. Nullable: legacy orders stay NULL and
-- simply don't get notification emails. Read by the order-email notifiers.
alter table public.orders add column if not exists recipient_email text;
