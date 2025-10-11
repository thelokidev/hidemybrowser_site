import { NextRequest, NextResponse } from 'next/server'
import { getDodoPayments } from '@/lib/dodopayments/client'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

/**
 * Manual Subscription Sync Endpoint
 * Use this to manually sync a user's subscription from DodoPayments
 * This is useful when webhooks fail or are missed
 */
export async function POST(request: NextRequest) {
  try {
    // Check if user is authenticated
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('[SubscriptionSync] Manual sync requested for user:', user.id)

    const dodoClient = getDodoPayments()
    const supabaseAdmin = createAdminClient()

    if (!dodoClient) {
      return NextResponse.json({ 
        error: 'Payment system not configured' 
      }, { status: 503 })
    }

    // 1. Get customer record
    const { data: customer, error: customerError } = await supabaseAdmin
      .from('customers')
      .select('user_id, email, dodo_customer_id')
      .eq('user_id', user.id)
      .single()

    if (customerError || !customer) {
      console.error('[SubscriptionSync] Customer not found:', user.id)
      return NextResponse.json({ 
        error: 'Customer record not found',
        details: 'Please complete a checkout first to create your customer record'
      }, { status: 404 })
    }

    if (!customer.dodo_customer_id) {
      console.error('[SubscriptionSync] Customer has no DodoPayments ID:', user.id)
      return NextResponse.json({ 
        error: 'DodoPayments customer ID not found',
        details: 'Your account is not linked to a payment customer'
      }, { status: 404 })
    }

    console.log('[SubscriptionSync] Found customer:', customer.dodo_customer_id)

    // 2. Fetch all subscriptions for this customer from DodoPayments
    try {
      const response = await dodoClient.subscriptions.list({
        customer_id: customer.dodo_customer_id
      })
      
      // Extract subscriptions from paginated response
      const subscriptions = response.data || []

      console.log('[SubscriptionSync] Found subscriptions:', subscriptions?.length || 0)

      if (!subscriptions || subscriptions.length === 0) {
        return NextResponse.json({
          success: false,
          message: 'No active subscriptions found in DodoPayments',
          syncedCount: 0
        })
      }

      // 3. Sync each subscription
      const syncResults = []
      for (const subscription of subscriptions) {
        try {
          console.log('[SubscriptionSync] Syncing subscription:', subscription.id)
          
          const { error: upsertError } = await supabaseAdmin
            .from('subscriptions')
            .upsert({
              user_id: customer.user_id,
              dodo_customer_id: subscription.customer_id,
              dodo_subscription_id: subscription.id,
              dodo_product_id: subscription.product_id,
              dodo_price_id: subscription.price_id,
              status: subscription.status,
              current_period_start: subscription.current_period_start,
              current_period_end: subscription.current_period_end,
              cancel_at_period_end: subscription.cancel_at_period_end || false,
              canceled_at: subscription.canceled_at,
              trial_start: subscription.trial_start,
              trial_end: subscription.trial_end,
              metadata: subscription.metadata,
              updated_at: new Date().toISOString()
            }, {
              onConflict: 'dodo_subscription_id'
            })

          if (upsertError) {
            console.error('[SubscriptionSync] Failed to sync subscription:', subscription.id, upsertError)
            syncResults.push({
              subscriptionId: subscription.id,
              success: false,
              error: upsertError.message
            })
          } else {
            console.log('[SubscriptionSync] Successfully synced subscription:', subscription.id)
            syncResults.push({
              subscriptionId: subscription.id,
              success: true,
              status: subscription.status
            })
          }
        } catch (subError) {
          console.error('[SubscriptionSync] Error processing subscription:', subscription.id, subError)
          syncResults.push({
            subscriptionId: subscription.id,
            success: false,
            error: subError instanceof Error ? subError.message : 'Unknown error'
          })
        }
      }

      const successCount = syncResults.filter(r => r.success).length
      
      console.log('[SubscriptionSync] Sync complete:', successCount, '/', syncResults.length)

      return NextResponse.json({
        success: successCount > 0,
        message: `Synced ${successCount} of ${syncResults.length} subscriptions`,
        syncedCount: successCount,
        totalCount: syncResults.length,
        results: syncResults
      })

    } catch (dodoError) {
      console.error('[SubscriptionSync] DodoPayments API error:', dodoError)
      return NextResponse.json({
        error: 'Failed to fetch subscriptions from payment provider',
        details: dodoError instanceof Error ? dodoError.message : 'Unknown error'
      }, { status: 500 })
    }

  } catch (error) {
    console.error('[SubscriptionSync] Unexpected error:', error)
    return NextResponse.json({
      error: 'Subscription sync failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

/**
 * Get sync status and recent webhook events
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabaseAdmin = createAdminClient()

    // Get customer
    const { data: customer } = await supabaseAdmin
      .from('customers')
      .select('dodo_customer_id, email')
      .eq('user_id', user.id)
      .single()

    // Get current subscription
    const { data: subscription } = await supabaseAdmin
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .single()

    // Get recent webhook events (last 24 hours)
    const { data: webhookEvents } = await supabaseAdmin
      .from('dodo_webhook_events')
      .select('event_id, event_type, processed, created_at')
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .order('created_at', { ascending: false })
      .limit(10)

    // Get recent payments
    const { data: payments } = await supabaseAdmin
      .from('payments')
      .select('dodo_payment_id, amount, currency, status, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(5)

    return NextResponse.json({
      customer: {
        hasRecord: !!customer,
        dodoCustomerId: customer?.dodo_customer_id,
        email: customer?.email
      },
      subscription: {
        exists: !!subscription,
        status: subscription?.status,
        dodoSubscriptionId: subscription?.dodo_subscription_id,
        currentPeriodEnd: subscription?.current_period_end
      },
      webhookEvents: webhookEvents || [],
      payments: payments || []
    })

  } catch (error) {
    console.error('[SubscriptionSync] Status check error:', error)
    return NextResponse.json({
      error: 'Failed to get sync status',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

