-- =====================================================
-- SUBSCRIPTION SYNC - VERIFICATION SCRIPT
-- =====================================================
-- Run this script to verify everything is set up correctly
-- =====================================================

-- =====================================================
-- 1. CHECK TRIGGERS
-- =====================================================
SELECT 
  '✅ Triggers' as check_type,
  trigger_name, 
  event_object_table as "table",
  action_timing as "when",
  event_manipulation as "event"
FROM information_schema.triggers
WHERE trigger_name IN (
  'trigger_deactivate_trial_on_active_subscription',
  'trigger_create_customer_on_signup'
)
ORDER BY trigger_name;

-- Expected: 2 rows
-- trigger_deactivate_trial_on_active_subscription on subscriptions table
-- trigger_create_customer_on_signup on auth.users table

-- =====================================================
-- 2. CHECK FUNCTIONS
-- =====================================================
SELECT 
  '✅ Functions' as check_type,
  routine_name as function_name,
  routine_type as type
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name IN (
  'deactivate_trial_on_subscription',
  'create_customer_for_new_user',
  'get_user_access_status',
  'is_trial_expired',
  'get_trial_status'
)
ORDER BY routine_name;

-- Expected: 5 rows (all functions exist)

-- =====================================================
-- 3. CHECK INDEXES
-- =====================================================
SELECT 
  '✅ Indexes' as check_type,
  indexname as index_name,
  tablename as "table"
FROM pg_indexes
WHERE schemaname = 'public'
AND indexname IN (
  'idx_subscriptions_user_status',
  'idx_free_trials_user_active',
  'idx_free_trials_expires_user'
)
ORDER BY indexname;

-- Expected: 3 rows (all indexes created)

-- =====================================================
-- 4. CHECK FOR STUCK TRIALS (SHOULD BE ZERO!)
-- =====================================================
SELECT 
  '❗ Stuck Trials' as check_type,
  COUNT(*) as count,
  CASE 
    WHEN COUNT(*) = 0 THEN '✅ All good!'
    ELSE '❌ Issues found - users have both active trial and subscription'
  END as status
FROM public.free_trials ft
JOIN public.subscriptions s ON s.user_id = ft.user_id
WHERE ft.is_active = true AND s.status = 'active';

-- Expected: count = 0, status = '✅ All good!'

-- =====================================================
-- 5. CHECK CUSTOMER RECORDS
-- =====================================================
SELECT 
  '✅ Customer Records' as check_type,
  COUNT(u.id) as total_users,
  COUNT(c.id) as users_with_customers,
  COUNT(u.id) - COUNT(c.id) as users_without_customers,
  CASE 
    WHEN COUNT(u.id) - COUNT(c.id) = 0 THEN '✅ All users have customer records'
    ELSE '⚠️ Some users missing customer records'
  END as status
FROM auth.users u
LEFT JOIN public.customers c ON c.user_id = u.id;

-- Expected: users_without_customers = 0

-- =====================================================
-- 6. CHECK WEBHOOK PROCESSING
-- =====================================================
SELECT 
  '📡 Webhook Status' as check_type,
  COUNT(*) as total_events,
  COUNT(*) FILTER (WHERE processed = true) as processed,
  COUNT(*) FILTER (WHERE processed = false) as unprocessed,
  CASE 
    WHEN COUNT(*) FILTER (WHERE processed = false) = 0 THEN '✅ All webhooks processed'
    ELSE '⚠️ Some webhooks pending'
  END as status
FROM public.dodo_webhook_events
WHERE created_at > NOW() - INTERVAL '24 hours';

-- Expected: unprocessed = 0 (or close to it)

-- =====================================================
-- 7. CHECK SUBSCRIPTION STATS
-- =====================================================
SELECT 
  '📊 Stats' as check_type,
  (SELECT COUNT(*) FROM public.customers) as total_customers,
  (SELECT COUNT(*) FROM public.subscriptions WHERE status = 'active') as active_subscriptions,
  (SELECT COUNT(*) FROM public.free_trials WHERE is_active = true) as active_trials,
  (SELECT COUNT(*) FROM public.dodo_webhook_events WHERE processed = false) as unprocessed_webhooks;

-- =====================================================
-- 8. TEST ACCESS STATUS FUNCTION
-- =====================================================
-- Replace 'USER_ID_HERE' with an actual user ID from your database

-- Test with a user (update this with real user ID)
/*
SELECT 
  '🧪 Access Status Test' as check_type,
  *
FROM get_user_access_status('USER_ID_HERE');
*/

-- To find a user ID to test with:
SELECT 
  '👤 Sample Users' as info,
  u.id as user_id,
  u.email,
  CASE 
    WHEN s.status = 'active' THEN 'Has active subscription'
    WHEN ft.is_active = true THEN 'Has active trial'
    ELSE 'No access'
  END as access_status
FROM auth.users u
LEFT JOIN public.subscriptions s ON s.user_id = u.id AND s.status = 'active'
LEFT JOIN public.free_trials ft ON ft.user_id = u.id AND ft.is_active = true
LIMIT 5;

-- =====================================================
-- 9. HEALTH CHECK SUMMARY
-- =====================================================
SELECT 
  '🏥 Health Summary' as check_type,
  CASE 
    WHEN 
      (SELECT COUNT(*) FROM information_schema.triggers 
       WHERE trigger_name IN ('trigger_deactivate_trial_on_active_subscription', 'trigger_create_customer_on_signup')) = 2
      AND
      (SELECT COUNT(*) FROM public.free_trials ft JOIN public.subscriptions s ON s.user_id = ft.user_id 
       WHERE ft.is_active = true AND s.status = 'active') = 0
      AND
      (SELECT COUNT(u.id) - COUNT(c.id) FROM auth.users u LEFT JOIN public.customers c ON c.user_id = u.id) = 0
    THEN '✅ SYSTEM HEALTHY - All checks passed!'
    ELSE '⚠️ ISSUES DETECTED - Review checks above'
  END as overall_status;

-- =====================================================
-- 10. USEFUL DEBUGGING QUERIES
-- =====================================================

-- Find users by email to test with
/*
SELECT id, email 
FROM auth.users 
WHERE email LIKE '%YOUR_EMAIL%';
*/

-- Check a specific user's full status
/*
SELECT 
  u.email,
  c.dodo_customer_id,
  s.status as subscription_status,
  s.dodo_product_id,
  s.current_period_end,
  ft.is_active as trial_active,
  ft.expires_at as trial_expires
FROM auth.users u
LEFT JOIN public.customers c ON c.user_id = u.id
LEFT JOIN public.subscriptions s ON s.user_id = u.id
LEFT JOIN public.free_trials ft ON ft.user_id = u.id
WHERE u.id = 'USER_ID_HERE';
*/

-- Check recent webhooks
/*
SELECT 
  event_type,
  processed,
  created_at,
  data->>'id' as event_data_id
FROM public.dodo_webhook_events
ORDER BY created_at DESC
LIMIT 10;
*/

-- =====================================================
-- ALL DONE!
-- =====================================================
-- If all checks show ✅, your system is properly configured!
-- =====================================================

