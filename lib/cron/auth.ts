import { type NextRequest, NextResponse } from 'next/server'

export function verifyCron(request: NextRequest): NextResponse | undefined {
  const secret = process.env.CRON_SECRET
  if (!secret) {
    return NextResponse.json({ error: 'CRON_SECRET not set' }, { status: 500 })
  }
  const header = request.headers.get('authorization') || request.headers.get('x-cron-secret')
  const token = header?.startsWith('Bearer ')
    ? header.slice('Bearer '.length).trim()
    : header?.trim()
  if (!token || token !== secret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  return undefined
}
