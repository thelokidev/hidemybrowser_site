'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Check } from 'lucide-react'

// Placeholder pricing data - replace with actual Stripe products/prices
const PLACEHOLDER_PLANS = [
  {
    id: 'price_placeholder_basic',
    name: 'Basic Plan',
    price: 9.99,
    interval: 'month',
    description: 'Perfect for individuals getting started',
    features: [
      'Basic browser fingerprint protection',
      'Up to 5 browser profiles',
      'Standard proxy support',
      'Email support'
    ]
  },
  {
    id: 'price_placeholder_pro',
    name: 'Pro Plan',
    price: 19.99,
    interval: 'month',
    description: 'For professionals who need more power',
    features: [
      'All Basic features',
      'Advanced fingerprint protection',
      'Unlimited browser profiles',
      'Premium proxy support',
      'Automation tools',
      'Priority support'
    ],
    popular: true
  },
  {
    id: 'price_placeholder_enterprise',
    name: 'Enterprise',
    price: 49.99,
    interval: 'month',
    description: 'For teams and businesses',
    features: [
      'All Pro features',
      'Team collaboration',
      'API access',
      'Custom integrations',
      'Dedicated account manager',
      '24/7 premium support'
    ]
  }
]

export default function PricingTable() {
  const [loading, setLoading] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const handleSubscribe = async (priceId: string) => {
    // Check if user is authenticated
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      router.push('/auth')
      return
    }

    setLoading(priceId)

    try {
      const { data, error } = await supabase.functions.invoke('stripe-checkout', {
        body: {
          priceId,
          mode: 'subscription',
          successUrl: `${window.location.origin}/success`,
          cancelUrl: `${window.location.origin}/pricing`
        }
      })

      if (error) throw error

      if (data.url) {
        window.location.href = data.url
      } else {
        console.log('Placeholder checkout - real integration pending')
        alert('Stripe integration pending - checkout will work once API key is added')
      }
    } catch (error) {
      console.error('Error creating checkout session:', error)
      alert('Error creating checkout session')
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-7xl mx-auto">
      {PLACEHOLDER_PLANS.map((plan) => (
        <Card 
          key={plan.id} 
          className={`relative ${plan.popular ? 'border-primary shadow-lg scale-105' : ''}`}
        >
          {plan.popular && (
            <div className="absolute -top-4 left-0 right-0 mx-auto w-fit">
              <span className="bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-full">
                MOST POPULAR
              </span>
            </div>
          )}
          
          <CardHeader>
            <CardTitle className="text-2xl">{plan.name}</CardTitle>
            <CardDescription>{plan.description}</CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <div className="text-4xl font-bold">
              ${plan.price}
              <span className="text-sm font-normal text-muted-foreground">/{plan.interval}</span>
            </div>
            
            <ul className="space-y-3">
              {plan.features.map((feature, index) => (
                <li key={index} className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <span className="text-sm">{feature}</span>
                </li>
              ))}
            </ul>
          </CardContent>
          
          <CardFooter>
            <Button
              onClick={() => handleSubscribe(plan.id)}
              disabled={loading === plan.id}
              className="w-full"
              variant={plan.popular ? 'default' : 'outline'}
            >
              {loading === plan.id ? 'Loading...' : 'Subscribe Now'}
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  )
}
