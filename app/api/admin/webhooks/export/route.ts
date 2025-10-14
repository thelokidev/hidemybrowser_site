import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { isAdminUser } from '@/lib/supabase/admin-guard'
import { Database } from '@/types/database.types'

function getSupabase(req: NextRequest, res: NextResponse) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  return createServerClient<Database>(url, key, {
    cookies: {
      get: (name) => req.cookies.get(name)?.value,
      set: (name, value, options: CookieOptions) => res.cookies.set({ name, value, ...options }),
      remove: (name, options: CookieOptions) => res.cookies.set({ name, value: '', ...options }),
    },
  })
}

export async function GET(request: NextRequest) {
  const response = NextResponse.next()
  const supabase = getSupabase(request, response)
  const { data: { user } } = await supabase.auth.getUser()
  if (!isAdminUser(user)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const url = new URL(request.url)
  const q = url.searchParams.get('q') || undefined
  const type = url.searchParams.get('type') || undefined
  const processed = url.searchParams.get('processed') || undefined

  let query = supabase
    .from('dodo_webhook_events')
    .select('event_id, event_type, processed, error_message, created_at')
    .order('created_at', { ascending: false })
    .limit(500)
  if (type) query = query.eq('event_type', type)
  if (processed === 'yes') query = query.eq('processed', true)
  if (processed === 'no') query = query.eq('processed', false)
  if (q) query = query.ilike('event_id', `%${q}%`)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const rows = data ?? []
  const header = ['event_id', 'event_type', 'processed', 'error_message', 'created_at']
  const csv = [header.join(',')]
  for (const r of rows) {
    const line = [
      r.event_id,
      r.event_type,
      r.processed ? 'true' : 'false',
      (r.error_message || '').replaceAll('\n',' ').replaceAll('"','""'),
      r.created_at,
    ]
    csv.push(line.map(v => `"${String(v ?? '').replaceAll('"','""')}"`).join(','))
  }
  const body = csv.join('\n')
  return new NextResponse(body, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="webhooks_export.csv"`,
    },
  })
}
