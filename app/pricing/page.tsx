"use client"

import { motion } from "framer-motion"
import { useInView } from "framer-motion"
import { useRef, useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Check, AlertCircle } from "lucide-react"
import { Header } from "@/components/header"
import { useToast } from '@/hooks/use-toast'
import { Footer } from "@/components/footer"
import { initiateCheckout } from "@/lib/dodopayments/checkout"
import { createClient } from '@/lib/supabase/client'
import { useSubscription } from '@/hooks/use-subscription'
import { canChangePlan, getTierName } from '@/lib/subscription-tier-utils'
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import Link from "next/link"
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
  const [authUser, setAuthUser] = useState<any>(null)
  const [authChecking, setAuthChecking] = useState(true)
  const [showLogin, setShowLogin] = useState(false)
  const [loginEmail, setLoginEmail] = useState("")
  const [loginLoading, setLoginLoading] = useState<string | null>(null)
  const [pendingPlan, setPendingPlan] = useState<typeof plans[0] | null>(null)
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null)
  const [showPayment, setShowPayment] = useState(false)
  const { toast } = useToast()
  const supabase = createClient()
  const { subscription, loading: subLoading } = useSubscription()

  // Fetch user email and name on mount
  useEffect(() => {
    async function fetchUser() {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUserEmail(user.email || null)
        setUserName(user.user_metadata?.full_name || user.user_metadata?.name || null)
      }
      setAuthUser(user)
      setAuthChecking(false)
    }
    fetchUser()
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuthUser(session?.user ?? null)
      if (session?.user) {
        setUserEmail(session.user.email || null)
        setUserName(session.user.user_metadata?.full_name || session.user.user_metadata?.name || null)
        setShowLogin(false)
        // If there was a pending plan, continue to payment creation
        if (pendingPlan) {
          void continueCheckout(pendingPlan)
          setPendingPlan(null)
        }
      }
    })
    return () => {
      listener.subscription.unsubscribe()
    }
  }, [supabase])

  /**
   * Get plan status and action for a plan
   * Returns info about whether user can subscribe, upgrade, or is blocked
   */
  const getPlanStatus = (planProductId: string) => {
    if (!subscription) {
      return { type: 'subscribe' as const, allowed: true, reason: '' }
    }

    const currentProductId = subscription.dodo_product_id

    // Current plan
    if (currentProductId === planProductId) {
      return {
        type: 'current' as const,
        allowed: false,
        reason: 'Current Plan',
      }
    }

    // Block ALL changes until current plan expires
    const validation = canChangePlan(String(currentProductId || ''), String(planProductId || ''))
    return {
      type: validation.changeType as 'upgrade' | 'downgrade' | 'unknown',
      allowed: false,
      reason: 'Plan changes are blocked until your current plan expires.',
    }
  }

  const continueCheckout = async (plan: typeof plans[0]) => {
    // Create programmatic checkout session and show in modal iframe
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
    setPaymentUrl(checkout_url)
    setShowPayment(true)
  }

  const handleCheckout = async (plan: typeof plans[0]) => {
    try {
      setLoading(plan.name)
      
      const planStatus = getPlanStatus(plan.dodoProductId)

      // Only handle new subscription checkout
      if (planStatus.type === 'subscribe') {
        // Enforce login before payment
        if (!authUser) {
          setPendingPlan(plan)
          setShowLogin(true)
          return
        }
        await continueCheckout(plan)
        return
      }

      // This shouldn't happen (blocked actions shouldn't trigger this function)
      throw new Error("Invalid action")
    } catch (error: any) {
      console.error('Checkout error:', error)
      toast({
        title: "Error",
        description: error.message || "Failed to process request. Please try again.",
        variant: "destructive",
      })
    } finally {
      // Always reset loading state to re-enable button
      // Skip only if we're redirecting (checkout flow)
      const planStatus = getPlanStatus(plan.dodoProductId)
      if (planStatus.type !== 'subscribe') {
        setLoading(null)
      }
    }
  }

  const sendMagicLink = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setLoginLoading('magic')
      const { error } = await supabase.auth.signInWithOtp({
        email: loginEmail,
        options: { emailRedirectTo: `${window.location.origin}/auth/callback` }
      })
      if (error) throw error
      toast({ title: 'Check your email', description: 'We sent you a magic link to sign in.' })
    } catch (err: any) {
      toast({ title: 'Login failed', description: err.message || 'Please try again.', variant: 'destructive' })
    } finally {
      setLoginLoading(null)
    }
  }

  return (
    <main className="min-h-screen bg-background">
      <Header />
      
      <section ref={ref} className="py-12 sm:py-16 md:py-20 px-4 sm:px-6 lg:px-8 bg-background">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-10 sm:mb-12 md:mb-16"
          >
            <h1 className="text-3xl sm:text-4xl md:text-4xl lg:text-5xl font-bold mb-3 sm:mb-4">Simple, transparent pricing</h1>
            <p className="text-base sm:text-lg text-muted-foreground">Choose the perfect plan for your needs</p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 md:gap-6 max-w-[1100px] mx-auto">
            {plans.map((plan, index) => {
              const planStatus = getPlanStatus(plan.dodoProductId)
              const isCurrentPlan = planStatus.type === 'current'
              const isUpgrade = planStatus.type === 'upgrade'
              const isDowngrade = planStatus.type === 'downgrade'
              // While subscription state is loading, treat all actions as blocked to avoid flicker
              const isBlocked = subLoading || !planStatus.allowed

              return (
                <motion.div
                  key={plan.name}
                  initial={{ opacity: 0, y: 20 }}
                  animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                  transition={{ duration: 0.5, delay: index * 0.08 }}
                  whileHover={isBlocked ? {} : { y: -6, scale: 1.02 }}
                  className="relative"
                >
                  {(plan.badge || isCurrentPlan) && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                      <div className={`px-4 py-1 rounded-full text-xs font-semibold ${
                        isCurrentPlan 
                          ? 'bg-blue-600 text-white'
                          : 'bg-foreground text-background'
                      }`}>
                        {isCurrentPlan ? 'Current Plan' : plan.badge}
                      </div>
                    </div>
                  )}

                  <div
                    className={`h-full p-6 rounded-xl border transition-all duration-300 flex flex-col ${
                      isCurrentPlan
                        ? "border-2 border-blue-500 shadow-md bg-gradient-to-b from-blue-50/50 to-background/70 dark:from-blue-950/20 ring-1 ring-blue-500/20"
                        : plan.highlighted
                        ? "border-2 border-foreground shadow-md bg-gradient-to-b from-background to-background/70 ring-1 ring-foreground/20"
                        : "bg-background border-border hover:border-foreground/20"
                    } ${isBlocked && !isCurrentPlan ? 'opacity-75' : ''} hover:shadow-xl hover:ring-1 hover:ring-primary/20`}
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

                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div>
                            <Button
                              onClick={() => handleCheckout(plan)}
                              disabled={isBlocked || loading === plan.name}
                              className={`w-full mt-auto transition-transform duration-200 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary/60 ${
                                isCurrentPlan
                                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                                  : isBlocked
                                  ? 'bg-muted text-muted-foreground cursor-not-allowed'
                                  : 'bg-foreground text-background hover:bg-foreground/90 hover:-translate-y-0.5 active:translate-y-0'
                              }`}
                              size="lg"
                            >
                              {loading === plan.name
                                ? 'Processing...'
                                : isCurrentPlan
                                ? 'Current Plan'
                                : isBlocked && subLoading
                                ? 'Checking subscription...'
                                : isBlocked
                                ? 'Plan Change Blocked'
                                : plan.cta}
                            </Button>
                          </div>
                        </TooltipTrigger>
                        {isBlocked && (
                          <TooltipContent>
                            <p className="max-w-xs text-sm">{planStatus.reason}</p>
                          </TooltipContent>
                        )}
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Login Modal (shown when user is not authenticated) */}
      <Dialog open={showLogin} onOpenChange={setShowLogin}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Sign in to continue</DialogTitle>
            <DialogDescription>
              You must be signed in to purchase a plan. Use a magic link to sign in.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={sendMagicLink} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="login-email">Email</label>
              <Input id="login-email" type="email" value={loginEmail} onChange={e => setLoginEmail(e.target.value)} placeholder="you@example.com" required />
            </div>
            <Button type="submit" disabled={!!loginLoading} className="w-full">
              {loginLoading ? 'Sending...' : 'Send magic link'}
            </Button>
            <div className="text-xs text-muted-foreground text-center">
              We’ll email you a secure link to log in.
            </div>
          </form>
          <Separator className="my-4" />
          <div className="text-xs text-center text-muted-foreground">
            Need help? <Link href="/support" className="underline">Contact support</Link>
          </div>
        </DialogContent>
      </Dialog>

      {/* Payment Modal - embeds checkout in-place */}
      <Dialog open={showPayment} onOpenChange={setShowPayment}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Complete your purchase</DialogTitle>
            <DialogDescription>Secure checkout</DialogDescription>
          </DialogHeader>
          {paymentUrl ? (
            <div className="w-full h-[640px]">
              <iframe src={paymentUrl} className="w-full h-full rounded-md border" title="Checkout" />
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">Preparing checkout...</div>
          )}
        </DialogContent>
      </Dialog>

      <Footer />
    </main>
  )
}
