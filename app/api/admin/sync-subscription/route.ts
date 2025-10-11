import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getDodoPayments } from '@/lib/dodopayments/client'

/**
 * Manual subscription sync endpoint
 * Use this to manually sync a subscription when webhooks fail
 * 
 * POST /api/admin/sync-subscription
 * Body: {
 *   email: "user@example.com" (required)
 *   subscription_id: "sub_xxx" (optional - will fetch from DodoPayments if omitted)
 * }
 * 
 * OR provide full details:
 * Body: {
 *   email: "user@example.com",
 *   subscription_id: "sub_xxx",
 *   customer_id: "cus_xxx",
 *   product_id: "pdt_xxx",
 *   status: "active",
 *   expires_at: "2026-01-11T02:41:34.720900Z"
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, subscription_id, customer_id, product_id, status, expires_at } = body

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    const supabase = createAdminClient()

    // Find or create customer by email
    let { data: customer } = await supabase
      .from('customers')
      .select('user_id, email, dodo_customer_id')
      .eq('email', email)
      .single()

    if (!customer) {
      console.log('[Manual Sync] Customer not found, creating...')
      
      // Get user from auth
      const { data: { users }, error: userError } = await supabase.auth.admin.listUsers()
      const user = users?.find(u => u.email === email)
      
      if (!user) {
        return NextResponse.json({ error: 'User not found in auth' }, { status: 404 })
      }

      // Create customer record
      const { data: newCustomer, error: createError } = await supabase
        .from('customers')
        .insert({
          user_id: user.id,
          email: user.email,
          name: user.user_metadata?.full_name || user.user_metadata?.name || email.split('@')[0],
          dodo_customer_id: customer_id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single()

      if (createError) {
        console.error('[Manual Sync] Error creating customer:', createError)
        return NextResponse.json({ error: 'Failed to create customer', details: createError }, { status: 500 })
      }

      customer = newCustomer
      console.log('[Manual Sync] Customer created:', customer.user_id)
    } else {
      console.log('[Manual Sync] Found customer:', customer.user_id)
      
      // Update customer with dodo_customer_id if provided and not already set
      if (customer_id && !customer.dodo_customer_id) {
        await supabase
          .from('customers')
          .update({ dodo_customer_id: customer_id })
          .eq('user_id', customer.user_id)
        console.log('[Manual Sync] Updated customer with dodo_customer_id')
      }
    }

    // If no subscription_id provided, try to fetch from DodoPayments
    let subscriptionData: any = null
    if (!subscription_id && customer.dodo_customer_id) {
      try {
        const dodo = getDodoPayments()
        console.log('[Manual Sync] Fetching subscriptions from DodoPayments for customer:', customer.dodo_customer_id)
        
        // Fetch all subscriptions for this customer
        const subscriptions = await dodo.listSubscriptions({ customer_id: customer.dodo_customer_id })
        const activeSubscription = subscriptions.data?.find((s: any) => s.status === 'active' || s.status === 'trialing')
        
        if (activeSubscription) {
          subscriptionData = activeSubscription
          console.log('[Manual Sync] Found active subscription from DodoPayments:', activeSubscription.id)
        }
      } catch (dodoError) {
        console.warn('[Manual Sync] Could not fetch from DodoPayments:', dodoError)
      }
    }

    // Prepare subscription data
    const subData = subscriptionData || {
      id: subscription_id,
      customer_id: customer_id,
      product_id: product_id,
      status: status || 'active',
      current_period_end: expires_at,
      current_period_start: new Date().toISOString()
    }

    if (!subData.id) {
      return NextResponse.json({ 
        error: 'No subscription found. Please provide subscription_id or ensure customer has active subscription in DodoPayments' 
      }, { status: 404 })
    }

    // Upsert subscription
    const { error: subError } = await supabase
      .from('subscriptions')
      .upsert({
        user_id: customer.user_id,
        dodo_customer_id: subData.customer_id || customer_id || customer.dodo_customer_id,
        dodo_subscription_id: subData.id,
        dodo_product_id: subData.product_id || product_id,
        dodo_price_id: subData.price_id,
        status: subData.status,
        current_period_start: subData.current_period_start || new Date().toISOString(),
        current_period_end: subData.current_period_end || expires_at,
        cancel_at_period_end: subData.cancel_at_period_end || false,
        canceled_at: subData.canceled_at,
        trial_start: subData.trial_start,
        trial_end: subData.trial_end,
        metadata: { 
          ...subData.metadata,
          manually_synced: true,
          synced_at: new Date().toISOString()
        },
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'dodo_subscription_id'
      })

    if (subError) {
      console.error('[Manual Sync] Error upserting subscription:', subError)
      return NextResponse.json({ error: 'Failed to sync subscription', details: subError }, { status: 500 })
    }

    console.log('[Manual Sync] Subscription synced successfully')

    return NextResponse.json({
      success: true,
      message: 'Subscription synced successfully',
      user_id: customer.user_id,
      email: customer.email,
      subscription_id: subData.id,
      status: subData.status,
      synced_from: subscriptionData ? 'dodo_api' : 'manual_input'
    })
  } catch (error) {
    console.error('[Manual Sync] Error:', error)
    return NextResponse.json({ error: 'Sync failed', details: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 })
  }
}


