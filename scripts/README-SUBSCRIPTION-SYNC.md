# Manual Subscription Sync Script

This script manually syncs subscriptions from DodoPayments to your Supabase database when webhook sync fails.

## Prerequisites

Create a `.env.local` file in the project root with the following variables:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# DodoPayments
DODO_PAYMENTS_API_KEY=your_dodo_payments_api_key
```

You can get these values from:
- **Supabase**: Project Settings > API
- **DodoPayments**: Settings > API Keys

## Usage

Run the script with a customer email:

```bash
npx tsx scripts/sync-subscription-by-customer.ts <customer_email>
```

### Example

To sync Sasi Kumar's subscription:

```bash
npx tsx scripts/sync-subscription-by-customer.ts sasikumarkudimi@gmail.com
```

## What It Does

1. Looks up the customer in your Supabase database by email
2. Fetches all subscriptions for that customer from DodoPayments API
3. Logs the complete subscription data structure for debugging
4. Syncs each subscription to your Supabase `subscriptions` table
5. Verifies the sync was successful

## Expected Output

The script will show detailed logging:
- ✅ Customer lookup results
- 📦 Raw API response from DodoPayments
- 📝 Data being upserted to database
- ✅ Verification of synced subscriptions

## Troubleshooting

### Error: "Customer not found in database"
- Verify the email address is correct
- Check that the customer exists in your Supabase `customers` table

### Error: "No subscriptions found in DodoPayments"
- Verify the subscription exists in DodoPayments dashboard
- Check that the customer's `dodo_customer_id` is correct

### Error: "Database upsert failed"
- Check the error details for constraint violations
- Verify the `subscriptions` table schema matches the expected structure

## After Running

Once the script completes successfully:
1. The user should see their subscription in the dashboard
2. Check `/dashboard` to verify subscription status
3. Monitor future webhooks to ensure they work correctly

