-- =============================================================================
-- Payment Retry System
-- Tracks payment failures and scheduled retries per subscription
-- =============================================================================

-- Create table: payment_attempts
CREATE TABLE IF NOT EXISTS public.payment_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subscription_id UUID NOT NULL REFERENCES public.subscriptions(id) ON DELETE CASCADE,
  dodo_payment_id TEXT,
  failure_count INTEGER NOT NULL DEFAULT 0,
  last_attempt_at TIMESTAMPTZ,
  next_retry_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending' | 'retrying' | 'suspended' | 'resolved'
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT payment_attempts_status_check CHECK (status IN ('pending','retrying','suspended','resolved'))
);

-- Helpful indexes
CREATE INDEX IF NOT EXISTS idx_payment_attempts_user_id ON public.payment_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_attempts_subscription_id ON public.payment_attempts(subscription_id);
CREATE INDEX IF NOT EXISTS idx_payment_attempts_status ON public.payment_attempts(status);
CREATE INDEX IF NOT EXISTS idx_payment_attempts_next_retry_at ON public.payment_attempts(next_retry_at);
CREATE INDEX IF NOT EXISTS idx_payment_attempts_dodo_payment_id ON public.payment_attempts(dodo_payment_id);

-- Enable RLS
ALTER TABLE public.payment_attempts ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Users can view own payment attempts" ON public.payment_attempts;
CREATE POLICY "Users can view own payment attempts" ON public.payment_attempts
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service role can write payment attempts" ON public.payment_attempts;
CREATE POLICY "Service role can write payment attempts" ON public.payment_attempts
  FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

-- Grants
GRANT ALL ON public.payment_attempts TO postgres, service_role;
GRANT SELECT ON public.payment_attempts TO authenticated;

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.set_updated_at_payment_attempts()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_set_updated_at_payment_attempts ON public.payment_attempts;
CREATE TRIGGER trg_set_updated_at_payment_attempts
BEFORE UPDATE ON public.payment_attempts
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_payment_attempts();

-- Comments
COMMENT ON TABLE public.payment_attempts IS 'Tracks DodoPayments failures and retry schedule for a user subscription';
COMMENT ON COLUMN public.payment_attempts.status IS 'pending | retrying | suspended | resolved';
