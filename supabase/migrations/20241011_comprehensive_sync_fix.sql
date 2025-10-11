-- Comprehensive subscription sync fix
-- This migration creates database-level enforcement for free trial deactivation
-- and provides a unified access status function

-- 1. Auto-deactivate free trial when subscription becomes active (DATABASE TRIGGER)
CREATE OR REPLACE FUNCTION deactivate_trial_on_subscription()
RETURNS TRIGGER AS $$
BEGIN
  -- When a subscription becomes active, deactivate the user's free trial
  IF NEW.status = 'active' AND (OLD.status IS NULL OR OLD.status != 'active') THEN
    UPDATE free_trials
    SET is_active = false, updated_at = NOW()
    WHERE user_id = NEW.user_id AND is_active = true;
    
    -- Log the action
    RAISE NOTICE 'Free trial deactivated for user % due to active subscription', NEW.user_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS trigger_deactivate_trial_on_active_subscription ON public.subscriptions;

CREATE TRIGGER trigger_deactivate_trial_on_active_subscription
AFTER INSERT OR UPDATE OF status ON public.subscriptions
FOR EACH ROW
EXECUTE FUNCTION deactivate_trial_on_subscription();

-- 2. Unified access status function
-- This function returns a single source of truth for user access
-- Priority: Active subscription > Active trial > No access
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
      WHEN s.status = 'active' THEN true
      WHEN ft.is_active = true AND ft.expires_at > NOW() THEN true
      ELSE false
    END as has_access,
    CASE 
      WHEN s.status = 'active' THEN 'subscription'
      WHEN ft.is_active = true AND ft.expires_at > NOW() THEN 'trial'
      ELSE 'none'
    END as access_type,
    s.status as subscription_status,
    s.current_period_end as subscription_expires_at,
    s.dodo_product_id as subscription_product_id,
    COALESCE(ft.is_active, false) as trial_is_active,
    ft.expires_at as trial_expires_at,
    CASE 
      WHEN ft.expires_at > NOW() THEN EXTRACT(EPOCH FROM (ft.expires_at - NOW()))::INTEGER / 60
      ELSE 0
    END as trial_minutes_remaining
  FROM auth.users u
  LEFT JOIN public.subscriptions s ON s.user_id = u.id AND s.status = 'active'
  LEFT JOIN public.free_trials ft ON ft.user_id = u.id
  WHERE u.id = user_uuid
  LIMIT 1;
  
  -- If no result (user doesn't exist), return default
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 'none'::TEXT, NULL::TEXT, NULL::TIMESTAMP WITH TIME ZONE, 
                        NULL::TEXT, false, NULL::TIMESTAMP WITH TIME ZONE, 0;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Performance indexes
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_status ON public.subscriptions(user_id, status);
CREATE INDEX IF NOT EXISTS idx_free_trials_user_active ON public.free_trials(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_free_trials_expires_user ON public.free_trials(user_id, expires_at);

-- 4. Grant permissions
GRANT EXECUTE ON FUNCTION get_user_access_status TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_access_status TO anon;

-- 5. Add helpful comments
COMMENT ON FUNCTION deactivate_trial_on_subscription IS 'Automatically deactivates free trial when user gets an active subscription';
COMMENT ON FUNCTION get_user_access_status IS 'Returns unified access status with subscription taking priority over trial';

