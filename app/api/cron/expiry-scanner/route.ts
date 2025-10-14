import { NextRequest, NextResponse } from 'next/server'
import { verifyCron } from '@/lib/cron/auth'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(request: NextRequest) {
  const unauthorized = verifyCron(request)
  if (unauthorized) return unauthorized

  const supabase = createAdminClient()
  const in7 = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
  const now = new Date().toISOString()

  const { count, error } = await supabase
    .from('subscriptions')
    .select('id', { count: 'exact', head: true })
    .gte('current_period_end', now)
    .lte('current_period_end', in7)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ expiring_in_7_days: count ?? 0 })
}
