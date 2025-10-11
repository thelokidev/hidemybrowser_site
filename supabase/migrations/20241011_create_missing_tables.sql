-- Create missing tables for DodoPayments integration
-- This ensures webhook events can be logged and processed

-- ============================================
-- 1. Create customers table (if not exists)
-- ============================================
CREATE TABLE IF NOT EXISTS public.customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT,
  dodo_customer_id TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for customers
CREATE INDEX IF NOT EXISTS idx_customers_user_id ON public.customers(user_id);
CREATE INDEX IF NOT EXISTS idx_customers_email ON public.customers(email);
CREATE INDEX IF NOT EXISTS idx_customers_dodo_customer_id ON public.customers(dodo_customer_id);

-- ============================================
-- 2. Create subscriptions table (if not exists)
-- ============================================
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  dodo_customer_id TEXT,
  dodo_subscription_id TEXT UNIQUE NOT NULL,
  dodo_product_id TEXT,
  dodo_price_id TEXT,
  status TEXT NOT NULL,
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  canceled_at TIMESTAMPTZ,
  trial_start TIMESTAMPTZ,
  trial_end TIMESTAMPTZ,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for subscriptions
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_dodo_subscription_id ON public.subscriptions(dodo_subscription_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON public.subscriptions(status);

-- ============================================
-- 3. Create payments table (if not exists)
-- ============================================
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  dodo_payment_id TEXT UNIQUE NOT NULL,
  dodo_checkout_session_id TEXT,
  amount NUMERIC(10,2),
  currency TEXT DEFAULT 'USD',
  status TEXT NOT NULL,
  payment_method TEXT,
  description TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for payments
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON public.payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_dodo_payment_id ON public.payments(dodo_payment_id);

-- ============================================
-- 4. Create webhook events table (if not exists)
-- ============================================
CREATE TABLE IF NOT EXISTS public.dodo_webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id TEXT UNIQUE NOT NULL,
  event_type TEXT NOT NULL,
  data JSONB NOT NULL,
  processed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for webhook events
CREATE INDEX IF NOT EXISTS idx_webhook_events_event_id ON public.dodo_webhook_events(event_id);
CREATE INDEX IF NOT EXISTS idx_webhook_events_processed ON public.dodo_webhook_events(processed);
CREATE INDEX IF NOT EXISTS idx_webhook_events_created_at ON public.dodo_webhook_events(created_at);

-- ============================================
-- 5. Enable RLS on all tables
-- ============================================
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dodo_webhook_events ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 6. Create RLS Policies
-- ============================================

-- Customers: Users can read their own customer record
DROP POLICY IF EXISTS "Users can view own customer record" ON public.customers;
CREATE POLICY "Users can view own customer record" ON public.customers
  FOR SELECT USING (auth.uid() = user_id);

-- Subscriptions: Users can read their own subscriptions
DROP POLICY IF EXISTS "Users can view own subscriptions" ON public.subscriptions;
CREATE POLICY "Users can view own subscriptions" ON public.subscriptions
  FOR SELECT USING (auth.uid() = user_id);

-- Payments: Users can read their own payments
DROP POLICY IF EXISTS "Users can view own payments" ON public.payments;
CREATE POLICY "Users can view own payments" ON public.payments
  FOR SELECT USING (auth.uid() = user_id);

-- Webhook events: No direct user access (admin only via service role)

-- ============================================
-- 7. Create customer record for existing user
-- ============================================
-- Backfill: Create customer records for all existing users
INSERT INTO public.customers (user_id, email, name, created_at, updated_at)
SELECT 
  u.id,
  u.email,
  COALESCE(u.raw_user_meta_data->>'full_name', u.raw_user_meta_data->>'name'),
  u.created_at,
  NOW()
FROM auth.users u
LEFT JOIN public.customers c ON c.user_id = u.id
WHERE c.id IS NULL
ON CONFLICT (user_id) DO NOTHING;

-- ============================================
-- 8. Create trigger to auto-create customer on user signup
-- ============================================
CREATE OR REPLACE FUNCTION create_customer_for_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.customers (user_id, email, name, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
    NOW(),
    NOW()
  )
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_create_customer_on_signup ON auth.users;
CREATE TRIGGER trigger_create_customer_on_signup
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION create_customer_for_new_user();

-- ============================================
-- 9. Grant necessary permissions
-- ============================================
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON public.customers TO postgres, service_role;
GRANT ALL ON public.subscriptions TO postgres, service_role;
GRANT ALL ON public.payments TO postgres, service_role;
GRANT ALL ON public.dodo_webhook_events TO postgres, service_role;
GRANT SELECT ON public.customers TO authenticated;
GRANT SELECT ON public.subscriptions TO authenticated;
GRANT SELECT ON public.payments TO authenticated;

-- ============================================
COMMENT ON TABLE public.customers IS 'Customer records linked to auth users for payment processing';
COMMENT ON TABLE public.subscriptions IS 'Active and historical subscription records from DodoPayments';
COMMENT ON TABLE public.payments IS 'Payment transaction records from DodoPayments';
COMMENT ON TABLE public.dodo_webhook_events IS 'Log of all webhook events received from DodoPayments';

