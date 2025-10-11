import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { getDodoPayments } from '@/lib/dodopayments/client'

/**
 * Diagnostic Endpoint
 * Helps diagnose subscription sync issues by checking:
 * - Customer records
 * - Payment records
 * - Subscription records
 * - Webhook events
 * - DodoPayments API status
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabaseAdmin = createAdminClient()
    const dodoClient = getDodoPayments()

    const diagnosis: any = {
      userId: user.id,
      userEmail: user.email,
      timestamp: new Date().toISOString(),
      checks: {}
    }

    // Check 1: Customer Record
    console.log('[Diagnose] Checking customer record...')
    const { data: customer, error: customerError } = await supabaseAdmin
      .from('customers')
      .select('*')
      .eq('user_id', user.id)
      .single()

    diagnosis.checks.customerRecord = {
      exists: !!customer,
      hasDodoCustomerId: !!customer?.dodo_customer_id,
      email: customer?.email,
      dodoCustomerId: customer?.dodo_customer_id,
      error: customerError?.message
    }

    // Check 2: Subscription Records
    console.log('[Diagnose] Checking subscription records...')
    const { data: subscriptions, error: subError } = await supabaseAdmin
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)

    diagnosis.checks.subscriptionRecords = {
      count: subscriptions?.length || 0,
      subscriptions: subscriptions?.map(sub => ({
        id: sub.dodo_subscription_id,
        status: sub.status,
        productId: sub.dodo_product_id,
        currentPeriodEnd: sub.current_period_end,
        cancelAtPeriodEnd: sub.cancel_at_period_end
      })),
      error: subError?.message
    }

    // Check 3: Payment Records
    console.log('[Diagnose] Checking payment records...')
    const { data: payments, error: payError } = await supabaseAdmin
      .from('payments')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10)

    diagnosis.checks.paymentRecords = {
      count: payments?.length || 0,
      latestPayment: payments?.[0] ? {
        id: payments[0].dodo_payment_id,
        amount: payments[0].amount,
        currency: payments[0].currency,
        status: payments[0].status,
        createdAt: payments[0].created_at
      } : null,
      allPayments: payments?.map(p => ({
        id: p.dodo_payment_id,
        amount: p.amount,
        status: p.status,
        createdAt: p.created_at
      })),
      error: payError?.message
    }

    // Check 4: Webhook Events (last 48 hours)
    console.log('[Diagnose] Checking webhook events...')
    const { data: webhookEvents, error: webhookError } = await supabaseAdmin
      .from('dodo_webhook_events')
      .select('*')
      .gte('created_at', new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString())
      .order('created_at', { ascending: false })
      .limit(20)

    diagnosis.checks.webhookEvents = {
      total: webhookEvents?.length || 0,
      processed: webhookEvents?.filter(e => e.processed).length || 0,
      unprocessed: webhookEvents?.filter(e => !e.processed).length || 0,
      types: webhookEvents?.reduce((acc: any, e) => {
        acc[e.event_type] = (acc[e.event_type] || 0) + 1
        return acc
      }, {}),
      events: webhookEvents?.map(e => ({
        id: e.event_id,
        type: e.event_type,
        processed: e.processed,
        createdAt: e.created_at,
        customerEmail: e.data?.customer?.email || e.data?.email,
        subscriptionId: e.data?.subscription_id || e.data?.id
      })),
      error: webhookError?.message
    }

    // Check 5: DodoPayments API Status
    console.log('[Diagnose] Checking DodoPayments API...')
    if (dodoClient && customer?.dodo_customer_id) {
      try {
        const dodoSubscriptions = await dodoClient.listSubscriptions({
          customer_id: customer.dodo_customer_id
        })

        diagnosis.checks.dodoPaymentsApi = {
          accessible: true,
          subscriptionCount: dodoSubscriptions?.length || 0,
          subscriptions: dodoSubscriptions?.map((sub: any) => ({
            id: sub.id,
            status: sub.status,
            productId: sub.product_id,
            currentPeriodEnd: sub.current_period_end,
            createdAt: sub.created_at
          }))
        }
      } catch (dodoError) {
        diagnosis.checks.dodoPaymentsApi = {
          accessible: false,
          error: dodoError instanceof Error ? dodoError.message : 'Unknown error'
        }
      }
    } else {
      diagnosis.checks.dodoPaymentsApi = {
        accessible: false,
        reason: !dodoClient ? 'Client not initialized' : 'No customer ID'
      }
    }

    // Analysis & Recommendations
    console.log('[Diagnose] Generating recommendations...')
    const recommendations = []

    if (!customer) {
      recommendations.push({
        severity: 'error',
        message: 'Customer record not found',
        action: 'Complete a checkout to create your customer record'
      })
    } else if (!customer.dodo_customer_id) {
      recommendations.push({
        severity: 'error',
        message: 'DodoPayments customer ID missing',
        action: 'Contact support to link your account'
      })
    }

    if (payments && payments.length > 0 && (!subscriptions || subscriptions.length === 0)) {
      recommendations.push({
        severity: 'critical',
        message: 'Payment succeeded but subscription not created',
        action: 'Use the "Sync Subscription" button to manually sync from DodoPayments'
      })
    }

    if (diagnosis.checks.dodoPaymentsApi?.subscriptionCount > 0 && 
        diagnosis.checks.subscriptionRecords.count === 0) {
      recommendations.push({
        severity: 'critical',
        message: 'Subscriptions exist in DodoPayments but not in database',
        action: 'Run manual subscription sync immediately'
      })
    }

    const subscriptionWebhooks = webhookEvents?.filter(e => 
      e.event_type.startsWith('subscription.')
    )
    if (!subscriptionWebhooks || subscriptionWebhooks.length === 0) {
      recommendations.push({
        severity: 'warning',
        message: 'No subscription webhook events received',
        action: 'Check DodoPayments webhook configuration'
      })
    }

    diagnosis.recommendations = recommendations
    diagnosis.needsManualSync = recommendations.some(r => 
      r.action?.includes('manual sync') || r.action?.includes('Sync Subscription')
    )

    console.log('[Diagnose] Diagnosis complete')

    return NextResponse.json(diagnosis)

  } catch (error) {
    console.error('[Diagnose] Error:', error)
    return NextResponse.json({
      error: 'Diagnostic check failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

