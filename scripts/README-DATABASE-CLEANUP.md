# Database Cleanup Instructions

## ⚠️ WARNING: DESTRUCTIVE OPERATION

This script will **permanently delete ALL data** from your Supabase database, including:
- All user accounts (auth.users)
- All customers
- All subscriptions
- All invoices
- All payments
- All webhook events

**This operation is IRREVERSIBLE. Make sure you have a backup if needed.**

## How to Execute

### Option 1: Supabase SQL Editor (Recommended)

1. Open your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Click **New Query**
4. Copy the contents of `complete-database-cleanup.sql`
5. Paste into the SQL Editor
6. Review the script carefully
7. Click **Run** to execute

### Option 2: Using Supabase CLI

```bash
supabase db execute -f scripts/complete-database-cleanup.sql
```

## After Cleanup

After running the cleanup:
1. Database will be completely empty
2. You can create a new account and test the subscription flow from scratch
3. All previous test data and users will be gone
4. Fresh start for implementing the new subscription tier management system

## Verification

To verify the cleanup was successful, run:

```sql
SELECT COUNT(*) as user_count FROM auth.users;
SELECT COUNT(*) as customer_count FROM public.customers;
SELECT COUNT(*) as subscription_count FROM public.subscriptions;
```

All counts should return `0`.

