-- Diagnostic script to check webhook and subscription status
-- for lokeshadhepalliprasad@gmail.com

-- 1. Check customer record
SELECT 
  'Customer Record' as check_type,
  user_id,
  email,
  name,
  dodo_customer_id,
  created_at,
  updated_at
FROM customers 
WHERE email = 'lokeshadhepalliprasad@gmail.com';

-- 2. Check if any subscriptions exist for this user
SELECT 
  'Subscription Records' as check_type,
  s.user_id,
  s.dodo_subscription_id,
  s.dodo_product_id,
  s.status,
  s.current_period_start,
  s.current_period_end,
  s.created_at,
  s.updated_at
FROM subscriptions s
JOIN customers c ON c.user_id = s.user_id
WHERE c.email = 'lokeshadhepalliprasad@gmail.com';

-- 3. Check webhook events related to this customer
SELECT 
  'Webhook Events' as check_type,
  event_id,
  event_type,
  processed,
  created_at,
  data->'customer'->>'id' as customer_id,
  data->'customer'->>'email' as customer_email,
  data->>'subscription_id' as subscription_id,
  data->>'status' as status
FROM dodo_webhook_events
WHERE 
  data->'customer'->>'email' = 'lokeshadhepalliprasad@gmail.com'
  OR data->>'customer_email' = 'lokeshadhepalliprasad@gmail.com'
  OR data->'customer'->>'id' = 'cus_CH5FUDkY8A7xm2MtccVQ2'
ORDER BY created_at DESC;

-- 4. Check all recent webhook events (last 24 hours)
SELECT 
  'Recent Webhooks (All)' as check_type,
  event_id,
  event_type,
  processed,
  created_at,
  data->'customer'->>'email' as customer_email,
  data->>'customer_id' as customer_id,
  data->>'subscription_id' as subscription_id
FROM dodo_webhook_events
WHERE created_at > NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC;

-- 5. Check payments for this user
SELECT 
  'Payment Records' as check_type,
  p.user_id,
  p.dodo_payment_id,
  p.amount,
  p.currency,
  p.status,
  p.created_at
FROM payments p
JOIN customers c ON c.user_id = p.user_id
WHERE c.email = 'lokeshadhepalliprasad@gmail.com'
ORDER BY p.created_at DESC;

-- 6. Check if there are any webhook events that failed to process
SELECT 
  'Failed Webhooks' as check_type,
  event_id,
  event_type,
  processed,
  created_at,
  data->'customer'->>'email' as customer_email
FROM dodo_webhook_events
WHERE processed = false
ORDER BY created_at DESC
LIMIT 10;

