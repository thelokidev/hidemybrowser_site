import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { DodoSubscription } from '@/types/dodopayments.types'

export function useSubscription() {
  const supabase = createClient()
  const [subscription, setSubscription] = useState<DodoSubscription | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    // Get current user
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user)
    })

    // Subscribe to auth changes
    const { data: { subscription: authSubscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => {
      authSubscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    if (!user) {
      setSubscription(null)
      setLoading(false)
      return
    }

    async function fetchSubscription() {
      try {
        console.log('[useSubscription] Fetching subscription for user:', user.id)
        
        // Get most recent active subscription from Supabase
        // Using maybeSingle() to handle cases with multiple subscriptions
        // Prioritize active subscriptions, then get most recent
        const { data, error } = await supabase
          .from('subscriptions')
          .select('*')
          .eq('user_id', user.id)
          .in('status', ['active', 'trialing', 'renewed'])
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle()

        console.log('[useSubscription] Supabase response:', { data, error })

        if (error) {
          console.error('[useSubscription] Error fetching subscription:', error)
          throw error
        }

        const subscriptionData = data as DodoSubscription | null

        // Check for expiration - ensure we don't show expired subscriptions as active
        const now = new Date()
        const currentPeriodEnd = subscriptionData?.current_period_end ? new Date(subscriptionData.current_period_end) : null
        const isExpired = currentPeriodEnd ? currentPeriodEnd < now : false

        if (isExpired && subscriptionData) {
           console.log('[useSubscription] Subscription found but expired on:', currentPeriodEnd)
           // Treat as no subscription
           setSubscription(null)
        } else {
           // Use Supabase as source of truth - webhooks keep it up-to-date
           // No need to fetch from DodoPayments API client-side
           console.log('[useSubscription] Subscription data from database:', subscriptionData)
           console.log('[useSubscription] Subscription status:', subscriptionData?.status)
           console.log('[useSubscription] Product ID:', subscriptionData?.dodo_product_id)
           setSubscription(subscriptionData)
        }
      } catch (err) {
        console.error('[useSubscription] Error:', err)
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }

    fetchSubscription()

    // Realtime updates: listen to subscription changes for this user
    const channel = user
      ? supabase
          .channel(`subscription_changes_${user.id}`)
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'subscriptions',
              filter: `user_id=eq.${user.id}`,
            },
            () => {
              fetchSubscription()
            }
          )
          .subscribe()
      : null

    return () => {
      if (channel) {
        supabase.removeChannel(channel)
      }
    }
  }, [user, supabase])

  return { subscription, loading, error }
}

export function useHasActiveSubscription() {
  const supabase = createClient()
  const [hasSubscription, setHasSubscription] = useState(false)
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    // Get current user
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user)
    })

    // Subscribe to auth changes
    const { data: { subscription: authSubscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => {
      authSubscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    if (!user) {
      setHasSubscription(false)
      setLoading(false)
      return
    }

    async function checkSubscription() {
      try {
        console.log('[useHasActiveSubscription] Checking subscription for user:', user.id)
        
        const { data, error } = await supabase
          .from('subscriptions')
          .select('status, current_period_end')
          .eq('user_id', user.id)
          .in('status', ['active', 'trialing', 'renewed'])
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle()

        if (error) {
          console.error('[useHasActiveSubscription] Error:', error)
          throw error
        }

        const subscription = data as { status: string, current_period_end: string | null } | null
        
        const now = new Date()
        const currentPeriodEnd = subscription?.current_period_end ? new Date(subscription.current_period_end) : null
        const isExpired = currentPeriodEnd ? currentPeriodEnd < now : false
        const isActive = !!subscription && !isExpired

        console.log('[useHasActiveSubscription] Result:', isActive)
        setHasSubscription(isActive)
      } catch (err) {
        console.error('[useHasActiveSubscription] Error checking subscription:', err)
        setHasSubscription(false)
      } finally {
        setLoading(false)
      }
    }

    checkSubscription()
  }, [user, supabase])

  return { hasSubscription, loading }
}
