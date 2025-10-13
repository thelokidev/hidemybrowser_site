/**
 * One-time script to sync subscription for lokeshadhepalliprasad@gmail.com
 * This fixes the issue where payment succeeded but webhook didn't create subscription
 * 
 * Usage: npx tsx scripts/sync-lokesh-subscription-now.ts
 */

import { getDodoPayments } from '../lib/dodopayments/client'
import { createAdminClient } from '../lib/supabase/admin'

async function syncLokeshSubscription(): Promise<void> {
  console.log('🔄 Starting subscription sync for lokeshadhepalliprasad@gmail.com...\n')

  const userEmail = 'lokeshadhepalliprasad@gmail.com'
  const dodoCustomerId = 'cus_CH5FUDkY8A7xm2MtccVQ2'

  try {
    const dodoClient = getDodoPayments()
    const supabase = createAdminClient()

    if (!dodoClient) {
      throw new Error('DodoPayments client not configured')
    }

    // Step 1: Verify customer exists in database
    console.log('📋 Step 1: Verifying customer record...')
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .select('user_id, email, dodo_customer_id')
      .eq('email', userEmail)
      .single()

    if (customerError || !customer) {
      throw new Error(`Customer not found: ${userEmail}`)
    }

    console.log('✅ Customer found:')
    console.log('   User ID:', customer.user_id)
    console.log('   Email:', customer.email)
    console.log('   Dodo Customer ID:', customer.dodo_customer_id)
    console.log('')

    // Step 2: Fetch subscriptions from DodoPayments
    console.log('📋 Step 2: Fetching subscriptions from DodoPayments...')
    const response = await dodoClient.subscriptions.list({
      customer_id: dodoCustomerId
    })

    const subscriptions = response.data || []
    console.log(`✅ Found ${subscriptions.length} subscription(s)\n`)

    if (subscriptions.length === 0) {
      console.log('⚠️  No subscriptions found in DodoPayments for this customer')
      console.log('   Please verify:')
      console.log('   1. The customer has an active subscription in DodoPayments dashboard')
      console.log('   2. The customer ID is correct')
      return
    }

    // Step 3: Sync each subscription
    console.log('📋 Step 3: Syncing subscriptions to database...\n')
    
    for (const subscription of subscriptions) {
      console.log(`   Processing subscription: ${subscription.id}`)
      console.log(`   - Status: ${subscription.status}`)
      console.log(`   - Product: ${subscription.product_id}`)
      console.log(`   - Period End: ${subscription.current_period_end}`)

      const { error: upsertError } = await supabase
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
          metadata: {
            ...subscription.metadata,
            manually_synced: true,
            synced_at: new Date().toISOString(),
            reason: 'Webhook sync failure - manual recovery script'
          },
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'dodo_subscription_id'
        })

      if (upsertError) {
        console.error(`   ❌ Failed to sync subscription ${subscription.id}:`, upsertError)
      } else {
        console.log(`   ✅ Successfully synced subscription ${subscription.id}`)
      }
      console.log('')
    }

    // Step 4: Verify the sync
    console.log('📋 Step 4: Verifying sync...\n')
    const { data: verifyData } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', customer.user_id)
      .order('created_at', { ascending: false })

    if (!verifyData || verifyData.length === 0) {
      console.error('❌ Verification failed: No subscriptions found in database')
      return
    }

    console.log('✅ Verification successful!')
    console.log(`   Found ${verifyData.length} subscription(s) in database:\n`)
    
    for (const sub of verifyData) {
      console.log(`   Subscription: ${sub.dodo_subscription_id}`)
      console.log(`   - Status: ${sub.status}`)
      console.log(`   - Product: ${sub.dodo_product_id}`)
      console.log(`   - Period End: ${sub.current_period_end}`)
      console.log(`   - Access: ${sub.status === 'active' || sub.status === 'trialing' ? 'YES ✅' : 'NO ❌'}`)
      console.log('')
    }

    console.log('🎉 SUCCESS! User should now see their subscription in the dashboard.')
    console.log('   The webhook handler has also been fixed to prevent this issue in the future.\n')

  } catch (error) {
    console.error('\n❌ ERROR:', error)
    if (error instanceof Error) {
      console.error('   Message:', error.message)
      if (error.stack) {
        console.error('   Stack:', error.stack)
      }
    }
    console.error('\n💡 Troubleshooting:')
    console.error('   1. Verify DODO_PAYMENTS_API_KEY is set correctly')
    console.error('   2. Verify SUPABASE_SERVICE_ROLE_KEY is set correctly')
    console.error('   3. Check if customer has active subscription in DodoPayments dashboard')
    console.error('   4. Verify customer ID: cus_CH5FUDkY8A7xm2MtccVQ2')
    process.exit(1)
  }
}

// Run the sync
syncLokeshSubscription()
  .then(() => {
    console.log('✅ Script completed successfully')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Unexpected error:', error)
    process.exit(1)
  })

