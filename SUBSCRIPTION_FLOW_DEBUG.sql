-- =================================================================
-- COMPREHENSIVE SUBSCRIPTION FLOW DIAGNOSTIC
-- Email: lokeshadhepalliprasad@gmail.com
-- Customer ID: cus_CH5FUDkY8A7xm2MtccVQ2
-- =================================================================

-- 1. CHECK CUSTOMER RECORD
SELECT '=== 1. CUSTOMER RECORD ===' as section;
SELECT 
  user_id,
  email,
  name,
  dodo_customer_id,
  created_at
FROM customers 
WHERE email = 'lokeshadhepalliprasad@gmail.com';

-- 2. CHECK ALL WEBHOOK EVENTS FOR THIS CUSTOMER
SELECT '=== 2. WEBHOOK EVENTS FOR THIS CUSTOMER ===' as section;
SELECT 
  event_id,
  event_type,
  processed,
  error_message,
  created_at,
  data->>'subscription_id' as subscription_id,
  data->>'status' as payload_status,
  data->'customer'->>'id' as customer_id_in_payload,
  data->'customer'->>'email' as customer_email_in_payload
FROM dodo_webhook_events
WHERE 
  data->'customer'->>'id' = 'cus_CH5FUDkY8A7xm2MtccVQ2'
  OR data->>'customer_id' = 'cus_CH5FUDkY8A7xm2MtccVQ2'
  OR data->'customer'->>'email' = 'lokeshadhepalliprasad@gmail.com'
ORDER BY created_at DESC;

-- 3. CHECK IF ANY SUBSCRIPTION EVENTS EXIST AT ALL
SELECT '=== 3. ALL SUBSCRIPTION-RELATED WEBHOOKS (Last 24h) ===' as section;
SELECT 
  event_id,
  event_type,
  processed,
  error_message,
  created_at,
  data->>'id' as sub_id,
  data->>'subscription_id' as subscription_id,
  data->>'status' as status
FROM dodo_webhook_events
WHERE event_type LIKE 'subscription.%'
  AND created_at > NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC
LIMIT 10;

-- 4. CHECK SUBSCRIPTIONS TABLE FOR THIS USER
SELECT '=== 4. SUBSCRIPTION RECORDS FOR THIS USER ===' as section;
SELECT 
  s.id,
  s.user_id,
  s.dodo_customer_id,
  s.dodo_subscription_id,
  s.dodo_product_id,
  s.status,
  s.current_period_start,
  s.current_period_end,
  s.created_at,
  s.updated_at
FROM subscriptions s
JOIN customers c ON c.user_id = s.user_id
WHERE c.email = 'lokeshadhepalliprasad@gmail.com'
ORDER BY s.created_at DESC;

-- 5. CHECK PAYMENT RECORDS
SELECT '=== 5. PAYMENT RECORDS FOR THIS USER ===' as section;
SELECT 
  p.dodo_payment_id,
  p.amount,
  p.currency,
  p.status,
  p.created_at
FROM payments p
JOIN customers c ON c.user_id = p.user_id
WHERE c.email = 'lokeshadhepalliprasad@gmail.com'
ORDER BY p.created_at DESC;

-- 6. CHECK FOR UNPROCESSED WEBHOOK EVENTS
SELECT '=== 6. UNPROCESSED/FAILED WEBHOOK EVENTS ===' as section;
SELECT 
  event_id,
  event_type,
  processed,
  error_message,
  created_at,
  LEFT(data::text, 200) as data_preview
FROM dodo_webhook_events
WHERE processed = FALSE
  OR error_message IS NOT NULL
ORDER BY created_at DESC
LIMIT 10;

-- 7. SUMMARY
SELECT '=== 7. DIAGNOSTIC SUMMARY ===' as section;
SELECT 
  'Customer Exists' as check_item,
  CASE WHEN COUNT(*) > 0 THEN '✓ YES' ELSE '✗ NO' END as status
FROM customers 
WHERE email = 'lokeshadhepalliprasad@gmail.com'

UNION ALL

SELECT 
  'Has Dodo Customer ID' as check_item,
  CASE WHEN COUNT(*) > 0 THEN '✓ YES: ' || MAX(dodo_customer_id) ELSE '✗ NO' END as status
FROM customers 
WHERE email = 'lokeshadhepalliprasad@gmail.com' AND dodo_customer_id IS NOT NULL

UNION ALL

SELECT 
  'Webhook Events Received' as check_item,
  CASE WHEN COUNT(*) > 0 THEN '✓ YES: ' || COUNT(*) || ' events' ELSE '✗ NO WEBHOOKS' END as status
FROM dodo_webhook_events
WHERE data->'customer'->>'id' = 'cus_CH5FUDkY8A7xm2MtccVQ2'
   OR data->'customer'->>'email' = 'lokeshadhepalliprasad@gmail.com'

UNION ALL

SELECT 
  'Subscription.active Event' as check_item,
  CASE WHEN COUNT(*) > 0 THEN '✓ YES: ' || COUNT(*) || ' events' ELSE '✗ NO subscription.active webhook' END as status
FROM dodo_webhook_events
WHERE event_type = 'subscription.active'
  AND (data->'customer'->>'id' = 'cus_CH5FUDkY8A7xm2MtccVQ2'
   OR data->'customer'->>'email' = 'lokeshadhepalliprasad@gmail.com')

UNION ALL

SELECT 
  'Subscription Record Exists' as check_item,
  CASE WHEN COUNT(*) > 0 THEN '✓ YES' ELSE '✗ NO SUBSCRIPTION RECORD' END as status
FROM subscriptions s
JOIN customers c ON c.user_id = s.user_id
WHERE c.email = 'lokeshadhepalliprasad@gmail.com'

UNION ALL

SELECT 
  'Payment Record Exists' as check_item,
  CASE WHEN COUNT(*) > 0 THEN '✓ YES: ' || COUNT(*) || ' payments' ELSE '✗ NO PAYMENTS' END as status
FROM payments p
JOIN customers c ON c.user_id = p.user_id
WHERE c.email = 'lokeshadhepalliprasad@gmail.com';

-- 8. ACTION ITEMS
SELECT '=== 8. RECOMMENDED ACTIONS ===' as section;
SELECT 
  CASE 
    WHEN NOT EXISTS (SELECT 1 FROM dodo_webhook_events WHERE data->'customer'->>'id' = 'cus_CH5FUDkY8A7xm2MtccVQ2') THEN
      '⚠️ ACTION: No webhooks received. Check DodoPayments webhook configuration.'
    WHEN EXISTS (SELECT 1 FROM dodo_webhook_events WHERE event_type = 'subscription.active' AND data->'customer'->>'id' = 'cus_CH5FUDkY8A7xm2MtccVQ2' AND processed = FALSE) THEN
      '⚠️ ACTION: subscription.active webhook failed. Check error_message column above.'
    WHEN EXISTS (SELECT 1 FROM dodo_webhook_events WHERE data->'customer'->>'id' = 'cus_CH5FUDkY8A7xm2MtccVQ2') 
      AND NOT EXISTS (SELECT 1 FROM dodo_webhook_events WHERE event_type = 'subscription.active' AND data->'customer'->>'id' = 'cus_CH5FUDkY8A7xm2MtccVQ2') THEN
      '⚠️ ACTION: Webhooks received but NO subscription.active event. Use manual sync.'
    WHEN EXISTS (SELECT 1 FROM payments p JOIN customers c ON c.user_id = p.user_id WHERE c.email = 'lokeshadhepalliprasad@gmail.com')
      AND NOT EXISTS (SELECT 1 FROM subscriptions s JOIN customers c ON c.user_id = s.user_id WHERE c.email = 'lokeshadhepalliprasad@gmail.com') THEN
      '⚠️ ACTION: Payment exists but no subscription. Use /api/subscriptions/sync to manually sync.'
    ELSE
      '✓ No obvious issues detected. Review webhook logs.'
  END as action_needed;

