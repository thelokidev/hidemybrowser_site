-- Simple Subscription Diagnostic Script
-- Email has been set to: lokeshadhepalliprasad@gmail.com
-- Run this in Supabase SQL Editor

-- ============================================
-- STEP 1: Check Customer Record
-- ============================================
SELECT 
  'STEP 1: Customer Record' as check_name,
  CASE 
    WHEN COUNT(*) > 0 THEN '✓ Customer EXISTS'
    ELSE '✗ Customer MISSING'
  END as status,
  COUNT(*) as records_found
FROM customers 
WHERE email = 'lokeshadhepalliprasad@gmail.com';

SELECT 
  id,
  user_id,
  email,
  dodo_customer_id,
  created_at
FROM customers 
WHERE email = 'lokeshadhepalliprasad@gmail.com';

-- ============================================
-- STEP 2: Check Recent Webhook Events
-- ============================================
SELECT 
  'STEP 2: Webhook Events (Last 10)' as check_name,
  COUNT(*) as total_webhooks,
  SUM(CASE WHEN processed THEN 1 ELSE 0 END) as processed_count,
  SUM(CASE WHEN NOT processed THEN 1 ELSE 0 END) as failed_count
FROM dodo_webhook_events;

SELECT 
  event_id,
  event_type,
  processed,
  created_at,
  LEFT(data::text, 200) as data_preview
FROM dodo_webhook_events 
ORDER BY created_at DESC 
LIMIT 10;

-- ============================================
-- STEP 3: Check Subscriptions
-- ============================================
SELECT 
  'STEP 3: User Subscriptions' as check_name,
  COUNT(*) as subscription_count,
  SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active_count
FROM subscriptions s
JOIN customers c ON c.user_id = s.user_id
WHERE c.email = 'lokeshadhepalliprasad@gmail.com';

SELECT 
  s.id,
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

-- ============================================
-- STEP 4: Check What Frontend Should See
-- ============================================
SELECT 
  'STEP 4: Expected Access Status' as check_name,
  CASE 
    WHEN s.status IN ('active', 'trialing') THEN '✓ User SHOULD have access'
    WHEN s.status IS NOT NULL THEN '⚠ Subscription exists but status is: ' || s.status
    ELSE '✗ No active subscription found'
  END as expected_result,
  s.status,
  s.current_period_end as expires_at,
  s.dodo_product_id
FROM customers c
LEFT JOIN subscriptions s ON s.user_id = c.user_id
WHERE c.email = 'lokeshadhepalliprasad@gmail.com'
ORDER BY s.created_at DESC
LIMIT 1;

-- ============================================
-- STEP 5: Verify User ID Matching
-- ============================================
SELECT 
  'STEP 5: User-Customer-Subscription Link' as check_name,
  u.id as auth_user_id,
  u.email as auth_email,
  c.id as customer_id,
  c.user_id as customer_user_id,
  c.dodo_customer_id,
  s.id as subscription_id,
  s.status as subscription_status,
  CASE 
    WHEN u.id = c.user_id AND c.user_id = s.user_id THEN '✓ All IDs match correctly'
    WHEN c.user_id IS NULL THEN '✗ No customer record'
    WHEN s.user_id IS NULL THEN '✗ No subscription record'
    ELSE '⚠ ID mismatch issue'
  END as link_status
FROM auth.users u
LEFT JOIN customers c ON c.user_id = u.id
LEFT JOIN subscriptions s ON s.user_id = u.id AND s.status IN ('active', 'trialing')
WHERE u.email = 'lokeshadhepalliprasad@gmail.com';

-- ============================================
-- FINAL SUMMARY
-- ============================================
SELECT 
  '=== DIAGNOSTIC SUMMARY ===' as summary,
  (SELECT COUNT(*) FROM customers WHERE email = 'lokeshadthepalliprasad@gmail.com') as customer_exists,
  (SELECT COUNT(*) FROM dodo_webhook_events) as total_webhooks,
  (SELECT COUNT(*) FROM subscriptions s JOIN customers c ON c.user_id = s.user_id WHERE c.email = 'lokeshadhepalliprasad@gmail.com') as subscriptions_found,
  (SELECT COUNT(*) FROM subscriptions s JOIN customers c ON c.user_id = s.user_id WHERE c.email = 'lokeshadhepalliprasad@gmail.com' AND s.status = 'active') as active_subscriptions;

