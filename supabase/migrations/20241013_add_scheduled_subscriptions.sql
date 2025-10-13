-- ============================================================================
-- Add Scheduled Subscription Support
-- ============================================================================
-- This migration adds columns to support scheduled subscription upgrades
-- 
-- Business Logic:
-- - Users can schedule an upgrade to a higher tier
-- - The upgrade will activate at the end of the current billing period
-- - Downgrades are prevented entirely
-- - Only one active subscription allowed at a time
-- ============================================================================

-- Add scheduled subscription columns to subscriptions table
ALTER TABLE public.subscriptions
ADD COLUMN IF NOT EXISTS scheduled_product_id TEXT,
ADD COLUMN IF NOT EXISTS scheduled_start_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS is_upgrade_scheduled BOOLEAN DEFAULT FALSE;

-- Add comments for documentation
COMMENT ON COLUMN public.subscriptions.scheduled_product_id IS 
'DodoPayments product ID for a scheduled upgrade. Will activate when current period ends.';

COMMENT ON COLUMN public.subscriptions.scheduled_start_date IS 
'Date when the scheduled upgrade should activate (typically matches current_period_end).';

COMMENT ON COLUMN public.subscriptions.is_upgrade_scheduled IS 
'Flag indicating if this subscription has a scheduled upgrade pending.';

-- Create index for faster queries on scheduled upgrades
CREATE INDEX IF NOT EXISTS idx_subscriptions_scheduled_upgrades 
ON public.subscriptions(user_id, is_upgrade_scheduled) 
WHERE is_upgrade_scheduled = TRUE;

-- Add constraint to ensure scheduled_product_id and scheduled_start_date are set together
ALTER TABLE public.subscriptions
ADD CONSTRAINT check_scheduled_fields_together
CHECK (
  (scheduled_product_id IS NULL AND scheduled_start_date IS NULL AND is_upgrade_scheduled = FALSE) OR
  (scheduled_product_id IS NOT NULL AND scheduled_start_date IS NOT NULL AND is_upgrade_scheduled = TRUE)
);

COMMENT ON CONSTRAINT check_scheduled_fields_together ON public.subscriptions IS
'Ensures scheduled subscription fields are set together or all null';

