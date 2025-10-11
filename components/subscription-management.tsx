'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { useSubscription } from '@/hooks/use-subscription'
import { getDodoPayments } from '@/lib/dodopayments/client'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { format } from 'date-fns'

export function SubscriptionManagement() {
  const { subscription, loading, error } = useSubscription()
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const { toast } = useToast()
  const supabase = createClient()

  const handleCancelSubscription = async () => {
    if (!subscription?.dodo_subscription_id) return

    setActionLoading('cancel')
    
    try {
      const dodoClient = getDodoPayments()
      if (!dodoClient) {
        throw new Error('Payment system unavailable')
      }

      await dodoClient.cancelSubscription(subscription.dodo_subscription_id)

      // Update local subscription
      await supabase
        .from('subscriptions')
        .update({
          status: 'canceled',
          canceled_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', subscription.id)

      toast({
        title: "Subscription canceled",
        description: "Your subscription has been canceled successfully.",
      })

      // Refresh the page to update subscription status
      window.location.reload()

    } catch (error) {
      console.error('Cancel subscription error:', error)
      toast({
        title: "Cancellation failed",
        description: "There was an error canceling your subscription. Please try again.",
        variant: "destructive",
      })
    } finally {
      setActionLoading(null)
    }
  }

  const handleReactivateSubscription = async () => {
    if (!subscription?.dodo_subscription_id) return

    setActionLoading('reactivate')
    
    try {
      const dodoClient = getDodoPayments()
      if (!dodoClient) {
        throw new Error('Payment system unavailable')
      }

      await dodoClient.updateSubscription(subscription.dodo_subscription_id, {
        cancel_at_period_end: false
      })

      // Update local subscription
      await supabase
        .from('subscriptions')
        .update({
          cancel_at_period_end: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', subscription.id)

      toast({
        title: "Subscription reactivated",
        description: "Your subscription has been reactivated successfully.",
      })

      // Refresh the page to update subscription status
      window.location.reload()

    } catch (error) {
      console.error('Reactivate subscription error:', error)
      toast({
        title: "Reactivation failed",
        description: "There was an error reactivating your subscription. Please try again.",
        variant: "destructive",
      })
    } finally {
      setActionLoading(null)
    }
  }

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'active':
        return 'default'
      case 'trialing':
        return 'secondary'
      case 'past_due':
        return 'destructive'
      case 'canceled':
        return 'outline'
      case 'incomplete':
        return 'destructive'
      default:
        return 'outline'
    }
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A'
    return format(new Date(dateString), 'MMM dd, yyyy')
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Subscription</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse">Loading subscription details...</div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Subscription</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-destructive">Error loading subscription: {error}</div>
        </CardContent>
      </Card>
    )
  }

  if (!subscription) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Subscription</CardTitle>
          <CardDescription>You don't have an active subscription</CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild>
            <a href="/pricing">View Plans</a>
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Subscription
          <Badge variant={getStatusBadgeVariant(subscription.status)}>
            {subscription.status}
          </Badge>
        </CardTitle>
        <CardDescription>
          Manage your subscription and billing
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <div className="text-sm font-medium">Current Period</div>
            <div className="text-sm text-muted-foreground">
              {formatDate(subscription.current_period_start)} - {formatDate(subscription.current_period_end)}
            </div>
          </div>
          
          {subscription.trial_end && (
            <div>
              <div className="text-sm font-medium">Trial Ends</div>
              <div className="text-sm text-muted-foreground">
                {formatDate(subscription.trial_end)}
              </div>
            </div>
          )}
        </div>

        {subscription.cancel_at_period_end && (
          <div className="p-4 border border-orange-200 bg-orange-50 rounded-lg">
            <div className="text-sm font-medium text-orange-800">
              Subscription will cancel at period end
            </div>
            <div className="text-sm text-orange-600">
              Your subscription will end on {formatDate(subscription.current_period_end)}
            </div>
          </div>
        )}

        <div className="flex gap-2">
          {subscription.status === 'active' && !subscription.cancel_at_period_end && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm">
                  Cancel Subscription
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Cancel Subscription</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to cancel your subscription? You'll continue to have access until the end of your current billing period.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Keep Subscription</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleCancelSubscription}
                    disabled={actionLoading === 'cancel'}
                  >
                    {actionLoading === 'cancel' ? 'Canceling...' : 'Cancel Subscription'}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}

          {subscription.cancel_at_period_end && (
            <Button
              onClick={handleReactivateSubscription}
              disabled={actionLoading === 'reactivate'}
              size="sm"
            >
              {actionLoading === 'reactivate' ? 'Reactivating...' : 'Reactivate Subscription'}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export default SubscriptionManagement
