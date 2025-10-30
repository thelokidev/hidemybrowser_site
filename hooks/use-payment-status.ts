import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Database } from '@/types/database.types'

type Payment = Database['public']['Tables']['payments']['Row']

interface PaymentWithExpiry {
  id: string
  amount: number
  currency: string
  status: string
  created_at: string
  metadata: any
  expires_at: string | null
  is_active: boolean
  plan_name: string
}

// Map product IDs to plan details
const PRODUCT_PLANS: Record<string, { name: string; duration_days: number }> = {
  // New product IDs
  [process.env.NEXT_PUBLIC_DODO_PRODUCT_WEEKLY || 'pdt_5ypSpqAzpNPQIBIw2Y66S']: { name: 'Weekly', duration_days: 7 },
  [process.env.NEXT_PUBLIC_DODO_PRODUCT_MONTHLY || 'pdt_EUozfisbUTWeqXfagMOlc']: { name: 'Monthly', duration_days: 30 },
  [process.env.NEXT_PUBLIC_DODO_PRODUCT_3_MONTH || 'pdt_tmsm2z2gKcT5azrdecgyD']: { name: '3 Months', duration_days: 90 },
  [process.env.NEXT_PUBLIC_DODO_PRODUCT_6_MONTH || 'pdt_lq0xS7T3B921STb4Ys6D0']: { name: '6 Months', duration_days: 180 },
  // Legacy product IDs for backward compatibility
  'pdt_v0slst9k4JI0Q2qUDkIAW': { name: 'Weekly', duration_days: 7 },
  'pdt_ugqyKXMT219386BcoejVN': { name: 'Monthly', duration_days: 30 },
  'pdt_W4YuF093U2MSpABbJ7miA': { name: '3 Months', duration_days: 90 },
  'pdt_Ah7DRDitJbvGcaFMrqrOf': { name: '6 Months', duration_days: 180 },
}

export function usePaymentStatus() {
  const supabase = createClient()
  const [payment, setPayment] = useState<PaymentWithExpiry | null>(null)
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
      setPayment(null)
      setLoading(false)
      return
    }

    async function fetchPaymentStatus() {
      try {
        // Get the most recent successful payment
        const { data, error: paymentsError } = await supabase
          .from('payments')
          .select('*')
          .eq('user_id', user.id)
          .eq('status', 'succeeded')
          .order('created_at', { ascending: false })
          .limit(10)
        
        const payments = data as Payment[] | null

        if (paymentsError) throw paymentsError

        if (!payments || payments.length === 0) {
          setPayment(null)
          setLoading(false)
          return
        }

        // Find the most recent active payment
        const now = new Date()
        let activePayment: PaymentWithExpiry | null = null

        for (const p of payments) {
          const metadata = p.metadata as any
          const productId = metadata?.product_id
          const planInfo = productId ? PRODUCT_PLANS[productId] : null
          
          if (planInfo && p.created_at) {
            const createdAt = new Date(p.created_at)
            const expiresAt = new Date(createdAt)
            expiresAt.setDate(expiresAt.getDate() + planInfo.duration_days)
            
            const isActive = now < expiresAt

            const paymentWithExpiry: PaymentWithExpiry = {
              id: p.id,
              amount: p.amount,
              currency: p.currency,
              status: p.status,
              created_at: p.created_at,
              metadata: p.metadata,
              expires_at: expiresAt.toISOString(),
              is_active: isActive,
              plan_name: planInfo.name
            }

            if (isActive) {
              activePayment = paymentWithExpiry
              break
            }
          }
        }

        setPayment(activePayment)
      } catch (err) {
        console.error('Error fetching payment status:', err)
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }

    fetchPaymentStatus()

    // Realtime updates: listen to payment changes for this user
    const channel = user
      ? supabase
          .channel(`payment_changes_${user.id}`)
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'payments',
              filter: `user_id=eq.${user.id}`,
            },
            () => {
              fetchPaymentStatus()
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

  return { payment, loading, error }
}
