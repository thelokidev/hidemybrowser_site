-- ============================================================================
-- Apply Scheduled Subscription Migration (Safe Version)
-- ============================================================================
-- This script safely adds the new columns only if they don't exist
-- Run this in Supabase SQL Editor
-- ============================================================================

-- Add scheduled subscription columns to subscriptions table (if not exists)
DO $$
BEGIN
    -- Add scheduled_product_id if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'subscriptions' 
        AND column_name = 'scheduled_product_id'
    ) THEN
        ALTER TABLE public.subscriptions ADD COLUMN scheduled_product_id TEXT;
        RAISE NOTICE 'Added column: scheduled_product_id';
    ELSE
        RAISE NOTICE 'Column scheduled_product_id already exists';
    END IF;

    -- Add scheduled_start_date if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'subscriptions' 
        AND column_name = 'scheduled_start_date'
    ) THEN
        ALTER TABLE public.subscriptions ADD COLUMN scheduled_start_date TIMESTAMPTZ;
        RAISE NOTICE 'Added column: scheduled_start_date';
    ELSE
        RAISE NOTICE 'Column scheduled_start_date already exists';
    END IF;

    -- Add is_upgrade_scheduled if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'subscriptions' 
        AND column_name = 'is_upgrade_scheduled'
    ) THEN
        ALTER TABLE public.subscriptions ADD COLUMN is_upgrade_scheduled BOOLEAN DEFAULT FALSE;
        RAISE NOTICE 'Added column: is_upgrade_scheduled';
    ELSE
        RAISE NOTICE 'Column is_upgrade_scheduled already exists';
    END IF;
END $$;

-- Add comments for documentation
COMMENT ON COLUMN public.subscriptions.scheduled_product_id IS 
'DodoPayments product ID for a scheduled upgrade. Will activate when current period ends.';

COMMENT ON COLUMN public.subscriptions.scheduled_start_date IS 
'Date when the scheduled upgrade should activate (typically matches current_period_end).';

COMMENT ON COLUMN public.subscriptions.is_upgrade_scheduled IS 
'Flag indicating if this subscription has a scheduled upgrade pending.';

-- Create index for faster queries on scheduled upgrades (if not exists)
CREATE INDEX IF NOT EXISTS idx_subscriptions_scheduled_upgrades 
ON public.subscriptions(user_id, is_upgrade_scheduled) 
WHERE is_upgrade_scheduled = TRUE;

-- Add constraint to ensure scheduled_product_id and scheduled_start_date are set together
-- Drop existing constraint first if it exists
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_schema = 'public' 
        AND table_name = 'subscriptions' 
        AND constraint_name = 'check_scheduled_fields_together'
    ) THEN
        ALTER TABLE public.subscriptions DROP CONSTRAINT check_scheduled_fields_together;
        RAISE NOTICE 'Dropped existing constraint: check_scheduled_fields_together';
    END IF;
END $$;

-- Add the constraint
ALTER TABLE public.subscriptions
ADD CONSTRAINT check_scheduled_fields_together
CHECK (
  (scheduled_product_id IS NULL AND scheduled_start_date IS NULL AND is_upgrade_scheduled = FALSE) OR
  (scheduled_product_id IS NOT NULL AND scheduled_start_date IS NOT NULL AND is_upgrade_scheduled = TRUE)
);

COMMENT ON CONSTRAINT check_scheduled_fields_together ON public.subscriptions IS
'Ensures scheduled subscription fields are set together or all null';

-- Verify the migration
DO $$
BEGIN
    RAISE NOTICE '============================================';
    RAISE NOTICE 'MIGRATION COMPLETED SUCCESSFULLY';
    RAISE NOTICE '============================================';
    RAISE NOTICE 'New columns added to subscriptions table:';
    RAISE NOTICE '  - scheduled_product_id';
    RAISE NOTICE '  - scheduled_start_date';
    RAISE NOTICE '  - is_upgrade_scheduled';
    RAISE NOTICE 'Index created: idx_subscriptions_scheduled_upgrades';
    RAISE NOTICE 'Constraint added: check_scheduled_fields_together';
END $$;


