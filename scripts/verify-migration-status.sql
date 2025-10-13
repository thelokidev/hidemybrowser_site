-- ============================================================================
-- Verify Migration Status
-- ============================================================================
-- Run this to check if the scheduled subscription columns exist
-- ============================================================================

-- Check if columns exist
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'subscriptions'
AND column_name IN ('scheduled_product_id', 'scheduled_start_date', 'is_upgrade_scheduled')
ORDER BY column_name;

-- Check if index exists
SELECT 
    indexname,
    indexdef
FROM pg_indexes 
WHERE schemaname = 'public' 
AND tablename = 'subscriptions'
AND indexname = 'idx_subscriptions_scheduled_upgrades';

-- Check if constraint exists
SELECT 
    conname as constraint_name,
    contype as constraint_type,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'public.subscriptions'::regclass
AND conname = 'check_scheduled_fields_together';

-- Count total subscriptions with scheduled upgrades
SELECT 
    COUNT(*) as total_subscriptions,
    COUNT(CASE WHEN is_upgrade_scheduled = TRUE THEN 1 END) as scheduled_upgrades
FROM public.subscriptions;


