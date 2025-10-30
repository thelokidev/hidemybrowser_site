# Dodo Payments Troubleshooting Guide

## Error: "Product does not exist"

### Error Message
```
Dodo Payments Checkout Session API Error: {
  message: '422 Product pdt_v0slst9k4JI0Q2qUDkIAW does not exist',
  payload: { ... },
  config: { environment: 'test_mode', hasBearerToken: true }
}
```

## Root Causes & Solutions

### 1. Environment Mismatch (Most Common)

**Problem:** You're using test mode product IDs with live mode API keys (or vice versa).

**Solution:**
1. Check your current environment in Vercel:
   - Go to your Vercel project → Settings → Environment Variables
   - Verify `DODO_PAYMENTS_ENVIRONMENT` is set to either `test_mode` or `live_mode`

2. Verify your API key matches the environment:
   - Test mode API keys typically start with `dp_test_`
   - Live mode API keys typically start with `dp_live_`

3. Check if product IDs match your environment:
   - In Dodo Payments dashboard, check **Products** section
   - Make sure the product ID `pdt_v0slst9k4JI0Q2qUDkIAW` exists in the environment you're using
   - Test mode products and live mode products have different IDs

**Action Items:**
- [ ] Verify environment variable in Vercel
- [ ] Verify API key prefix matches environment
- [ ] Check product ID exists in correct environment dashboard

### 2. Product Not Created in Dashboard

**Problem:** The product ID doesn't exist in your Dodo Payments dashboard at all.

**Solution:**
1. Go to [Dodo Payments Dashboard](https://app.dodopayments.com)
2. Navigate to **Products** section
3. Create the product if it doesn't exist, or find the correct product ID
4. Update the product IDs in your code:

**Files to Update:**
- `app/pricing/page.tsx` - lines 28, 40, 52, 64
- `components/pricing.tsx` - lines 13-16
- `lib/dodopayments/checkout.ts` - lines 54-58

**Action Items:**
- [ ] Check Dodo Payments dashboard for products
- [ ] Create missing products if needed
- [ ] Update product IDs in code to match dashboard

### 3. Vercel Cache Issue

**Problem:** Vercel hasn't picked up the new environment variables yet.

**Solution:**
1. **Force redeploy:**
   ```bash
   vercel --prod
   ```
   
2. Or in Vercel dashboard:
   - Go to Deployments
   - Click "..." on the latest deployment
   - Select "Redeploy"

3. **Clear build cache** (if needed):
   - Project Settings → General → Clear build cache and redeploy

**Action Items:**
- [ ] Redeploy application
- [ ] Verify new environment variables are loaded

### 4. Incorrect API Key Permissions

**Problem:** The API key doesn't have permission to access products.

**Solution:**
1. Go to Dodo Payments dashboard
2. Settings → API Keys
3. Check if the API key has the right permissions
4. Create a new API key if needed
5. Update environment variable in Vercel

**Action Items:**
- [ ] Check API key permissions
- [ ] Create new API key if needed
- [ ] Update `DODO_PAYMENTS_API_KEY` in Vercel

## How to Verify Configuration

### Step 1: Check Vercel Environment Variables
```
DODO_PAYMENTS_API_KEY=dp_test_xxxxxxxxxxxxx
DODO_PAYMENTS_ENVIRONMENT=test_mode
```

### Step 2: Check Product IDs Match Dashboard
In Dodo Payments dashboard, navigate to Products and verify these IDs exist:
- `pdt_v0slst9k4JI0Q2qUDkIAW` (Weekly)
- `pdt_ugqyKXMT219386BcoejVN` (Monthly)
- `pdt_W4YuF093U2MSpABbJ7miA` (3 Months)
- `pdt_Ah7DRDitJbvGcaFMrqrOf` (6 Months)

### Step 3: Test After Deployment
After redeploying, check Vercel logs for:
```
[Checkout] Configuration: {
  hasApiKey: true,
  apiKeyPrefix: 'dp_test_...',
  environment: 'test_mode'
}
```

## Recommended Next Steps

1. **Check Dodo Payments Dashboard** - Verify products exist and match the environment
2. **Verify Vercel Environment Variables** - Ensure they're set correctly
3. **Redeploy Application** - Force Vercel to pick up new variables
4. **Check Logs** - Look for the new configuration log message
5. **Test Checkout Flow** - Try creating a checkout session again

## Quick Fix Command

If you've updated environment variables in Vercel:
```bash
# Pull environment variables locally to verify
vercel env pull .env.local

# Check the values
cat .env.local | grep DODO

# Redeploy
vercel --prod
```

## Contact Support

If none of the above solutions work:
1. Check Dodo Payments documentation: https://docs.dodopayments.com
2. Contact Dodo Payments support with:
   - Your API key prefix (first 10 characters)
   - Environment mode (test_mode/live_mode)
   - Product ID causing the issue
   - Error logs from Vercel

