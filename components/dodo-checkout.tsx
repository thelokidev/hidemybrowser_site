'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { getDodoPayments } from '@/lib/dodopayments/client'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { TablesInsert } from '@/types/database.types'

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

      const dodoClient = getDodoPayments()
      if (!dodoClient) {
        toast({
          title: "Payment system unavailable",
          description: "Please try again later.",
          variant: "destructive",
        })
        return
      }

      // Check if customer exists, create if not
      let customerId: string
      const existingCustomerRes = await supabase
        .from('customers')
        .select('dodo_customer_id')
        .eq('user_id', user.id)
        .maybeSingle()
      const existingCustomer = existingCustomerRes.data as { dodo_customer_id: string | null } | null

      if (existingCustomer?.dodo_customer_id) {
        customerId = existingCustomer.dodo_customer_id
      } else {
        // Create new customer
        const customer = await dodoClient.createCustomer({
          email: user.email!,
          name: user.user_metadata?.full_name || user.email!,
          metadata: { supabase_user_id: user.id }
        })

        customerId = customer.id

        // Save customer to Supabase
        await (supabase
          .from('customers') as any)
          .upsert({
            user_id: user.id,
            dodo_customer_id: customerId,
            email: user.email,
            name: user.user_metadata?.full_name || user.email
          })
      }

      // Create checkout session
      const returnUrl = `${window.location.origin}/?paid=1`
      console.log('Creating checkout session with return_url:', returnUrl)
      console.log('Product ID:', productId, 'Price ID:', priceId)
      
      const session = await dodoClient.createCheckoutSession({
        return_url: returnUrl,
        customer_id: customerId,
        product_cart: [
          {
            product_id: productId,
            quantity: 1
          }
        ],
        metadata: {
          user_id: user.id,
          product_id: productId,
          price_id: priceId
        }
      })

      console.log('Checkout session created:', session.session_id)
      console.log('Checkout URL:', session.checkout_url)
      
      // Redirect to checkout
      window.location.href = session.checkout_url

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
                  disabled={loading === price.id}
                  size="sm"
                >
                  {loading === price.id ? 'Processing...' : 'Subscribe'}
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
