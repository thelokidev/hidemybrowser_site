import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export interface AccessStatus {
  hasAccess: boolean
  accessType: 'subscription' | 'none'
  subscriptionStatus?: string
  subscriptionExpiresAt?: string
  subscriptionProductId?: string
  loading: boolean
  error?: string
}

// Local row type for subscriptions query
type SubscriptionRow = {
  status: 'active' | 'trialing' | 'renewed' | 'canceled' | 'incomplete' | 'past_due'
  current_period_end: string | null
  dodo_product_id: string | null
}

/**
 * Hook for checking user subscription access status
 * Includes real-time updates for subscription changes
 */
function clearCorruptedSupabaseSession(): void {
  if (typeof window === 'undefined') return
  const url: string | undefined = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!url) return
  try {
    const { hostname } = new URL(url)
    const key = `sb-${hostname.split('.')[0]}-auth-token`
    const value = window.localStorage.getItem(key)
    if (!value) return
    try {
      let parsed: unknown = JSON.parse(value)
      if (typeof parsed === 'string') parsed = JSON.parse(parsed)
      if (parsed && typeof parsed === 'object') return
    } catch {}
    window.localStorage.removeItem(key)
  } catch {}
}

export function useAccessStatus() {
  const supabase = createClient()
  const [status, setStatus] = useState<AccessStatus>({
    hasAccess: false,
    accessType: 'none',
    loading: true
  })
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    clearCorruptedSupabaseSession()
    supabase.auth.getUser().then(({ data: { user } }) => setUser(user))
    
    const { data: { subscription: authSub } } = supabase.auth.onAuthStateChange(
      (_event, session) => setUser(session?.user ?? null)
    )
    
    return () => authSub.unsubscribe()
  }, [])

  useEffect(() => {
    if (!user) {
      setStatus({ hasAccess: false, accessType: 'none', loading: false })
      return
    }

    async function fetchStatus() {
      try {
        console.log('[useAccessStatus] Fetching access status for user:', user.id)
        
        // Query subscription directly instead of using RPC function
        const { data, error } = await supabase
          .from('subscriptions')
          .select('status, current_period_end, dodo_product_id')
          .eq('user_id', user.id)
          .in('status', ['active', 'trialing', 'renewed'])
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle()

        if (error) {
          console.error('[useAccessStatus] Error:', error)
          throw error
        }

        const subscription = data as SubscriptionRow | null
        console.log('[useAccessStatus] Subscription:', subscription)
        
        const now = new Date()
        const currentPeriodEnd = subscription?.current_period_end ? new Date(subscription.current_period_end) : null
        const isExpired = currentPeriodEnd ? currentPeriodEnd < now : false

        // Check if subscription is active AND not expired
        const isSubscribed = !!subscription && 
          ['active', 'trialing', 'renewed'].includes(subscription.status) && 
          !isExpired

        if (isSubscribed) {
          setStatus({
            hasAccess: true,
            accessType: 'subscription',
            subscriptionStatus: subscription.status,
            subscriptionExpiresAt: subscription.current_period_end ?? undefined,
            subscriptionProductId: subscription.dodo_product_id ?? undefined,
            loading: false
          })
        } else {
          if (subscription && isExpired) {
            console.log('[useAccessStatus] Subscription expired on:', currentPeriodEnd)
          }
          setStatus({
            hasAccess: false,
            accessType: 'none',
            loading: false
          })
        }
      } catch (err) {
        console.error('[useAccessStatus] Error fetching access status:', err)
        setStatus(prev => ({ 
          ...prev, 
          loading: false, 
          error: err instanceof Error ? err.message : 'Unknown error' 
        }))
      }
    }

    fetchStatus()

    // Real-time updates for subscriptions
    const channel = supabase
      .channel(`access_status_${user.id}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'subscriptions',
        filter: `user_id=eq.${user.id}`
      }, (payload) => {
        console.log('[useAccessStatus] Subscription change detected:', payload)
        fetchStatus()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user, supabase])

  return status
}

