-- =============================================================================
-- Webhook Retry Queue
-- Stores failed webhook events for reprocessing with backoff
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.webhook_retry_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id TEXT NOT NULL REFERENCES public.dodo_webhook_events(event_id) ON DELETE CASCADE,
  retry_count INTEGER NOT NULL DEFAULT 0,
  max_retries INTEGER NOT NULL DEFAULT 3,
  next_retry_at TIMESTAMPTZ,
  last_error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT webhook_retry_queue_retry_bounds CHECK (retry_count >= 0 AND max_retries >= 0)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_webhook_retry_event_id ON public.webhook_retry_queue(event_id);
CREATE INDEX IF NOT EXISTS idx_webhook_retry_next_retry_at ON public.webhook_retry_queue(next_retry_at);
CREATE INDEX IF NOT EXISTS idx_webhook_retry_retry_count ON public.webhook_retry_queue(retry_count);

-- Enable RLS
ALTER TABLE public.webhook_retry_queue ENABLE ROW LEVEL SECURITY;

-- RLS: No user access; service role only
DROP POLICY IF EXISTS "Service role full access to webhook_retry_queue" ON public.webhook_retry_queue;
CREATE POLICY "Service role full access to webhook_retry_queue" ON public.webhook_retry_queue
  FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

-- Grants
GRANT ALL ON public.webhook_retry_queue TO postgres, service_role;

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.set_updated_at_webhook_retry_queue()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_set_updated_at_webhook_retry_queue ON public.webhook_retry_queue;
CREATE TRIGGER trg_set_updated_at_webhook_retry_queue
BEFORE UPDATE ON public.webhook_retry_queue
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_webhook_retry_queue();

-- Comments
COMMENT ON TABLE public.webhook_retry_queue IS 'Queue of webhook events that failed processing and are scheduled for retry with backoff';
COMMENT ON COLUMN public.webhook_retry_queue.next_retry_at IS 'When this event should be retried next';
