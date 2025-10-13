# Fix Subscription Sync - Quick Start Guide

## 🎯 What Was Found

**3 Critical Issues Blocking Subscriptions:**

1. ❌ **API returns `items` not `data`** - Code was checking wrong field
2. ❌ **Wrong field names** - DodoPayments uses `subscription_id`, `next_billing_date`, etc.
3. ❌ **Database trigger error** - Trigger tries to update deleted `free_trials` table

## 🚀 Fix It Now (3 Steps)

### Step 1: Fix Database (CRITICAL)

1. Open [Supabase Dashboard](https://app.supabase.com)
2. Go to **SQL Editor**
3. Copy and paste this SQL:

```sql
-- Drop the broken trigger
DROP TRIGGER IF EXISTS trigger_deactivate_trial_on_active_subscription ON public.subscriptions;
DROP FUNCTION IF EXISTS deactivate_trial_on_subscription();

-- Drop indexes
DROP INDEX IF EXISTS idx_free_trials_user_active;
DROP INDEX IF EXISTS idx_free_trials_expires_user;

-- Recreate access function without free_trials
CREATE OR REPLACE FUNCTION get_user_access_status(user_uuid UUID)
RETURNS TABLE (
  has_access BOOLEAN,
  access_type TEXT,
  subscription_status TEXT,
  subscription_expires_at TIMESTAMP WITH TIME ZONE,
  subscription_product_id TEXT,
  trial_is_active BOOLEAN,
  trial_expires_at TIMESTAMP WITH TIME ZONE,
  trial_minutes_remaining INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    CASE 
      WHEN s.status IN ('active', 'trialing', 'renewed') THEN true
      ELSE false
    END as has_access,
    CASE 
      WHEN s.status IN ('active', 'trialing', 'renewed') THEN 'subscription'
      ELSE 'none'
    END as access_type,
    s.status as subscription_status,
    s.current_period_end as subscription_expires_at,
    s.dodo_product_id as subscription_product_id,
    false as trial_is_active,
    NULL::TIMESTAMP WITH TIME ZONE as trial_expires_at,
    0 as trial_minutes_remaining
  FROM auth.users u
  LEFT JOIN public.subscriptions s ON s.user_id = u.id AND s.status IN ('active', 'trialing', 'renewed')
  WHERE u.id = user_uuid
  ORDER BY s.created_at DESC
  LIMIT 1;
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 'none'::TEXT, NULL::TEXT, NULL::TIMESTAMP WITH TIME ZONE, 
                        NULL::TEXT, false, NULL::TIMESTAMP WITH TIME ZONE, 0;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION get_user_access_status TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_access_status TO anon;

SELECT 'Database fixed!' as status;
```

4. Click **RUN**
5. Should see: "Database fixed!"

### Step 2: Sync Sasi Kumar's Subscription

```bash
npx tsx scripts/sync-subscription-by-customer.ts sasikumarkudimi@gmail.com
```

**Expected output**:
- ✅ Found customer
- ✅ Found 1 subscription
- ✅ Subscription synced successfully

**If it fails**: Make sure you ran Step 1 first!

### Step 3: Deploy to Production

```bash
git add .
git commit -m "Fix: Subscription sync - API parsing, field mapping, database trigger"
git push origin main
```

Vercel will auto-deploy (or use `vercel --prod`)

## ✅ Verify It Works

1. **Check Dashboard**: Have Sasi Kumar log into `/dashboard`
   - Should see: Active subscription
   - Should NOT see: "NO SUBSCRIPTION"

2. **Test New Payment**: Have another user make a test payment
   - Should sync automatically
   - Check Vercel logs for detailed webhook processing

3. **Monitor Webhooks**: 
   - Go to `/api/admin/webhook-debug`
   - Should see successful subscription events

## 📊 What Was Fixed

### Code Changes
- ✅ `app/api/webhooks/dodopayments/route.ts` - Fixed API parsing and field mapping
- ✅ `scripts/sync-subscription-by-customer.ts` - Fixed manual sync tool
- ✅ Enhanced logging throughout

### Database Changes
- ✅ Removed broken `free_trials` trigger
- ✅ Fixed `get_user_access_status()` function
- ✅ Cleaned up orphaned indexes

### Tools Added
- ✅ Manual sync script for recovery
- ✅ Admin debug endpoint for monitoring
- ✅ Environment setup helpers

## 🆘 If Something Goes Wrong

### "Database migration failed"
- Check if you have admin access in Supabase
- Try running each DROP statement separately

### "Manual sync still fails"
- Verify Step 1 (database fix) was applied
- Check `.env.local` exists with correct keys
- Run with `--verbose` for more details

### "Still showing NO SUBSCRIPTION"
- Hard refresh browser (Ctrl+Shift+R)
- Check Supabase subscriptions table directly
- Look at `use-access-status` hook logs in browser console

## 📝 Files to Review

- `ROOT-CAUSE-ANALYSIS.md` - Detailed technical analysis
- `WEBHOOK-FIX-SUMMARY.md` - Implementation details
- `scripts/apply-fix-free-trial-trigger.sql` - Database migration SQL

---

**Critical Path**: Database Fix → Manual Sync → Deploy → Verify

**Time to Fix**: ~5 minutes

**Status**: All code ready, just needs database migration and deployment

