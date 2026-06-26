import { NextResponse } from 'next/server'
import { requireStaff } from '@/lib/supabase/admin'
import { runSync } from '@/lib/sync'

export async function POST() {
  const supabase = await requireStaff()
  if (!supabase) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const result = await runSync()
  if ('error' in result) return NextResponse.json(result, { status: 500 })
  return NextResponse.json(result)
}
