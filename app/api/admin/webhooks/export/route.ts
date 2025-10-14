import { NextRequest, NextResponse } from 'next/server'
import { isAdminUser } from '@/lib/supabase/admin-guard'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!isAdminUser(user)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  
  const supabaseAdmin = createAdminClient()

  const url = new URL(request.url)
  const q = url.searchParams.get('q') || undefined
  const type = url.searchParams.get('type') || undefined
  const processed = url.searchParams.get('processed') || undefined

  let query = supabaseAdmin
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
