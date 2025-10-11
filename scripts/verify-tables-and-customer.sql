-- Verify tables exist and customer record is created
-- Run this AFTER running the migration

-- Check if tables exist
SELECT 
  'Tables Check' as check_type,
  EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'customers') as customers_exists,
  EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'subscriptions') as subscriptions_exists,
  EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'payments') as payments_exists,
  EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'dodo_webhook_events') as webhook_events_exists;

-- Check if customer record was created
SELECT 
  'Customer Record' as check_type,
  id,
  user_id,
  email,
  dodo_customer_id,
  created_at
FROM customers
WHERE email = 'lokeshadhepalliprasad@gmail.com';

-- Verify trigger exists
SELECT 
  'Trigger Check' as check_type,
  trigger_name,
  event_manipulation,
  event_object_table
FROM information_schema.triggers
WHERE trigger_name = 'trigger_create_customer_on_signup';

