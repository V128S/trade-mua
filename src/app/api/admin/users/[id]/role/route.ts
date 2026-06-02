import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/supabase/admin'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import type { Database, UserRole } from '@/lib/types/database.types'

const VALID_ROLES: UserRole[] = ['customer', 'director', 'admin']

// Assign a role to a user. Admin-only (directors can do everything EXCEPT change
// roles). Profiles have no RLS write path for other users, so we use the service
// role here — the requireAdmin() gate is the only authorization.
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await requireAdmin()
  if (!supabase) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await params
  const body = await request.json()
  const role: UserRole = body.role

  if (!VALID_ROLES.includes(role)) {
    return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
  }

  // Prevent an admin from demoting themselves (avoids accidental lockout).
  const { data: { user } } = await supabase.auth.getUser()
  if (user?.id === id) {
    return NextResponse.json({ error: 'Не можна змінити власну роль' }, { status: 400 })
  }

  const service = createServiceClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  const { error } = await service.from('profiles').update({ role }).eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
