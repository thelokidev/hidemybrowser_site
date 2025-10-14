import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { isAdminUser } from '@/lib/supabase/admin-guard'
import { createAdminClient } from '@/lib/supabase/admin'
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

export async function POST(request: NextRequest) {
  const response = NextResponse.next()
  const sb = getSupabase(request, response)
  const { data: { user } } = await sb.auth.getUser()
  if (!isAdminUser(user)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const payload = await request.json().catch(() => null) as { event_id?: string; action?: 'requeue' | 'mark_processed' }
  if (!payload?.event_id || !payload.action) return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })

  const supabase = createAdminClient()

  if (payload.action === 'mark_processed') {
    const { error } = await supabase
      .from('dodo_webhook_events')
      .update({ processed: true, error_message: null })
      .eq('event_id', payload.event_id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  }

  // requeue: upsert into webhook_retry_queue with immediate next_retry_at
  const nowIso = new Date().toISOString()
  const { data: existing } = await supabase
    .from('webhook_retry_queue')
    .select('id, retry_count, max_retries')
    .eq('event_id', payload.event_id)
    .limit(1)

  if (existing && existing.length > 0) {
    const { error } = await supabase
      .from('webhook_retry_queue')
      .update({ next_retry_at: nowIso, updated_at: nowIso })
      .eq('id', existing[0].id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  } else {
    const { error } = await supabase
      .from('webhook_retry_queue')
      .insert({ event_id: payload.event_id, retry_count: 0, max_retries: 3, next_retry_at: nowIso, created_at: nowIso, updated_at: nowIso })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  }
}
