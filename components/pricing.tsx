"use client"

import { motion } from "framer-motion"
import { useInView } from "framer-motion"
import { useRef, useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Check } from "lucide-react"
import { createClient } from '@/lib/supabase/client'
import { useSubscription } from '@/hooks/use-subscription'

// Product ID mapping for checkout
const checkoutUrls: Record<string, string> = {
  "Weekly": "https://test.checkout.dodopayments.com/buy/pdt_v0slst9k4JI0Q2qUDkIAW?quantity=1",
  "Monthly": "https://test.checkout.dodopayments.com/buy/pdt_ugqyKXMT219386BcoejVN?quantity=1",
  "3 Months": "https://test.checkout.dodopayments.com/buy/pdt_W4YuF093U2MSpABbJ7miA?quantity=1",
  "6 Months": "https://test.checkout.dodopayments.com/buy/pdt_Ah7DRDitJbvGcaFMrqrOf?quantity=1",
}

// Extract product IDs from URLs for reverse lookup against subscriptions
const productIds: Record<string, string> = Object.fromEntries(
  Object.entries(checkoutUrls).map(([name, url]) => {
    const id = url.split('/').pop()?.split('?')[0] || ''
    return [name, id]
  })
)
const idToPlan: Record<string, string> = Object.fromEntries(
  Object.entries(productIds).map(([plan, id]) => [id, plan])
)

const plans = [
  {
    name: "Weekly",
    price: "$5",
    period: "/week",
    features: ["Full stealth browsing", "Unlimited usage", "Advanced shortcuts", "Email support"],
    cta: "Get Weekly",
    highlighted: false,
    badge: null,
    savings: null,
  },
  {
    name: "Monthly",
    price: "$15",
    period: "/month",
    features: ["Everything in Weekly", "Priority support", "Best value", "Regular updates"],
    cta: "Get Monthly",
    highlighted: true,
    badge: "Most Popular",
    savings: null,
  },
  {
    name: "3 Months",
    price: "$30",
    period: "/3 months",
    features: ["Everything in Monthly", "Significant savings", "Extended access", "Premium support"],
    cta: "Get 3 Months",
    highlighted: false,
    badge: null,
    savings: "Save 33%",
  },
  {
    name: "6 Months",
    price: "$50",
    period: "/6 months",
    features: ["Everything included", "Maximum savings", "Long-term value", "VIP support"],
    cta: "Get 6 Months",
    highlighted: false,
    badge: "Best Value",
    savings: "Save 44%",
  },
]

export function Pricing() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })
  const [userEmail, setUserEmail] = useState<string | undefined>(undefined)
  const [userName, setUserName] = useState<string | undefined>(undefined)
  const [loading, setLoading] = useState<string | null>(null)
  const [currentPlan, setCurrentPlan] = useState<string | null>(null)
  const supabase = createClient()
  const { subscription, loading: subLoading } = useSubscription()

  // Fetch user email/name and derive current plan from subscription hook
  useEffect(() => {
    async function fetchUser() {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUserEmail(user.email || undefined)
        setUserName(user.user_metadata?.full_name || user.user_metadata?.name || undefined)
      }
    }
    fetchUser()
  }, [supabase])

  // Keep current plan in sync with subscription hook
  useEffect(() => {
    const productId = subscription?.dodo_product_id || null
    if (productId) {
      const plan = idToPlan[productId]
      setCurrentPlan(plan || null)
    } else {
      setCurrentPlan(null)
    }
  }, [subscription])

  const handleCheckout = async (plan: typeof plans[0]) => {
    try {
      setLoading(plan.name)
      // While subscription is loading or an active subscription exists for another plan, block
      if (subLoading || (currentPlan && currentPlan !== plan.name)) {
        setLoading(null)
        return
      }
      
      // Create programmatic checkout session with pre-filled customer data
      const response = await fetch(`${window.location.origin}/checkout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          product_cart: [{
            product_id: checkoutUrls[plan.name]?.split('/').pop()?.split('?')[0] || "",
            quantity: 1,
          }],
          customer: {
            email: userEmail || "",
            name: userName || userEmail?.split('@')[0] || "",
          },
          return_url: `${window.location.origin}/dashboard?paid=1`,
        }),
      })

      if (!response.ok) {
        console.error('Checkout failed')
        window.location.href = "/pricing" // Fallback to pricing page
        return
      }

      const { checkout_url } = await response.json()
      window.location.href = checkout_url
    } catch (error: any) {
      console.error('Checkout error:', error)
      window.location.href = "/pricing" // Fallback to pricing page
    }
  }

  return (
    <section id="pricing" ref={ref} className="py-12 sm:py-16 md:py-20 px-4 sm:px-6 lg:px-8 bg-background">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-10 sm:mb-12 md:mb-16"
        >
          <h2 className="text-3xl sm:text-4xl md:text-4xl lg:text-5xl font-bold mb-3 sm:mb-4">Simple, transparent pricing</h2>
          <p className="text-base sm:text-lg text-muted-foreground">Choose the perfect plan for your needs</p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 md:gap-6 max-w-[1100px] mx-auto">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              transition={{ duration: 0.5, delay: index * 0.08 }}
              whileHover={{ y: -6, scale: 1.02 }}
              className="relative"
            >
              {plan.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                  <div className="bg-foreground text-background px-4 py-1 rounded-full text-xs font-semibold">
                    {plan.badge}
                  </div>
                </div>
              )}

              <div
                className={`h-full p-6 rounded-xl border transition-all duration-300 flex flex-col ${
                  plan.highlighted
                    ? "border-2 border-foreground shadow-md bg-gradient-to-b from-background to-background/70 ring-1 ring-foreground/20"
                    : "bg-background border-border hover:border-foreground/20"
                } hover:shadow-xl hover:ring-1 hover:ring-primary/20`}
              >
                <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
                <div className="mb-1">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  <span className="text-muted-foreground text-sm">{plan.period}</span>
                </div>

                {plan.savings && <p className="text-sm font-semibold text-green-600 mb-4">{plan.savings}</p>}

                <ul className="space-y-3 mb-6 mt-6 flex-1">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2 text-sm">
                      <Check className="w-4 h-4 flex-shrink-0 mt-0.5 text-green-600" />
                      <span className="text-muted-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  onClick={() => {
                    const slug = plan.name.toLowerCase().split(' ')[0]
                    window.location.href = `/pricing?plan=${encodeURIComponent(slug)}`
                  }}
                  disabled={subLoading || loading === plan.name || (currentPlan !== null && currentPlan !== plan.name)}
                  className={`w-full mt-auto transition-transform duration-200 hover:-translate-y-0.5 active:translate-y-0 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary/60 
            ${currentPlan === plan.name ? 'bg-muted text-foreground cursor-default' : currentPlan ? 'bg-muted text-muted-foreground cursor-not-allowed' : 'bg-foreground text-background hover:bg-foreground/90'}`}
                  size="lg"
                >
                  {subLoading
                    ? 'Checking subscription...'
                    : currentPlan === plan.name
                      ? 'Current Plan'
                      : currentPlan && currentPlan !== plan.name
                        ? 'Plan Change Blocked'
                        : (loading === plan.name ? 'Processing...' : plan.cta)}
                </Button>
                {currentPlan && currentPlan !== plan.name && (
                  <p className="text-[12px] text-muted-foreground mt-2 text-center">
                    Plan changes are blocked until your current plan expires.
                  </p>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
