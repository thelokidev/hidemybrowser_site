'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { useSubscription } from '@/hooks/use-subscription'

interface DodoCheckoutProps {
  products: Array<{
    id: string
    name: string
    description?: string
    prices: Array<{
      id: string
      amount: number
      currency: string
      interval?: string
      interval_count?: number
    }>
  }>
}

export function DodoCheckout({ products }: DodoCheckoutProps) {
  const [loading, setLoading] = useState<string | null>(null)
  const { toast } = useToast()
  const supabase = createClient()
  const { subscription, loading: subLoading } = useSubscription()

  const handleCheckout = async (priceId: string, productId: string) => {
    setLoading(priceId)
    
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        toast({
          title: "Authentication required",
          description: "Please sign in to continue with your purchase.",
          variant: "destructive",
        })
        return
      }

      // Prevent purchase if already subscribed
      if (subscription) {
        toast({
          title: "Already subscribed",
          description: "You already have an active subscription. Manage your plan from the dashboard.",
          variant: "destructive",
        })
        return
      }

      // Create session via guarded API route
      const res = await fetch('/api/checkout/create-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId }),
      })

      if (res.status === 409) {
        toast({
          title: "Purchase blocked",
          description: "You already have an active subscription. Please wait for it to end before purchasing another plan.",
          variant: "destructive",
        })
        return
      }

      if (!res.ok) {
        const body = await res.json().catch(() => ({ error: 'Failed to create checkout session' }))
        toast({
          title: "Checkout failed",
          description: body.error || 'There was an error processing your request. Please try again.',
          variant: "destructive",
        })
        return
      }

      const { checkoutUrl } = await res.json()
      window.location.href = checkoutUrl

    } catch (error) {
      console.error('Checkout error:', error)
      toast({
        title: "Checkout failed",
        description: "There was an error processing your request. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(null)
    }
  }

  const formatPrice = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amount / 100)
  }

  const formatInterval = (interval?: string, intervalCount?: number) => {
    if (!interval) return 'one-time'
    
    const count = intervalCount || 1
    if (count === 1) {
      return `per ${interval}`
    }
    return `every ${count} ${interval}s`
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {products.map((product) => (
        <Card key={product.id} className="flex flex-col">
          <CardHeader>
            <CardTitle>{product.name}</CardTitle>
            {product.description && (
              <CardDescription>{product.description}</CardDescription>
            )}
          </CardHeader>
          <CardContent className="flex-1 space-y-4">
            {product.prices.map((price) => (
              <div key={price.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <div className="font-semibold">
                    {formatPrice(price.amount, price.currency)}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {formatInterval(price.interval, price.interval_count)}
                  </div>
                </div>
                <Button
                  onClick={() => handleCheckout(price.id, product.id)}
                  disabled={loading === price.id || subLoading || !!subscription}
                  size="sm"
                >
                  {loading === price.id
                    ? 'Processing...'
                    : subscription
                      ? 'Already subscribed'
                      : 'Subscribe'}
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

export default DodoCheckout
