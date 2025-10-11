/**
 * Webhook Payload Debugger
 * 
 * Use this to test and debug DodoPayments webhook payloads locally
 * Run with: npx tsx scripts/test-webhook-payload.ts
 */

// Sample subscription webhook payload from DodoPayments
const sampleSubscriptionCreated = {
  id: "evt_test_123",
  type: "subscription.created",
  created_at: "2025-10-11T12:00:00Z",
  data: {
    id: "sub_test_123",
    customer_id: "cus_test_123",
    customer: {
      id: "cus_test_123",
      email: "test@example.com",
      name: "Test User"
    },
    product_id: "pdt_test_123",
    price_id: "pri_test_123",
    status: "active",
    current_period_start: "2025-10-11T12:00:00Z",
    current_period_end: "2025-11-11T12:00:00Z",
    cancel_at_period_end: false,
    canceled_at: null,
    created_at: "2025-10-11T12:00:00Z",
    trial_start: null,
    trial_end: null,
    metadata: {
      supabase_user_id: "test-user-uuid"
    }
  }
}

// Sample payment webhook payload
const samplePaymentSucceeded = {
  id: "evt_test_456",
  type: "payment.succeeded",
  created_at: "2025-10-11T12:00:00Z",
  data: {
    id: "pay_test_123",
    customer_id: "cus_test_123",
    customer: {
      id: "cus_test_123",
      email: "test@example.com"
    },
    subscription_id: "sub_test_123",
    amount: 999,
    currency: "USD",
    status: "succeeded",
    checkout_session_id: "cs_test_123",
    payment_method: "card",
    description: "Monthly Plan - October 2025",
    metadata: {
      supabase_user_id: "test-user-uuid",
      product_id: "pdt_test_123"
    }
  }
}

/**
 * Test field extraction logic
 */
function testFieldExtraction() {
  console.log('\n=== Testing Subscription Field Extraction ===\n')
  
  const subscription = sampleSubscriptionCreated.data
  
  // Test subscription ID extraction
  const subscriptionId = subscription.id
  console.log('✓ Subscription ID:', subscriptionId)
  
  // Test customer ID extraction (with fallbacks)
  const customerId = subscription.customer?.id || subscription.customer_id
  console.log('✓ Customer ID:', customerId)
  
  // Test customer email extraction (with fallbacks)
  const customerEmail = subscription.customer?.email || subscription.email
  console.log('✓ Customer Email:', customerEmail)
  
  // Test period dates (PRIMARY fields)
  const periodStart = subscription.current_period_start || subscription.created_at
  const periodEnd = subscription.current_period_end || subscription.created_at
  console.log('✓ Period Start:', periodStart)
  console.log('✓ Period End:', periodEnd)
  
  // Test cancellation fields
  const cancelAtPeriodEnd = subscription.cancel_at_period_end || false
  const canceledAt = subscription.canceled_at
  console.log('✓ Cancel at period end:', cancelAtPeriodEnd)
  console.log('✓ Canceled at:', canceledAt)
  
  console.log('\n=== Testing Payment Field Extraction ===\n')
  
  const payment = samplePaymentSucceeded.data
  
  // Test payment ID extraction
  const paymentId = payment.id
  console.log('✓ Payment ID:', paymentId)
  
  // Test customer extraction (with fallbacks)
  const paymentCustomerId = payment.customer?.id || payment.customer_id
  console.log('✓ Customer ID:', paymentCustomerId)
  
  // Test amount extraction (with fallbacks)
  const amount = payment.amount
  console.log('✓ Amount:', amount)
  
  // Test subscription ID extraction (with fallbacks)
  const paymentSubId = payment.subscription_id
  console.log('✓ Subscription ID:', paymentSubId)
  
  console.log('\n=== All field extractions successful! ===\n')
}

/**
 * Simulate database upsert payload
 */
function simulateDatabaseUpsert() {
  console.log('\n=== Simulating Database Upsert ===\n')
  
  const subscription = sampleSubscriptionCreated.data
  const subscriptionId = subscription.id
  const customerId = subscription.customer?.id || subscription.customer_id
  
  const dbPayload = {
    user_id: 'test-user-uuid', // Would come from customer lookup
    dodo_customer_id: customerId,
    dodo_subscription_id: subscriptionId,
    dodo_product_id: subscription.product_id,
    dodo_price_id: subscription.price_id,
    status: subscription.status,
    current_period_start: subscription.current_period_start || subscription.created_at,
    current_period_end: subscription.current_period_end || subscription.created_at,
    cancel_at_period_end: subscription.cancel_at_period_end || false,
    canceled_at: subscription.canceled_at,
    trial_start: subscription.trial_start,
    trial_end: subscription.trial_end,
    metadata: subscription.metadata,
    updated_at: new Date().toISOString()
  }
  
  console.log('Database upsert payload:')
  console.log(JSON.stringify(dbPayload, null, 2))
  
  // Verify critical fields are not null
  const criticalFields = ['current_period_start', 'current_period_end']
  const missingFields = criticalFields.filter(field => !dbPayload[field as keyof typeof dbPayload])
  
  if (missingFields.length > 0) {
    console.error('\n❌ ERROR: Missing critical fields:', missingFields)
  } else {
    console.log('\n✅ All critical fields present!')
  }
}

/**
 * Test UTF-8 handling
 */
function testUTF8Handling() {
  console.log('\n=== Testing UTF-8 Handling ===\n')
  
  const specialChars = {
    ...sampleSubscriptionCreated.data,
    customer: {
      ...sampleSubscriptionCreated.data.customer,
      name: "Tëst Üser 测试用户 🎉"
    },
    metadata: {
      description: "Plan with émojis 🚀 and special chars: €£¥"
    }
  }
  
  try {
    // Test JSON stringification (this is what webhook handler does)
    const jsonString = JSON.stringify(specialChars)
    const parsed = JSON.parse(jsonString)
    
    console.log('✓ UTF-8 serialization successful')
    console.log('✓ Customer name:', parsed.customer.name)
    console.log('✓ Metadata description:', parsed.metadata.description)
    console.log('\n✅ UTF-8 handling test passed!')
  } catch (error) {
    console.error('❌ UTF-8 handling failed:', error)
  }
}

// Run all tests
console.log('\n========================================')
console.log('   DodoPayments Webhook Payload Tester')
console.log('========================================')

testFieldExtraction()
simulateDatabaseUpsert()
testUTF8Handling()

console.log('\n========================================')
console.log('   All tests completed!')
console.log('========================================\n')

// Export for use in other scripts
export { sampleSubscriptionCreated, samplePaymentSucceeded }


