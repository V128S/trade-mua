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
            <Image src={avatarUrl} alt="Avatar" width={80} height={80} className="object-cover w-full h-full" unoptimized />
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
