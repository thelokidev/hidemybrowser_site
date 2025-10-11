-- Diagnostic Script: Subscription Sync Issue
-- Run this in Supabase SQL Editor to diagnose why subscription isn't showing

-- Set your email here
DO $$
DECLARE
  user_email TEXT := 'lokeshadthepalliprasad@gmail.com'; -- CHANGE THIS to your email
  user_uuid UUID;
BEGIN
  RAISE NOTICE '================================================';
  RAISE NOTICE 'SUBSCRIPTION SYNC DIAGNOSTIC';
  RAISE NOTICE '================================================';
  RAISE NOTICE '';
  
  -- Get user ID
  SELECT id INTO user_uuid FROM auth.users WHERE email = user_email;
  
  IF user_uuid IS NULL THEN
    RAISE NOTICE 'ERROR: User not found with email: %', user_email;
    RETURN;
  END IF;
  
  RAISE NOTICE '✓ User found: %', user_uuid;
  RAISE NOTICE '';
  RAISE NOTICE '================================================';
  RAISE NOTICE 'STEP 1: CHECKING CUSTOMER RECORD';
  RAISE NOTICE '================================================';
END $$;

-- Check customer record
SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM customers WHERE user_id = (SELECT id FROM auth.users WHERE email = 'lokeshadthepalliprasad@gmail.com')) 
    THEN '✓ Customer record EXISTS'
    ELSE '✗ Customer record MISSING - This is the problem!'
  END as customer_status;

SELECT 
  id,
  user_id,
  email,
  dodo_customer_id,
  created_at
FROM customers 
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'lokeshadthepalliprasad@gmail.com');

-- If no result above, you need to create customer record:
SELECT '
-- FIX: Create customer record
INSERT INTO customers (user_id, email, created_at, updated_at)
SELECT id, email, NOW(), NOW()
FROM auth.users
WHERE email = ''lokeshadthepalliprasad@gmail.com''
ON CONFLICT (user_id) DO NOTHING;
' as fix_command;

\echo ''
\echo '================================================'
\echo 'STEP 2: CHECKING WEBHOOK EVENTS'
\echo '================================================'

-- Check recent webhook events
SELECT 
  event_id,
  event_type,
  processed,
  created_at,
  LEFT(data::text, 100) as data_preview
FROM dodo_webhook_events 
ORDER BY created_at DESC 
LIMIT 5;

SELECT 
  CASE 
    WHEN COUNT(*) = 0 THEN '✗ NO webhook events found - DodoPayments might not be sending webhooks!'
    WHEN COUNT(*) > 0 AND SUM(CASE WHEN processed THEN 1 ELSE 0 END) = COUNT(*) THEN '✓ All webhook events processed'
    ELSE '⚠ Some webhook events NOT processed - check errors'
  END as webhook_status,
  COUNT(*) as total_events,
  SUM(CASE WHEN processed THEN 1 ELSE 0 END) as processed_events
FROM dodo_webhook_events;

\echo ''
\echo '================================================'
\echo 'STEP 3: CHECKING SUBSCRIPTIONS TABLE'
\echo '================================================'

-- Check for subscriptions
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
WHERE s.user_id = (SELECT id FROM auth.users WHERE email = 'lokeshadthepalliprasad@gmail.com')
ORDER BY s.created_at DESC;

SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM subscriptions 
      WHERE user_id = (SELECT id FROM auth.users WHERE email = 'lokeshadthepalliprasad@gmail.com')
      AND status = 'active'
    ) THEN '✓ ACTIVE subscription found - should be visible in dashboard!'
    WHEN EXISTS (
      SELECT 1 FROM subscriptions 
      WHERE user_id = (SELECT id FROM auth.users WHERE email = 'lokeshadthepalliprasad@gmail.com')
    ) THEN '⚠ Subscription found but not ACTIVE'
    ELSE '✗ NO subscription found - webhook sync failed or hasn''t happened yet'
  END as subscription_status;

\echo ''
\echo '================================================'
\echo 'STEP 4: CHECKING ACCESS STATUS'
\echo '================================================'

-- Test the access function (if it exists, otherwise will error - that's okay)
DO $$
DECLARE
  user_uuid UUID;
BEGIN
  SELECT id INTO user_uuid FROM auth.users WHERE email = 'lokeshadthepalliprasad@gmail.com';
  
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'get_user_subscription_access') THEN
    RAISE NOTICE 'Testing get_user_subscription_access() function...';
    PERFORM * FROM get_user_subscription_access(user_uuid);
  ELSE
    RAISE NOTICE 'Function get_user_subscription_access() does not exist (expected after free trial removal)';
  END IF;
END $$;

-- Direct query to check what the hook should see
SELECT 
  CASE 
    WHEN s.status = 'active' OR s.status = 'trialing' THEN 'User SHOULD have access'
    ELSE 'User should NOT have access'
  END as expected_access,
  s.status,
  s.current_period_end as expires_at,
  s.dodo_product_id
FROM subscriptions s
WHERE s.user_id = (SELECT id FROM auth.users WHERE email = 'lokeshadthepalliprasad@gmail.com')
  AND s.status IN ('active', 'trialing')
ORDER BY s.created_at DESC
LIMIT 1;

\echo ''
\echo '================================================'
\echo 'DIAGNOSTIC SUMMARY'
\echo '================================================'

DO $$
DECLARE
  user_uuid UUID;
  has_customer BOOLEAN;
  has_webhook BOOLEAN;
  has_subscription BOOLEAN;
  sub_is_active BOOLEAN;
BEGIN
  SELECT id INTO user_uuid FROM auth.users WHERE email = 'lokeshadthepalliprasad@gmail.com';
  
  SELECT EXISTS (SELECT 1 FROM customers WHERE user_id = user_uuid) INTO has_customer;
  SELECT EXISTS (SELECT 1 FROM dodo_webhook_events LIMIT 1) INTO has_webhook;
  SELECT EXISTS (SELECT 1 FROM subscriptions WHERE user_id = user_uuid) INTO has_subscription;
  SELECT EXISTS (SELECT 1 FROM subscriptions WHERE user_id = user_uuid AND status = 'active') INTO sub_is_active;
  
  RAISE NOTICE '';
  RAISE NOTICE 'Status Checklist:';
  RAISE NOTICE '  Customer record: %', CASE WHEN has_customer THEN '✓' ELSE '✗ MISSING' END;
  RAISE NOTICE '  Webhook events: %', CASE WHEN has_webhook THEN '✓' ELSE '✗ NONE RECEIVED' END;
  RAISE NOTICE '  Subscription record: %', CASE WHEN has_subscription THEN '✓' ELSE '✗ NOT CREATED' END;
  RAISE NOTICE '  Subscription active: %', CASE WHEN sub_is_active THEN '✓ YES' ELSE '✗ NO' END;
  RAISE NOTICE '';
  
  IF NOT has_customer THEN
    RAISE NOTICE 'ACTION NEEDED: Create customer record (run the FIX command from STEP 1)';
  END IF;
  
  IF NOT has_webhook THEN
    RAISE NOTICE 'ACTION NEEDED: Check DodoPayments webhook configuration';
    RAISE NOTICE '  - Verify webhook URL is correct';
    RAISE NOTICE '  - Check webhook secret (DODO_WEBHOOK_SECRET)';
    RAISE NOTICE '  - If local dev, ensure ngrok is running';
  END IF;
  
  IF NOT has_subscription THEN
    RAISE NOTICE 'ACTION NEEDED: Manually sync subscription';
    RAISE NOTICE '  - Call admin sync API: POST /api/admin/sync-subscription';
    RAISE NOTICE '  - Or wait for webhook to arrive from DodoPayments';
  END IF;
  
  IF has_subscription AND NOT sub_is_active THEN
    RAISE NOTICE 'ACTION NEEDED: Check subscription status in DodoPayments dashboard';
  END IF;
  
  IF has_customer AND has_webhook AND sub_is_active THEN
    RAISE NOTICE 'All checks passed! Subscription should be visible.';
    RAISE NOTICE 'If still not showing, check:';
    RAISE NOTICE '  - Frontend is querying correctly (hooks/use-access-status.ts)';
    RAISE NOTICE '  - Browser cache (try hard refresh: Ctrl+Shift+R)';
    RAISE NOTICE '  - Real-time subscription to database changes';
  END IF;
  
  RAISE NOTICE '';
  RAISE NOTICE '================================================';
END $$;

