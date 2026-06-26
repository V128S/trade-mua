import { NextRequest, NextResponse } from 'next/server'
import { runSync } from '@/lib/sync'

function isAuthorized(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization')
  const isValidBearer = !!process.env.SYNC_SECRET && authHeader === `Bearer ${process.env.SYNC_SECRET}`
  const isValidCron = !!process.env.CRON_SECRET && authHeader === `Bearer ${process.env.CRON_SECRET}`
  const isVercelCron = request.headers.get('x-vercel-cron') === '1'
  return isValidBearer || isValidCron || isVercelCron
}

async function handle(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const result = await runSync()
  if ('error' in result) return NextResponse.json(result, { status: 500 })
  return NextResponse.json(result)
}

// Apps Script webhook (POST, Bearer SYNC_SECRET).
export const POST = handle
// Vercel Cron (GET, Bearer CRON_SECRET).
export const GET = handle
