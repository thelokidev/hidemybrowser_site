-- Remove free trial functionality completely
-- This migration removes all free trial related tables, functions, and policies

-- Drop RLS policies first
DROP POLICY IF EXISTS "Users can view own trial" ON public.free_trials;
DROP POLICY IF EXISTS "Users can create own trial" ON public.free_trials;

-- Revoke permissions
REVOKE SELECT, INSERT ON public.free_trials FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.is_trial_expired FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.get_trial_status FROM authenticated;

-- Drop functions
DROP FUNCTION IF EXISTS public.get_trial_status(UUID);
DROP FUNCTION IF EXISTS public.is_trial_expired(UUID);

-- Drop indexes
DROP INDEX IF EXISTS idx_free_trials_user_id;
DROP INDEX IF EXISTS idx_free_trials_expires_at;

-- Drop table
DROP TABLE IF EXISTS public.free_trials CASCADE;

-- Add comment
COMMENT ON SCHEMA public IS 'Free trial functionality removed - using DodoPayments subscriptions only';

