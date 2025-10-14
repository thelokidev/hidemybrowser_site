import { NextRequest, NextResponse } from 'next/server'
import { verifyCron } from '@/lib/cron/auth'
import { createAdminClient } from '@/lib/supabase/admin'

async function handle(request: NextRequest) {
  const unauthorized = verifyCron(request)
  if (unauthorized) return unauthorized

  const supabase = createAdminClient()
  const nowIso = new Date().toISOString()

  // Pull items due for retry and not exceeding max retries
  const { data: items, error } = await supabase
    .from('webhook_retry_queue')
    .select('id, event_id, retry_count, max_retries, next_retry_at')
    .lte('next_retry_at', nowIso)
    .limit(100)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!items || items.length === 0) return NextResponse.json({ processed: 0 })

  let processed = 0
  for (const it of items) {
    try {
      // If already processed, remove from queue
      const { data: ev } = await supabase
        .from('dodo_webhook_events')
        .select('processed')
        .eq('event_id', it.event_id)
        .single()

      if (ev?.processed === true) {
        await supabase.from('webhook_retry_queue').delete().eq('id', it.id)
        processed++
        continue
      }

      // Not yet processed: backoff and try later (Dodo will retry on its own as we returned 500)
      const newRetryCount = (it.retry_count ?? 0) + 1
      if (newRetryCount >= (it.max_retries ?? 3)) {
        // reached max: keep record but stop scheduling further retries
        await supabase
          .from('webhook_retry_queue')
          .update({ retry_count: newRetryCount, next_retry_at: null, updated_at: new Date().toISOString() })
          .eq('id', it.id)
      } else {
        const delaySeconds = Math.pow(2, newRetryCount)
        const nextRetryAt = new Date(Date.now() + delaySeconds * 1000).toISOString()
        await supabase
          .from('webhook_retry_queue')
          .update({ retry_count: newRetryCount, next_retry_at: nextRetryAt, updated_at: new Date().toISOString() })
          .eq('id', it.id)
      }
      processed++
    } catch (e: any) {
      // continue others, but record last error in item for visibility
      try {
        await supabase
          .from('webhook_retry_queue')
          .update({ last_error: String(e), updated_at: new Date().toISOString() })
          .eq('id', it.id)
      } catch {}
    }
  }

  return NextResponse.json({ processed })
}

export async function POST(request: NextRequest) {
  return handle(request)
}

export async function GET(request: NextRequest) {
  return handle(request)
}
