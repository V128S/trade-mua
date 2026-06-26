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

## Cleared in 0007 + 0008 + post-hardening-2

- Authenticated promo redeem abuse → fixed by `place_order` RPC (0008): validate + insert + redeem in one transaction
- `getRandomProductsFromDB` full-table shuffle → replaced with `random_products` RPC (0006)
- Atomic sync → replaced with `sync_products` RPC (0007)
- Full error monitoring → `@vercel/otel` instrumentation added (`src/instrumentation.ts`)

## Rate Limiting (manual platform step — required)

**Status:** Requires Vercel Dashboard configuration. No code changes needed.

**Steps:**
1. Vercel Dashboard → project `trade-mua` → **Settings → Security → BotID** → enable, set Managed Challenge on paths: `/login`, `/register`, `/en/login`, `/en/register`, `/ru/login`, `/ru/register`, `/checkout`.
2. Vercel Dashboard → **Firewall** → add rules:
   - Path `/login OR /register` (all locales) + rate > 10 req/60s per IP → **Challenge**
   - Path `/api/sync-products` + rate > 3 req/60s per IP → **Block**
   - Path `/checkout` + rate > 5 req/60s per IP → **Challenge**

**Why not in middleware:** In-memory rate limiting doesn't work across multiple Vercel function instances. Vercel Firewall is the correct layer; Upstash Redis would add an unneeded dependency.

## Cleared in 0004 + 0005

- `auth_rls_initplan` (4×) — fixed by `(select auth.uid())` pattern
- `multiple_permissive_policies` (12×) — fixed by policy consolidation
- `is_admin` / `is_staff` RPC exposure — moved to `private` schema
- `handle_new_user` anon exposure — revoked
- `unindexed_foreign_keys` for `orders.user_id` — `idx_orders_user_id` added
- `public_bucket_allows_listing` for `avatars` — policy dropped
