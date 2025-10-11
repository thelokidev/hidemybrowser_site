/**
 * Manual Subscription Sync Script
 * Use this to manually sync a subscription from DodoPayments when webhooks fail
 * 
 * Usage:
 * 1. Get the subscription ID from DodoPayments dashboard
 * 2. Update the values below
 * 3. Run: npx ts-node scripts/manual-subscription-sync.ts
 */

import { getDodoPayments } from '../lib/dodopayments/client'
import { createAdminClient } from '../lib/supabase/admin'

async function syncSubscription() {
  // UPDATE THESE VALUES
  const userEmail = 'lokeshadhepalliprasad@gmail.com'
  const subscriptionId = 'sub_XXXXXXXX' // Get this from DodoPayments dashboard
  
  console.log('🔄 Starting manual subscription sync...')
  console.log('User:', userEmail)
  console.log('Subscription ID:', subscriptionId)
  
  const dodoClient = getDodoPayments()
  const supabase = createAdminClient()
  
  try {
    // 1. Get customer from database
    console.log('\n📋 Step 1: Looking up customer...')
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .select('user_id, email, dodo_customer_id')
      .eq('email', userEmail)
      .single()
    
    if (customerError || !customer) {
      throw new Error(`Customer not found: ${userEmail}`)
    }
    
    console.log('✅ Found customer:', customer.user_id)
    console.log('   Dodo Customer ID:', customer.dodo_customer_id)
    
    // 2. Fetch subscription from DodoPayments
    console.log('\n📋 Step 2: Fetching subscription from DodoPayments...')
    const subscription = await dodoClient.getSubscription(subscriptionId)
    
    console.log('✅ Found subscription:', subscription.id)
    console.log('   Status:', subscription.status)
    console.log('   Product ID:', subscription.product_id)
    console.log('   Customer ID:', subscription.customer_id)
    
    // 3. Verify customer IDs match
    if (subscription.customer_id !== customer.dodo_customer_id) {
      throw new Error(
        `Customer ID mismatch!\n` +
        `  Database: ${customer.dodo_customer_id}\n` +
        `  DodoPayments: ${subscription.customer_id}`
      )
    }
    
    // 4. Upsert subscription in database
    console.log('\n📋 Step 3: Syncing subscription to database...')
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
        metadata: subscription.metadata,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'dodo_subscription_id'
      })
    
    if (upsertError) {
      throw upsertError
    }
    
    console.log('✅ Subscription synced successfully!')
    
    // 5. Verify the sync
    console.log('\n📋 Step 4: Verifying sync...')
    const { data: verification } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', customer.user_id)
      .single()
    
    console.log('\n✅ SYNC COMPLETE!')
    console.log('\nSubscription Details:')
    console.log('  User ID:', verification?.user_id)
    console.log('  Subscription ID:', verification?.dodo_subscription_id)
    console.log('  Status:', verification?.status)
    console.log('  Product ID:', verification?.dodo_product_id)
    console.log('  Current Period End:', verification?.current_period_end)
    
    console.log('\n🎉 User should now see their subscription in the dashboard!')
    
  } catch (error) {
    console.error('\n❌ ERROR:', error)
    console.error('\nSync failed. Please check:')
    console.error('1. Subscription ID is correct')
    console.error('2. Subscription exists in DodoPayments')
    console.error('3. Environment variables are set correctly')
    process.exit(1)
  }
}

syncSubscription()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Unexpected error:', err)
    process.exit(1)
  })

