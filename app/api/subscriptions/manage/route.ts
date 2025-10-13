import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { canChangePlan, getTierName } from '@/lib/subscription-tier-utils'

/**
 * Subscription Management API
 * 
 * Handles subscription tier changes with business logic:
 * - Upgrades: Scheduled to start at end of current period
 * - Downgrades: Blocked entirely
 * - Same tier: Blocked
 */

interface ManageSubscriptionRequest {
  action: 'schedule-upgrade' | 'cancel-scheduled-upgrade'
  newProductId?: string
}

interface ManageSubscriptionResponse {
  success: boolean
  message: string
  error?: string
  scheduledUpgrade?: {
    productId: string
    planName: string
    startDate: string
  }
}

/**
 * POST /api/subscriptions/manage
 * Manage subscription tier changes
 */
export async function POST(
  request: NextRequest
): Promise<NextResponse<ManageSubscriptionResponse>> {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized', error: 'Authentication required' },
        { status: 401 }
      )
    }

    const body = await request.json() as ManageSubscriptionRequest
    const { action, newProductId } = body

    console.log('[SubscriptionManagement] Action:', action, 'User:', user.id, 'New Product:', newProductId)

    // Get current active subscription
    const { data: currentSubscription, error: subError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .in('status', ['active', 'trialing', 'renewed'])
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (subError) {
      console.error('[SubscriptionManagement] Error fetching subscription:', subError)
      return NextResponse.json(
        { success: false, message: 'Error fetching subscription', error: subError.message },
        { status: 500 }
      )
    }

    if (!currentSubscription) {
      return NextResponse.json(
        { success: false, message: 'No active subscription found', error: 'You must have an active subscription to manage' },
        { status: 400 }
      )
    }

    // Handle different actions
    if (action === 'schedule-upgrade') {
      if (!newProductId) {
        return NextResponse.json(
          { success: false, message: 'Product ID required', error: 'newProductId is required for schedule-upgrade action' },
          { status: 400 }
        )
      }

      // Validate the plan change
      const validation = canChangePlan(currentSubscription.dodo_product_id, newProductId)

      if (!validation.allowed) {
        console.log('[SubscriptionManagement] Plan change not allowed:', validation.reason)
        return NextResponse.json(
          { success: false, message: validation.reason, error: validation.reason },
          { status: 400 }
        )
      }

      // Schedule the upgrade
      const scheduledStartDate = currentSubscription.current_period_end
      const newPlanName = getTierName(newProductId)

      const { error: updateError } = await supabase
        .from('subscriptions')
        .update({
          scheduled_product_id: newProductId,
          scheduled_start_date: scheduledStartDate,
          is_upgrade_scheduled: true,
          updated_at: new Date().toISOString(),
        })
        .eq('id', currentSubscription.id)

      if (updateError) {
        console.error('[SubscriptionManagement] Error scheduling upgrade:', updateError)
        return NextResponse.json(
          { success: false, message: 'Failed to schedule upgrade', error: updateError.message },
          { status: 500 }
        )
      }

      console.log('[SubscriptionManagement] Upgrade scheduled successfully:', {
        from: currentSubscription.dodo_product_id,
        to: newProductId,
        startDate: scheduledStartDate,
      })

      return NextResponse.json({
        success: true,
        message: `Upgrade to ${newPlanName} scheduled successfully. It will activate on ${new Date(scheduledStartDate).toLocaleDateString()}.`,
        scheduledUpgrade: {
          productId: newProductId,
          planName: newPlanName,
          startDate: scheduledStartDate,
        },
      })
    }

    if (action === 'cancel-scheduled-upgrade') {
      // Cancel a scheduled upgrade
      if (!currentSubscription.is_upgrade_scheduled) {
        return NextResponse.json(
          { success: false, message: 'No scheduled upgrade found', error: 'You do not have a scheduled upgrade to cancel' },
          { status: 400 }
        )
      }

      const { error: updateError } = await supabase
        .from('subscriptions')
        .update({
          scheduled_product_id: null,
          scheduled_start_date: null,
          is_upgrade_scheduled: false,
          updated_at: new Date().toISOString(),
        })
        .eq('id', currentSubscription.id)

      if (updateError) {
        console.error('[SubscriptionManagement] Error canceling scheduled upgrade:', updateError)
        return NextResponse.json(
          { success: false, message: 'Failed to cancel scheduled upgrade', error: updateError.message },
          { status: 500 }
        )
      }

      console.log('[SubscriptionManagement] Scheduled upgrade canceled successfully')

      return NextResponse.json({
        success: true,
        message: 'Scheduled upgrade canceled successfully',
      })
    }

    // Unknown action
    return NextResponse.json(
      { success: false, message: 'Invalid action', error: `Unknown action: ${action}` },
      { status: 400 }
    )
  } catch (error) {
    console.error('[SubscriptionManagement] Unexpected error:', error)
    return NextResponse.json(
      {
        success: false,
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

/**
 * GET /api/subscriptions/manage
 * Get current subscription and scheduled upgrade info
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get current active subscription
    const { data: subscription, error: subError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .in('status', ['active', 'trialing', 'renewed'])
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (subError) {
      console.error('[SubscriptionManagement] Error fetching subscription:', subError)
      return NextResponse.json(
        { error: subError.message },
        { status: 500 }
      )
    }

    if (!subscription) {
      return NextResponse.json({
        hasSubscription: false,
        subscription: null,
      })
    }

    return NextResponse.json({
      hasSubscription: true,
      subscription: {
        id: subscription.id,
        status: subscription.status,
        currentProductId: subscription.dodo_product_id,
        currentPlanName: getTierName(subscription.dodo_product_id),
        currentPeriodEnd: subscription.current_period_end,
        isUpgradeScheduled: subscription.is_upgrade_scheduled,
        scheduledUpgrade: subscription.is_upgrade_scheduled ? {
          productId: subscription.scheduled_product_id,
          planName: getTierName(subscription.scheduled_product_id),
          startDate: subscription.scheduled_start_date,
        } : null,
      },
    })
  } catch (error) {
    console.error('[SubscriptionManagement] Unexpected error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

