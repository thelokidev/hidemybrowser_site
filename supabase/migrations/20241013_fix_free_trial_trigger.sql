-- Fix free_trials trigger issue
-- The trigger references a table that doesn't exist or was removed
-- This migration ensures cleanup of all free_trials references

-- Drop the trigger that references free_trials
DROP TRIGGER IF EXISTS trigger_deactivate_trial_on_active_subscription ON public.subscriptions;

-- Drop the function that updates free_trials
DROP FUNCTION IF EXISTS deactivate_trial_on_subscription();

-- Recreate get_user_access_status without free_trials dependency
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
  
  -- If no result (user doesn't exist), return default
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 'none'::TEXT, NULL::TEXT, NULL::TIMESTAMP WITH TIME ZONE, 
                        NULL::TEXT, false, NULL::TIMESTAMP WITH TIME ZONE, 0;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop indexes related to free_trials if they exist
DROP INDEX IF EXISTS idx_free_trials_user_active;
DROP INDEX IF EXISTS idx_free_trials_expires_user;

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_user_access_status TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_access_status TO anon;

-- Add comment
COMMENT ON FUNCTION get_user_access_status IS 'Returns unified access status - subscriptions only (no free trials)';

