import { NextRequest, NextResponse } from 'next/server'
import { requireStaff } from '@/lib/supabase/admin'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/types/database.types'

const BUCKET = 'product-photos'
const MAX_BYTES = 5 * 1024 * 1024
const EXT: Record<string, string> = { 'image/png': 'png', 'image/jpeg': 'jpg', 'image/webp': 'webp' }

function service() {
  return createServiceClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

// Extract the in-bucket object path from a public URL, or null if the URL isn't
// one of ours (e.g. a Sheet/Cloudinary link — we must not try to delete those).
function storagePath(url: string | null): string | null {
  if (!url) return null
  const marker = `/storage/v1/object/public/${BUCKET}/`
  const i = url.indexOf(marker)
  return i === -1 ? null : decodeURIComponent(url.slice(i + marker.length).split('?')[0])
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireStaff())) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const { id } = await params

  const form = await request.formData()
  const file = form.get('file')
  if (!(file instanceof File)) return NextResponse.json({ error: 'Файл не надано' }, { status: 400 })

  const ext = EXT[file.type]
  if (!ext) return NextResponse.json({ error: 'Лише PNG, JPG або WEBP' }, { status: 400 })
  if (file.size > MAX_BYTES) return NextResponse.json({ error: 'Файл більший за 5 МБ' }, { status: 400 })

  const svc = service()
  const path = `${id}/${Date.now()}.${ext}`
  const buffer = Buffer.from(await file.arrayBuffer())

  const { error: upErr } = await svc.storage.from(BUCKET).upload(path, buffer, {
    contentType: file.type,
    upsert: false,
  })
  if (upErr) return NextResponse.json({ error: upErr.message }, { status: 500 })

  const url = svc.storage.from(BUCKET).getPublicUrl(path).data.publicUrl

  // Swap the DB pointer, then best-effort remove the previously uploaded file.
  const { data: prev } = await svc.from('products').select('image_url_admin').eq('id', id).maybeSingle()
  const { error: dbErr } = await svc.from('products').update({ image_url_admin: url }).eq('id', id)
  if (dbErr) {
    await svc.storage.from(BUCKET).remove([path]) // roll back the orphan upload
    return NextResponse.json({ error: dbErr.message }, { status: 500 })
  }

  const oldPath = storagePath(prev?.image_url_admin ?? null)
  if (oldPath && oldPath !== path) await svc.storage.from(BUCKET).remove([oldPath])

  return NextResponse.json({ url })
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireStaff())) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const { id } = await params

  const svc = service()
  const { data: prev } = await svc.from('products').select('image_url_admin').eq('id', id).maybeSingle()

  const { error: dbErr } = await svc.from('products').update({ image_url_admin: null }).eq('id', id)
  if (dbErr) return NextResponse.json({ error: dbErr.message }, { status: 500 })

  const path = storagePath(prev?.image_url_admin ?? null)
  if (path) await svc.storage.from(BUCKET).remove([path])

  return NextResponse.json({ ok: true })
}
