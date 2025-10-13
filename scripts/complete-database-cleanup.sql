-- ============================================================================
-- COMPLETE DATABASE CLEANUP SCRIPT
-- ============================================================================
-- WARNING: This script will DELETE ALL DATA from your Supabase database
-- including all users, subscriptions, customers, invoices, and webhook events
-- 
-- USE WITH EXTREME CAUTION - THIS IS IRREVERSIBLE
-- 
-- Recommended: Take a backup before running this script
-- ============================================================================

-- Start transaction
BEGIN;

-- Disable triggers temporarily to avoid conflicts
SET session_replication_role = replica;

-- 1. Delete all webhook events
DELETE FROM public.dodo_webhook_events;

-- 2. Delete all payments
DELETE FROM public.payments;

-- 3. Delete all invoices
DELETE FROM public.invoices;

-- 4. Delete all subscriptions
DELETE FROM public.subscriptions;

-- 5. Delete all customers
DELETE FROM public.customers;

-- 6. Delete all auth users (this will cascade to related data)
-- CRITICAL: This deletes ALL user accounts
DELETE FROM auth.users;

-- Re-enable triggers
SET session_replication_role = DEFAULT;

-- Commit transaction
COMMIT;

-- Success message
DO $$
BEGIN
    RAISE NOTICE '============================================';
    RAISE NOTICE 'DATABASE CLEANUP COMPLETED SUCCESSFULLY';
    RAISE NOTICE '============================================';
    RAISE NOTICE 'All users, subscriptions, customers, invoices, payments, and webhook events have been deleted';
    RAISE NOTICE 'You can now start fresh with a clean database';
END $$;

