-- One-time fix: Sync subscription for lokeshadhepalliprasad@gmail.com
-- This user has successful payments but no subscription record due to webhook sync failure
-- Run this in Supabase SQL Editor

-- Step 1: Verify the customer and payment data
SELECT 
  'Customer Info' as check_type,
  c.user_id,
  c.email,
  c.dodo_customer_id,
  c.created_at
FROM customers c
WHERE c.email = 'lokeshadhepalliprasad@gmail.com';

SELECT 
  'Payment Info' as check_type,
  p.dodo_payment_id,
  p.amount,
  p.currency,
  p.status,
  p.created_at
FROM payments p
JOIN customers c ON c.user_id = p.user_id
WHERE c.email = 'lokeshadhepalliprasad@gmail.com'
ORDER BY p.created_at DESC
LIMIT 5;

-- Step 2: Check if subscription already exists
SELECT 
  'Existing Subscription' as check_type,
  s.*
FROM subscriptions s
JOIN customers c ON c.user_id = s.user_id
WHERE c.email = 'lokeshadhepalliprasad@gmail.com';

-- Step 3: IMPORTANT - Fetch subscription details from DodoPayments dashboard
-- Before running the INSERT below, you need to get from DodoPayments:
-- - subscription_id (starts with sub_)
-- - product_id (starts with pdt_)
-- - price_id (starts with pri_)
-- - current_period_start
-- - current_period_end

-- Step 4: Insert/Update subscription record
-- REPLACE THE PLACEHOLDER VALUES BELOW WITH ACTUAL DATA FROM DODOPAYMENTS

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
  metadata,
  created_at,
  updated_at
)
SELECT 
  c.user_id,
  'cus_CH5FUDkY8A7xm2MtccVQ2' as dodo_customer_id,
  'sub_XXXXX' as dodo_subscription_id,  -- REPLACE with actual subscription ID
  'pdt_XXXXX' as dodo_product_id,        -- REPLACE with actual product ID
  'pri_XXXXX' as dodo_price_id,          -- REPLACE with actual price ID
  'active' as status,
  '2025-10-13 00:00:00+00' as current_period_start,  -- REPLACE with actual date
  '2026-01-13 00:00:00+00' as current_period_end,    -- REPLACE with actual date
  false as cancel_at_period_end,
  jsonb_build_object(
    'manually_fixed', true,
    'fixed_at', NOW(),
    'reason', 'Webhook sync failure - manual recovery'
  ) as metadata,
  NOW() as created_at,
  NOW() as updated_at
FROM customers c
WHERE c.email = 'lokeshadhepalliprasad@gmail.com'
ON CONFLICT (dodo_subscription_id) 
DO UPDATE SET
  status = EXCLUDED.status,
  current_period_start = EXCLUDED.current_period_start,
  current_period_end = EXCLUDED.current_period_end,
  dodo_product_id = EXCLUDED.dodo_product_id,
  dodo_price_id = EXCLUDED.dodo_price_id,
  updated_at = NOW();
*/

-- Step 5: Verify the fix
SELECT 
  'Verification' as check_type,
  c.email,
  c.dodo_customer_id,
  s.dodo_subscription_id,
  s.dodo_product_id,
  s.status,
  s.current_period_start,
  s.current_period_end,
  CASE 
    WHEN s.status = 'active' AND s.current_period_end > NOW() THEN 'HAS ACCESS'
    ELSE 'NO ACCESS'
  END as access_status
FROM customers c
LEFT JOIN subscriptions s ON s.user_id = c.user_id
WHERE c.email = 'lokeshadhepalliprasad@gmail.com';

-- After running this, the user should see their subscription in the dashboard
-- NOTE: The webhook handler has been fixed to prevent this issue in the future

