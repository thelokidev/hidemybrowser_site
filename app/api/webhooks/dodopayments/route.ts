import { NextRequest, NextResponse } from 'next/server'
import { getDodoPayments } from '@/lib/dodopayments/client'
import { nextRetryAt } from '@/lib/payments/retry-scheduler'
import { createAdminClient } from '@/lib/supabase/admin'
import { invalidateUserAccessCache } from '@/lib/supabase/access-control'
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
    console.log('[Webhook] Full event payload:', JSON.stringify(event, null, 2))
    console.log('[Webhook] Event data structure:', JSON.stringify(event.data, null, 2))

    // Log the webhook event
    await supabase
      .from('dodo_webhook_events')
      .insert({
        event_id: event.id,
        event_type: event.type,
        data: event.data,
        processed: false
      })

    // Check if event was already processed (idempotency protection)
    const { data: existingEvent } = await supabase
      .from('dodo_webhook_events')
      .select('processed')
      .eq('event_id', event.id)
      .single()

    if (existingEvent?.processed === true) {
      console.log('[Webhook] Event already processed, skipping:', event.id)
      return NextResponse.json({ received: true, skipped: 'already_processed' })
    }

    // Process the event with enhanced error handling
    try {
      switch (event.type) {
        // Subscription lifecycle events
        case 'subscription.created':
        case 'subscription.updated':
        case 'subscription.active':
        case 'subscription.renewed':
        case 'subscription.plan_changed':
          console.log(`[Webhook] Processing subscription event: ${event.type}`)
          await handleSubscriptionEvent(event.data, supabase)
          break
        
        case 'subscription.on_hold':
          console.log('[Webhook] Processing subscription on hold')
          await handleSubscriptionOnHold(event.data, supabase)
          break
        
        case 'subscription.canceled':
          console.log('[Webhook] Processing subscription cancellation')
          await handleSubscriptionCanceled(event.data, supabase)
          break
        
        case 'subscription.expired':
          console.log('[Webhook] Processing subscription expiration')
          await handleSubscriptionExpired(event.data, supabase)
          break
        
        case 'subscription.failed':
          console.log('[Webhook] Processing subscription failure')
          await handleSubscriptionFailed(event.data, supabase)
          break
        
        // Payment events
        case 'payment.succeeded':
          console.log('[Webhook] Processing successful payment')
          await handlePaymentSucceeded(event.data, supabase, getDodoPayments())
          break
        
        case 'payment.processing':
          console.log('[Webhook] Processing payment in progress')
          await handlePaymentProcessing(event.data, supabase)
          break
        
        case 'payment.failed':
          console.log('[Webhook] Processing failed payment')
          await handlePaymentFailed(event.data, supabase)
          break
        
        case 'payment.cancelled':
          console.log('[Webhook] Processing cancelled payment')
          await handlePaymentCancelled(event.data, supabase)
          break
        
        // Customer events
        case 'customer.created':
        case 'customer.updated':
          console.log('[Webhook] Processing customer event')
          await handleCustomerEvent(event.data, supabase)
          break
        
        default:
          console.log(`[Webhook] Unhandled event type: ${event.type}`)
      }

      // Mark event as processed
      await supabase
        .from('dodo_webhook_events')
        .update({ processed: true })
        .eq('event_id', event.id)

    } catch (eventError) {
      console.error(`[Webhook] Failed to process ${event.type}:`, eventError)
      
      // Mark event as failed with error message
      await supabase
        .from('dodo_webhook_events')
        .update({ 
          processed: false,
          error_message: eventError instanceof Error ? eventError.message : 'Unknown error'
        })
        .eq('event_id', event.id)

      // Enqueue for retry with exponential backoff (2^n seconds), max 3
      try {
        // Get existing queue row
        const { data: existingQueue } = await supabase
          .from('webhook_retry_queue')
          .select('id, retry_count, max_retries')
          .eq('event_id', event.id)
          .limit(1)

        const existing = existingQueue?.[0]
        const retryCount = Math.min((existing?.retry_count ?? 0) + 1, (existing?.max_retries ?? 3))
        const maxRetries = existing?.max_retries ?? 3
        const delaySeconds = Math.pow(2, retryCount) // 2,4,8s
        const nextRetryAt = new Date(Date.now() + delaySeconds * 1000).toISOString()

        if (existing) {
          await supabase
            .from('webhook_retry_queue')
            .update({ retry_count: retryCount, next_retry_at: nextRetryAt, last_error: String(eventError), updated_at: new Date().toISOString() })
            .eq('id', existing.id)
        } else {
          await supabase
            .from('webhook_retry_queue')
            .insert({ event_id: event.id, retry_count: retryCount, max_retries: maxRetries, next_retry_at: nextRetryAt, last_error: String(eventError), created_at: new Date().toISOString(), updated_at: new Date().toISOString() })
        }
      } catch (queueErr) {
        console.warn('[Webhook] Failed to enqueue webhook for retry:', queueErr)
      }
      
      // Return 500 so DodoPayments retries
      return NextResponse.json({ 
        error: 'Event processing failed',
        details: eventError instanceof Error ? eventError.message : 'Unknown error'
      }, { status: 500 })
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
}

async function handleSubscriptionEvent(subscription: any, supabase: any) {
  try {
    console.log('[Webhook] handleSubscriptionEvent called with:', JSON.stringify(subscription, null, 2))
    
    // Extract subscription ID - DodoPayments uses 'subscription_id' primarily
    const subscriptionId = subscription.subscription_id || subscription.id
    console.log('[Webhook] Processing subscription:', subscriptionId, 'status:', subscription.status)
    
    // Extract customer data from nested structure - DodoPayments uses customer.customer_id
    const customerId = subscription.customer?.customer_id || subscription.customer?.id || subscription.customer_id
    const customerEmail = subscription.customer?.email || subscription.customer_email || subscription.email
    
    console.log('[Webhook] Customer lookup:', { customerId, customerEmail })
    console.log('[Webhook] Subscription fields:', {
      id: subscription.id,
      subscription_id: subscription.subscription_id,
      product_id: subscription.product_id,
      price_id: subscription.price_id,
      status: subscription.status,
      current_period_start: subscription.current_period_start,
      current_period_end: subscription.current_period_end,
      expires_at: subscription.expires_at,
      customer_structure: subscription.customer
    })
    
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
    
    const subscriptionData = {
      user_id: customer.user_id,
      dodo_customer_id: customerId,
      dodo_subscription_id: subscriptionId,
      dodo_product_id: subscription.product_id,
      dodo_price_id: subscription.price_id || null,
      status: subscription.status,
      // DodoPayments uses previous_billing_date/next_billing_date OR current_period_start/end
      current_period_start: subscription.current_period_start || subscription.previous_billing_date || subscription.created_at,
      current_period_end: subscription.current_period_end || subscription.next_billing_date || subscription.expires_at,
      cancel_at_period_end: subscription.cancel_at_period_end || subscription.cancel_at_next_billing_date || false,
      canceled_at: subscription.canceled_at || subscription.cancelled_at || null,
      trial_start: subscription.trial_start || null,
      trial_end: subscription.trial_end || null,
      metadata: subscription.metadata,
      updated_at: new Date().toISOString(),
    }
    
    console.log('[Webhook] Upserting subscription with data:', JSON.stringify(subscriptionData, null, 2))
    
    const { data: upsertData, error: upsertError } = await supabase
      .from('subscriptions')
      .upsert(subscriptionData, {
        onConflict: 'dodo_subscription_id'
      })
      .select()

    if (upsertError) {
      console.error('[Webhook] Database upsert failed:', {
        error: upsertError,
        message: upsertError.message,
        details: upsertError.details,
        hint: upsertError.hint,
        code: upsertError.code
      })
      throw upsertError
    }

    console.log('[Webhook] Subscription synced successfully, returned data:', JSON.stringify(upsertData, null, 2))
    try { invalidateUserAccessCache(customer.user_id) } catch {}

  } catch (error) {
    console.error('[Webhook] Error handling subscription event:', error)
    throw error
  }
}

async function handlePaymentSucceeded(payment: any, supabase: any, dodoClient: any) {
  try {
    const paymentId = payment.id || payment.payment_id
    console.log('[Webhook] Processing payment:', paymentId)

    // Extract customer data
    const customerId = payment.customer?.id || payment.customer?.customer_id || payment.customer_id
    const customerEmail = payment.customer?.email || payment.customer_email || payment.email

    // Lookup customer by dodo_customer_id, fallback to email (and link id)
    let customer = null as any
    if (customerId) {
      const result = await supabase
        .from('customers')
        .select('user_id, email, dodo_customer_id')
        .eq('dodo_customer_id', customerId)
        .single()
      customer = result.data
    }
    if (!customer && customerEmail) {
      const result = await supabase
        .from('customers')
        .select('user_id, email, dodo_customer_id')
        .eq('email', customerEmail)
        .single()
      if (result.data) {
        customer = result.data
        if (customerId && !result.data.dodo_customer_id) {
          await supabase
            .from('customers')
            .update({ dodo_customer_id: customerId })
            .eq('user_id', result.data.user_id)
        }
      }
    }
    if (!customer) {
      console.error('[Webhook] Customer not found for payment:', { paymentId, customerId, customerEmail })
      return
    }

    // Upsert payment as succeeded
    const { data: paymentUpsert, error: paymentUpsertError } = await supabase
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
        updated_at: new Date().toISOString(),
      }, { onConflict: 'dodo_payment_id' })
      .select('dodo_payment_id')
    if (paymentUpsertError) throw paymentUpsertError

    // Resolve attempts and clear grace -> activate
    try {
      const { data: subs } = await supabase
        .from('subscriptions')
        .select('id')
        .eq('user_id', customer.user_id)
        .order('updated_at', { ascending: false })
        .limit(1)
      const sub = subs?.[0]
      if (sub) {
        await supabase
          .from('payment_attempts')
          .update({ status: 'resolved', failure_count: 0, next_retry_at: null, updated_at: new Date().toISOString() })
          .eq('subscription_id', sub.id)
          .eq('user_id', customer.user_id)
        await supabase
          .from('subscriptions')
          .update({ status: 'active', grace_period_start: null, grace_period_end: null, updated_at: new Date().toISOString() })
          .eq('id', sub.id)
        try { invalidateUserAccessCache(customer.user_id) } catch {}
      }
    } catch {}
  } catch (error) {
    console.error('[Webhook] Error handling payment success:', error)
    throw error
  }
}

async function handlePaymentProcessing(payment: any, supabase: any) {
  try {
    const paymentId = payment.id || payment.payment_id
    const customerId = payment.customer?.id || payment.customer?.customer_id || payment.customer_id
    const customerEmail = payment.customer?.email || payment.customer_email || payment.email

    let customer = null as any
    if (customerId) {
      const result = await supabase.from('customers').select('user_id').eq('dodo_customer_id', customerId).single()
      customer = result.data
    }
    if (!customer && customerEmail) {
      const result = await supabase.from('customers').select('user_id').eq('email', customerEmail).single()
      customer = result.data
    }
    if (!customer) return

    const { error } = await supabase
      .from('payments')
      .upsert({
        user_id: customer.user_id,
        dodo_payment_id: paymentId,
        dodo_checkout_session_id: payment.checkout_session_id || payment.session_id,
        amount: payment.amount || payment.total_amount || payment.settlement_amount,
        currency: payment.currency || 'USD',
        status: 'processing',
        payment_method: payment.payment_method,
        description: payment.description,
        metadata: payment.metadata,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'dodo_payment_id' })
      .select('dodo_payment_id')
    if (error) throw error
  } catch (error) {
    console.error('[Webhook] Error handling payment processing:', error)
    throw error
  }
}

async function handlePaymentFailed(payment: any, supabase: any) {
  try {
    const paymentId = payment.id || payment.payment_id
    const customerId = payment.customer?.id || payment.customer?.customer_id || payment.customer_id
    const customerEmail = payment.customer?.email || payment.customer_email || payment.email

    let customer = null as any
    if (customerId) {
      const result = await supabase.from('customers').select('user_id').eq('dodo_customer_id', customerId).single()
      customer = result.data
    }
    if (!customer && customerEmail) {
      const result = await supabase.from('customers').select('user_id').eq('email', customerEmail).single()
      customer = result.data
    }
    if (!customer) return

    const { error: failedError } = await supabase
      .from('payments')
      .upsert({
        user_id: customer.user_id,
        dodo_payment_id: paymentId,
        amount: payment.amount,
        currency: payment.currency,
        status: 'failed',
        description: payment.description,
        metadata: payment.metadata,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'dodo_payment_id' })
      .select('dodo_payment_id')
    if (failedError) throw failedError
  } catch (error) {
    console.error('Error handling payment failure:', error)
    throw error
  }
}

async function handlePaymentCancelled(payment: any, supabase: any) {
  try {
    const paymentId = payment.id || payment.payment_id
    const { data, error } = await supabase
      .from('payments')
      .update({ status: 'cancelled', updated_at: new Date().toISOString() })
      .eq('dodo_payment_id', paymentId)
      .select('dodo_payment_id')
    if (error) throw error
  } catch (error) {
    console.error('[Webhook] Error handling payment cancellation:', error)
    throw error
  }
}

async function handleSubscriptionOnHold(subscription: any, supabase: any) {
  try {
    const subscriptionId = subscription.id || subscription.subscription_id
    let existing = null as any
    const { data: existingSub } = await supabase
      .from('subscriptions')
      .select('id, status')
      .eq('dodo_subscription_id', subscriptionId)
      .single()
    existing = existingSub
    if (existing?.status === 'on_hold') return
    const { error } = await supabase
      .from('subscriptions')
      .update({ status: 'on_hold', updated_at: new Date().toISOString() })
      .eq('dodo_subscription_id', subscriptionId)
      .select('id')
    if (error) throw error
  } catch (error) {
    console.error('[Webhook] Error handling subscription on hold:', error)
    throw error
  }
}

async function handleSubscriptionCanceled(subscription: any, supabase: any) {
  try {
    const subscriptionId = subscription.id || subscription.subscription_id
    console.log('[Webhook] Processing subscription cancellation:', subscriptionId)
    let existing = null
    try {
      const { data: existingSub, error: fetchError } = await supabase
        .from('subscriptions')
        .select('id, status, user_id')
        .eq('dodo_subscription_id', subscriptionId)
        .single()
      if (fetchError && !existingSub) {
        console.warn('[Webhook] No subscription found to cancel:', subscriptionId)
        return
      }
      existing = existingSub
    } catch (fetchErr) {
      console.error('[Webhook] Failed to fetch subscription before cancellation:', fetchErr)
      throw fetchErr
    }
    console.log('[Webhook] Subscription status transition:', { subscriptionId, from: existing?.status, to: 'canceled' })
    if (existing?.status === 'canceled') {
      console.log('[Webhook] Subscription already canceled, no-op:', subscriptionId)
      return
    }
    const { data, error } = await supabase
      .from('subscriptions')
      .update({
        status: 'canceled',
        canceled_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('dodo_subscription_id', subscriptionId)
      .select('id, status, user_id')
    if (error) {
      console.error('[Webhook] Failed to update canceled subscription:', { subscriptionId, error })
      throw error
    }
    if (!data || data.length === 0) {
      console.warn('[Webhook] Update affected 0 rows for canceled subscription:', subscriptionId)
    } else {
      console.log('[Webhook] Subscription marked as canceled:', subscriptionId)
      try { if (data[0]?.user_id) invalidateUserAccessCache(data[0].user_id) } catch {}
    }
  } catch (error) {
    console.error('Error handling subscription cancellation:', error)
    throw error
  }
}

async function handleSubscriptionExpired(subscription: any, supabase: any) {
  try {
    const subscriptionId = subscription.id || subscription.subscription_id
    const canceledAt = subscription.canceled_at || subscription.cancelled_at || subscription.expires_at || new Date().toISOString()
    const expiresAt = subscription.expires_at || subscription.current_period_end || null
    console.log('[Webhook] Processing expired subscription:', { subscriptionId, canceledAt, expiresAt })
    let existing = null
    try {
      const { data: existingSub, error: fetchError } = await supabase
        .from('subscriptions')
        .select('id, status, user_id')
        .eq('dodo_subscription_id', subscriptionId)
        .single()
      if (fetchError && !existingSub) {
        console.warn('[Webhook] No subscription found to expire:', subscriptionId)
        return
      }
      existing = existingSub
    } catch (fetchErr) {
      console.error('[Webhook] Failed to fetch subscription before expiring:', fetchErr)
      throw fetchErr
    }
    console.log('[Webhook] Subscription status transition:', { subscriptionId, from: existing?.status, to: 'expired' })
    if (existing?.status === 'expired') {
      console.log('[Webhook] Subscription already expired, no-op:', subscriptionId)
      return
    }
    const { data, error } = await supabase
      .from('subscriptions')
      .update({
        status: 'expired',
        canceled_at: canceledAt,
        updated_at: new Date().toISOString()
      })
      .eq('dodo_subscription_id', subscriptionId)
      .select('id, status, user_id')
    if (error) {
      console.error('[Webhook] Failed to update expired subscription:', { subscriptionId, error })
      throw error
    }
    if (!data || data.length === 0) {
      console.warn('[Webhook] Update affected 0 rows for expired subscription:', subscriptionId)
    } else {
      console.log('[Webhook] Subscription marked as expired:', subscriptionId)
      try { if (data[0]?.user_id) invalidateUserAccessCache(data[0].user_id) } catch {}
    }
  } catch (error) {
    console.error('[Webhook] Error handling subscription expiration:', error)
    throw error
  }
}

async function handleSubscriptionFailed(subscription: any, supabase: any) {
  try {
    const subscriptionId = subscription.id || subscription.subscription_id
    console.log('[Webhook] Processing failed subscription:', subscriptionId)
    
    let existing = null
    try {
      const { data: existingSub, error: fetchError } = await supabase
        .from('subscriptions')
        .select('id, status, user_id')
        .eq('dodo_subscription_id', subscriptionId)
        .single()
      if (fetchError && !existingSub) {
        console.warn('[Webhook] No subscription found to mark failed:', subscriptionId)
        return
      }
      existing = existingSub
    } catch (fetchErr) {
      console.error('[Webhook] Failed to fetch subscription before marking failed:', fetchErr)
      throw fetchErr
    }
    console.log('[Webhook] Subscription status transition:', { subscriptionId, from: existing?.status, to: 'failed' })
    if (existing?.status === 'failed') {
      console.log('[Webhook] Subscription already failed, no-op:', subscriptionId)
      return
    }
    const { data, error } = await supabase
      .from('subscriptions')
      .update({
        status: 'failed',
        updated_at: new Date().toISOString()
      })
      .eq('dodo_subscription_id', subscriptionId)
      .select('id, status, user_id')
    if (error) {
      console.error('[Webhook] Failed to update failed subscription:', { subscriptionId, error })
      throw error
    }
    if (!data || data.length === 0) {
      console.warn('[Webhook] Update affected 0 rows for failed subscription:', subscriptionId)
    } else {
      console.log('[Webhook] Subscription marked as failed')
      try { if (data[0]?.user_id) invalidateUserAccessCache(data[0].user_id) } catch {}
    }
  } catch (error) {
    console.error('[Webhook] Error handling subscription failure:', error)
    throw error
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
