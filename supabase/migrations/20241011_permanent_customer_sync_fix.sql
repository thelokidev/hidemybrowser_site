-- PERMANENT FIX: Auto-create customers and handle webhook sync
-- This migration ensures all users have customer records and webhooks work correctly

-- ================================================================
-- PART 1: Backfill - Create customer records for ALL existing users
-- ================================================================
DO $$
DECLARE
  inserted_count INTEGER;
BEGIN
  -- Insert customer records for all users who don't have one
  WITH inserted AS (
    INSERT INTO public.customers (user_id, email, name, created_at, updated_at)
    SELECT 
      u.id as user_id,
      u.email,
      COALESCE(
        u.raw_user_meta_data->>'full_name', 
        u.raw_user_meta_data->>'name',
        split_part(u.email, '@', 1)
      ) as name,
      u.created_at,
      NOW() as updated_at
    FROM auth.users u
    LEFT JOIN public.customers c ON c.user_id = u.id
    WHERE c.id IS NULL
    ON CONFLICT (user_id) DO UPDATE 
    SET 
      email = EXCLUDED.email,
      updated_at = NOW()
    RETURNING 1
  )
  SELECT COUNT(*) INTO inserted_count FROM inserted;
  
  RAISE NOTICE 'Backfilled % customer records', inserted_count;
END $$;

-- ================================================================
-- PART 2: Create or replace trigger function for new user signups
-- ================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  -- Automatically create customer record when user signs up
  INSERT INTO public.customers (user_id, email, name, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'name',
      split_part(NEW.email, '@', 1)
    ),
    NOW(),
    NOW()
  )
  ON CONFLICT (user_id) DO UPDATE
  SET 
    email = EXCLUDED.email,
    name = COALESCE(EXCLUDED.name, customers.name),
    updated_at = NOW();
  
  RAISE NOTICE 'Customer record created for user: %', NEW.email;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger to run on new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ================================================================
-- PART 3: Create helper function to manually sync subscription
-- ================================================================
CREATE OR REPLACE FUNCTION public.get_user_by_email(user_email TEXT)
RETURNS TABLE (
  user_id UUID,
  email TEXT,
  has_customer BOOLEAN,
  has_subscription BOOLEAN,
  subscription_status TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    u.id as user_id,
    u.email::TEXT,
    (c.id IS NOT NULL) as has_customer,
    (s.id IS NOT NULL) as has_subscription,
    s.status::TEXT as subscription_status
  FROM auth.users u
  LEFT JOIN public.customers c ON c.user_id = u.id
  LEFT JOIN public.subscriptions s ON s.user_id = u.id AND s.status IN ('active', 'trialing')
  WHERE u.email = user_email
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.get_user_by_email TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_by_email TO service_role;

-- ================================================================
-- PART 4: Add updated_at trigger for automatic timestamp updates
-- ================================================================
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to all relevant tables
DROP TRIGGER IF EXISTS set_updated_at ON public.customers;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.customers
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_updated_at ON public.subscriptions;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_updated_at ON public.payments;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.payments
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ================================================================
-- PART 5: Add indexes for performance
-- ================================================================
CREATE INDEX IF NOT EXISTS idx_customers_email ON public.customers(email);
CREATE INDEX IF NOT EXISTS idx_customers_dodo_customer_id ON public.customers(dodo_customer_id) WHERE dodo_customer_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_status ON public.subscriptions(user_id, status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_dodo_ids ON public.subscriptions(dodo_subscription_id, dodo_customer_id);
CREATE INDEX IF NOT EXISTS idx_webhook_events_processed ON public.dodo_webhook_events(processed, created_at);

-- ================================================================
-- PART 6: Verify the fix was applied
-- ================================================================
DO $$
DECLARE
  total_users INTEGER;
  total_customers INTEGER;
  missing_customers INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_users FROM auth.users;
  SELECT COUNT(*) INTO total_customers FROM public.customers;
  SELECT COUNT(*) INTO missing_customers 
  FROM auth.users u 
  LEFT JOIN public.customers c ON c.user_id = u.id 
  WHERE c.id IS NULL;
  
  RAISE NOTICE '========================================';
  RAISE NOTICE 'PERMANENT FIX VERIFICATION';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Total auth users: %', total_users;
  RAISE NOTICE 'Total customer records: %', total_customers;
  RAISE NOTICE 'Missing customer records: %', missing_customers;
  
  IF missing_customers = 0 THEN
    RAISE NOTICE '✓ SUCCESS: All users have customer records!';
  ELSE
    RAISE WARNING '⚠ WARNING: % users still missing customer records', missing_customers;
  END IF;
  
  RAISE NOTICE '========================================';
END $$;

-- ================================================================
-- PART 7: Show specific user status
-- ================================================================
SELECT 
  '✓ User Status for lokeshadhepalliprasad@gmail.com' as info,
  user_id,
  email,
  has_customer,
  has_subscription,
  subscription_status
FROM public.get_user_by_email('lokeshadhepalliprasad@gmail.com');

-- ================================================================
-- Add helpful comments
-- ================================================================
COMMENT ON FUNCTION public.handle_new_user IS 'Automatically creates customer record when new user signs up';
COMMENT ON FUNCTION public.get_user_by_email IS 'Helper function to check user, customer, and subscription status by email';
COMMENT ON TRIGGER on_auth_user_created ON auth.users IS 'Auto-creates customer record for new user signups';

