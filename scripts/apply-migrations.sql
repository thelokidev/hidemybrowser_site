-- =====================================================
-- SUBSCRIPTION SYNC FIX - COMPLETE MIGRATION SCRIPT
-- =====================================================
-- Run this entire script in your Supabase SQL Editor
-- Or use: npx supabase db push
-- =====================================================

-- =====================================================
-- PART 1: Comprehensive Sync Fix
-- =====================================================

-- 1. Auto-deactivate free trial when subscription becomes active (DATABASE TRIGGER)
CREATE OR REPLACE FUNCTION deactivate_trial_on_subscription()
RETURNS TRIGGER AS $$
BEGIN
  -- When a subscription becomes active, deactivate the user's free trial
  IF NEW.status = 'active' AND (OLD.status IS NULL OR OLD.status != 'active') THEN
    UPDATE free_trials
    SET is_active = false, updated_at = NOW()
    WHERE user_id = NEW.user_id AND is_active = true;
    
    -- Log the action
    RAISE NOTICE 'Free trial deactivated for user % due to active subscription', NEW.user_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS trigger_deactivate_trial_on_active_subscription ON public.subscriptions;

CREATE TRIGGER trigger_deactivate_trial_on_active_subscription
AFTER INSERT OR UPDATE OF status ON public.subscriptions
FOR EACH ROW
EXECUTE FUNCTION deactivate_trial_on_subscription();

-- 2. Unified access status function
CREATE OR REPLACE FUNCTION get_user_access_status(user_uuid UUID)
RETURNS TABLE (
  has_access BOOLEAN,
  access_type TEXT,
  subscription_status TEXT,
  subscription_expires_at TIMESTAMP WITH TIME ZONE,
  subscription_product_id TEXT,
  trial_is_active BOOLEAN,
  trial_expires_at TIMESTAMP WITH TIME ZONE,
  trial_minutes_remaining INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    CASE 
      WHEN s.status = 'active' THEN true
      WHEN ft.is_active = true AND ft.expires_at > NOW() THEN true
      ELSE false
    END as has_access,
    CASE 
      WHEN s.status = 'active' THEN 'subscription'
      WHEN ft.is_active = true AND ft.expires_at > NOW() THEN 'trial'
      ELSE 'none'
    END as access_type,
    s.status as subscription_status,
    s.current_period_end as subscription_expires_at,
    s.dodo_product_id as subscription_product_id,
    COALESCE(ft.is_active, false) as trial_is_active,
    ft.expires_at as trial_expires_at,
    CASE 
      WHEN ft.expires_at > NOW() THEN EXTRACT(EPOCH FROM (ft.expires_at - NOW()))::INTEGER / 60
      ELSE 0
    END as trial_minutes_remaining
  FROM auth.users u
  LEFT JOIN public.subscriptions s ON s.user_id = u.id AND s.status = 'active'
  LEFT JOIN public.free_trials ft ON ft.user_id = u.id
  WHERE u.id = user_uuid
  LIMIT 1;
  
  -- If no result (user doesn't exist), return default
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 'none'::TEXT, NULL::TEXT, NULL::TIMESTAMP WITH TIME ZONE, 
                        NULL::TEXT, false, NULL::TIMESTAMP WITH TIME ZONE, 0;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Performance indexes
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_status ON public.subscriptions(user_id, status);
CREATE INDEX IF NOT EXISTS idx_free_trials_user_active ON public.free_trials(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_free_trials_expires_user ON public.free_trials(user_id, expires_at);

-- 4. Grant permissions
GRANT EXECUTE ON FUNCTION get_user_access_status TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_access_status TO anon;

-- 5. Add helpful comments
COMMENT ON FUNCTION deactivate_trial_on_subscription IS 'Automatically deactivates free trial when user gets an active subscription';
COMMENT ON FUNCTION get_user_access_status IS 'Returns unified access status with subscription taking priority over trial';

-- =====================================================
-- PART 2: Customer Auto-Create
-- =====================================================

-- 1. Create trigger function
CREATE OR REPLACE FUNCTION create_customer_for_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Create customer record for new user
  INSERT INTO public.customers (user_id, email, name, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
    NOW(),
    NOW()
  )
  ON CONFLICT (user_id) DO NOTHING;
  
  RAISE NOTICE 'Customer record created for user %', NEW.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS trigger_create_customer_on_signup ON auth.users;

CREATE TRIGGER trigger_create_customer_on_signup
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION create_customer_for_new_user();

-- 2. Backfill existing users without customer records
INSERT INTO public.customers (user_id, email, name, created_at, updated_at)
SELECT 
  u.id,
  u.email,
  COALESCE(u.raw_user_meta_data->>'full_name', u.raw_user_meta_data->>'name'),
  u.created_at,
  NOW()
FROM auth.users u
LEFT JOIN public.customers c ON c.user_id = u.id
WHERE c.id IS NULL
ON CONFLICT (user_id) DO NOTHING;

-- 3. Add comment
COMMENT ON FUNCTION create_customer_for_new_user IS 'Automatically creates customer record when user signs up';

-- =====================================================
-- PART 3: Fix Existing Users with Stuck Trials
-- =====================================================

-- Deactivate free trials for users with active subscriptions
UPDATE public.free_trials
SET 
  is_active = false,
  updated_at = NOW()
WHERE user_id IN (
  SELECT user_id 
  FROM public.subscriptions 
  WHERE status = 'active'
)
AND is_active = true;

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Check that triggers were created
SELECT 
  trigger_name, 
  event_object_table,
  action_timing,
  event_manipulation
FROM information_schema.triggers
WHERE trigger_name IN (
  'trigger_deactivate_trial_on_active_subscription',
  'trigger_create_customer_on_signup'
);

-- Check that functions exist
SELECT 
  routine_name,
  routine_type,
  data_type
FROM information_schema.routines
WHERE routine_name IN (
  'deactivate_trial_on_subscription',
  'create_customer_for_new_user',
  'get_user_access_status'
);

-- Check that indexes were created
SELECT 
  indexname,
  tablename
FROM pg_indexes
WHERE indexname IN (
  'idx_subscriptions_user_status',
  'idx_free_trials_user_active',
  'idx_free_trials_expires_user'
);

-- Verify no users have both active trial and active subscription
SELECT COUNT(*) as stuck_trials_count
FROM public.free_trials ft
JOIN public.subscriptions s ON s.user_id = ft.user_id
WHERE ft.is_active = true AND s.status = 'active';
-- Should return 0

-- Check customer records
SELECT 
  COUNT(*) as total_users,
  COUNT(c.id) as users_with_customers,
  COUNT(*) - COUNT(c.id) as users_without_customers
FROM auth.users u
LEFT JOIN public.customers c ON c.user_id = u.id;
-- users_without_customers should be 0

-- =====================================================
-- SUCCESS!
-- =====================================================
-- If all verification queries return expected results,
-- the migration was successful.
-- =====================================================

