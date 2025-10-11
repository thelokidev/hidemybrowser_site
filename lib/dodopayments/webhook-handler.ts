/**
 * DodoPayments Webhook Handler Types
 * Based on the reference architecture
 */

import { createClient } from '@/lib/supabase/client'

export interface DodoWebhookEvent {
  type: string
  data: any
}

/**
 * Handle subscription activation or plan change
 * Updates user's current subscription in the database
 */
export async function handleSubscriptionActive(event: DodoWebhookEvent) {
  const supabase = createClient()
  const { data } = event
  
  try {
    // Update or insert subscription
    const { error } = await supabase
      .from('subscriptions')
      .upsert({
        user_id: data.customer?.customer_id, // Map to your user system
        dodo_subscription_id: data.subscription_id,
        dodo_product_id: data.product_id,
        dodo_customer_id: data.customer?.customer_id,
        status: data.status,
        current_period_start: data.current_period_start,
        current_period_end: data.next_billing_date,
        cancel_at_period_end: data.cancel_at_next_billing_date || false,
        metadata: data.metadata,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'dodo_subscription_id'
      })
    
    if (error) {
      console.error('Error updating subscription:', error)
      throw error
    }
    
    return { success: true }
  } catch (error) {
    console.error('Error handling subscription active:', error)
    return { success: false, error }
  }
}

/**
 * Handle subscription cancellation or expiration
 * Removes active subscription from user
 */
export async function handleSubscriptionCancelled(event: DodoWebhookEvent) {
  const supabase = createClient()
  const { data } = event
  
  try {
    const { error } = await supabase
      .from('subscriptions')
      .update({
        status: 'cancelled',
        canceled_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('dodo_subscription_id', data.subscription_id)
    
    if (error) {
      console.error('Error cancelling subscription:', error)
      throw error
    }
    
    return { success: true }
  } catch (error) {
    console.error('Error handling subscription cancelled:', error)
    return { success: false, error }
  }
}

/**
 * Handle successful payment
 * Stores payment record for invoicing
 */
export async function handlePaymentSucceeded(event: DodoWebhookEvent) {
  const supabase = createClient()
  const { data } = event
  
  try {
    const { error } = await supabase
      .from('payments')
      .insert({
        user_id: data.customer?.customer_id, // Map to your user system
        dodo_payment_id: data.payment_id,
        dodo_checkout_session_id: data.checkout_session_id,
        amount: data.total_amount,
        currency: data.currency,
        status: data.status,
        payment_method: data.payment_method,
        description: `Payment for subscription`,
        metadata: data.metadata,
        created_at: data.created_at || new Date().toISOString(),
      })
    
    if (error) {
      console.error('Error recording payment:', error)
      throw error
    }
    
    return { success: true }
  } catch (error) {
    console.error('Error handling payment succeeded:', error)
    return { success: false, error }
  }
}

