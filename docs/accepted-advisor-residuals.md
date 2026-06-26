# Accepted Supabase Advisor Residuals

After the 2026-06-26 architecture hardening (migrations 0004 + 0005), the following
advisor warnings are intentionally left open and should not be re-flagged in future audits.

## Security (4 remaining)

| Lint | Function | Why accepted |
|---|---|---|
| `authenticated_security_definer_function_executable` | `cancel_order(uuid)` | Intentionally callable by authenticated users from `cancelOrder` server action |
| `authenticated_security_definer_function_executable` | `validate_promo(text)` | Intentionally callable by authenticated users from `previewPromo` server action |
| `authenticated_security_definer_function_executable` | `redeem_promo(text)` | Intentionally callable by authenticated users from `placeOrder` server action |
| `auth_leaked_password_protection` | — | HaveIBeenPwned integration — enable in Supabase Dashboard → Auth → Password settings (Task 12 Step 1) |

## Deferred Hardening (backlog, not accepted as permanent)

See the plan's "Deferred / Future Hardening" section for items consciously deferred:
- Authenticated promo redeem abuse (fold into transactional place_order RPC)
- `getRandomProductsFromDB` full-table shuffle → replace with Postgres RPC
- Atomic sync (wrap upsert+delete in a DB function)
- Rate limiting via Vercel WAF / BotID
- Full error monitoring (Sentry / Vercel Observability)

## Cleared in 0004 + 0005

- `auth_rls_initplan` (4×) — fixed by `(select auth.uid())` pattern
- `multiple_permissive_policies` (12×) — fixed by policy consolidation
- `is_admin` / `is_staff` RPC exposure — moved to `private` schema
- `handle_new_user` anon exposure — revoked
- `unindexed_foreign_keys` for `orders.user_id` — `idx_orders_user_id` added
- `public_bucket_allows_listing` for `avatars` — policy dropped
