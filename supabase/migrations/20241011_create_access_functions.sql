-- Create function to check user subscription status
-- This replaces the old get_user_access_status that included free trials

CREATE OR REPLACE FUNCTION public.get_user_subscription_access(user_uuid UUID)
RETURNS TABLE (
  has_access BOOLEAN,
  access_type TEXT,
  subscription_status TEXT,
  subscription_expires_at TIMESTAMP WITH TIME ZONE,
  subscription_product_id TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    CASE 
      WHEN s.status = 'active' THEN true
      ELSE false
    END as has_access,
    CASE 
      WHEN s.status = 'active' THEN 'subscription'::TEXT
      ELSE 'none'::TEXT
    END as access_type,
    s.status as subscription_status,
    s.current_period_end as subscription_expires_at,
    s.dodo_product_id as subscription_product_id
  FROM public.subscriptions s
  WHERE s.user_id = user_uuid
    AND s.status IN ('active', 'trialing')
  ORDER BY s.created_at DESC
  LIMIT 1;
  
  -- If no subscription found, return default values
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 'none'::TEXT, NULL::TEXT, NULL::TIMESTAMP WITH TIME ZONE, NULL::TEXT;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.get_user_subscription_access TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_subscription_access TO anon;

-- Add comment
COMMENT ON FUNCTION public.get_user_subscription_access IS 'Get user subscription access status (replaces get_user_access_status)';

