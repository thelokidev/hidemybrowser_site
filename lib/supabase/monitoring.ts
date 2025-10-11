import { createAdminClient } from './admin'

/**
 * Get unprocessed webhook events
 * Useful for debugging webhook processing issues
 */
export async function getUnprocessedWebhooks() {
  const supabase = createAdminClient()
  
  const { data, error } = await supabase
    .from('dodo_webhook_events')
    .select('*')
    .eq('processed', false)
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) {
    console.error('[Monitoring] Error fetching unprocessed webhooks:', error)
    return []
  }

  return data || []
}

/**
 * Get overall subscription sync health metrics
 */
export async function getSubscriptionSyncHealth() {
  const supabase = createAdminClient()
  
  try {
    // Get counts
    const { count: totalCustomers } = await supabase
      .from('customers')
      .select('*', { count: 'exact', head: true })

    const { count: activeSubscriptions } = await supabase
      .from('subscriptions')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active')

    const { count: unprocessedWebhooks } = await supabase
      .from('dodo_webhook_events')
      .select('*', { count: 'exact', head: true })
      .eq('processed', false)

    return {
      totalCustomers: totalCustomers || 0,
      activeSubscriptions: activeSubscriptions || 0,
      unprocessedWebhooks: unprocessedWebhooks || 0,
      healthy: (unprocessedWebhooks || 0) === 0
    }
  } catch (error) {
    console.error('[Monitoring] Error getting sync health:', error)
    return {
      totalCustomers: 0,
      activeSubscriptions: 0,
      unprocessedWebhooks: 0,
      healthy: false
    }
  }
}

/**
 * Get recent webhook events for debugging
 */
export async function getRecentWebhookEvents(limit: number = 20) {
  const supabase = createAdminClient()
  
  const { data, error } = await supabase
    .from('dodo_webhook_events')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('[Monitoring] Error fetching recent webhooks:', error)
    return []
  }

  return data || []
}

