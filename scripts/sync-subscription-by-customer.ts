/**
 * Manual Subscription Sync Script
 * Syncs subscription from DodoPayments to Supabase for a specific customer
 * Usage: npx tsx scripts/sync-subscription-by-customer.ts <customer_email>
 */

import 'dotenv/config'
import { getDodoPayments } from '../lib/dodopayments/client'
import { createAdminClient } from '../lib/supabase/admin'

interface SyncOptions {
  customerEmail?: string
  customerId?: string
}

async function syncSubscriptionByCustomer(options: SyncOptions): Promise<void> {
  const dodoClient = getDodoPayments()
  const supabase = createAdminClient()

  console.log('\n🔄 Starting Subscription Sync\n')
  console.log('Options:', options)

  try {
    // Step 1: Find customer in Supabase
    let customer: any = null
    
    if (options.customerEmail) {
      console.log(`📋 Step 1: Looking up customer by email: ${options.customerEmail}`)
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('email', options.customerEmail)
        .single()

      if (error) {
        console.error('❌ Error finding customer:', error)
        throw error
      }

      customer = data
    } else if (options.customerId) {
      console.log(`📋 Step 1: Looking up customer by Dodo ID: ${options.customerId}`)
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('dodo_customer_id', options.customerId)
        .single()

      if (error) {
        console.error('❌ Error finding customer:', error)
        throw error
      }

      customer = data
    } else {
      throw new Error('Must provide either customerEmail or customerId')
    }

    if (!customer) {
      console.error('❌ Customer not found in database')
      return
    }

    console.log('✅ Found customer:', {
      user_id: customer.user_id,
      email: customer.email,
      dodo_customer_id: customer.dodo_customer_id
    })

    // Step 2: Fetch subscriptions from DodoPayments
    console.log('\n📋 Step 2: Fetching subscriptions from DodoPayments...')
    
    if (!customer.dodo_customer_id) {
      console.error('❌ Customer has no dodo_customer_id')
      return
    }

    console.log('API Call: dodoClient.subscriptions.list({ customer_id:', customer.dodo_customer_id, '})')
    
    const response = await dodoClient.subscriptions.list({
      customer_id: customer.dodo_customer_id
    })

    console.log('\n📦 Raw API Response:')
    console.log(JSON.stringify(response, null, 2))

    // DodoPayments API returns subscriptions in 'items' not 'data'
    const subscriptions = response.items || response.data || []
    console.log(`\n✅ Found ${subscriptions.length} subscription(s)\n`)

    if (subscriptions.length === 0) {
      console.log('⚠️  No subscriptions found in DodoPayments for this customer')
      console.log('   Please verify:')
      console.log('   1. The customer has an active subscription in DodoPayments dashboard')
      console.log('   2. The customer ID is correct:', customer.dodo_customer_id)
      return
    }

    // Step 3: Sync each subscription
    console.log('📋 Step 3: Syncing subscriptions to database...\n')
    
    for (const subscription of subscriptions) {
      // DodoPayments uses subscription_id, not id
      const subscriptionId = subscription.subscription_id || subscription.id
      const customerId = subscription.customer?.customer_id || subscription.customer_id
      
      console.log(`   Processing subscription: ${subscriptionId}`)
      console.log(`   - Status: ${subscription.status}`)
      console.log(`   - Product: ${subscription.product_id}`)
      console.log(`   - Next Billing: ${subscription.next_billing_date}`)
      console.log(`   - Full subscription object:`)
      console.log(JSON.stringify(subscription, null, 2))

      const subscriptionData = {
        user_id: customer.user_id,
        dodo_customer_id: customerId,
        dodo_subscription_id: subscriptionId,
        dodo_product_id: subscription.product_id,
        dodo_price_id: subscription.price_id || null,
        status: subscription.status,
        current_period_start: subscription.previous_billing_date || subscription.created_at,
        current_period_end: subscription.next_billing_date,
        cancel_at_period_end: subscription.cancel_at_next_billing_date || false,
        canceled_at: subscription.cancelled_at || null,
        trial_start: subscription.trial_start || null,
        trial_end: subscription.trial_end || null,
        metadata: {
          ...subscription.metadata,
          manually_synced: true,
          synced_at: new Date().toISOString(),
          reason: 'Manual sync script - webhook sync issue recovery'
        },
        updated_at: new Date().toISOString()
      }

      console.log('\n   📝 Data to be upserted:')
      console.log(JSON.stringify(subscriptionData, null, 2))

      const { data: upsertedData, error: upsertError } = await supabase
        .from('subscriptions')
        .upsert(subscriptionData, {
          onConflict: 'dodo_subscription_id'
        })
        .select()

      if (upsertError) {
        console.error('   ❌ Error upserting subscription:', {
          error: upsertError,
          message: upsertError.message,
          details: upsertError.details,
          hint: upsertError.hint,
          code: upsertError.code
        })
        continue
      }

      console.log('   ✅ Subscription synced successfully!')
      console.log('   📦 Returned data:', JSON.stringify(upsertedData, null, 2))
      console.log('')
    }

    // Step 4: Verify the sync
    console.log('\n📋 Step 4: Verifying sync...')
    const { data: verification, error: verifyError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', customer.user_id)

    if (verifyError) {
      console.error('❌ Error verifying sync:', verifyError)
      throw verifyError
    }

    console.log('\n✅ SYNC COMPLETE!')
    console.log(`\nFound ${verification?.length || 0} subscription(s) in database:`)
    verification?.forEach((sub: any) => {
      console.log(`\n  Subscription:`)
      console.log(`    - ID: ${sub.dodo_subscription_id}`)
      console.log(`    - Status: ${sub.status}`)
      console.log(`    - Product ID: ${sub.dodo_product_id}`)
      console.log(`    - Current Period End: ${sub.current_period_end}`)
    })
    
    console.log('\n🎉 User should now see their subscription in the dashboard!')
    
  } catch (error) {
    console.error('\n❌ ERROR:', error)
    if (error instanceof Error) {
      console.error('Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      })
    }
    process.exit(1)
  }
}

// Parse command line arguments
const args = process.argv.slice(2)
const customerEmail = args[0]

if (!customerEmail) {
  console.error('Usage: npx tsx scripts/sync-subscription-by-customer.ts <customer_email>')
  console.error('Example: npx tsx scripts/sync-subscription-by-customer.ts sasikumarkudimi@gmail.com')
  process.exit(1)
}

// Run the sync
syncSubscriptionByCustomer({ customerEmail })
  .then(() => {
    console.log('\n✨ Script completed successfully')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n💥 Script failed:', error)
    process.exit(1)
  })

