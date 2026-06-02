import { createClient } from '@/lib/supabase/server'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/types/database.types'

export async function requireAdmin(): Promise<SupabaseClient<Database> | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  if (data?.role !== 'admin') return null
  return supabase
}

// Like requireAdmin but also allows the 'director' role. Use for staff actions
// (orders, promos, product sync). Role changes must stay on requireAdmin.
export async function requireStaff(): Promise<SupabaseClient<Database> | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  if (data?.role !== 'admin' && data?.role !== 'director') return null
  return supabase
}
