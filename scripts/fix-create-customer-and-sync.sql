-- Fix: Create customer record and prepare for subscription sync
-- Run this in Supabase SQL Editor

-- Step 1: Create customer record for your user
INSERT INTO public.customers (user_id, email, name, created_at, updated_at)
SELECT 
  id as user_id,
  email,
  COALESCE(raw_user_meta_data->>'full_name', raw_user_meta_data->>'name', 'User') as name,
  created_at,
  NOW() as updated_at
FROM auth.users
WHERE email = 'lokeshadhepalliprasad@gmail.com'
ON CONFLICT (user_id) DO UPDATE 
SET 
  email = EXCLUDED.email,
  updated_at = NOW();

-- Step 2: Verify customer was created
SELECT 
  '✓ Customer record created!' as status,
  id,
  user_id,
  email,
  name,
  dodo_customer_id,
  created_at
FROM public.customers
WHERE email = 'lokeshadhepalliprasad@gmail.com';

-- Step 3: Check if user exists in auth
SELECT 
  'User in auth.users:' as info,
  id,
  email,
  created_at
FROM auth.users
WHERE email = 'lokeshadhepalliprasad@gmail.com';

