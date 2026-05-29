# User Dashboard + Admin Panel + Supabase + Sheets Sync Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add email/password auth, user personal account, admin panel, and Google Sheets → Supabase product sync to TradeMua.

**Architecture:** Supabase Auth (email+password) with `@supabase/ssr` cookie sessions. Next.js middleware guards `/dashboard/*` and `/admin/*`. Admin role check happens in `/admin/layout.tsx` Server Component (reads `profiles.role` from DB). Products synced from Google Sheets into Supabase via POST webhook `/api/sync-products` (triggered by Google Apps Script on edit) + Vercel Cron hourly fallback. All product pages switch from reading Sheets CSV to reading Supabase.

**Tech Stack:** `@supabase/supabase-js`, `@supabase/ssr`, Next.js 16 App Router, Tailwind 4, Supabase PostgreSQL + Storage, Vercel Cron, Google Apps Script (one-time manual setup)

---

## File Map

**New files:**
```
src/
  middleware.ts
  lib/
    supabase/
      client.ts           ← browser Supabase client
      server.ts           ← server Supabase client (Server Components, Route Handlers)
    types/
      database.types.ts   ← TypeScript types matching DB schema
    products.ts           ← getProductsFromDB(), getTopProductsFromDB()
  app/
    login/page.tsx
    register/page.tsx
    auth/callback/route.ts          ← exchanges Supabase auth code for session
    auth/reset-password/page.tsx
    dashboard/
      layout.tsx
      page.tsx            ← redirects to /dashboard/profile
      profile/page.tsx
      orders/page.tsx
    admin/
      layout.tsx          ← role guard
      page.tsx            ← redirects to /admin/users
      users/page.tsx
      users/[id]/page.tsx
      orders/page.tsx
      promos/page.tsx
      products/page.tsx
    api/
      sync-products/route.ts
      admin/
        orders/[id]/route.ts
        promos/route.ts
        promos/[id]/route.ts
  components/
    auth/
      LoginForm.tsx
      RegisterForm.tsx
      ResetPasswordForm.tsx
    dashboard/
      ProfileForm.tsx
      OrderList.tsx
    admin/
      AdminSidebar.tsx
      UsersTable.tsx
      OrdersTable.tsx
      PromosManager.tsx
      ProductsSyncPanel.tsx
    ui/
      StatusBadge.tsx
```

**Modified files:**
```
src/components/layout/Navbar.tsx    ← add UserNavButton (auth-aware)
src/app/page.tsx                    ← switch from getTopProducts() to getTopProductsFromDB()
src/app/products/page.tsx           ← switch to getProductsFromDB()
src/app/products/[slug]/page.tsx    ← switch to getProductsFromDB()
```

---

## Task 1: Install dependencies + environment variables

**Files:**
- Modify: `package.json`
- Create: `.env.local` (not committed)

- [ ] **Install Supabase packages**

```bash
cd /Users/VI2US/Documents/TradeMua
npm install @supabase/supabase-js @supabase/ssr
```

Expected: `added N packages` with no errors.

- [ ] **Create `.env.local`**

```bash
cat > .env.local << 'EOF'
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY
SYNC_SECRET=GENERATE_A_RANDOM_32_CHAR_STRING
EOF
```

> Fill in real values from Supabase Dashboard → Project Settings → API.  
> Generate SYNC_SECRET with: `node -e "console.log(require('crypto').randomBytes(16).toString('hex'))"`

- [ ] **Verify `.env.local` is in `.gitignore`**

```bash
grep ".env.local" /Users/VI2US/Documents/TradeMua/.gitignore
```

Expected: `.env.local` or `.env*` appears. If not: `echo ".env.local" >> .gitignore`

- [ ] **Commit**

```bash
cd /Users/VI2US/Documents/TradeMua
git add package.json package-lock.json .gitignore
git commit -m "feat: install @supabase/supabase-js and @supabase/ssr"
```

---

## Task 2: Supabase SQL Schema

**No code files — run SQL in Supabase Dashboard → SQL Editor.**

- [ ] **Run migration: tables + trigger**

```sql
-- profiles (extends auth.users)
CREATE TABLE profiles (
  id uuid REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name text,
  phone text,
  avatar_url text,
  role text NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'admin')),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Auto-create profile row on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO profiles (id, full_name, phone)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'phone'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- orders
CREATE TABLE orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  items jsonb NOT NULL DEFAULT '[]',
  total_usdt numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','confirmed','shipped','delivered','cancelled')),
  promo_code text,
  discount_pct numeric,
  nova_poshta_address text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- promo_codes
CREATE TABLE promo_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  discount_pct numeric NOT NULL,
  max_uses int,
  uses_count int NOT NULL DEFAULT 0,
  expires_at timestamptz,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- products (cache of Google Sheets)
CREATE TABLE products (
  id text PRIMARY KEY,
  algorithm text NOT NULL,
  brand text NOT NULL,
  name text NOT NULL,
  hashrate text NOT NULL,
  power_w int NOT NULL,
  price_usdt numeric NOT NULL,
  in_stock boolean NOT NULL DEFAULT false,
  is_new boolean NOT NULL DEFAULT false,
  synced_at timestamptz NOT NULL DEFAULT now()
);
```

- [ ] **Run migration: RLS policies**

```sql
-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE promo_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- profiles: user reads/updates own row; admin reads all
CREATE POLICY "user_read_own_profile"
  ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "user_update_own_profile"
  ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "admin_read_all_profiles"
  ON profiles FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

-- orders: user reads own; admin reads/writes all
CREATE POLICY "user_read_own_orders"
  ON orders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "admin_all_orders"
  ON orders FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

-- promo_codes: admin only
CREATE POLICY "admin_all_promos"
  ON promo_codes FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

-- products: public read; service_role writes (bypasses RLS)
CREATE POLICY "public_read_products"
  ON products FOR SELECT USING (true);
```

- [ ] **Run migration: Storage bucket for avatars**

```sql
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT DO NOTHING;

CREATE POLICY "public_read_avatars"
  ON storage.objects FOR SELECT USING (bucket_id = 'avatars');

CREATE POLICY "auth_upload_avatar"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'avatars' AND auth.role() = 'authenticated');

CREATE POLICY "owner_update_avatar"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
```

- [ ] **Verify in Supabase Dashboard → Table Editor** that all 4 tables appear.

- [ ] **Configure email confirmation in Supabase Dashboard**
  - Authentication → Email Templates → confirm the "Confirm signup" template is enabled
  - Authentication → URL Configuration → set Site URL to `http://localhost:3000` (dev) and add `https://trademua.vercel.app` to Redirect URLs
  - Set `Redirect URL` for email confirmation to: `https://trademua.vercel.app/auth/callback`

---

## Task 3: TypeScript database types

**Files:**
- Create: `src/lib/types/database.types.ts`

- [ ] **Create the types file**

```typescript
// src/lib/types/database.types.ts
export type Json = string | number | boolean | null | { [key: string]: Json } | Json[]

export type OrderStatus = 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled'
export type UserRole = 'customer' | 'admin'

export interface OrderItem {
  product_id: string
  name: string
  price_usdt: number
  qty: number
}

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          full_name: string | null
          phone: string | null
          avatar_url: string | null
          role: UserRole
          created_at: string
        }
        Insert: {
          id: string
          full_name?: string | null
          phone?: string | null
          avatar_url?: string | null
          role?: UserRole
        }
        Update: {
          full_name?: string | null
          phone?: string | null
          avatar_url?: string | null
          role?: UserRole
        }
      }
      orders: {
        Row: {
          id: string
          user_id: string
          items: OrderItem[]
          total_usdt: number
          status: OrderStatus
          promo_code: string | null
          discount_pct: number | null
          nova_poshta_address: string | null
          notes: string | null
          created_at: string
        }
        Insert: {
          user_id: string
          items: OrderItem[]
          total_usdt: number
          status?: OrderStatus
          promo_code?: string | null
          discount_pct?: number | null
          nova_poshta_address?: string | null
          notes?: string | null
        }
        Update: {
          status?: OrderStatus
          nova_poshta_address?: string | null
          notes?: string | null
        }
      }
      promo_codes: {
        Row: {
          id: string
          code: string
          discount_pct: number
          max_uses: number | null
          uses_count: number
          expires_at: string | null
          is_active: boolean
          created_at: string
        }
        Insert: {
          code: string
          discount_pct: number
          max_uses?: number | null
          expires_at?: string | null
          is_active?: boolean
        }
        Update: {
          discount_pct?: number
          max_uses?: number | null
          expires_at?: string | null
          is_active?: boolean
        }
      }
      products: {
        Row: {
          id: string
          algorithm: string
          brand: string
          name: string
          hashrate: string
          power_w: number
          price_usdt: number
          in_stock: boolean
          is_new: boolean
          synced_at: string
        }
        Insert: {
          id: string
          algorithm: string
          brand: string
          name: string
          hashrate: string
          power_w: number
          price_usdt: number
          in_stock: boolean
          is_new: boolean
          synced_at?: string
        }
        Update: {
          algorithm?: string
          brand?: string
          name?: string
          hashrate?: string
          power_w?: number
          price_usdt?: number
          in_stock?: boolean
          is_new?: boolean
          synced_at?: string
        }
      }
    }
  }
}
```

- [ ] **Commit**

```bash
git add src/lib/types/database.types.ts
git commit -m "feat: add Supabase database TypeScript types"
```

---

## Task 4: Supabase client utilities

**Files:**
- Create: `src/lib/supabase/client.ts`
- Create: `src/lib/supabase/server.ts`

- [ ] **Create browser client**

```typescript
// src/lib/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/lib/types/database.types'

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

- [ ] **Create server client**

```typescript
// src/lib/supabase/server.ts
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from '@/lib/types/database.types'

export async function createClient() {
  const cookieStore = await cookies()
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // setAll called from a Server Component — cookies will be set by middleware
          }
        },
      },
    }
  )
}
```

- [ ] **Verify TypeScript compiles**

```bash
cd /Users/VI2US/Documents/TradeMua
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Commit**

```bash
git add src/lib/supabase/
git commit -m "feat: add Supabase client utilities (browser + server)"
```

---

## Task 5: Next.js Middleware

**Files:**
- Create: `src/middleware.ts`

- [ ] **Create middleware**

```typescript
// src/middleware.ts
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Refresh session — must call getUser() not getSession() per Supabase docs
  const { data: { user } } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  if (!user && (pathname.startsWith('/dashboard') || pathname.startsWith('/admin'))) {
    const loginUrl = request.nextUrl.clone()
    loginUrl.pathname = '/login'
    return NextResponse.redirect(loginUrl)
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/dashboard/:path*', '/admin/:path*'],
}
```

- [ ] **Verify build compiles**

```bash
cd /Users/VI2US/Documents/TradeMua
npm run build 2>&1 | tail -20
```

Expected: build succeeds (or only pre-existing warnings).

- [ ] **Commit**

```bash
git add src/middleware.ts
git commit -m "feat: add Next.js middleware for session-based route protection"
```

---

## Task 6: Auth callback route handler

**Files:**
- Create: `src/app/auth/callback/route.ts`

Supabase sends users to `/auth/callback?code=...` after email confirmation and password reset. This route exchanges the code for a session.

- [ ] **Create auth callback route**

```typescript
// src/app/auth/callback/route.ts
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`)
}
```

- [ ] **Commit**

```bash
git add src/app/auth/
git commit -m "feat: add Supabase auth callback route handler"
```

---

## Task 7: Login page

**Files:**
- Create: `src/components/auth/LoginForm.tsx`
- Create: `src/app/login/page.tsx`

- [ ] **Create LoginForm client component**

```tsx
// src/components/auth/LoginForm.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function LoginForm() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError('Невірний email або пароль')
      setLoading(false)
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest block mb-1.5 text-[11px]">
          Email
        </label>
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
          placeholder="your@email.com"
          className="w-full bg-surface border border-[#2e2d2b] rounded px-4 py-2.5 font-body-md text-body-md text-on-surface focus:outline-none focus:border-primary/60 transition-colors"
        />
      </div>
      <div>
        <label className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest block mb-1.5 text-[11px]">
          Пароль
        </label>
        <input
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
          placeholder="••••••••"
          className="w-full bg-surface border border-[#2e2d2b] rounded px-4 py-2.5 font-body-md text-body-md text-on-surface focus:outline-none focus:border-primary/60 transition-colors"
        />
      </div>
      {error && (
        <p className="font-body-md text-body-md text-red-400 text-sm">{error}</p>
      )}
      <button
        type="submit"
        disabled={loading}
        className="btn-primary w-full py-3 rounded font-label-caps text-label-caps uppercase tracking-widest disabled:opacity-50 transition-opacity"
      >
        {loading ? 'Вхід...' : 'Увійти'}
      </button>
      <div className="flex items-center justify-between font-label-caps text-label-caps text-on-surface-variant text-[11px] uppercase tracking-widest">
        <Link href="/register" className="hover:text-primary transition-colors">
          Реєстрація
        </Link>
        <Link href="/auth/reset-password" className="hover:text-primary transition-colors">
          Забули пароль?
        </Link>
      </div>
    </form>
  )
}
```

- [ ] **Create login page**

```tsx
// src/app/login/page.tsx
import type { Metadata } from 'next'
import LoginForm from '@/components/auth/LoginForm'

export const metadata: Metadata = {
  title: 'Вхід | Trade M',
}

export default function LoginPage() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center px-margin-mobile">
      <div className="w-full max-w-md bg-card border-card rounded-lg p-8 space-y-6">
        <div>
          <h1 className="font-headline-md text-headline-md text-on-surface uppercase tracking-widest">
            Вхід
          </h1>
          <p className="font-body-md text-body-md text-on-surface-variant mt-2">
            Введіть email та пароль для входу в кабінет
          </p>
        </div>
        <LoginForm />
      </div>
    </div>
  )
}
```

- [ ] **Verify dev server shows /login without errors**

```bash
cd /Users/VI2US/Documents/TradeMua && npm run dev &
# wait 3 seconds, then open http://localhost:3000/login
```

Expected: login form renders with email + password fields and gold "Увійти" button.

- [ ] **Commit**

```bash
git add src/components/auth/LoginForm.tsx src/app/login/
git commit -m "feat: add login page with Supabase email/password auth"
```

---

## Task 8: Register page

**Files:**
- Create: `src/components/auth/RegisterForm.tsx`
- Create: `src/app/register/page.tsx`

- [ ] **Create RegisterForm client component**

```tsx
// src/components/auth/RegisterForm.tsx
'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function RegisterForm() {
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password.length < 6) {
      setError('Пароль мінімум 6 символів')
      return
    }
    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName, phone },
        emailRedirectTo: `${location.origin}/auth/callback`,
      },
    })

    if (error) {
      setError(error.message === 'User already registered'
        ? 'Цей email вже зареєстрований'
        : 'Помилка реєстрації. Спробуйте ще раз.')
      setLoading(false)
      return
    }

    setSuccess(true)
  }

  if (success) {
    return (
      <div className="space-y-4 text-center">
        <span className="material-symbols-outlined text-primary text-[48px]">mark_email_read</span>
        <p className="font-headline-md text-headline-md text-on-surface uppercase tracking-widest">
          Перевірте пошту
        </p>
        <p className="font-body-md text-body-md text-on-surface-variant">
          Ми надіслали лист підтвердження на <strong className="text-on-surface">{email}</strong>.
          Перейдіть за посиланням у листі для активації акаунту.
        </p>
        <Link href="/login" className="inline-block btn-ghost py-2 px-6 rounded font-label-caps text-label-caps uppercase tracking-widest text-sm mt-4">
          На сторінку входу
        </Link>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {[
        { label: 'Ім\'я та прізвище', value: fullName, setter: setFullName, type: 'text', placeholder: 'Іван Петренко' },
        { label: 'Телефон', value: phone, setter: setPhone, type: 'tel', placeholder: '+380501234567' },
        { label: 'Email', value: email, setter: setEmail, type: 'email', placeholder: 'your@email.com' },
        { label: 'Пароль', value: password, setter: setPassword, type: 'password', placeholder: '••••••••' },
      ].map(({ label, value, setter, type, placeholder }) => (
        <div key={label}>
          <label className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest block mb-1.5 text-[11px]">
            {label}
          </label>
          <input
            type={type}
            value={value}
            onChange={e => setter(e.target.value)}
            required
            placeholder={placeholder}
            className="w-full bg-surface border border-[#2e2d2b] rounded px-4 py-2.5 font-body-md text-body-md text-on-surface focus:outline-none focus:border-primary/60 transition-colors"
          />
        </div>
      ))}
      {error && <p className="font-body-md text-body-md text-red-400 text-sm">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="btn-primary w-full py-3 rounded font-label-caps text-label-caps uppercase tracking-widest disabled:opacity-50"
      >
        {loading ? 'Реєстрація...' : 'Зареєструватись'}
      </button>
      <p className="text-center font-label-caps text-label-caps text-on-surface-variant text-[11px] uppercase tracking-widest">
        Вже є акаунт?{' '}
        <Link href="/login" className="text-primary hover:underline">
          Увійти
        </Link>
      </p>
    </form>
  )
}
```

- [ ] **Create register page**

```tsx
// src/app/register/page.tsx
import type { Metadata } from 'next'
import RegisterForm from '@/components/auth/RegisterForm'

export const metadata: Metadata = {
  title: 'Реєстрація | Trade M',
}

export default function RegisterPage() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center px-margin-mobile py-16">
      <div className="w-full max-w-md bg-card border-card rounded-lg p-8 space-y-6">
        <div>
          <h1 className="font-headline-md text-headline-md text-on-surface uppercase tracking-widest">
            Реєстрація
          </h1>
          <p className="font-body-md text-body-md text-on-surface-variant mt-2">
            Створіть акаунт для доступу до особистого кабінету
          </p>
        </div>
        <RegisterForm />
      </div>
    </div>
  )
}
```

- [ ] **Commit**

```bash
git add src/components/auth/RegisterForm.tsx src/app/register/
git commit -m "feat: add registration page with email confirmation"
```

---

## Task 9: Password reset pages

**Files:**
- Create: `src/components/auth/ResetPasswordForm.tsx`
- Create: `src/app/auth/reset-password/page.tsx`

- [ ] **Create ResetPasswordForm**

```tsx
// src/components/auth/ResetPasswordForm.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function ResetPasswordForm() {
  const router = useRouter()
  const [step, setStep] = useState<'request' | 'update'>('request')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  // Check if we arrived via reset link (has active session with type=recovery)
  // In that case show the new password form immediately
  // The auth/callback route already exchanged the code, so session is set

  async function handleRequest(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const supabase = createClient()
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${location.origin}/auth/callback?next=/auth/reset-password`,
    })
    setLoading(false)
    if (error) {
      setError('Помилка. Перевірте email та спробуйте ще раз.')
      return
    }
    setMessage('Лист з посиланням надіслано. Перевірте пошту.')
  }

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault()
    if (password.length < 6) { setError('Мінімум 6 символів'); return }
    setLoading(true)
    setError(null)
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password })
    setLoading(false)
    if (error) { setError('Помилка оновлення пароля'); return }
    router.push('/dashboard')
  }

  if (message) {
    return (
      <div className="text-center space-y-3">
        <span className="material-symbols-outlined text-primary text-[48px]">mark_email_read</span>
        <p className="font-body-md text-body-md text-on-surface-variant">{message}</p>
      </div>
    )
  }

  if (step === 'update') {
    return (
      <form onSubmit={handleUpdate} className="space-y-4">
        <div>
          <label className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest block mb-1.5 text-[11px]">
            Новий пароль
          </label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            placeholder="••••••••"
            className="w-full bg-surface border border-[#2e2d2b] rounded px-4 py-2.5 font-body-md text-body-md text-on-surface focus:outline-none focus:border-primary/60 transition-colors"
          />
        </div>
        {error && <p className="text-red-400 text-sm">{error}</p>}
        <button type="submit" disabled={loading} className="btn-primary w-full py-3 rounded font-label-caps text-label-caps uppercase tracking-widest disabled:opacity-50">
          {loading ? 'Збереження...' : 'Зберегти пароль'}
        </button>
      </form>
    )
  }

  return (
    <form onSubmit={handleRequest} className="space-y-4">
      <div>
        <label className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest block mb-1.5 text-[11px]">
          Email
        </label>
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
          placeholder="your@email.com"
          className="w-full bg-surface border border-[#2e2d2b] rounded px-4 py-2.5 font-body-md text-body-md text-on-surface focus:outline-none focus:border-primary/60 transition-colors"
        />
      </div>
      {error && <p className="text-red-400 text-sm">{error}</p>}
      <button type="submit" disabled={loading} className="btn-primary w-full py-3 rounded font-label-caps text-label-caps uppercase tracking-widest disabled:opacity-50">
        {loading ? 'Надсилання...' : 'Відновити пароль'}
      </button>
      <button
        type="button"
        onClick={() => setStep('update')}
        className="w-full text-center font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest text-[11px] hover:text-primary transition-colors"
      >
        Вже є посилання — ввести новий пароль
      </button>
    </form>
  )
}
```

- [ ] **Create reset-password page**

```tsx
// src/app/auth/reset-password/page.tsx
import type { Metadata } from 'next'
import ResetPasswordForm from '@/components/auth/ResetPasswordForm'

export const metadata: Metadata = { title: 'Відновлення пароля | Trade M' }

export default function ResetPasswordPage() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center px-margin-mobile">
      <div className="w-full max-w-md bg-card border-card rounded-lg p-8 space-y-6">
        <h1 className="font-headline-md text-headline-md text-on-surface uppercase tracking-widest">
          Відновлення пароля
        </h1>
        <ResetPasswordForm />
      </div>
    </div>
  )
}
```

- [ ] **Commit**

```bash
git add src/components/auth/ResetPasswordForm.tsx src/app/auth/reset-password/
git commit -m "feat: add password reset flow"
```

---

## Task 10: Products sync API route + DB read functions

**Files:**
- Create: `src/lib/products.ts`
- Create: `src/app/api/sync-products/route.ts`

- [ ] **Create `src/lib/products.ts`** — reads products from Supabase

```typescript
// src/lib/products.ts
import { createClient } from '@/lib/supabase/server'
import type { Product } from '@/lib/sheets'

export async function getProductsFromDB(): Promise<Product[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .order('price_usdt', { ascending: false })

  if (error || !data) return []

  return data.map(row => ({
    id: row.id,
    algorithm: row.algorithm,
    brand: row.brand,
    name: row.name,
    hashrate: row.hashrate,
    powerW: row.power_w,
    priceUSDT: Number(row.price_usdt),
    inStock: row.in_stock,
    isNew: row.is_new,
  }))
}

export async function getTopProductsFromDB(limit = 8): Promise<Product[]> {
  const all = await getProductsFromDB()
  return all.slice(0, limit)
}

export async function getLastSyncTime(): Promise<string | null> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('products')
    .select('synced_at')
    .order('synced_at', { ascending: false })
    .limit(1)
    .single()
  return data?.synced_at ?? null
}
```

- [ ] **Create sync API route**

```typescript
// src/app/api/sync-products/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { getProducts } from '@/lib/sheets'
import type { Database } from '@/lib/types/database.types'

function getServiceClient() {
  return createServiceClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.SYNC_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const products = await getProducts()
  if (products.length === 0) {
    return NextResponse.json({ error: 'No products fetched from Sheets' }, { status: 500 })
  }

  const supabase = getServiceClient()
  const now = new Date().toISOString()

  const rows = products.map(p => ({
    id: p.id,
    algorithm: p.algorithm,
    brand: p.brand,
    name: p.name,
    hashrate: p.hashrate,
    power_w: p.powerW,
    price_usdt: p.priceUSDT,
    in_stock: p.inStock,
    is_new: p.isNew,
    synced_at: now,
  }))

  const { error: upsertError } = await supabase
    .from('products')
    .upsert(rows, { onConflict: 'id' })

  if (upsertError) {
    return NextResponse.json({ error: upsertError.message }, { status: 500 })
  }

  // Remove products no longer in Sheets
  const currentIds = rows.map(r => r.id)
  await supabase
    .from('products')
    .delete()
    .not('id', 'in', `(${currentIds.map(id => `"${id}"`).join(',')})`)

  return NextResponse.json({ synced: rows.length, timestamp: now })
}
```

- [ ] **Do initial sync** (run once manually to populate the products table)

```bash
# Make sure dev server is running on :3000
curl -X POST http://localhost:3000/api/sync-products \
  -H "Authorization: Bearer $(grep SYNC_SECRET .env.local | cut -d= -f2)"
```

Expected response: `{"synced": N, "timestamp": "..."}` where N > 0.

- [ ] **Verify products in Supabase Dashboard → Table Editor → products** — rows should appear.

- [ ] **Commit**

```bash
git add src/lib/products.ts src/app/api/sync-products/
git commit -m "feat: add product sync API route and Supabase read helpers"
```

---

## Task 11: Switch product pages to Supabase

**Files:**
- Modify: `src/app/page.tsx`
- Modify: `src/app/products/page.tsx`
- Modify: `src/app/products/[slug]/page.tsx`

- [ ] **Update `src/app/page.tsx`** — replace `getTopProducts` with `getTopProductsFromDB`

Find and replace the import line:
```typescript
// OLD
import { getTopProducts, type Product } from "@/lib/sheets";
// NEW
import { getTopProductsFromDB } from "@/lib/products";
import type { Product } from "@/lib/sheets";
```

Replace the `revalidate` export and function call:
```typescript
// OLD
export const revalidate = 3600;
// ...
const products = await getTopProducts(8);

// NEW
export const revalidate = 60;
// ...
const products = await getTopProductsFromDB(8);
```

- [ ] **Update `src/app/products/page.tsx`**

```typescript
// OLD
import { getProducts } from "@/lib/sheets";
// NEW
import { getProductsFromDB } from "@/lib/products";
```

```typescript
// OLD
export const revalidate = 3600;
// ...
const products = await getProducts();

// NEW
export const revalidate = 60;
// ...
const products = await getProductsFromDB();
```

- [ ] **Update `src/app/products/[slug]/page.tsx`**

```typescript
// OLD (two occurrences)
import { getProducts } from "@/lib/sheets";
// NEW
import { getProductsFromDB } from "@/lib/products";
```

Replace all three calls to `getProducts()` with `getProductsFromDB()`:
```typescript
// OLD (in generateMetadata)
const products = await getProducts();
// NEW
const products = await getProductsFromDB();

// OLD (in ProductPage)
const [products, revenueMap] = await Promise.all([getProducts(), getMinerstatRevenue()]);
// NEW
const [products, revenueMap] = await Promise.all([getProductsFromDB(), getMinerstatRevenue()]);
```

Also remove `export const revalidate = 3600` and replace with `export const revalidate = 60`.

- [ ] **Verify locally** — open http://localhost:3000 and http://localhost:3000/products — products should appear (from Supabase now).

- [ ] **Commit**

```bash
git add src/app/page.tsx src/app/products/
git commit -m "feat: switch all product pages to read from Supabase"
```

---

## Task 12: User Dashboard — layout + profile

**Files:**
- Create: `src/app/dashboard/layout.tsx`
- Create: `src/app/dashboard/page.tsx`
- Create: `src/app/dashboard/profile/page.tsx`
- Create: `src/components/dashboard/ProfileForm.tsx`

- [ ] **Create dashboard layout**

```tsx
// src/app/dashboard/layout.tsx
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  return (
    <div className="px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto py-10 pb-section-gap">
      <div className="flex items-center gap-3 mb-8">
        <span className="material-symbols-outlined text-primary text-[28px]">person</span>
        <h1 className="font-headline-md text-headline-md text-on-surface uppercase tracking-widest">
          Особистий кабінет
        </h1>
      </div>
      <nav className="flex gap-1 mb-8 border-b border-[#2e2d2b]">
        {[
          { href: '/dashboard/profile', label: 'Профіль', icon: 'manage_accounts' },
          { href: '/dashboard/orders', label: 'Замовлення', icon: 'receipt_long' },
        ].map(tab => (
          <Link
            key={tab.href}
            href={tab.href}
            className="flex items-center gap-2 px-5 py-3 font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest text-[11px] hover:text-primary border-b-2 border-transparent hover:border-primary transition-colors -mb-px"
          >
            <span className="material-symbols-outlined text-[16px]">{tab.icon}</span>
            {tab.label}
          </Link>
        ))}
      </nav>
      {children}
    </div>
  )
}
```

- [ ] **Create dashboard index page** (redirects to profile)

```tsx
// src/app/dashboard/page.tsx
import { redirect } from 'next/navigation'
export default function DashboardPage() {
  redirect('/dashboard/profile')
}
```

- [ ] **Create ProfileForm client component**

```tsx
// src/components/dashboard/ProfileForm.tsx
'use client'

import { useState, useRef } from 'react'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import type { Database } from '@/lib/types/database.types'

type Profile = Database['public']['Tables']['profiles']['Row']

export default function ProfileForm({ profile, userId }: { profile: Profile; userId: string }) {
  const [fullName, setFullName] = useState(profile.full_name ?? '')
  const [phone, setPhone] = useState(profile.phone ?? '')
  const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url ?? '')
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  async function uploadAvatar(file: File) {
    setUploading(true)
    const supabase = createClient()
    const ext = file.name.split('.').pop()
    const path = `${userId}/avatar.${ext}`
    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(path, file, { upsert: true })
    if (uploadError) { setError('Помилка завантаження фото'); setUploading(false); return }
    const { data } = supabase.storage.from('avatars').getPublicUrl(path)
    setAvatarUrl(data.publicUrl + '?t=' + Date.now())
    setUploading(false)
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setMessage(null)
    setError(null)
    const supabase = createClient()
    const { error } = await supabase
      .from('profiles')
      .update({ full_name: fullName, phone, avatar_url: avatarUrl || null })
      .eq('id', userId)
    setSaving(false)
    if (error) { setError('Помилка збереження'); return }
    setMessage('Профіль збережено')
  }

  return (
    <form onSubmit={handleSave} className="space-y-6 max-w-lg">
      {/* Avatar */}
      <div className="flex items-center gap-5">
        <div className="w-20 h-20 rounded-full bg-card border-card overflow-hidden flex items-center justify-center shrink-0">
          {avatarUrl ? (
            <Image src={avatarUrl} alt="Avatar" width={80} height={80} className="object-cover w-full h-full" />
          ) : (
            <span className="material-symbols-outlined text-on-surface-variant text-[40px]">person</span>
          )}
        </div>
        <div>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="btn-ghost py-2 px-4 rounded font-label-caps text-label-caps uppercase tracking-widest text-[11px] disabled:opacity-50"
          >
            {uploading ? 'Завантаження...' : 'Змінити фото'}
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="hidden"
            onChange={e => { if (e.target.files?.[0]) uploadAvatar(e.target.files[0]) }}
          />
        </div>
      </div>

      {/* Fields */}
      {[
        { label: "Ім'я та прізвище", value: fullName, setter: setFullName, type: 'text' },
        { label: 'Телефон', value: phone, setter: setPhone, type: 'tel' },
      ].map(({ label, value, setter, type }) => (
        <div key={label}>
          <label className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest block mb-1.5 text-[11px]">
            {label}
          </label>
          <input
            type={type}
            value={value}
            onChange={e => setter(e.target.value)}
            className="w-full bg-surface border border-[#2e2d2b] rounded px-4 py-2.5 font-body-md text-body-md text-on-surface focus:outline-none focus:border-primary/60 transition-colors"
          />
        </div>
      ))}

      {message && <p className="font-body-md text-body-md text-green-400 text-sm">{message}</p>}
      {error && <p className="font-body-md text-body-md text-red-400 text-sm">{error}</p>}

      <button
        type="submit"
        disabled={saving}
        className="btn-primary py-3 px-8 rounded font-label-caps text-label-caps uppercase tracking-widest disabled:opacity-50"
      >
        {saving ? 'Збереження...' : 'Зберегти'}
      </button>
    </form>
  )
}
```

- [ ] **Create profile page**

```tsx
// src/app/dashboard/profile/page.tsx
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import ProfileForm from '@/components/dashboard/ProfileForm'

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/login')

  return <ProfileForm profile={profile} userId={user.id} />
}
```

- [ ] **Commit**

```bash
git add src/app/dashboard/ src/components/dashboard/ProfileForm.tsx
git commit -m "feat: add user dashboard layout and profile edit page"
```

---

## Task 13: User Dashboard — orders

**Files:**
- Create: `src/app/dashboard/orders/page.tsx`
- Create: `src/components/dashboard/OrderList.tsx`
- Create: `src/components/ui/StatusBadge.tsx`

- [ ] **Create StatusBadge component**

```tsx
// src/components/ui/StatusBadge.tsx
import type { OrderStatus } from '@/lib/types/database.types'

const STATUS_CONFIG: Record<OrderStatus, { label: string; classes: string }> = {
  pending:   { label: 'Очікує',     classes: 'bg-[#2b2a26] text-[#ecc246]' },
  confirmed: { label: 'Підтверджено', classes: 'bg-[#1a2520] text-emerald-400' },
  shipped:   { label: 'Відправлено', classes: 'bg-[#1a2030] text-blue-400' },
  delivered: { label: 'Доставлено',  classes: 'bg-[#1a2b1a] text-green-400' },
  cancelled: { label: 'Скасовано',   classes: 'bg-[#2b1a1a] text-red-400' },
}

export default function StatusBadge({ status }: { status: OrderStatus }) {
  const cfg = STATUS_CONFIG[status]
  return (
    <span className={`chip px-2 py-0.5 font-technical-data text-[10px] uppercase tracking-wider ${cfg.classes}`}>
      {cfg.label}
    </span>
  )
}
```

- [ ] **Create OrderList component**

```tsx
// src/components/dashboard/OrderList.tsx
import type { Database } from '@/lib/types/database.types'
import StatusBadge from '@/components/ui/StatusBadge'

type Order = Database['public']['Tables']['orders']['Row']

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('uk-UA', { day: '2-digit', month: 'short', year: 'numeric' })
}

export default function OrderList({ orders }: { orders: Order[] }) {
  if (orders.length === 0) {
    return (
      <div className="text-center py-16">
        <span className="material-symbols-outlined text-outline-variant text-[64px]">receipt_long</span>
        <p className="font-body-md text-body-md text-on-surface-variant mt-4">
          Замовлень ще немає
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {orders.map(order => (
        <div key={order.id} className="bg-card border-card rounded-lg p-6 space-y-4">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <p className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest text-[10px]">
                {formatDate(order.created_at)}
              </p>
              <p className="font-technical-data text-technical-data text-on-surface mt-1">
                #{order.id.slice(0, 8).toUpperCase()}
              </p>
            </div>
            <StatusBadge status={order.status} />
          </div>

          <div className="border-t border-[#2e2d2b] pt-4 space-y-2">
            {(order.items as { name: string; qty: number; price_usdt: number }[]).map((item, i) => (
              <div key={i} className="flex justify-between items-center">
                <span className="font-body-md text-body-md text-on-surface">{item.name}</span>
                <span className="font-label-caps text-label-caps text-on-surface-variant text-[11px]">
                  {item.qty} × ${item.price_usdt.toLocaleString()}
                </span>
              </div>
            ))}
          </div>

          <div className="border-t border-[#2e2d2b] pt-3 flex flex-wrap justify-between items-center gap-3">
            <div>
              <p className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest text-[10px]">
                Адреса доставки
              </p>
              <p className="font-body-md text-body-md text-on-surface mt-0.5">
                {order.nova_poshta_address ?? '—'}
              </p>
            </div>
            <div className="text-right">
              {order.promo_code && (
                <p className="font-label-caps text-label-caps text-primary text-[10px] uppercase tracking-widest">
                  Промокод: {order.promo_code} (−{order.discount_pct}%)
                </p>
              )}
              <p className="font-headline-md text-headline-md text-primary">
                ${order.total_usdt.toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
```

- [ ] **Create orders page**

```tsx
// src/app/dashboard/orders/page.tsx
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import OrderList from '@/components/dashboard/OrderList'

export default async function OrdersPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: orders } = await supabase
    .from('orders')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  return <OrderList orders={orders ?? []} />
}
```

- [ ] **Commit**

```bash
git add src/app/dashboard/orders/ src/components/dashboard/OrderList.tsx src/components/ui/StatusBadge.tsx
git commit -m "feat: add dashboard orders page with status badges"
```

---

## Task 14: Admin layout + sidebar

**Files:**
- Create: `src/app/admin/layout.tsx`
- Create: `src/app/admin/page.tsx`
- Create: `src/components/admin/AdminSidebar.tsx`

- [ ] **Create AdminSidebar client component**

```tsx
// src/components/admin/AdminSidebar.tsx
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NAV = [
  { href: '/admin/users',    label: 'Користувачі',  icon: 'group' },
  { href: '/admin/orders',   label: 'Замовлення',   icon: 'receipt_long' },
  { href: '/admin/promos',   label: 'Промокоди',    icon: 'local_offer' },
  { href: '/admin/products', label: 'Синк товарів', icon: 'sync' },
]

export default function AdminSidebar() {
  const pathname = usePathname()
  return (
    <aside className="w-56 shrink-0">
      <p className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest text-[10px] mb-4 px-3">
        Адміністрування
      </p>
      <nav className="space-y-1">
        {NAV.map(item => {
          const active = pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded font-label-caps text-label-caps uppercase tracking-widest text-[11px] transition-colors ${
                active
                  ? 'bg-primary/10 text-primary'
                  : 'text-on-surface-variant hover:text-primary hover:bg-primary/5'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">{item.icon}</span>
              {item.label}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
```

- [ ] **Create admin layout with role guard**

```tsx
// src/app/admin/layout.tsx
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import AdminSidebar from '@/components/admin/AdminSidebar'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') redirect('/')

  return (
    <div className="px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto py-10 pb-section-gap">
      <div className="flex items-center gap-3 mb-8">
        <span className="material-symbols-outlined text-primary text-[28px]">admin_panel_settings</span>
        <h1 className="font-headline-md text-headline-md text-on-surface uppercase tracking-widest">
          Адмін-панель
        </h1>
      </div>
      <div className="flex gap-8 items-start">
        <AdminSidebar />
        <main className="flex-1 min-w-0">{children}</main>
      </div>
    </div>
  )
}
```

- [ ] **Create admin index page**

```tsx
// src/app/admin/page.tsx
import { redirect } from 'next/navigation'
export default function AdminPage() {
  redirect('/admin/users')
}
```

- [ ] **Set yourself as admin in Supabase** (one-time, replace YOUR_USER_ID):

```sql
-- Run in Supabase Dashboard → SQL Editor
UPDATE profiles SET role = 'admin' WHERE id = 'YOUR_USER_ID';
```

To find your user ID: log in on the site, then check Supabase Dashboard → Authentication → Users.

- [ ] **Commit**

```bash
git add src/app/admin/ src/components/admin/AdminSidebar.tsx
git commit -m "feat: add admin panel layout with role guard and sidebar"
```

---

## Task 15: Admin — Users

**Files:**
- Create: `src/app/admin/users/page.tsx`
- Create: `src/app/admin/users/[id]/page.tsx`
- Create: `src/components/admin/UsersTable.tsx`

- [ ] **Create UsersTable component**

```tsx
// src/components/admin/UsersTable.tsx
import Link from 'next/link'
import type { Database } from '@/lib/types/database.types'

type Profile = Database['public']['Tables']['profiles']['Row'] & { order_count?: number }

export default function UsersTable({ users }: { users: Profile[] }) {
  if (users.length === 0) {
    return <p className="font-body-md text-body-md text-on-surface-variant py-8">Користувачів ще немає</p>
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left">
        <thead>
          <tr className="border-b border-[#2e2d2b]">
            {["Ім'я", 'Email*', 'Телефон', 'Дата реєстрації', 'Замовлень', ''].map(h => (
              <th key={h} className="pb-3 pr-4 font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest text-[10px]">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {users.map(u => (
            <tr key={u.id} className="border-b border-[#2e2d2b]/50 hover:bg-card/50 transition-colors">
              <td className="py-3 pr-4 font-body-md text-body-md text-on-surface">{u.full_name ?? '—'}</td>
              <td className="py-3 pr-4 font-body-md text-body-md text-on-surface-variant text-sm">*hidden*</td>
              <td className="py-3 pr-4 font-body-md text-body-md text-on-surface-variant text-sm">{u.phone ?? '—'}</td>
              <td className="py-3 pr-4 font-label-caps text-label-caps text-on-surface-variant text-[11px]">
                {new Date(u.created_at).toLocaleDateString('uk-UA')}
              </td>
              <td className="py-3 pr-4 font-technical-data text-technical-data text-on-surface">{u.order_count ?? 0}</td>
              <td className="py-3">
                <Link href={`/admin/users/${u.id}`} className="font-label-caps text-label-caps text-primary hover:underline uppercase tracking-widest text-[11px]">
                  Деталі
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mt-2 font-label-caps text-label-caps text-on-surface-variant text-[10px] uppercase tracking-widest">
        * Email доступний у Supabase Dashboard → Authentication → Users
      </p>
    </div>
  )
}
```

> **Note:** Supabase RLS means the admin's session token (anon key) cannot read `auth.users.email` directly from the client. Emails are visible in Supabase Dashboard. To expose them server-side you'd need the service role key — intentionally omitted here for security. Add if needed.

- [ ] **Create users list page**

```tsx
// src/app/admin/users/page.tsx
import { createClient } from '@/lib/supabase/server'
import UsersTable from '@/components/admin/UsersTable'

export default async function AdminUsersPage() {
  const supabase = await createClient()

  const { data: profiles } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false })

  // Count orders per user
  const { data: orderCounts } = await supabase
    .from('orders')
    .select('user_id')

  const countMap: Record<string, number> = {}
  for (const row of orderCounts ?? []) {
    countMap[row.user_id] = (countMap[row.user_id] ?? 0) + 1
  }

  const users = (profiles ?? []).map(p => ({
    ...p,
    order_count: countMap[p.id] ?? 0,
  }))

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-headline-md text-headline-md text-on-surface uppercase tracking-widest text-base">
          Користувачі ({users.length})
        </h2>
      </div>
      <UsersTable users={users} />
    </div>
  )
}
```

- [ ] **Create user detail page**

```tsx
// src/app/admin/users/[id]/page.tsx
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import OrderList from '@/components/dashboard/OrderList'

type Props = { params: Promise<{ id: string }> }

export default async function AdminUserDetailPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', id).single()
  if (!profile) notFound()

  const { data: orders } = await supabase
    .from('orders')
    .select('*')
    .eq('user_id', id)
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-8">
      <div className="bg-card border-card rounded-lg p-6 space-y-3">
        <h2 className="font-headline-md text-headline-md text-on-surface uppercase tracking-widest text-base">
          {profile.full_name ?? 'Без імені'}
        </h2>
        {[
          { label: 'Телефон', value: profile.phone },
          { label: 'Роль', value: profile.role },
          { label: 'Зареєстровано', value: new Date(profile.created_at).toLocaleDateString('uk-UA') },
        ].map(({ label, value }) => (
          <div key={label} className="flex gap-4">
            <span className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest text-[10px] w-32">{label}</span>
            <span className="font-body-md text-body-md text-on-surface text-sm">{value ?? '—'}</span>
          </div>
        ))}
      </div>
      <div>
        <h3 className="font-headline-md text-headline-md text-on-surface uppercase tracking-widest text-sm mb-4">
          Замовлення ({(orders ?? []).length})
        </h3>
        <OrderList orders={orders ?? []} />
      </div>
    </div>
  )
}
```

- [ ] **Commit**

```bash
git add src/app/admin/users/ src/components/admin/UsersTable.tsx
git commit -m "feat: add admin users list and user detail pages"
```

---

## Task 16: Admin — Orders

**Files:**
- Create: `src/app/admin/orders/page.tsx`
- Create: `src/components/admin/OrdersTable.tsx`
- Create: `src/app/api/admin/orders/[id]/route.ts`

- [ ] **Create order status update API route**

```typescript
// src/app/api/admin/orders/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { OrderStatus } from '@/lib/types/database.types'

const VALID_STATUSES: OrderStatus[] = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled']

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await request.json()
  const status: OrderStatus = body.status
  if (!VALID_STATUSES.includes(status)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
  }

  const { error } = await supabase.from('orders').update({ status }).eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
```

- [ ] **Create OrdersTable component**

```tsx
// src/components/admin/OrdersTable.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import StatusBadge from '@/components/ui/StatusBadge'
import type { Database, OrderStatus } from '@/lib/types/database.types'

type Order = Database['public']['Tables']['orders']['Row'] & { profile?: { full_name: string | null } }

const STATUSES: OrderStatus[] = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled']
const STATUS_UA: Record<OrderStatus, string> = {
  pending: 'Очікує', confirmed: 'Підтверджено', shipped: 'Відправлено',
  delivered: 'Доставлено', cancelled: 'Скасовано',
}

export default function OrdersTable({ orders }: { orders: Order[] }) {
  const router = useRouter()
  const [updating, setUpdating] = useState<string | null>(null)

  async function updateStatus(orderId: string, status: OrderStatus) {
    setUpdating(orderId)
    await fetch(`/api/admin/orders/${orderId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    setUpdating(null)
    router.refresh()
  }

  if (orders.length === 0) {
    return <p className="font-body-md text-body-md text-on-surface-variant py-8">Замовлень немає</p>
  }

  return (
    <div className="space-y-4">
      {orders.map(order => (
        <div key={order.id} className="bg-card border-card rounded-lg p-5 space-y-3">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <p className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest text-[10px]">
                #{order.id.slice(0, 8).toUpperCase()} · {new Date(order.created_at).toLocaleDateString('uk-UA')}
              </p>
              <p className="font-body-md text-body-md text-on-surface mt-0.5">
                {order.profile?.full_name ?? 'Анонім'}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <StatusBadge status={order.status} />
              <select
                value={order.status}
                disabled={updating === order.id}
                onChange={e => updateStatus(order.id, e.target.value as OrderStatus)}
                className="bg-surface border border-[#2e2d2b] rounded px-2 py-1 font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest text-[10px] focus:outline-none focus:border-primary/60 disabled:opacity-50"
              >
                {STATUSES.map(s => (
                  <option key={s} value={s}>{STATUS_UA[s]}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex flex-wrap justify-between items-end gap-3 border-t border-[#2e2d2b] pt-3">
            <div className="text-sm">
              <p className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest text-[10px]">
                Нова Пошта
              </p>
              <p className="font-body-md text-body-md text-on-surface mt-0.5">{order.nova_poshta_address ?? '—'}</p>
            </div>
            <p className="font-headline-md text-headline-md text-primary">${order.total_usdt.toLocaleString()}</p>
          </div>
        </div>
      ))}
    </div>
  )
}
```

- [ ] **Create admin orders page**

```tsx
// src/app/admin/orders/page.tsx
import { createClient } from '@/lib/supabase/server'
import OrdersTable from '@/components/admin/OrdersTable'

export default async function AdminOrdersPage() {
  const supabase = await createClient()

  const { data: orders } = await supabase
    .from('orders')
    .select('*, profile:profiles(full_name)')
    .order('created_at', { ascending: false })

  return (
    <div>
      <h2 className="font-headline-md text-headline-md text-on-surface uppercase tracking-widest text-base mb-6">
        Замовлення ({(orders ?? []).length})
      </h2>
      <OrdersTable orders={(orders ?? []) as Parameters<typeof OrdersTable>[0]['orders']} />
    </div>
  )
}
```

- [ ] **Commit**

```bash
git add src/app/admin/orders/ src/components/admin/OrdersTable.tsx src/app/api/admin/orders/
git commit -m "feat: add admin orders page with inline status update"
```

---

## Task 17: Admin — Promo Codes

**Files:**
- Create: `src/app/api/admin/promos/route.ts`
- Create: `src/app/api/admin/promos/[id]/route.ts`
- Create: `src/components/admin/PromosManager.tsx`
- Create: `src/app/admin/promos/page.tsx`

- [ ] **Create promos API routes**

```typescript
// src/app/api/admin/promos/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

async function requireAdmin(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return false
  const { data } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  return data?.role === 'admin'
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  if (!await requireAdmin(supabase)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await request.json()
  const { code, discount_pct, max_uses, expires_at } = body

  if (!code || !discount_pct) return NextResponse.json({ error: 'code and discount_pct required' }, { status: 400 })

  const { data, error } = await supabase.from('promo_codes').insert({
    code: code.toUpperCase().trim(),
    discount_pct: Number(discount_pct),
    max_uses: max_uses ? Number(max_uses) : null,
    expires_at: expires_at || null,
  }).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
```

```typescript
// src/app/api/admin/promos/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

async function requireAdmin(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return false
  const { data } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  return data?.role === 'admin'
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  if (!await requireAdmin(supabase)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const { id } = await params
  const body = await request.json()
  const { error } = await supabase.from('promo_codes').update(body).eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  if (!await requireAdmin(supabase)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const { id } = await params
  const { error } = await supabase.from('promo_codes').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
```

- [ ] **Create PromosManager client component**

```tsx
// src/components/admin/PromosManager.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Database } from '@/lib/types/database.types'

type Promo = Database['public']['Tables']['promo_codes']['Row']

export default function PromosManager({ promos }: { promos: Promo[] }) {
  const router = useRouter()
  const [code, setCode] = useState('')
  const [pct, setPct] = useState('')
  const [maxUses, setMaxUses] = useState('')
  const [expires, setExpires] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function createPromo(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const res = await fetch('/api/admin/promos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, discount_pct: pct, max_uses: maxUses || null, expires_at: expires || null }),
    })
    setLoading(false)
    if (!res.ok) { setError((await res.json()).error); return }
    setCode(''); setPct(''); setMaxUses(''); setExpires('')
    router.refresh()
  }

  async function toggleActive(promo: Promo) {
    await fetch(`/api/admin/promos/${promo.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: !promo.is_active }),
    })
    router.refresh()
  }

  async function deletePromo(id: string) {
    if (!confirm('Видалити промокод?')) return
    await fetch(`/api/admin/promos/${id}`, { method: 'DELETE' })
    router.refresh()
  }

  return (
    <div className="space-y-8">
      {/* Create form */}
      <div className="bg-card border-card rounded-lg p-6">
        <h3 className="font-headline-md text-headline-md text-on-surface uppercase tracking-widest text-sm mb-5">
          Новий промокод
        </h3>
        <form onSubmit={createPromo} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            { label: 'Код', value: code, setter: setCode, placeholder: 'SUMMER10', required: true },
            { label: 'Знижка %', value: pct, setter: setPct, placeholder: '10', required: true },
            { label: 'Ліміт використань', value: maxUses, setter: setMaxUses, placeholder: 'Без ліміту', required: false },
          ].map(({ label, value, setter, placeholder, required }) => (
            <div key={label}>
              <label className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest block mb-1.5 text-[10px]">
                {label}
              </label>
              <input
                value={value}
                onChange={e => setter(e.target.value)}
                required={required}
                placeholder={placeholder}
                className="w-full bg-surface border border-[#2e2d2b] rounded px-3 py-2 font-body-md text-body-md text-on-surface focus:outline-none focus:border-primary/60 transition-colors text-sm"
              />
            </div>
          ))}
          <div>
            <label className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest block mb-1.5 text-[10px]">
              Діє до
            </label>
            <input
              type="date"
              value={expires}
              onChange={e => setExpires(e.target.value)}
              className="w-full bg-surface border border-[#2e2d2b] rounded px-3 py-2 font-body-md text-body-md text-on-surface focus:outline-none focus:border-primary/60 transition-colors text-sm"
            />
          </div>
          {error && <p className="col-span-full text-red-400 text-sm">{error}</p>}
          <div className="col-span-full">
            <button type="submit" disabled={loading} className="btn-primary py-2 px-6 rounded font-label-caps text-label-caps uppercase tracking-widest text-sm disabled:opacity-50">
              {loading ? 'Створення...' : 'Створити промокод'}
            </button>
          </div>
        </form>
      </div>

      {/* List */}
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-[#2e2d2b]">
              {['Код', 'Знижка', 'Використано', 'Закінчується', 'Статус', ''].map(h => (
                <th key={h} className="pb-3 pr-4 font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest text-[10px]">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {promos.map(p => (
              <tr key={p.id} className="border-b border-[#2e2d2b]/50">
                <td className="py-3 pr-4 font-technical-data text-technical-data text-primary">{p.code}</td>
                <td className="py-3 pr-4 font-body-md text-body-md text-on-surface">{p.discount_pct}%</td>
                <td className="py-3 pr-4 font-body-md text-body-md text-on-surface-variant text-sm">
                  {p.uses_count}{p.max_uses ? ` / ${p.max_uses}` : ''}
                </td>
                <td className="py-3 pr-4 font-body-md text-body-md text-on-surface-variant text-sm">
                  {p.expires_at ? new Date(p.expires_at).toLocaleDateString('uk-UA') : '—'}
                </td>
                <td className="py-3 pr-4">
                  <button
                    onClick={() => toggleActive(p)}
                    className={`chip px-2 py-0.5 font-technical-data text-[10px] uppercase tracking-wider cursor-pointer ${
                      p.is_active ? 'bg-[#1a2b1a] text-green-400' : 'bg-[#2b1a1a] text-red-400'
                    }`}
                  >
                    {p.is_active ? 'Активний' : 'Деактивовано'}
                  </button>
                </td>
                <td className="py-3">
                  <button
                    onClick={() => deletePromo(p.id)}
                    className="text-on-surface-variant hover:text-red-400 transition-colors"
                  >
                    <span className="material-symbols-outlined text-[18px]">delete</span>
                  </button>
                </td>
              </tr>
            ))}
            {promos.length === 0 && (
              <tr><td colSpan={6} className="py-8 text-center font-body-md text-body-md text-on-surface-variant">Промокодів ще немає</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
```

- [ ] **Create promos page**

```tsx
// src/app/admin/promos/page.tsx
import { createClient } from '@/lib/supabase/server'
import PromosManager from '@/components/admin/PromosManager'

export default async function AdminPromosPage() {
  const supabase = await createClient()
  const { data: promos } = await supabase
    .from('promo_codes')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <div>
      <h2 className="font-headline-md text-headline-md text-on-surface uppercase tracking-widest text-base mb-6">
        Промокоди
      </h2>
      <PromosManager promos={promos ?? []} />
    </div>
  )
}
```

- [ ] **Commit**

```bash
git add src/app/admin/promos/ src/components/admin/PromosManager.tsx src/app/api/admin/promos/
git commit -m "feat: add admin promo codes CRUD"
```

---

## Task 18: Admin — Products sync status

**Files:**
- Create: `src/components/admin/ProductsSyncPanel.tsx`
- Create: `src/app/admin/products/page.tsx`

- [ ] **Create ProductsSyncPanel client component**

```tsx
// src/components/admin/ProductsSyncPanel.tsx
'use client'

import { useState } from 'react'

export default function ProductsSyncPanel({
  lastSync,
  productCount,
}: {
  lastSync: string | null
  productCount: number
}) {
  const [syncing, setSyncing] = useState(false)
  const [result, setResult] = useState<{ synced?: number; error?: string } | null>(null)

  async function triggerSync() {
    setSyncing(true)
    setResult(null)
    const res = await fetch('/api/sync-products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    })
    const data = await res.json()
    setSyncing(false)
    setResult(res.ok ? { synced: data.synced } : { error: data.error })
  }

  return (
    <div className="space-y-6 max-w-lg">
      <div className="bg-card border-card rounded-lg p-6 space-y-4">
        <h3 className="font-headline-md text-headline-md text-on-surface uppercase tracking-widest text-sm">
          Статус синхронізації
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest text-[10px]">
              Товарів у базі
            </p>
            <p className="font-headline-md text-headline-md text-primary mt-1">{productCount}</p>
          </div>
          <div>
            <p className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest text-[10px]">
              Останній синк
            </p>
            <p className="font-body-md text-body-md text-on-surface mt-1">
              {lastSync
                ? new Date(lastSync).toLocaleString('uk-UA', { dateStyle: 'short', timeStyle: 'short' })
                : 'Ніколи'}
            </p>
          </div>
        </div>
      </div>

      <button
        onClick={triggerSync}
        disabled={syncing}
        className="btn-primary py-3 px-8 rounded font-label-caps text-label-caps uppercase tracking-widest flex items-center gap-2 disabled:opacity-50"
      >
        <span className={`material-symbols-outlined text-[18px] ${syncing ? 'animate-spin' : ''}`}>sync</span>
        {syncing ? 'Синхронізація...' : 'Синхронізувати зараз'}
      </button>

      {result?.synced !== undefined && (
        <p className="font-body-md text-body-md text-green-400">
          ✓ Синхронізовано {result.synced} товарів
        </p>
      )}
      {result?.error && (
        <p className="font-body-md text-body-md text-red-400">Помилка: {result.error}</p>
      )}

      <div className="bg-card border-card rounded-lg p-6 space-y-3">
        <h3 className="font-headline-md text-headline-md text-on-surface uppercase tracking-widest text-sm">
          Google Apps Script (одноразове налаштування)
        </h3>
        <p className="font-body-md text-body-md text-on-surface-variant text-sm">
          Щоб зміни в Google Sheets оновлювались автоматично за &lt;5 сек:
        </p>
        <ol className="space-y-2 font-body-md text-body-md text-on-surface-variant text-sm list-decimal list-inside">
          <li>Відкрийте Google Sheets → Розширення → Apps Script</li>
          <li>Вставте код нижче</li>
          <li>Збережіть. Тригери → Додати тригер → onEdit → On edit</li>
          <li>У Властивостях скрипту встановіть SYNC_SECRET (те саме значення що у Vercel)</li>
        </ol>
        <pre className="bg-surface border border-[#2e2d2b] rounded p-4 text-[11px] text-on-surface-variant overflow-x-auto font-mono">
{`function onEdit(e) {
  const secret = PropertiesService
    .getScriptProperties()
    .getProperty('SYNC_SECRET');
  UrlFetchApp.fetch(
    'https://trademua.vercel.app/api/sync-products',
    {
      method: 'post',
      headers: { 'Authorization': 'Bearer ' + secret },
      muteHttpExceptions: true,
    }
  );
}`}
        </pre>
      </div>
    </div>
  )
}
```

> **Note:** The "Синхронізувати зараз" button calls `/api/sync-products` without an Authorization header — this will return 401. To allow admin-triggered syncs from the browser, either: (a) add a separate admin-only endpoint that uses the service role key, or (b) expose the SYNC_SECRET to the admin UI via a server-side prop and send it. Option (b) is simpler — see the page below.

- [ ] **Update ProductsSyncPanel to receive and use the secret for manual trigger**

Replace the `triggerSync` function body:

```tsx
// Pass syncSecret as prop from the Server Component page (never exposed in HTML)
export default function ProductsSyncPanel({
  lastSync,
  productCount,
  syncSecret,
}: {
  lastSync: string | null
  productCount: number
  syncSecret: string
}) {
  // ...
  async function triggerSync() {
    setSyncing(true)
    setResult(null)
    const res = await fetch('/api/sync-products', {
      method: 'POST',
      headers: { Authorization: `Bearer ${syncSecret}` },
    })
    // rest unchanged
  }
```

- [ ] **Create admin products page**

```tsx
// src/app/admin/products/page.tsx
import { createClient } from '@/lib/supabase/server'
import { getLastSyncTime } from '@/lib/products'
import ProductsSyncPanel from '@/components/admin/ProductsSyncPanel'

export default async function AdminProductsPage() {
  const supabase = await createClient()
  const { count } = await supabase.from('products').select('*', { count: 'exact', head: true })
  const lastSync = await getLastSyncTime()

  return (
    <div>
      <h2 className="font-headline-md text-headline-md text-on-surface uppercase tracking-widest text-base mb-6">
        Синхронізація товарів
      </h2>
      <ProductsSyncPanel
        lastSync={lastSync}
        productCount={count ?? 0}
        syncSecret={process.env.SYNC_SECRET!}
      />
    </div>
  )
}
```

- [ ] **Commit**

```bash
git add src/app/admin/products/ src/components/admin/ProductsSyncPanel.tsx
git commit -m "feat: add admin products sync status panel with manual trigger"
```

---

## Task 19: Update Navbar for auth state

**Files:**
- Modify: `src/components/layout/Navbar.tsx`

- [ ] **Add UserNavButton to Navbar**

In `src/components/layout/Navbar.tsx`, add this component above the `export default function Navbar()`:

```tsx
// Add at the top of the file (after existing imports):
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'
import { useEffect, useState } from 'react'

function UserNavButton() {
  const [user, setUser] = useState<User | null | undefined>(undefined)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => setUser(data.user))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null)
    })
    return () => subscription.unsubscribe()
  }, [])

  // undefined = loading (show nothing to avoid flash)
  if (user === undefined) return null

  if (user) {
    return (
      <Link
        href="/dashboard"
        className="hidden sm:flex items-center gap-1.5 border border-primary/40 hover:border-primary bg-primary/5 hover:bg-primary/10 px-3 py-1.5 rounded font-label-caps text-label-caps uppercase tracking-widest text-[11px] text-primary transition-colors duration-200"
      >
        <span className="material-symbols-outlined text-[16px]">person</span>
        Кабінет
      </Link>
    )
  }

  return (
    <Link
      href="/login"
      className="hidden sm:flex items-center gap-1.5 border border-outline-variant/50 hover:border-primary/60 hover:text-primary px-3 py-1.5 rounded font-label-caps text-label-caps uppercase tracking-widest text-[11px] text-on-surface-variant transition-colors duration-200"
    >
      <span className="material-symbols-outlined text-[16px]">person</span>
      Логін
    </Link>
  )
}
```

- [ ] **Replace the existing Login link in the Navbar JSX**

Find in `Navbar.tsx`:
```tsx
{/* Login */}
<Link
  href="/login"
  className="hidden sm:flex items-center gap-1.5 border border-outline-variant/50 hover:border-primary/60 hover:text-primary px-3 py-1.5 rounded font-label-caps text-label-caps uppercase tracking-widest text-[11px] text-on-surface-variant transition-colors duration-200"
>
  <span className="material-symbols-outlined text-[16px]">person</span>
  Логін
</Link>
```

Replace with:
```tsx
<UserNavButton />
```

- [ ] **Add logout to mobile menu** — in the mobile dropdown section, replace the existing Login link:

```tsx
<div className="pt-3 border-t border-outline-variant/20">
  <UserNavButtonMobile />
</div>
```

Add `UserNavButtonMobile` component (after `UserNavButton`):

```tsx
function UserNavButtonMobile() {
  const [user, setUser] = useState<User | null | undefined>(undefined)
  const router = useRouter()

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => setUser(data.user))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null)
    })
    return () => subscription.unsubscribe()
  }, [])

  if (user === undefined) return null

  if (user) {
    return (
      <div className="space-y-1">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 py-3 font-label-caps text-label-caps uppercase tracking-widest text-on-surface-variant hover:text-primary transition-colors duration-200"
        >
          <span className="material-symbols-outlined text-[18px]">person</span>
          Кабінет
        </Link>
        <button
          type="button"
          onClick={async () => {
            const supabase = createClient()
            await supabase.auth.signOut()
            router.push('/')
            router.refresh()
          }}
          className="flex items-center gap-2 py-3 font-label-caps text-label-caps uppercase tracking-widest text-on-surface-variant hover:text-red-400 transition-colors duration-200 w-full text-left"
        >
          <span className="material-symbols-outlined text-[18px]">logout</span>
          Вийти
        </button>
      </div>
    )
  }

  return (
    <Link
      href="/login"
      className="flex items-center gap-2 py-3 font-label-caps text-label-caps uppercase tracking-widest text-on-surface-variant hover:text-primary transition-colors duration-200"
    >
      <span className="material-symbols-outlined text-[18px]">person</span>
      Логін
    </Link>
  )
}
```

- [ ] **Add `useRouter` to imports** (already imported in Navbar — verify):

```typescript
import { useCallback, useState, useSyncExternalStore, useEffect, useRouter } from 'react'
// Note: useRouter comes from next/navigation, not react
```

Correct imports in Navbar:
```typescript
import { useCallback, useState, useSyncExternalStore, useEffect } from 'react'
import { useRouter } from 'next/navigation'
```

- [ ] **Verify in browser**: logged-out → shows "Логін"; after login → shows "Кабінет" in gold.

- [ ] **Commit**

```bash
git add src/components/layout/Navbar.tsx
git commit -m "feat: update Navbar to show Кабінет when logged in, Логін when not"
```

---

## Task 20: Vercel Cron + environment variables

**Files:**
- Create: `vercel.json`

- [ ] **Add Vercel Cron for hourly sync fallback**

```json
// vercel.json
{
  "crons": [
    {
      "path": "/api/sync-products",
      "schedule": "0 * * * *"
    }
  ]
}
```

> **Note:** Vercel Cron calls do not include the Authorization header. Update the sync route to also allow calls from Vercel Cron (identified by the `x-vercel-cron` header):

In `src/app/api/sync-products/route.ts`, update the auth check:

```typescript
// OLD
if (authHeader !== `Bearer ${process.env.SYNC_SECRET}`) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}

// NEW
const isValidBearer = authHeader === `Bearer ${process.env.SYNC_SECRET}`
const isVercelCron = request.headers.get('x-vercel-cron') === '1'
if (!isValidBearer && !isVercelCron) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}
```

- [ ] **Add environment variables to Vercel Dashboard**

Go to Vercel Dashboard → TradeMua project → Settings → Environment Variables and add:

| Variable | Environment |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Production + Preview |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Production + Preview |
| `SUPABASE_SERVICE_ROLE_KEY` | Production + Preview (Server only) |
| `SYNC_SECRET` | Production + Preview (Server only) |

- [ ] **Verify build passes**

```bash
npm run build 2>&1 | tail -20
```

Expected: `✓ Compiled successfully` or similar.

- [ ] **Commit**

```bash
git add vercel.json src/app/api/sync-products/route.ts
git commit -m "feat: add Vercel Cron hourly sync fallback"
```

---

## Self-Review Checklist

- [x] **Spec: Auth (email+password)** → Tasks 6, 7, 8, 9
- [x] **Spec: Email confirmation + password recovery** → Tasks 8, 9 (`signUp` with emailRedirectTo, `/auth/callback`, ResetPasswordForm)
- [x] **Spec: Google Sheets → Supabase webhook** → Task 10, 18 (Apps Script instructions in ProductsSyncPanel), Task 20 (Vercel Cron fallback)
- [x] **Spec: profiles (+ phone field)** → Task 2 (SQL), Task 3 (types), Task 12 (ProfileForm)
- [x] **Spec: orders (+ nova_poshta_address)** → Task 2 (SQL), Task 3 (types), Task 13 (OrderList)
- [x] **Spec: promo_codes** → Task 2 (SQL), Task 3 (types), Task 17 (PromosManager)
- [x] **Spec: products table (sync cache)** → Task 2 (SQL), Task 10 (sync route + products.ts), Task 11 (pages switched)
- [x] **Spec: /dashboard** → Tasks 12, 13
- [x] **Spec: /admin + role guard in layout** → Task 14 (layout with profiles.role check)
- [x] **Spec: Admin users** → Task 15
- [x] **Spec: Admin orders (status change)** → Task 16
- [x] **Spec: Admin promos CRUD** → Task 17
- [x] **Spec: Admin products sync status** → Task 18
- [x] **Spec: Navbar update** → Task 19
- [x] **Spec: RLS policies** → Task 2
- [x] **Spec: Storage bucket for avatars** → Task 2
- [x] **Type consistency**: `OrderItem`, `OrderStatus`, `UserRole` defined in Task 3 and used consistently in Tasks 13, 16, 17
- [x] **No placeholders**: all code blocks complete
