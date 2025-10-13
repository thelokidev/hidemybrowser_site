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
        
        // First get subscription from Supabase
        const { data, error } = await supabase
          .from('subscriptions')
          .select('*')
          .eq('user_id', user.id)
          .single()

        console.log('[useSubscription] Supabase response:', { data, error })

        if (error && error.code !== 'PGRST116') throw error

        const subscriptionData = data as DodoSubscription | null

        // Use Supabase as source of truth - webhooks keep it up-to-date
        // No need to fetch from DodoPayments API client-side
        console.log('[useSubscription] Subscription data from database:', subscriptionData)
        setSubscription(subscriptionData)
      } catch (err) {
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
        const { data, error } = await supabase
          .from('subscriptions')
          .select('status')
          .eq('user_id', user.id)
          .eq('status', 'active')
          .single()

        if (error && error.code !== 'PGRST116') throw error

        setHasSubscription(!!data)
      } catch (err) {
        console.error('Error checking subscription:', err)
        setHasSubscription(false)
      } finally {
        setLoading(false)
      }
    }

    checkSubscription()
  }, [user, supabase])

  return { hasSubscription, loading }
}
