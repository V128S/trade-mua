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
    try {
      const res = await fetch('/api/admin/sync-trigger', { method: 'POST' })
      const data = await res.json()
      setResult(res.ok ? { synced: data.synced } : { error: data.error })
    } catch {
      setResult({ error: 'Помилка мережі' })
    } finally {
      setSyncing(false)
    }
  }

  return (
    <div className="space-y-6 max-w-lg">
      <div className="bg-card border-card rounded-lg p-6 space-y-4">
        <h3 className="font-headline-md text-headline-md text-on-surface uppercase tracking-widest text-sm">
          Статус синхронізації
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest text-[10px]">Товарів у базі</p>
            <p className="font-headline-md text-headline-md text-primary mt-1">{productCount}</p>
          </div>
          <div>
            <p className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest text-[10px]">Останній синк</p>
            <p className="font-body-md text-body-md text-on-surface mt-1">
              {lastSync ? new Date(lastSync).toLocaleString('uk-UA', { dateStyle: 'short', timeStyle: 'short' }) : 'Ніколи'}
            </p>
          </div>
        </div>
      </div>

      <button onClick={triggerSync} disabled={syncing}
        className="btn-primary py-3 px-8 rounded font-label-caps text-label-caps uppercase tracking-widest flex items-center gap-2 disabled:opacity-50">
        <span className={`material-symbols-outlined text-[18px] ${syncing ? 'animate-spin' : ''}`}>sync</span>
        {syncing ? 'Синхронізація...' : 'Синхронізувати зараз'}
      </button>

      {result?.synced !== undefined && (
        <p className="font-body-md text-body-md text-green-400">✓ Синхронізовано {result.synced} товарів</p>
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
          <li>У Властивостях скрипту встановіть SYNC_SECRET</li>
        </ol>
        <pre className="bg-surface border border-card-border rounded p-4 text-[11px] text-on-surface-variant overflow-x-auto font-mono whitespace-pre-wrap">
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
