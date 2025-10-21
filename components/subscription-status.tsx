'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { useAccessStatus } from '@/hooks/use-access-status'
import { useSubscription } from '@/hooks/use-subscription'
import { useToast } from '@/hooks/use-toast'
// Removed unused Clock import since free trial is removed

export default function SubscriptionStatus() {
  // Use unified access status hook for priority logic
  const accessStatus = useAccessStatus()
  // Still need subscription details for display
  const { subscription } = useSubscription()
  const { toast } = useToast()
  const [pendingSubscription, setPendingSubscription] = useState<string | null>(null)

  // Check for pending subscription from URL
  useEffect(() => {
    if (typeof window === 'undefined') return
    const url = new URL(window.location.href)
    const subscriptionId = url.searchParams.get('subscription_id')
    const status = url.searchParams.get('status')
    
    if (subscriptionId && status === 'active') {
      setPendingSubscription(subscriptionId)
      // Clear after 30 seconds (webhook should have processed by then)
      setTimeout(() => setPendingSubscription(null), 30000)
    }
  }, [])

  // Show a success toast if redirected back with ?paid=1
  useEffect(() => {
    if (typeof window === 'undefined') return
    const url = new URL(window.location.href)
    const paid = url.searchParams.get('paid')
    if (paid === '1') {
      toast({
        title: 'Payment successful',
        description: 'Your subscription is being activated. This may take a few moments.',
      })
      url.searchParams.delete('paid')
      window.history.replaceState({}, '', url.toString())
    }
  }, [toast])

  if (accessStatus.loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Subscription Status</CardTitle>
          <CardDescription>Checking your subscription...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse text-sm text-muted-foreground">Loading...</div>
        </CardContent>
      </Card>
    )
  }

  if (accessStatus.error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Subscription Status</CardTitle>
          <CardDescription>Error</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-destructive">{accessStatus.error}</div>
        </CardContent>
      </Card>
    )
  }

  // Active paid subscription - priority display
  if (accessStatus.accessType === 'subscription' && subscription) {
    const formatDate = (dateString?: string) => {
      if (!dateString) return '-'
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })
    }

    const getDaysRemaining = () => {
      if (!subscription.current_period_end) return null
      const now = new Date()
      const end = new Date(subscription.current_period_end)
      const diff = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      return diff > 0 ? diff : 0
    }

    // Map product IDs to plan names
    const getPlanName = (productId?: string) => {
      const planMap: Record<string, string> = {
        'pdt_v0slst9k4JI0Q2qUDkIAW': 'Weekly Plan',
        'pdt_ugqyKXMT219386BcoejVN': 'Monthly Plan',
        'pdt_W4YuF093U2MSpABbJ7miA': '3 Months Plan',
        'pdt_Ah7DRDitJbvGcaFMrqrOf': '6 Months Plan',
      }
      return productId ? planMap[productId] || 'Premium Plan' : 'Premium Plan'
    }

    const daysRemaining = getDaysRemaining()
    const planName = getPlanName(subscription?.dodo_product_id)

    return (
      <Card>
        <CardHeader>
          <CardTitle>Subscription Status</CardTitle>
          <CardDescription>Manage your subscription</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Current Plan</p>
                <p className="text-lg font-bold">{planName}</p>
              </div>
              <Badge 
                variant={subscription.status === 'active' ? 'default' : 'secondary'}
                className={subscription.status === 'active' ? 'bg-green-500/10 text-green-600 hover:bg-green-500/20' : ''}
              >
                {subscription.status}
              </Badge>
            </div>
          </div>

          {subscription.current_period_start && subscription.current_period_end && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Current period</span>
                <span className="font-medium">
                  {formatDate(subscription.current_period_start)} - {formatDate(subscription.current_period_end)}
                </span>
              </div>
              
              {daysRemaining !== null && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Days remaining</span>
                  <span className={`font-medium ${daysRemaining < 7 ? 'text-orange-600' : 'text-green-600'}`}>
                    {daysRemaining} days
                  </span>
                </div>
              )}
            </div>
          )}

          {subscription.cancel_at_period_end && (
            <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
              <p className="text-sm text-yellow-700 dark:text-yellow-600">
                Your subscription will cancel at the end of the current period.
              </p>
            </div>
          )}

          <div className="pt-2 space-y-2">
            <Link href="/pricing" className="block">
              <Button variant="outline" className="w-full transition-all duration-300 hover:bg-foreground hover:text-background">
                View Plans
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Show processing state if payment just succeeded
  if (pendingSubscription) {
    return (
      <Card className="border-green-500/50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Subscription Activating</CardTitle>
            <Badge variant="secondary" className="bg-green-500/10 text-green-600">
              Processing
            </Badge>
          </div>
          <CardDescription>Your payment was successful!</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600"></div>
              <span className="text-sm font-medium">Activating your subscription...</span>
            </div>
            <p className="text-xs text-muted-foreground">
              This usually takes a few seconds. Your subscription will appear shortly.
            </p>
          </div>
          
          <p className="text-sm text-muted-foreground text-center">
            Subscription ID: <code className="text-xs bg-muted px-1 py-0.5 rounded">{pendingSubscription}</code>
          </p>
        </CardContent>
      </Card>
    )
  }

  // No active subscription
  if (accessStatus.accessType === 'none') {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Subscription Status</CardTitle>
          <CardDescription>No active subscription</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground mb-2">Subscribe to unlock all premium features</p>
          </div>
          <Link href="/pricing">
            <Button className="w-full transition-all duration-300 hover:bg-foreground hover:text-background">View Plans</Button>
          </Link>
          
          {/* Info about automatic subscription sync */}
          <div className="pt-4 border-t">
            <p className="text-xs text-muted-foreground">
              After completing a payment, your subscription will be activated automatically within a few moments. 
              If you don't see it after refreshing, please contact support.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  // This should never be reached, but return a fallback just in case
  return null
}
