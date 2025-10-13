# Next Steps - Subscription Sync Fix

## ✅ What Has Been Implemented

1. **Enhanced webhook logging** - All webhook events now log complete payload structure
2. **Robust error handling** - Database errors are captured with full diagnostic details
3. **Improved fallback sync** - Payment handler has better subscription fetching with detailed logs
4. **Manual sync script** - Created tool to manually sync customer subscriptions
5. **Admin debug endpoint** - Added `/api/admin/webhook-debug` for monitoring webhooks
6. **Documentation** - Complete guides for troubleshooting and recovery

## 🎯 Immediate Actions Required

### 1. Set Up Local Environment (For Manual Sync)

You have two options:

#### Option A: Pull from Vercel (Recommended)
```bash
# Install Vercel CLI if not already installed
npm install -g vercel

# Login to Vercel
vercel login

# Pull environment variables
vercel env pull .env.local
```

#### Option B: Manual Setup
Create a file named `.env.local` in the project root with your environment variables.
See `scripts/setup-env.md` for detailed instructions.

### 2. Sync Sasi Kumar's Subscription

Once environment is set up, run:

```bash
npx tsx scripts/sync-subscription-by-customer.ts sasikumarkudimi@gmail.com
```

**Expected Output:**
- ✅ Customer found
- 📦 API response showing subscription data
- ✅ Subscription synced to database
- 🎉 Success message

### 3. Deploy Enhanced Webhook Handler

Deploy the updated code to Vercel:

```bash
# Commit changes
git add .
git commit -m "Fix: Enhanced webhook logging and subscription sync"

# Push to deploy (if auto-deploy is enabled)
git push origin main

# OR deploy directly with Vercel CLI
vercel --prod
```

### 4. Monitor Next Webhook Event

After deployment:
1. Go to Vercel Dashboard > Your Project > Logs
2. Wait for the next webhook event (or trigger a test payment)
3. Look for the detailed logs we added:
   - `[Webhook] Full event payload:`
   - `[Webhook] Subscription fields:`
   - `[Webhook] Upserting subscription with data:`
   - `[Webhook] Subscription synced successfully`

## 🔍 Debugging Tools Available

### 1. Webhook Debug Endpoint

View recent webhook events:
```
GET https://your-domain.com/api/admin/webhook-debug
GET https://your-domain.com/api/admin/webhook-debug?failed_only=true
GET https://your-domain.com/api/admin/webhook-debug?event_type=subscription.active
```

### 2. Vercel Logs

Monitor real-time logs:
1. Go to Vercel Dashboard
2. Select your project
3. Go to Deployments > Latest > Functions
4. Click on the webhook function to see logs

### 3. Supabase Database

Check webhook events table:
```sql
-- View recent webhook events
SELECT * FROM dodo_webhook_events 
ORDER BY created_at DESC 
LIMIT 10;

-- View failed events
SELECT * FROM dodo_webhook_events 
WHERE processed = false 
ORDER BY created_at DESC;

-- View subscriptions
SELECT * FROM subscriptions 
WHERE user_id = (
  SELECT user_id FROM customers 
  WHERE email = 'sasikumarkudimi@gmail.com'
);
```

## 📊 What to Look For

### Success Indicators
- ✅ Webhook logs show complete payload
- ✅ Database upsert returns data
- ✅ No error messages in logs
- ✅ User sees subscription in `/dashboard`

### Failure Indicators
- ❌ "Database upsert failed" in logs
- ❌ Missing required fields in subscription object
- ❌ Customer not found errors
- ❌ Empty subscription list from API

## 🐛 Common Issues & Solutions

### Issue: Script fails with "supabaseUrl is required"
**Solution**: Create `.env.local` file with environment variables (see step 1 above)

### Issue: "No subscriptions found in DodoPayments"
**Solutions**:
1. Verify customer_id is correct in database
2. Check DodoPayments dashboard directly
3. Look at the full API response in logs

### Issue: "Database upsert failed"
**Solutions**:
1. Check the error code and hint in logs
2. Verify table schema matches expected structure
3. Check for missing required fields

### Issue: Subscription exists in Dodo but not syncing
**Solution**:
1. Run manual sync script for affected customer
2. Check webhook debug endpoint for failed events
3. Review detailed logs in Vercel for the actual error

## 📝 Files Created/Modified

### New Files
- `scripts/sync-subscription-by-customer.ts` - Manual sync tool
- `app/api/admin/webhook-debug/route.ts` - Debug endpoint
- `scripts/README-SUBSCRIPTION-SYNC.md` - Sync script documentation
- `scripts/setup-env.md` - Environment setup guide
- `WEBHOOK-FIX-SUMMARY.md` - Implementation summary
- `NEXT-STEPS.md` - This file

### Modified Files
- `app/api/webhooks/dodopayments/route.ts` - Enhanced logging and error handling
- `package.json` - Added dotenv dependency

## 🎯 Success Criteria

The fix is successful when:

1. ✅ Manual sync script runs and syncs Sasi Kumar's subscription
2. ✅ User can see subscription in dashboard
3. ✅ Next webhook event processes without errors
4. ✅ Detailed logs show complete webhook processing flow
5. ✅ No more "NO SUBSCRIPTION" for paying customers

## 📞 Need Help?

If issues persist after following these steps:

1. **Check logs** - Look for the specific error message
2. **Run debug endpoint** - See what webhooks were received
3. **Manual sync** - Use the script to sync affected customers
4. **Share logs** - Copy the detailed error output for further diagnosis

---

**Status**: ✅ Implementation Complete - Ready for Testing
**Last Updated**: October 13, 2025

