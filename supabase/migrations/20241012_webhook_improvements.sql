-- Webhook Event Tracking Improvements
-- Add error tracking and retry count to webhook events table

-- Add error_message column to track webhook processing errors
ALTER TABLE dodo_webhook_events 
ADD COLUMN IF NOT EXISTS error_message TEXT;

-- Add retry_count column to track how many times an event has been retried
ALTER TABLE dodo_webhook_events 
ADD COLUMN IF NOT EXISTS retry_count INTEGER DEFAULT 0;

-- Create index for faster queries on processed events
CREATE INDEX IF NOT EXISTS idx_webhook_events_processed 
ON dodo_webhook_events(processed, created_at);

-- Create index for faster queries by event type
CREATE INDEX IF NOT EXISTS idx_webhook_events_type 
ON dodo_webhook_events(event_type, created_at);

-- Add helpful comments
COMMENT ON COLUMN dodo_webhook_events.error_message IS 'Error message if webhook processing failed';
COMMENT ON COLUMN dodo_webhook_events.retry_count IS 'Number of times this webhook event has been retried';
COMMENT ON INDEX idx_webhook_events_processed IS 'Index for efficiently querying processed/unprocessed events';
COMMENT ON INDEX idx_webhook_events_type IS 'Index for efficiently querying events by type';

