-- Auto-create customer record when user signs up
-- This ensures all users have a customer record for payment processing

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

