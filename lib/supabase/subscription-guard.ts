import { type SupabaseClient } from '@supabase/supabase-js'

export interface SubscriptionAccess {
  allow: boolean
  inGrace: boolean
  status?: string | null
  graceEnd?: string | null
}

export async function checkSubscriptionAccess(
  supabase: SupabaseClient<any>
): Promise<SubscriptionAccess> {
  const { data, error } = await supabase
    .from('subscriptions' as any)
    .select('status, grace_period_end, updated_at' as any)
    .order('updated_at', { ascending: false } as any)
    .limit(1)

  if (error) return { allow: false, inGrace: false }
  const sub = (data as any)?.[0] as { status?: string | null; grace_period_end?: string | null } | undefined
  if (!sub) return { allow: false, inGrace: false }

  const status = sub.status ?? null
  const graceEnd = (sub.grace_period_end as string | null) ?? null

  if (status === 'active') return { allow: true, inGrace: false, status }

  if (status === 'suspended' && graceEnd) {
    const now = new Date()
    const end = new Date(graceEnd)
    if (end.getTime() >= now.getTime()) return { allow: true, inGrace: true, status, graceEnd }
  }

  return { allow: false, inGrace: false, status, graceEnd }
}
