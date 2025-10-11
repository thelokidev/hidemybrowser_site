"use client"

import { motion } from "framer-motion"
import { useInView } from "framer-motion"
import { useRef, useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Check } from "lucide-react"
import { Header } from "@/components/header"
import { useToast } from '@/hooks/use-toast'
import { Footer } from "@/components/footer"
import { initiateCheckout } from "@/lib/dodopayments/checkout"
import { createClient } from '@/lib/supabase/client'
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
    dodoProductId: "pdt_v0slst9k4JI0Q2qUDkIAW",
    checkoutUrl: "https://test.checkout.dodopayments.com/buy/pdt_v0slst9k4JI0Q2qUDkIAW?quantity=1",
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
    dodoProductId: "pdt_ugqyKXMT219386BcoejVN",
    checkoutUrl: "https://test.checkout.dodopayments.com/buy/pdt_ugqyKXMT219386BcoejVN?quantity=1",
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
    dodoProductId: "pdt_W4YuF093U2MSpABbJ7miA",
    checkoutUrl: "https://test.checkout.dodopayments.com/buy/pdt_W4YuF093U2MSpABbJ7miA?quantity=1",
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
    dodoProductId: "pdt_Ah7DRDitJbvGcaFMrqrOf",
    checkoutUrl: "https://test.checkout.dodopayments.com/buy/pdt_Ah7DRDitJbvGcaFMrqrOf?quantity=1",
  },
]

export default function PricingPage() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })
  const [loading, setLoading] = useState<string | null>(null)
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [userName, setUserName] = useState<string | null>(null)
  const { toast } = useToast()
  const supabase = createClient()

  // Fetch user email and name on mount
  useEffect(() => {
    async function fetchUser() {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUserEmail(user.email || null)
        setUserName(user.user_metadata?.full_name || user.user_metadata?.name || null)
      }
    }
    fetchUser()
  }, [supabase])

  const handleCheckout = async (plan: typeof plans[0]) => {
    try {
      setLoading(plan.name)
      
      // Create programmatic checkout session with pre-filled customer data
      const response = await fetch(`${window.location.origin}/checkout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          product_cart: [{
            product_id: plan.dodoProductId,
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
        throw new Error("Failed to create checkout session")
      }

      const { checkout_url } = await response.json()
      window.location.href = checkout_url
    } catch (error: any) {
      console.error('Checkout error:', error)
      toast({
        title: "Checkout Error",
        description: error.message || "Failed to start checkout process. Please try again.",
        variant: "destructive",
      })
      setLoading(null)
    }
  }

  return (
    <main className="min-h-screen bg-background">
      <Header />
      
      <section ref={ref} className="py-20 px-4 sm:px-6 lg:px-8 bg-background">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h1 className="text-4xl sm:text-5xl font-bold mb-4">Simple, transparent pricing</h1>
            <p className="text-lg text-muted-foreground">Choose the perfect plan for your needs</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-[1200px] mx-auto">
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
                    onClick={() => handleCheckout(plan)}
                    disabled={loading === plan.name}
                    className="w-full mt-auto bg-foreground text-background hover:bg-foreground/90 transition-transform duration-200 hover:-translate-y-0.5 active:translate-y-0 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary/60"
                    size="lg"
                  >
                    {loading === plan.name ? 'Processing...' : plan.cta}
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </main>
  )
}
