-- =============================================================================
-- Grace Period Fields for Subscriptions
-- Adds fields to support payment failure grace periods and cutoff enforcement
-- =============================================================================

ALTER TABLE public.subscriptions
ADD COLUMN IF NOT EXISTS grace_period_start TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS grace_period_end TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS grace_period_days INTEGER DEFAULT 7;

-- Indexes to facilitate queries used by guards/cron
CREATE INDEX IF NOT EXISTS idx_subscriptions_grace_end ON public.subscriptions(grace_period_end);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_status ON public.subscriptions(user_id, status);

-- Helpful comments
COMMENT ON COLUMN public.subscriptions.grace_period_start IS 'When grace period began due to repeated payment failures';
COMMENT ON COLUMN public.subscriptions.grace_period_end IS 'When grace period ends; access may be cut off after this';
COMMENT ON COLUMN public.subscriptions.grace_period_days IS 'Configured grace days applied when entering suspended state';
