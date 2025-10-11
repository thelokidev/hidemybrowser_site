# Testing Guide - Subscription Sync Fix

## Pre-Deployment Testing

### 1. Code Quality Checks
- [x] Build succeeds (`npm run build`)
- [x] No linter errors
- [x] TypeScript compilation passes
- [x] All types updated correctly

### 2. Local Testing (if possible)
If you have local Supabase and DodoPayments test environment:
- [ ] Test each webhook event type with mock payloads
- [ ] Verify idempotency (send same event twice)
- [ ] Check error handling with malformed payloads

## Post-Deployment Testing

### Step 1: Deploy to Vercel
```bash
git add .
git commit -F COMMIT_MESSAGE.txt
git push origin main
```

### Step 2: Apply Database Migration
In Supabase Dashboard:
1. Go to SQL Editor
2. Paste contents of `supabase/migrations/20241012_webhook_improvements.sql`
3. Run migration
4. Verify new columns exist:
   ```sql
   SELECT column_name, data_type 
   FROM information_schema.columns 
   WHERE table_name = 'dodo_webhook_events';
   ```

### Step 3: Test Payment Flow

#### 3.1 Complete Test Payment
1. Log into your HideMyBrowser app
2. Navigate to pricing page
3. Select a plan
4. Complete checkout with test card: `4242 4242 4242 4242`
5. Wait for redirect back to dashboard

#### 3.2 Verify Webhook Processing
In Vercel Dashboard → Logs:
```
Look for:
[Webhook] Processing event: payment.succeeded
[Webhook] Payment recorded successfully
[Webhook] Processing subscription event: subscription.active
[Webhook] Subscription synced successfully
```

#### 3.3 Verify Database Records

**Check webhook events:**
```sql
SELECT event_type, processed, error_message, created_at
FROM dodo_webhook_events
WHERE event_type IN ('payment.succeeded', 'subscription.active')
ORDER BY created_at DESC
LIMIT 5;
```

**Check payment record:**
```sql
SELECT user_id, dodo_payment_id, amount, status, created_at
FROM payments
WHERE user_id = 'YOUR_USER_ID'
ORDER BY created_at DESC
LIMIT 1;
```

**Check subscription record:**
```sql
SELECT user_id, dodo_subscription_id, status, current_period_end
FROM subscriptions
WHERE user_id = 'YOUR_USER_ID'
ORDER BY created_at DESC
LIMIT 1;
```

#### 3.4 Verify Dashboard
1. Refresh dashboard
2. Should show "Active Subscription"
3. Should display subscription details
4. Download button should be enabled

### Step 4: Test Edge Cases

#### 4.1 Test Idempotency
Manually replay a webhook event:
```powershell
# Use the test-webhook-endpoint.ps1 script with same event ID
# Verify second request returns "already_processed"
```

#### 4.2 Test Subscription Cancellation
1. Cancel subscription in DodoPayments dashboard
2. Wait for `subscription.canceled` webhook
3. Verify subscription status updated to "canceled" in database
4. Verify dashboard reflects cancellation

#### 4.3 Test Failed Payment
1. Use test card that fails: `4000 0000 0000 0002`
2. Verify `payment.failed` webhook processed
3. Check payment status is "failed" in database

#### 4.4 Test Manual Sync Fallback
If webhook fails:
1. Click "Sync Subscription" button on dashboard
2. Verify subscription appears after sync
3. Check manual sync endpoint logs

### Step 5: Monitor Production

#### First 24 Hours
Monitor Vercel logs for:
- [ ] All webhook events being received
- [ ] No unhandled event types
- [ ] No 500 errors from webhook endpoint
- [ ] Successful subscription creation for all payments

#### Check Database Health
```sql
-- Count processed vs unprocessed events
SELECT 
  processed,
  COUNT(*) as count
FROM dodo_webhook_events
WHERE created_at > NOW() - INTERVAL '24 hours'
GROUP BY processed;

-- Check for errors
SELECT 
  event_type,
  error_message,
  created_at
FROM dodo_webhook_events
WHERE error_message IS NOT NULL
  AND created_at > NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC;

-- Verify payment → subscription correlation
SELECT 
  p.created_at as payment_time,
  s.created_at as subscription_time,
  EXTRACT(EPOCH FROM (s.created_at - p.created_at)) as delay_seconds
FROM payments p
LEFT JOIN subscriptions s ON p.user_id = s.user_id
WHERE p.created_at > NOW() - INTERVAL '24 hours'
  AND p.status = 'succeeded';
```

## Rollback Procedure

If critical issues occur:

### Immediate Rollback
```bash
# Revert to previous deployment in Vercel Dashboard
# Or git revert:
git revert HEAD
git push origin main
```

### Database Rollback (if needed)
```sql
-- Remove new columns (optional - old code ignores them)
ALTER TABLE dodo_webhook_events 
DROP COLUMN IF EXISTS error_message,
DROP COLUMN IF EXISTS retry_count;

-- Remove indexes (optional)
DROP INDEX IF EXISTS idx_webhook_events_processed;
DROP INDEX IF EXISTS idx_webhook_events_type;
```

## Success Criteria

✅ **Primary Goal**: All test payments result in active subscriptions
✅ **Secondary Goals**:
  - All 11 webhook event types handled correctly
  - No duplicate subscription records
  - Error messages logged for failed webhooks
  - Manual sync works as fallback
  - Dashboard correctly reflects subscription status

## Known Limitations

1. Migration is additive only - doesn't remove any existing data
2. Webhook signature validation remains the same
3. Customer auto-creation logic preserved from original implementation
4. Assumes DodoPayments sends `subscription.active` after `payment.succeeded`

## Support Resources

- Vercel Logs: https://vercel.com/dashboard/logs
- Supabase Dashboard: https://supabase.com/dashboard
- DodoPayments Dashboard: https://dodopayments.com/dashboard
- Webhook Event Reference: See `app/api/webhooks/dodopayments/route.ts` lines 123-183

