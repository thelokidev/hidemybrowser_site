import { NextRequest, NextResponse } from 'next/server'
import { verifyCron } from '@/lib/cron/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { nextRetryAt } from '@/lib/payments/retry-scheduler'

export async function POST(request: NextRequest) {
  const unauthorized = verifyCron(request)
  if (unauthorized) return unauthorized

  const supabase = createAdminClient()
  const nowIso = new Date().toISOString()

  // Find attempts ready for retry
  const { data: attempts, error } = await supabase
    .from('payment_attempts')
    .select('id, user_id, subscription_id, failure_count, next_retry_at, status')
    .eq('status', 'retrying')
    .lte('next_retry_at', nowIso)
    .limit(100)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!attempts || attempts.length === 0) return NextResponse.json({ retried: 0 })

  // Best-effort scheduling for next tries; actual charge should be triggered via provider API from server flows.
  let processed = 0
  for (const a of attempts) {
    try {
      const next = nextRetryAt((a.failure_count ?? 0) + 1)
      const reachedLimit = next === null

      if (reachedLimit) {
        // Grace enforcement handled by webhook payment.failed path; here we just mark suspended for visibility
        await supabase
          .from('payment_attempts')
          .update({ status: 'suspended', updated_at: new Date().toISOString() })
          .eq('id', a.id)
      } else {
        await supabase
          .from('payment_attempts')
          .update({ next_retry_at: next, updated_at: new Date().toISOString() })
          .eq('id', a.id)
      }
      processed++
    } catch (e) {
      // continue others
    }
  }

  return NextResponse.json({ retried: processed })
}
