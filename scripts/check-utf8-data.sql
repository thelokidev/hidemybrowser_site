-- =====================================================
-- UTF-8 DATA INTEGRITY CHECK
-- =====================================================
-- Run this in your Supabase SQL Editor to find corrupted data
-- =====================================================

-- Check for invalid UTF-8 in subscriptions table
SELECT 
  'subscriptions' as table_name,
  id,
  user_id,
  dodo_subscription_id,
  'Invalid UTF-8 in metadata' as issue
FROM public.subscriptions
WHERE metadata IS NOT NULL
  AND NOT (metadata::text ~ '^[\x00-\x7F\xC0-\xDF][\x80-\xBF]*$|^[\xE0-\xEF][\x80-\xBF]{2}$|^[\xF0-\xF7][\x80-\xBF]{3}$');

-- Check for invalid UTF-8 in customers table
SELECT 
  'customers' as table_name,
  id,
  user_id,
  email,
  name,
  'Check name or email' as issue
FROM public.customers
WHERE (name IS NOT NULL AND length(name) != char_length(name))
   OR (email IS NOT NULL AND length(email) != char_length(email));

-- Check for invalid UTF-8 in payments table
SELECT 
  'payments' as table_name,
  id,
  user_id,
  dodo_payment_id,
  'Invalid UTF-8 in metadata or description' as issue
FROM public.payments
WHERE (metadata IS NOT NULL AND NOT (metadata::text ~ '^[\x00-\x7F\xC0-\xDF][\x80-\xBF]*$|^[\xE0-\xEF][\x80-\xBF]{2}$|^[\xF0-\xF7][\x80-\xBF]{3}$'))
   OR (description IS NOT NULL AND length(description) != char_length(description));

-- Check for null bytes (another common issue)
SELECT 
  'subscriptions_null_bytes' as check_type,
  COUNT(*) as count
FROM public.subscriptions
WHERE metadata::text LIKE '%\x00%';

-- Check for very large metadata objects (might cause serialization issues)
SELECT 
  'large_metadata' as check_type,
  'subscriptions' as table_name,
  id,
  user_id,
  length(metadata::text) as metadata_size_bytes
FROM public.subscriptions
WHERE metadata IS NOT NULL 
  AND length(metadata::text) > 10000
ORDER BY metadata_size_bytes DESC
LIMIT 10;

-- Check recent webhook events for invalid data
SELECT 
  'webhook_events' as table_name,
  id,
  event_type,
  length(data::text) as data_size_bytes,
  'Check for large or invalid UTF-8 in data' as issue
FROM public.dodo_webhook_events
WHERE data IS NOT NULL
  AND (
    length(data::text) > 50000
    OR NOT (data::text ~ '^[\x00-\x7F\xC0-\xDF][\x80-\xBF]*$|^[\xE0-\xEF][\x80-\xBF]{2}$|^[\xF0-\xF7][\x80-\xBF]{3}$')
  )
ORDER BY created_at DESC
LIMIT 10;

-- Summary check
SELECT 
  '📊 Summary' as check_type,
  (SELECT COUNT(*) FROM public.subscriptions WHERE metadata IS NOT NULL) as subscriptions_with_metadata,
  (SELECT COUNT(*) FROM public.customers WHERE name IS NOT NULL) as customers_with_names,
  (SELECT COUNT(*) FROM public.payments WHERE metadata IS NOT NULL) as payments_with_metadata,
  (SELECT COUNT(*) FROM public.dodo_webhook_events) as total_webhook_events;

-- =====================================================
-- CLEANUP SCRIPT (RUN ONLY IF ISSUES FOUND ABOVE)
-- =====================================================

-- Clean up subscriptions with invalid metadata
-- UPDATE public.subscriptions
-- SET metadata = NULL, updated_at = NOW()
-- WHERE metadata IS NOT NULL
--   AND NOT (metadata::text ~ '^[\x00-\x7F\xC0-\xDF][\x80-\xBF]*$|^[\xE0-\xEF][\x80-\xBF]{2}$|^[\xF0-\xF7][\x80-\xBF]{3}$');

-- Clean up old webhook events (keep last 1000)
-- DELETE FROM public.dodo_webhook_events
-- WHERE id NOT IN (
--   SELECT id FROM public.dodo_webhook_events
--   ORDER BY created_at DESC
--   LIMIT 1000
-- );

