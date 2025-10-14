import { SupabaseClient } from '@supabase/supabase-js'

/**
 * Sync customer from DodoPayments to Supabase
 * Returns the Supabase user_id if found
 */
export async function syncCustomerFromDodo(
  supabase: SupabaseClient,
  dodoCustomer: any
): Promise<string | null> {
  console.log('[WebhookHelper] Syncing customer from DodoPayments:', dodoCustomer.id)
  
  // Try to get user_id from metadata first
  const userId = dodoCustomer.metadata?.supabase_user_id

  if (!userId) {
    // Try to find by email using listUsers
    console.log('[WebhookHelper] No user_id in metadata, looking up by email:', dodoCustomer.email)
    const { data: { users }, error } = await supabase.auth.admin.listUsers()
    
    if (error) {
      console.error('[WebhookHelper] Error listing users:', error)
      return null
    }
    
    const authUser = users.find(u => u.email === dodoCustomer.email)
    
    if (!authUser) {
      console.warn('[WebhookHelper] Cannot find Supabase user for customer:', dodoCustomer.id)
      return null
    }
    
    console.log('[WebhookHelper] Found user by email:', authUser.id)
    
    // Update customer record with found user
    await supabase
      .from('customers')
      .upsert({
        user_id: authUser.id,
        dodo_customer_id: dodoCustomer.id,
        email: dodoCustomer.email,
        name: dodoCustomer.name,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'dodo_customer_id'
      })
    
    return authUser.id
  }

  // Update customer record
  await supabase
    .from('customers')
    .upsert({
      user_id: userId,
      dodo_customer_id: dodoCustomer.id,
      email: dodoCustomer.email,
      name: dodoCustomer.name,
      updated_at: new Date().toISOString()
    }, {
      onConflict: 'dodo_customer_id'
    })

  console.log('[WebhookHelper] Customer synced successfully')
  return userId
}

/**
 * Sync subscription from DodoPayments to Supabase
 */
export async function syncSubscriptionFromDodo(
  supabase: SupabaseClient,
  subscription: any,
  userId: string
): Promise<void> {
  console.log('[WebhookHelper] Syncing subscription:', subscription.id)
  
  await supabase
    .from('subscriptions')
    .upsert({
      user_id: userId,
      dodo_customer_id: subscription.customer_id,
      dodo_subscription_id: subscription.id,
      dodo_product_id: subscription.product_id,
      dodo_price_id: subscription.price_id,
      status: subscription.status,
      current_period_start: subscription.current_period_start,
      current_period_end: subscription.current_period_end,
      cancel_at_period_end: subscription.cancel_at_period_end,
      canceled_at: subscription.canceled_at,
      trial_start: subscription.trial_start,
      trial_end: subscription.trial_end,
      metadata: subscription.metadata,
      updated_at: new Date().toISOString()
    }, {
      onConflict: 'dodo_subscription_id'
    })
  
  console.log('[WebhookHelper] Subscription synced successfully')
}

/**
 * Mark webhook event as processed
 */
export async function markWebhookProcessed(
  supabase: SupabaseClient,
  eventId: string,
  success: boolean,
  error?: string
): Promise<void> {
  await supabase
    .from('dodo_webhook_events')
    .update({ 
      processed: success,
      updated_at: new Date().toISOString()
    })
    .eq('event_id', eventId)
  
  if (!success && error) {
    console.error(`[WebhookHelper] Event ${eventId} failed:`, error)
  }
}

