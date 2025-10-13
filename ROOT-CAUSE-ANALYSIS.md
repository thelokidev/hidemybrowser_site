# Root Cause Analysis - Subscription Sync Failure

## Executive Summary

**Problem**: Users can complete payments successfully, but their subscriptions don't appear in the database, resulting in "NO SUBSCRIPTION" status despite having active paid subscriptions in DodoPayments.

**Root Causes Identified**: 
1. ❌ DodoPayments API returns subscriptions in `response.items`, NOT `response.data`
2. ❌ DodoPayments uses different field names than expected (`subscription_id` vs `id`, `next_billing_date` vs `current_period_end`)
3. ❌ Database trigger references non-existent `free_trials` table, blocking all subscription inserts

## Detailed Analysis

### Issue #1: Incorrect API Response Structure

**Code Location**: `app/api/webhooks/dodopayments/route.ts` (line 532)

**Problem**:
```typescript
const subscriptions = response.data || [];  // ❌ WRONG
```

**Actual API Response**:
```json
{
  "options": {...},
  "response": {},
  "body": {
    "items": [...]  // ← Subscriptions are HERE
  },
  "items": [...]    // ← Also available here
}
```

**Fix**:
```typescript
const subscriptions = response.items || response.data || [];  // ✅ CORRECT
```

**Impact**: The fallback subscription fetch in payment handler returned 0 subscriptions every time, even though subscriptions existed.

---

### Issue #2: Field Name Mismatches

**Problem**: DodoPayments API uses different field names than the code expected

| Expected Field | Actual DodoPayments Field |
|---|---|
| `id` | `subscription_id` |
| `current_period_end` | `next_billing_date` |
| `current_period_start` | `previous_billing_date` |
| `price_id` | Often `null` or missing |
| `customer.id` | `customer.customer_id` |
| `cancel_at_period_end` | `cancel_at_next_billing_date` |

**Example from API**:
```json
{
  "subscription_id": "sub_bJ5fNl1sciVggO9Lc2s3c",  // NOT "id"
  "next_billing_date": "2025-10-20T19:09:33Z",   // NOT "current_period_end"
  "previous_billing_date": "2025-10-13T19:08:51Z", // NOT "current_period_start"
  "cancel_at_next_billing_date": false,            // NOT "cancel_at_period_end"
  "customer": {
    "customer_id": "cus_pvj6fDkW7AGfdLi3suqDL"    // NOT "id"
  }
}
```

**Fix**: Updated field mappings to check both variations:
```typescript
const subscriptionId = subscription.subscription_id || subscription.id
const customerId = subscription.customer?.customer_id || subscription.customer?.id
const periodEnd = subscription.current_period_end || subscription.next_billing_date
```

**Impact**: Even when webhooks fired, field extraction failed silently, preventing database sync.

---

### Issue #3: Database Trigger Error

**Code Location**: Database trigger on `subscriptions` table

**Problem**:
```sql
-- Trigger created by migration: 20241011_comprehensive_sync_fix.sql
CREATE TRIGGER trigger_deactivate_trial_on_active_subscription
AFTER INSERT OR UPDATE OF status ON public.subscriptions
FOR EACH ROW
EXECUTE FUNCTION deactivate_trial_on_subscription();

-- Function tries to update non-existent table
CREATE OR REPLACE FUNCTION deactivate_trial_on_subscription()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE free_trials  -- ❌ Table doesn't exist!
  SET is_active = false
  WHERE user_id = NEW.user_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

**Error**:
```
relation "free_trials" does not exist
Code: 42P01
```

**Impact**: **EVERY subscription insert/update was failing** because the trigger tried to update a table that was removed by a later migration.

**Fix**: Created migration to drop the trigger and function:
```sql
-- File: supabase/migrations/20241013_fix_free_trial_trigger.sql
DROP TRIGGER IF EXISTS trigger_deactivate_trial_on_active_subscription ON public.subscriptions;
DROP FUNCTION IF EXISTS deactivate_trial_on_subscription();
```

---

## Timeline of Events

1. **User completes payment** → Payment succeeds in DodoPayments ✅
2. **`payment.succeeded` webhook fires** → Payment recorded in database ✅
3. **Fallback subscription fetch** → Returns 0 results (wrong field: `response.data`) ❌
4. **`subscription.active` webhook fires** → Event received ✅
5. **Subscription extraction** → Fields extracted incorrectly (`subscription.id` instead of `subscription.subscription_id`) ⚠️
6. **Database upsert attempt** → Trigger fires and fails on `free_trials` table ❌
7. **Error suppressed** → No detailed logging, silent failure ❌
8. **User sees** → "NO SUBSCRIPTION" despite active paid subscription ❌

---

## Fixes Implemented

### 1. Fixed API Response Parsing ✅
**Files**:
- `app/api/webhooks/dodopayments/route.ts`
- `scripts/sync-subscription-by-customer.ts`

**Changes**:
- Check `response.items` before `response.data`
- Added detailed API response logging

### 2. Fixed Field Name Mappings ✅
**Files**:
- `app/api/webhooks/dodopayments/route.ts` (handleSubscriptionEvent)
- `scripts/sync-subscription-by-customer.ts`

**Changes**:
- Updated to check `subscription_id` first
- Map `next_billing_date` to `current_period_end`
- Map `previous_billing_date` to `current_period_start`
- Handle `customer.customer_id` correctly
- Set `price_id` to `null` if missing (allowed by schema)

### 3. Removed Problematic Trigger ✅
**Files**:
- `supabase/migrations/20241013_fix_free_trial_trigger.sql`
- `scripts/apply-fix-free-trial-trigger.sql`

**Changes**:
- Dropped trigger that references `free_trials`
- Dropped function `deactivate_trial_on_subscription()`
- Recreated `get_user_access_status()` without `free_trials` dependency

### 4. Enhanced Logging ✅
**Files**:
- `app/api/webhooks/dodopayments/route.ts`

**Changes**:
- Log complete event payload
- Log subscription object structure
- Log extracted fields before upsert
- Capture and log full database error details
- Added `.select()` to verify upsert success

### 5. Created Recovery Tools ✅
**Files**:
- `scripts/sync-subscription-by-customer.ts` - Manual sync tool
- `app/api/admin/webhook-debug/route.ts` - Webhook monitoring
- `setup-env.ps1` - Environment setup helper

---

## Action Items

### Immediate (User Must Do)

1. **Apply Database Migration**:
   ```sql
   -- Run in Supabase Dashboard > SQL Editor
   -- Copy from: scripts/apply-fix-free-trial-trigger.sql
   ```

2. **Run Manual Sync** (after migration):
   ```bash
   npx tsx scripts/sync-subscription-by-customer.ts sasikumarkudimi@gmail.com
   ```

3. **Deploy to Vercel**:
   ```bash
   git add .
   git commit -m "Fix: Subscription sync - API fields, trigger, logging"
   git push origin main
   ```

### Verification

1. Check Sasi Kumar's subscription appears in dashboard
2. Monitor logs for next webhook event
3. Verify detailed logging shows correct field extraction
4. Test with a new payment to confirm fix

---

## Expected Outcome

After applying all fixes:

✅ **Subscriptions will sync correctly** from DodoPayments to database
✅ **Webhook events will process without errors**
✅ **Users will see their subscriptions** immediately after payment
✅ **Failed events can be debugged** with detailed logs
✅ **Manual recovery is available** for affected customers

---

**Date**: October 13, 2025  
**Status**: Root cause identified, fixes implemented, awaiting database migration  
**Critical Path**: Apply database migration → Run manual sync → Deploy to production

