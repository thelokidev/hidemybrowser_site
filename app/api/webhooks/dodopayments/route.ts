import { NextRequest, NextResponse } from 'next/server'
import { getDodoPayments } from '@/lib/dodopayments/client'
import { createAdminClient } from '@/lib/supabase/admin'
import { syncCustomerFromDodo } from '@/lib/supabase/webhook-helpers'

export async function POST(request: NextRequest) {
  try {
    // Read body as text for UTF-8 safety
    const body = await request.text()
    
    // Get Svix webhook headers
    const webhookId = request.headers.get('webhook-id') || request.headers.get('svix-id')
    const webhookTimestamp = request.headers.get('webhook-timestamp') || request.headers.get('svix-timestamp')
    const webhookSignature = request.headers.get('webhook-signature') || request.headers.get('svix-signature')
    
    console.log('[Webhook] Received event with headers:', { 
      hasId: !!webhookId, 
      hasTimestamp: !!webhookTimestamp, 
      hasSig: !!webhookSignature 
    })
    
    if (!webhookId || !webhookTimestamp || !webhookSignature) {
      console.error('[Webhook] Missing required headers')
      return NextResponse.json({ 
        error: 'Missing webhook headers',
        details: 'Expected webhook-id, webhook-timestamp, and webhook-signature headers'
      }, { status: 400 })
    }

    const webhookSecret = process.env.DODO_WEBHOOK_SECRET
    if (!webhookSecret) {
      console.error('Webhook secret not configured in environment variables')
      return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 })
    }

    // Verify Svix signature
    // Format string to sign: webhook-id.webhook-timestamp.payload
    const crypto = require('crypto')
    const signedContent = `${webhookId}.${webhookTimestamp}.${body}`

    // Compute expected signatures using both base64-decoded and raw secret for robustness
    const secretCandidateBase64 = webhookSecret.startsWith('whsec_') ? webhookSecret.slice(6) : webhookSecret
    const secretBytesBase64 = Buffer.from(secretCandidateBase64, 'base64')
    const secretBytesRaw = Buffer.from(webhookSecret.startsWith('whsec_') ? webhookSecret.slice(6) : webhookSecret, 'utf-8')

    const expectedSignatureBase64 = secretBytesBase64.length
      ? crypto.createHmac('sha256', secretBytesBase64).update(signedContent).digest('base64')
      : ''
    const expectedSignatureRaw = crypto
      .createHmac('sha256', secretBytesRaw)
      .update(signedContent)
      .digest('base64')

    // Extract received v1 signature
    let receivedSignature = ''
    const sigHeader = (webhookSignature || '').trim()
    
    if (sigHeader.startsWith('v1,')) {
      receivedSignature = sigHeader.slice(3).trim()
    } else if (sigHeader.startsWith('v1=')) {
      receivedSignature = sigHeader.slice(3).trim()
    } else {
      const tokens = sigHeader.split(/\s+/).filter(Boolean)
      const token = tokens.find(t => t.startsWith('v1,')) || tokens.find(t => t.startsWith('v1='))
      if (token) {
        receivedSignature = token.slice(3).trim()
      } else if (sigHeader && !sigHeader.includes(' ')) {
        receivedSignature = sigHeader
      }
    }

    // Timing-safe signature comparison
    let valid = false
    try {
      if (receivedSignature) {
        const bufRecv = Buffer.from(receivedSignature)
        const bufA = expectedSignatureBase64 ? Buffer.from(expectedSignatureBase64) : null
        const bufB = expectedSignatureRaw ? Buffer.from(expectedSignatureRaw) : null
        valid = (bufA && bufRecv.length === bufA.length && crypto.timingSafeEqual(bufRecv, bufA)) || 
                (bufB && bufRecv.length === bufB.length && crypto.timingSafeEqual(bufRecv, bufB)) || 
                false
      }
    } catch (err) {
      console.error('[Webhook] Signature comparison error:', err)
      valid = false
    }

    if (!valid) {
      console.error('[Webhook] Invalid signature')
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }

    // Parse event with UTF-8 safety
    const event = JSON.parse(body)
    const supabase = createAdminClient()

    console.log('[Webhook] Processing event:', event.type, 'ID:', event.id)

    // Log the webhook event
    await supabase
      .from('dodo_webhook_events')
      .insert({
        event_id: event.id,
        event_type: event.type,
        data: event.data,
        processed: false
      })

    // Process the event
    switch (event.type) {
      case 'subscription.created':
      case 'subscription.updated':
      case 'subscription.active':
      case 'subscription.renewed':
        await handleSubscriptionEvent(event.data, supabase)
        break
      
      case 'subscription.canceled':
        await handleSubscriptionCanceled(event.data, supabase)
        break
      
      case 'payment.succeeded':
        await handlePaymentSucceeded(event.data, supabase, getDodoPayments())
        break
      
      case 'payment.failed':
        await handlePaymentFailed(event.data, supabase)
        break
      
      case 'customer.created':
      case 'customer.updated':
        await handleCustomerEvent(event.data, supabase)
        break
      
      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    // Mark event as processed
    await supabase
      .from('dodo_webhook_events')
      .update({ processed: true })
      .eq('event_id', event.id)

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
}

async function handleSubscriptionEvent(subscription: any, supabase: any) {
  try {
    // Extract subscription ID (webhook may use 'id' or 'subscription_id')
    const subscriptionId = subscription.id || subscription.subscription_id
    console.log('[Webhook] Processing subscription:', subscriptionId, 'status:', subscription.status)
    
    // Extract customer data from nested structure
    const customerId = subscription.customer?.id || subscription.customer?.customer_id || subscription.customer_id
    const customerEmail = subscription.customer?.email || subscription.customer_email || subscription.email
    
    console.log('[Webhook] Customer lookup:', { customerId, customerEmail })
    
    // Try to get customer by dodo_customer_id first
    let customer = null
    if (customerId) {
      const result = await supabase
        .from('customers')
        .select('user_id, email')
        .eq('dodo_customer_id', customerId)
        .single()
      customer = result.data
    }

    // If customer not found by dodo_customer_id, try to match by email
    if (!customer && customerEmail) {
      console.log('[Webhook] Looking up by email:', customerEmail)
      const result = await supabase
        .from('customers')
        .select('user_id, email, dodo_customer_id')
        .eq('email', customerEmail)
        .single()
      
      if (result.data) {
        customer = result.data
        // Update the customer record with the dodo_customer_id
        if (customerId && !result.data.dodo_customer_id) {
          await supabase
            .from('customers')
            .update({ dodo_customer_id: customerId })
            .eq('user_id', result.data.user_id)
          console.log('[Webhook] Linked customer to Dodo ID')
        }
      }
    }

    if (!customer) {
      console.error('[Webhook] Customer not found:', { subscriptionId, customerId, customerEmail })
      // Attempt to auto-create a customer record using the email from the event
      if (customerEmail) {
        try {
          const { data: adminUsers } = await supabase.auth.admin.listUsers()
          const user = adminUsers?.users?.find((u: any) => u.email === customerEmail)
          if (user) {
            const { data: newCustomer, error: createErr } = await supabase
              .from('customers')
              .insert({
                user_id: user.id,
                email: customerEmail,
                name: user.user_metadata?.full_name || user.user_metadata?.name || customerEmail.split('@')[0],
                dodo_customer_id: customerId,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              })
              .select('user_id, email')
              .single()
            if (!createErr && newCustomer) {
              customer = newCustomer
              console.log('[Webhook] Auto-created customer from subscription event:', customer.user_id)
            }
          }
        } catch (autoCreateErr) {
          console.warn('[Webhook] Failed to auto-create customer (subscription):', autoCreateErr)
        }
      }
      if (!customer) return
    }

    console.log('[Webhook] Updating subscription for user:', customer.user_id)

    // Upsert subscription with correct DodoPayments field mappings
    // DodoPayments webhook subscription object structure:
    // - id/subscription_id: subscription identifier
    // - product_id: product identifier
    // - price_id: price identifier  
    // - status: subscription status
    // - current_period_start/current_period_end: billing period dates
    // - cancel_at_period_end: cancellation flag
    // - canceled_at: cancellation timestamp
    // - created_at: creation timestamp
    // - expires_at: expiration timestamp (for one-time/lifetime)
    await supabase
      .from('subscriptions')
      .upsert({
        user_id: customer.user_id,
        dodo_customer_id: customerId,
        dodo_subscription_id: subscriptionId,
        dodo_product_id: subscription.product_id,
        dodo_price_id: subscription.price_id,
        status: subscription.status,
        // Use correct period fields - DodoPayments API returns these field names
        current_period_start: subscription.current_period_start || subscription.created_at,
        current_period_end: subscription.current_period_end || subscription.expires_at,
        cancel_at_period_end: subscription.cancel_at_period_end || subscription.cancel_at_next_billing_date || false,
        canceled_at: subscription.canceled_at || subscription.cancelled_at,
        trial_start: subscription.trial_start,
        trial_end: subscription.trial_end,
        metadata: subscription.metadata,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'dodo_subscription_id'
      })

    console.log('[Webhook] Subscription synced successfully')

  } catch (error) {
    console.error('[Webhook] Error handling subscription event:', error)
    throw error
  }
}

async function handleSubscriptionCanceled(subscription: any, supabase: any) {
  try {
    await supabase
      .from('subscriptions')
      .update({
        status: 'canceled',
        canceled_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('dodo_subscription_id', subscription.id)
  } catch (error) {
    console.error('Error handling subscription cancellation:', error)
  }
}

async function handlePaymentSucceeded(payment: any, supabase: any, dodoClient: any) {
  try {
    const paymentId = payment.id || payment.payment_id
    console.log('[Webhook] Processing payment:', paymentId)
    
    // Extract customer data from nested structure
    const customerId = payment.customer?.id || payment.customer?.customer_id || payment.customer_id
    const customerEmail = payment.customer?.email || payment.customer_email || payment.email
    
    console.log('[Webhook] Payment customer lookup:', { customerId, customerEmail })
    
    // Try to get customer by dodo_customer_id first
    let customer = null
    if (customerId) {
      const result = await supabase
        .from('customers')
        .select('user_id, email')
        .eq('dodo_customer_id', customerId)
        .single()
      customer = result.data
    }

    // If customer not found by dodo_customer_id, try to match by email
    if (!customer && customerEmail) {
      console.log('[Webhook] Trying to find customer by email:', customerEmail)
      const result = await supabase
        .from('customers')
        .select('user_id, email, dodo_customer_id')
        .eq('email', customerEmail)
        .single()
      
      if (result.data) {
        customer = result.data
        // Update the customer record with the dodo_customer_id
        if (customerId && !result.data.dodo_customer_id) {
          await supabase
            .from('customers')
            .update({ dodo_customer_id: customerId })
            .eq('user_id', result.data.user_id)
          console.log('[Webhook] Updated customer with dodo_customer_id from payment')
        }
      }
    }

    if (!customer) {
      console.error('[Webhook] Customer not found for payment:', { paymentId, customerId, customerEmail })
      // Attempt to auto-create a customer record using the email from the event
      if (customerEmail) {
        try {
          const { data: adminUsers } = await supabase.auth.admin.listUsers()
          const user = adminUsers?.users?.find((u: any) => u.email === customerEmail)
          if (user) {
            const { data: newCustomer, error: createErr } = await supabase
              .from('customers')
              .insert({
                user_id: user.id,
                email: customerEmail,
                name: user.user_metadata?.full_name || user.user_metadata?.name || customerEmail.split('@')[0],
                dodo_customer_id: customerId,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              })
              .select('user_id, email')
              .single()
            if (!createErr && newCustomer) {
              customer = newCustomer
              console.log('[Webhook] Auto-created customer from payment event:', customer.user_id)
            }
          }
        } catch (autoCreateErr) {
          console.warn('[Webhook] Failed to auto-create customer (payment):', autoCreateErr)
        }
      }
      if (!customer) return
    }

    console.log('[Webhook] Recording payment for user:', customer.user_id)

    // Record payment with correct field names
    await supabase
      .from('payments')
      .upsert({
        user_id: customer.user_id,
        dodo_payment_id: paymentId,
        dodo_checkout_session_id: payment.checkout_session_id || payment.session_id,
        amount: payment.amount || payment.total_amount || payment.settlement_amount,
        currency: payment.currency || 'USD',
        status: 'succeeded',
        payment_method: payment.payment_method,
        description: payment.description,
        metadata: payment.metadata,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'dodo_payment_id'
      })
    
    console.log('[Webhook] Payment recorded successfully')
    
    // If payment corresponds to a subscription, fetch latest subscription from Dodo and upsert
    // Check multiple possible field names for subscription ID
    const subscriptionId = payment.subscription_id || payment.subscription?.id || payment.metadata?.subscription_id
    if (subscriptionId && dodoClient) {
      try {
        console.log('[Webhook] Fetching subscription from DodoPayments:', subscriptionId)
        const sub = await dodoClient.getSubscription(subscriptionId)
        
        await supabase
          .from('subscriptions')
          .upsert({
            user_id: customer.user_id,
            dodo_customer_id: sub.customer_id,
            dodo_subscription_id: sub.id,
            dodo_product_id: sub.product_id,
            dodo_price_id: sub.price_id,
            status: sub.status,
            current_period_start: sub.current_period_start,
            current_period_end: sub.current_period_end,
            cancel_at_period_end: sub.cancel_at_period_end,
            canceled_at: sub.canceled_at,
            trial_start: sub.trial_start,
            trial_end: sub.trial_end,
            metadata: sub.metadata,
            updated_at: new Date().toISOString()
          }, { onConflict: 'dodo_subscription_id' })
        
        console.log('[Webhook] Subscription updated after payment:', sub.id)
        
      } catch (e) {
        console.warn('[Webhook] Failed to refresh subscription after payment:', e)
      }
    } else if (!subscriptionId) {
      console.log('[Webhook] Payment is not associated with a subscription')
    }
  } catch (error) {
    console.error('[Webhook] Error handling payment success:', error)
    throw error
  }
}

async function handlePaymentFailed(payment: any, supabase: any) {
  try {
    // Get customer to find user_id
    const { data: customer } = await supabase
      .from('customers')
      .select('user_id')
      .eq('dodo_customer_id', payment.customer_id)
      .single()

    if (!customer) {
      console.error('Customer not found for payment:', payment.id)
      return
    }

    // Record failed payment
    await supabase
      .from('payments')
      .upsert({
        user_id: customer.user_id,
        dodo_payment_id: payment.id,
        amount: payment.amount,
        currency: payment.currency,
        status: 'failed',
        description: payment.description,
        metadata: payment.metadata,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'dodo_payment_id'
      })

  } catch (error) {
    console.error('Error handling payment failure:', error)
  }
}

async function handleCustomerEvent(customer: any, supabase: any) {
  try {
    console.log('[Webhook] Processing customer event:', customer.id)
    
    const userId = await syncCustomerFromDodo(supabase, customer)
    
    if (!userId) {
      console.warn('[Webhook] Could not sync customer:', customer.id)
    } else {
      console.log('[Webhook] Customer synced successfully')
    }
  } catch (error) {
    console.error('[Webhook] Error handling customer event:', error)
    throw error
  }
}
