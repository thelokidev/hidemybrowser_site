import { createAdminClient } from './admin'
import * as AccessCache from '@/lib/cache/subscription-cache'

export interface ServerAccessStatus {
  hasAccess: boolean
  accessType: 'subscription' | 'trial' | 'none'
  subscriptionStatus?: string
  subscriptionExpiresAt?: string
  subscriptionProductId?: string
  trialIsActive?: boolean
  trialExpiresAt?: string
  trialMinutesRemaining?: number
}

/**
 * Server-side access control
 * Get user's access status using the unified database function
 */
export async function getUserAccessStatus(userId: string): Promise<ServerAccessStatus> {
  const supabase = createAdminClient()
  
  try {
    // Check cache first
    const cached = AccessCache.get(userId)
    if (cached) {
      return {
        hasAccess: cached.hasAccess,
        accessType: cached.accessType,
        subscriptionStatus: cached.subscriptionStatus,
        subscriptionExpiresAt: cached.subscriptionExpiresAt,
        subscriptionProductId: cached.subscriptionProductId,
        trialIsActive: cached.trialIsActive,
        trialExpiresAt: cached.trialExpiresAt,
        trialMinutesRemaining: cached.trialMinutesRemaining,
      }
    }

    const { data, error } = await (supabase as any).rpc('get_user_access_status', {
      user_uuid: userId,
    })

    if (error) {
      console.error('[ServerAccessControl] Error getting access status:', error)
      return { hasAccess: false, accessType: 'none' }
    }

    const result = (data as any)?.[0]
    
    if (!result) {
      return { hasAccess: false, accessType: 'none' }
    }

    const status: ServerAccessStatus = {
      hasAccess: result.has_access ?? false,
      accessType: result.access_type ?? 'none',
      subscriptionStatus: result.subscription_status,
      subscriptionExpiresAt: result.subscription_expires_at,
      subscriptionProductId: result.subscription_product_id,
      trialIsActive: result.trial_is_active,
      trialExpiresAt: result.trial_expires_at,
      trialMinutesRemaining: result.trial_minutes_remaining
    }

    // Save to cache
    AccessCache.set(userId, status)
    return status
  } catch (error) {
    console.error('[ServerAccessControl] Exception:', error)
    return { hasAccess: false, accessType: 'none' }
  }
}

export function invalidateUserAccessCache(userId: string) {
  AccessCache.invalidate(userId)
}

/**
 * Require active access or throw error
 * Useful for API routes that need access control
 */
export async function requireActiveAccess(userId: string): Promise<ServerAccessStatus> {
  const status = await getUserAccessStatus(userId)
  
  if (!status.hasAccess) {
    throw new Error('Active subscription or trial required')
  }
  
  return status
}

