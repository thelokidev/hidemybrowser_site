/**
 * Webhook Connectivity Test Script
 * Tests if DodoPayments webhooks can reach your endpoint
 * 
 * Usage:
 *   npx tsx scripts/test-webhook-connectivity.ts
 */

import crypto from 'crypto'

interface WebhookTestConfig {
  webhookUrl: string
  webhookSecret: string
  testPayload: any
}

async function generateWebhookSignature(
  webhookId: string,
  timestamp: string,
  payload: string,
  secret: string
): Promise<string> {
  // Remove 'whsec_' prefix if present
  const secretKey = secret.startsWith('whsec_') ? secret.slice(6) : secret
  
  // Decode base64 secret
  const secretBytes = Buffer.from(secretKey, 'base64')
  
  // Create signed content: webhook-id.timestamp.payload
  const signedContent = `${webhookId}.${timestamp}.${payload}`
  
  // Generate HMAC SHA256 signature
  const signature = crypto
    .createHmac('sha256', secretBytes)
    .update(signedContent)
    .digest('base64')
  
  return signature
}

async function testWebhookEndpoint(config: WebhookTestConfig): Promise<void> {
  console.log('🔍 Testing Webhook Endpoint Connectivity')
  console.log('=' .repeat(60))
  console.log(`📍 URL: ${config.webhookUrl}`)
  console.log('=' .repeat(60))
  console.log('')

  // Generate webhook headers
  const webhookId = `evt_test_${Date.now()}`
  const timestamp = Math.floor(Date.now() / 1000).toString()
  const payload = JSON.stringify(config.testPayload)

  console.log('📦 Test Payload:')
  console.log(JSON.stringify(config.testPayload, null, 2))
  console.log('')

  // Generate signature
  console.log('🔐 Generating webhook signature...')
  const signature = await generateWebhookSignature(
    webhookId,
    timestamp,
    payload,
    config.webhookSecret
  )

  const headers = {
    'Content-Type': 'application/json',
    'webhook-id': webhookId,
    'webhook-timestamp': timestamp,
    'webhook-signature': `v1,${signature}`,
  }

  console.log('📨 Request Headers:')
  console.log(`  webhook-id: ${webhookId}`)
  console.log(`  webhook-timestamp: ${timestamp}`)
  console.log(`  webhook-signature: v1,${signature.substring(0, 20)}...`)
  console.log('')

  // Send test webhook
  console.log('🚀 Sending test webhook...')
  console.log('')

  try {
    const startTime = Date.now()
    const response = await fetch(config.webhookUrl, {
      method: 'POST',
      headers,
      body: payload,
    })

    const duration = Date.now() - startTime
    const responseText = await response.text()

    console.log('📬 Response Received:')
    console.log('=' .repeat(60))
    console.log(`  Status: ${response.status} ${response.statusText}`)
    console.log(`  Duration: ${duration}ms`)
    console.log(`  Content-Type: ${response.headers.get('content-type')}`)
    console.log('')
    console.log('  Response Body:')
    
    try {
      const responseJson = JSON.parse(responseText)
      console.log(JSON.stringify(responseJson, null, 2))
    } catch {
      console.log(responseText)
    }
    console.log('=' .repeat(60))
    console.log('')

    // Evaluate result
    if (response.status === 200) {
      console.log('✅ SUCCESS: Webhook endpoint is reachable and responding!')
      console.log('')
      console.log('Next steps:')
      console.log('  1. Check Vercel logs to verify webhook was processed')
      console.log('  2. Verify event was logged in dodo_webhook_events table')
      console.log('  3. Check if test subscription was created (if applicable)')
      return
    } else if (response.status === 401) {
      console.log('❌ AUTHENTICATION FAILED: Invalid webhook signature')
      console.log('')
      console.log('Possible causes:')
      console.log('  1. Webhook secret mismatch between script and server')
      console.log('  2. Check DODO_WEBHOOK_SECRET in Vercel environment')
      console.log('  3. Verify secret matches DodoPayments dashboard')
    } else if (response.status === 400) {
      console.log('⚠️  BAD REQUEST: Webhook format issue')
      console.log('')
      console.log('Possible causes:')
      console.log('  1. Missing required headers')
      console.log('  2. Invalid payload format')
      console.log('  3. Check error message above for details')
    } else if (response.status >= 500) {
      console.log('❌ SERVER ERROR: Webhook endpoint is failing')
      console.log('')
      console.log('Action needed:')
      console.log('  1. Check Vercel deployment logs for errors')
      console.log('  2. Verify database connection is working')
      console.log('  3. Check if any migrations are pending')
    } else {
      console.log(`⚠️  UNEXPECTED STATUS: ${response.status}`)
      console.log('')
      console.log('Review the response above for more details')
    }
  } catch (error) {
    console.log('💥 CONNECTION FAILED')
    console.log('=' .repeat(60))
    
    if (error instanceof Error) {
      console.log(`  Error: ${error.message}`)
      
      if (error.message.includes('ENOTFOUND') || error.message.includes('ECONNREFUSED')) {
        console.log('')
        console.log('❌ Cannot reach webhook endpoint!')
        console.log('')
        console.log('Possible causes:')
        console.log('  1. URL is incorrect')
        console.log('  2. Server is not running')
        console.log('  3. DNS resolution failed')
        console.log('  4. Firewall blocking connection')
      } else if (error.message.includes('timeout')) {
        console.log('')
        console.log('⏱️  Request timed out!')
        console.log('')
        console.log('Possible causes:')
        console.log('  1. Server is too slow to respond')
        console.log('  2. Webhook handler is stuck')
        console.log('  3. Database connection issues')
      }
    } else {
      console.log(`  ${error}`)
    }
    console.log('=' .repeat(60))
  }
}

async function testMultipleScenarios(): Promise<void> {
  console.log('🧪 WEBHOOK CONNECTIVITY TEST SUITE')
  console.log('=' .repeat(60))
  console.log('')

  // Load environment variables
  const webhookUrl = process.env.WEBHOOK_URL || 'https://www.hidemybrowser.com/api/webhooks/dodopayments'
  const webhookSecret = process.env.DODO_WEBHOOK_SECRET

  if (!webhookSecret) {
    console.log('❌ ERROR: DODO_WEBHOOK_SECRET environment variable not set')
    console.log('')
    console.log('Please set it in your .env.local file or run:')
    console.log('  DODO_WEBHOOK_SECRET=whsec_xxx npx tsx scripts/test-webhook-connectivity.ts')
    process.exit(1)
  }

  console.log('Configuration:')
  console.log(`  Webhook URL: ${webhookUrl}`)
  console.log(`  Webhook Secret: ${webhookSecret.substring(0, 15)}...`)
  console.log('')
  console.log('=' .repeat(60))
  console.log('')

  // Test 1: subscription.active event
  console.log('TEST 1: subscription.active webhook')
  console.log('-' .repeat(60))
  await testWebhookEndpoint({
    webhookUrl,
    webhookSecret,
    testPayload: {
      id: 'evt_test_sub_active_' + Date.now(),
      type: 'subscription.active',
      data: {
        id: 'sub_TEST123',
        subscription_id: 'sub_TEST123',
        customer_id: 'cus_CH5FUDkY8A7xm2MtccVQ2',
        product_id: 'pdt_W4YuF093U2MSpABbJ7miA',
        price_id: 'pri_test123',
        status: 'active',
        current_period_start: new Date().toISOString(),
        current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        cancel_at_period_end: false,
        customer: {
          id: 'cus_CH5FUDkY8A7xm2MtccVQ2',
          customer_id: 'cus_CH5FUDkY8A7xm2MtccVQ2',
          email: 'lokeshadhepalliprasad@gmail.com',
          name: 'Lokesh Adhepalli Prasad',
        },
        metadata: {
          test: true,
        },
      },
    },
  })

  console.log('')
  console.log('=' .repeat(60))
  console.log('')

  // Test 2: payment.succeeded event
  console.log('TEST 2: payment.succeeded webhook')
  console.log('-' .repeat(60))
  await testWebhookEndpoint({
    webhookUrl,
    webhookSecret,
    testPayload: {
      id: 'evt_test_payment_' + Date.now(),
      type: 'payment.succeeded',
      data: {
        id: 'pay_TEST123',
        payment_id: 'pay_TEST123',
        customer_id: 'cus_CH5FUDkY8A7xm2MtccVQ2',
        subscription_id: 'sub_TEST123',
        amount: 1500,
        currency: 'USD',
        status: 'succeeded',
        payment_method: 'card',
        customer: {
          id: 'cus_CH5FUDkY8A7xm2MtccVQ2',
          customer_id: 'cus_CH5FUDkY8A7xm2MtccVQ2',
          email: 'lokeshadhepalliprasad@gmail.com',
          name: 'Lokesh Adhepalli Prasad',
        },
        metadata: {
          test: true,
        },
      },
    },
  })

  console.log('')
  console.log('=' .repeat(60))
  console.log('🏁 Test suite complete!')
  console.log('')
}

// Run tests
testMultipleScenarios().catch((error) => {
  console.error('Fatal error:', error)
  process.exit(1)
})

