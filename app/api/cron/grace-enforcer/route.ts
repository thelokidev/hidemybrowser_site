import { NextRequest, NextResponse } from 'next/server'
import { verifyCron } from '@/lib/cron/auth'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(request: NextRequest) {
  const unauthorized = verifyCron(request)
  if (unauthorized) return unauthorized

  const supabase = createAdminClient()
  const now = new Date().toISOString()

  const { data: subs, error } = await supabase
    .from('subscriptions')
    .select('id')
    .eq('status', 'suspended')
    .lte('grace_period_end', now)
    .limit(500)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!subs || subs.length === 0) return NextResponse.json({ enforced: 0 })

  let updated = 0
  for (const s of subs) {
    const { error: updErr } = await supabase
      .from('subscriptions')
      .update({ status: 'expired', updated_at: now })
      .eq('id', s.id)
    if (!updErr) updated++
  }

  return NextResponse.json({ enforced: updated })
}
