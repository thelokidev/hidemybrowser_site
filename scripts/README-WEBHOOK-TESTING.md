# Webhook Connectivity Testing Guide

## Purpose
This script tests if DodoPayments webhooks can successfully reach your application endpoint and be processed correctly.

## Prerequisites

1. **Install tsx** (if not already installed):
   ```bash
   npm install -D tsx
   ```

2. **Get your webhook secret** from DodoPayments dashboard:
   - Go to DodoPayments → Webhooks
   - Copy the webhook secret (starts with `whsec_`)

## Usage

### Option 1: Using environment variable

```bash
# Set the webhook secret
export DODO_WEBHOOK_SECRET=whsec_your_secret_here

# Run the test
npx tsx scripts/test-webhook-connectivity.ts
```

### Option 2: Using .env.local

Add to your `.env.local`:
```env
DODO_WEBHOOK_SECRET=whsec_your_secret_here
WEBHOOK_URL=https://www.hidemybrowser.com/api/webhooks/dodopayments
```

Then run:
```bash
npx tsx scripts/test-webhook-connectivity.ts
```

### Option 3: Inline

```bash
DODO_WEBHOOK_SECRET=whsec_xxx npx tsx scripts/test-webhook-connectivity.ts
```

## What It Tests

The script sends two test webhooks:

1. **subscription.active** - Tests subscription creation flow
2. **payment.succeeded** - Tests payment recording flow

For each test, it:
- ✅ Generates proper Svix webhook signature
- ✅ Sends request with correct headers
- ✅ Validates response status and body
- ✅ Provides troubleshooting guidance

## Expected Results

### ✅ Success (Status 200)
```
✅ SUCCESS: Webhook endpoint is reachable and responding!

Next steps:
  1. Check Vercel logs to verify webhook was processed
  2. Verify event was logged in dodo_webhook_events table
  3. Check if test subscription was created
```

### ❌ Authentication Failed (Status 401)
```
❌ AUTHENTICATION FAILED: Invalid webhook signature

Possible causes:
  1. Webhook secret mismatch between script and server
  2. Check DODO_WEBHOOK_SECRET in Vercel environment
  3. Verify secret matches DodoPayments dashboard
```

**Fix:**
1. Go to Vercel → Project → Settings → Environment Variables
2. Verify `DODO_WEBHOOK_SECRET` matches DodoPayments
3. Redeploy if you changed the secret

### ⚠️ Bad Request (Status 400)
```
⚠️ BAD REQUEST: Webhook format issue

Possible causes:
  1. Missing required headers
  2. Invalid payload format
  3. Check error message for details
```

**Fix:**
- Check the response body for specific error message
- Verify webhook handler code is correct

### ❌ Server Error (Status 500)
```
❌ SERVER ERROR: Webhook endpoint is failing

Action needed:
  1. Check Vercel deployment logs for errors
  2. Verify database connection is working
  3. Check if any migrations are pending
```

**Fix:**
1. Go to Vercel → Deployments → Logs
2. Look for errors in the webhook handler
3. Check Supabase connection is working
4. Run any pending migrations

### 💥 Connection Failed
```
💥 CONNECTION FAILED

❌ Cannot reach webhook endpoint!

Possible causes:
  1. URL is incorrect
  2. Server is not running
  3. DNS resolution failed
  4. Firewall blocking connection
```

**Fix:**
- Verify the webhook URL is correct
- Check if site is deployed and accessible
- Try accessing the URL in a browser

## Troubleshooting Guide

### Issue: "DODO_WEBHOOK_SECRET not set"

**Solution:**
```bash
# Check if secret exists in .env.local
cat .env.local | grep DODO_WEBHOOK_SECRET

# If missing, add it
echo "DODO_WEBHOOK_SECRET=whsec_xxx" >> .env.local
```

### Issue: Signature verification fails

**Root Cause:** Mismatch between secrets

**Check:**
1. DodoPayments Dashboard → Webhooks → Secret
2. Vercel → Settings → Environment Variables → `DODO_WEBHOOK_SECRET`
3. Local `.env.local` → `DODO_WEBHOOK_SECRET`

All three MUST match exactly!

**Fix:**
```bash
# Update Vercel environment variable
vercel env add DODO_WEBHOOK_SECRET production

# Then redeploy
vercel --prod
```

### Issue: Test succeeds but real webhooks fail

**Possible causes:**
1. Webhook not configured in DodoPayments
2. Webhook URL is wrong in DodoPayments
3. Webhook events not selected in DodoPayments

**Fix:**
1. Go to DodoPayments Dashboard → Webhooks
2. Click "Create Webhook" or edit existing
3. Set URL: `https://www.hidemybrowser.com/api/webhooks/dodopayments`
4. Select ALL event types
5. Save and test

### Issue: Webhook reaches server but subscription not created

**Debug steps:**
1. Check Vercel logs for the webhook processing
2. Look for errors in `handleSubscriptionEvent` function
3. Query `dodo_webhook_events` table:
   ```sql
   SELECT * FROM dodo_webhook_events 
   WHERE event_type = 'subscription.active'
   ORDER BY created_at DESC LIMIT 5;
   ```
4. Check `error_message` column for failures

## After Testing

Once tests pass:

1. **Configure real webhook in DodoPayments:**
   - URL: `https://www.hidemybrowser.com/api/webhooks/dodopayments`
   - Secret: (copy from Vercel environment variables)
   - Events: Select ALL

2. **Test with real payment:**
   - Make a test payment
   - Check Vercel logs
   - Verify subscription appears in database

3. **For affected users:**
   - Have them click "Sync Subscription" on dashboard
   - Or use `/api/subscriptions/sync` endpoint

## Related Files

- Webhook handler: `app/api/webhooks/dodopayments/route.ts`
- Manual sync: `app/api/subscriptions/sync/route.ts`
- Diagnostic SQL: `SUBSCRIPTION_FLOW_DEBUG.sql`
- Manual fix SQL: `MANUAL_SUBSCRIPTION_FIX.sql`

## Support

If issues persist after following this guide:
1. Share Vercel logs
2. Share test script output
3. Share results from `SUBSCRIPTION_FLOW_DEBUG.sql`

