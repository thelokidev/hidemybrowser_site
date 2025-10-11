-- =================================================================
-- MANUAL SUBSCRIPTION POPULATION FIX
-- Use this if webhooks failed and subscription needs to be manually added
-- =================================================================

-- INSTRUCTIONS:
-- 1. First run SUBSCRIPTION_FLOW_DEBUG.sql to diagnose the issue
-- 2. If subscription.active webhook was never received, you need to:
--    a) Manually trigger the sync endpoint: POST /api/subscriptions/sync
--    OR
--    b) Get subscription details from DodoPayments dashboard and run this script

-- =================================================================
-- OPTION A: Use the manual sync API endpoint (RECOMMENDED)
-- =================================================================
-- Just click the "Sync Subscription" button on the dashboard
-- Or call: POST https://www.hidemybrowser.com/api/subscriptions/sync
-- (Must be logged in as the user)

-- =================================================================
-- OPTION B: Manual SQL insert (if API doesn't work)
-- =================================================================
-- WARNING: Only use this if you have the subscription details from DodoPayments

-- Step 1: Get the user_id
DO $$
DECLARE
  v_user_id UUID;
  v_customer_id TEXT;
BEGIN
  -- Get user_id from customers table
  SELECT user_id, dodo_customer_id INTO v_user_id, v_customer_id
  FROM customers 
  WHERE email = 'lokeshadhepalliprasad@gmail.com';
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Customer not found for email: lokeshadhepalliprasad@gmail.com';
  END IF;
  
  RAISE NOTICE 'Found user_id: %', v_user_id;
  RAISE NOTICE 'Customer ID: %', v_customer_id;
  
  -- Check if subscription already exists
  IF EXISTS (SELECT 1 FROM subscriptions WHERE user_id = v_user_id) THEN
    RAISE NOTICE '⚠️  Subscription already exists for this user!';
    RAISE NOTICE 'Current subscriptions:';
    FOR r IN SELECT dodo_subscription_id, status, current_period_end FROM subscriptions WHERE user_id = v_user_id LOOP
      RAISE NOTICE '  - ID: %, Status: %, Expires: %', r.dodo_subscription_id, r.status, r.current_period_end;
    END LOOP;
  ELSE
    RAISE NOTICE '✓ No existing subscription found. Safe to insert.';
    RAISE NOTICE '';
    RAISE NOTICE '==================================================';
    RAISE NOTICE 'TO MANUALLY INSERT A SUBSCRIPTION:';
    RAISE NOTICE '==================================================';
    RAISE NOTICE '1. Get subscription details from DodoPayments dashboard';
    RAISE NOTICE '2. Replace the values below with actual data';
    RAISE NOTICE '3. Uncomment and run the INSERT statement';
    RAISE NOTICE '';
  END IF;
END $$;

-- =================================================================
-- Step 2: Insert subscription (UNCOMMENT AND FILL IN REAL VALUES)
-- =================================================================
/*
INSERT INTO subscriptions (
  user_id,
  dodo_customer_id,
  dodo_subscription_id,
  dodo_product_id,
  dodo_price_id,
  status,
  current_period_start,
  current_period_end,
  cancel_at_period_end,
  canceled_at,
  trial_start,
  trial_end,
  metadata,
  created_at,
  updated_at
) VALUES (
  (SELECT user_id FROM customers WHERE email = 'lokeshadhepalliprasad@gmail.com'),
  'cus_CH5FUDkY8A7xm2MtccVQ2',  -- dodo_customer_id
  'sub_XXXXXXXXXXXXX',  -- ⚠️  REPLACE WITH REAL SUBSCRIPTION ID FROM DODOPAYMENTS
  'pdt_XXXXXXXXXXXXX',  -- ⚠️  REPLACE WITH PRODUCT ID
  'pri_XXXXXXXXXXXXX',  -- ⚠️  REPLACE WITH PRICE ID (optional)
  'active',             -- Status
  NOW(),                -- current_period_start - ⚠️  REPLACE WITH REAL DATE
  NOW() + INTERVAL '30 days',  -- current_period_end - ⚠️  REPLACE WITH REAL DATE
  FALSE,                -- cancel_at_period_end
  NULL,                 -- canceled_at
  NULL,                 -- trial_start
  NULL,                 -- trial_end
  '{}'::jsonb,          -- metadata
  NOW(),                -- created_at
  NOW()                 -- updated_at
)
ON CONFLICT (dodo_subscription_id) DO UPDATE SET
  status = EXCLUDED.status,
  current_period_end = EXCLUDED.current_period_end,
  updated_at = NOW();

-- Verify insertion
SELECT 
  '✓ Subscription inserted successfully!' as result,
  dodo_subscription_id,
  status,
  current_period_start,
  current_period_end
FROM subscriptions s
JOIN customers c ON c.user_id = s.user_id
WHERE c.email = 'lokeshadhepalliprasad@gmail.com';
*/

-- =================================================================
-- Step 3: Verify the fix worked
-- =================================================================
SELECT 
  '=== VERIFICATION ===' as section,
  u.email,
  c.dodo_customer_id,
  s.dodo_subscription_id,
  s.status,
  s.current_period_end,
  CASE 
    WHEN s.status = 'active' AND s.current_period_end > NOW() THEN '✓ ACTIVE - Dashboard should show subscription'
    WHEN s.status = 'active' AND s.current_period_end <= NOW() THEN '⚠️  EXPIRED - Subscription past end date'
    WHEN s.status IS NULL THEN '✗ STILL NO SUBSCRIPTION'
    ELSE '⚠️  Status: ' || s.status
  END as access_status
FROM auth.users u
LEFT JOIN customers c ON c.user_id = u.id
LEFT JOIN subscriptions s ON s.user_id = u.id AND s.status = 'active'
WHERE u.email = 'lokeshadhepalliprasad@gmail.com';

