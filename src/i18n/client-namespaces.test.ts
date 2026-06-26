import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { CLIENT_NAMESPACES } from './client-namespaces'

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const p = join(dir, entry)
    if (statSync(p).isDirectory()) return walk(p)
    return p.endsWith('.tsx') || p.endsWith('.ts') ? [p] : []
  })
}

describe('CLIENT_NAMESPACES covers every client-component namespace', () => {
  it('lists every useTranslations namespace used in a "use client" file', () => {
    const allowed = new Set<string>(CLIENT_NAMESPACES)
    const offenders: string[] = []
    for (const file of [...walk('src/components'), ...walk('src/app')]) {
      const src = readFileSync(file, 'utf8')
      if (!/^['"]use client['"]/m.test(src)) continue
      for (const m of src.matchAll(/useTranslations\(\s*['"]([a-zA-Z0-9_]+)['"]/g)) {
        if (!allowed.has(m[1])) offenders.push(`${file} → "${m[1]}"`)
      }
    }
    expect(offenders, `Add these namespaces to CLIENT_NAMESPACES:\n${offenders.join('\n')}`).toEqual([])
  })
})
