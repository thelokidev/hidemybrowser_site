/**
 * Subscription Tier Management Utilities
 * 
 * Handles tier comparison, upgrade/downgrade detection,
 * and validation logic for subscription plan changes.
 */

/**
 * Product ID mapping for subscription tiers
 */
export const SUBSCRIPTION_TIERS = {
  WEEKLY: 'pdt_v0slst9k4JI0Q2qUDkIAW',
  MONTHLY: 'pdt_ugqyKXMT219386BcoejVN',
  THREE_MONTHS: 'pdt_W4YuF093U2MSpABbJ7miA',
  SIX_MONTHS: 'pdt_Ah7DRDitJbvGcaFMrqrOf',
} as const

/**
 * Tier levels for comparison (higher = better tier)
 */
const TIER_LEVELS: Record<string, number> = {
  [SUBSCRIPTION_TIERS.WEEKLY]: 1,
  [SUBSCRIPTION_TIERS.MONTHLY]: 2,
  [SUBSCRIPTION_TIERS.THREE_MONTHS]: 3,
  [SUBSCRIPTION_TIERS.SIX_MONTHS]: 4,
}

/**
 * Human-readable tier names
 */
export const TIER_NAMES: Record<string, string> = {
  [SUBSCRIPTION_TIERS.WEEKLY]: 'Weekly Plan',
  [SUBSCRIPTION_TIERS.MONTHLY]: 'Monthly Plan',
  [SUBSCRIPTION_TIERS.THREE_MONTHS]: '3 Months Plan',
  [SUBSCRIPTION_TIERS.SIX_MONTHS]: '6 Months Plan',
}

/**
 * Get the tier level for a product ID
 * @param productId - DodoPayments product ID
 * @returns Tier level (1-4) or 0 if unknown
 */
export function getTierLevel(productId: string): number {
  return TIER_LEVELS[productId] || 0
}

/**
 * Get the human-readable name for a tier
 * @param productId - DodoPayments product ID
 * @returns Tier name or 'Unknown Plan'
 */
export function getTierName(productId: string): string {
  return TIER_NAMES[productId] || 'Unknown Plan'
}

/**
 * Check if changing from one tier to another is an upgrade
 * @param currentProductId - Current subscription product ID
 * @param newProductId - New subscription product ID
 * @returns True if this is an upgrade
 */
export function isUpgrade(currentProductId: string, newProductId: string): boolean {
  const currentLevel = getTierLevel(currentProductId)
  const newLevel = getTierLevel(newProductId)
  return newLevel > currentLevel
}

/**
 * Check if changing from one tier to another is a downgrade
 * @param currentProductId - Current subscription product ID
 * @param newProductId - New subscription product ID
 * @returns True if this is a downgrade
 */
export function isDowngrade(currentProductId: string, newProductId: string): boolean {
  const currentLevel = getTierLevel(currentProductId)
  const newLevel = getTierLevel(newProductId)
  return newLevel < currentLevel
}

/**
 * Check if the tiers are the same
 * @param currentProductId - Current subscription product ID
 * @param newProductId - New subscription product ID
 * @returns True if same tier
 */
export function isSameTier(currentProductId: string, newProductId: string): boolean {
  return currentProductId === newProductId
}

/**
 * Result of plan change validation
 */
export interface PlanChangeValidation {
  allowed: boolean
  reason: string
  changeType: 'upgrade' | 'downgrade' | 'same' | 'unknown'
}

/**
 * Validate if a plan change is allowed based on business rules
 * 
 * Business Rules:
 * - Upgrades: Allowed, will be scheduled for end of current period
 * - Downgrades: NOT allowed - user must wait for current plan to expire
 * - Same tier: Not allowed - user already has this plan
 * 
 * @param currentProductId - Current subscription product ID
 * @param newProductId - New subscription product ID
 * @returns Validation result
 */
export function canChangePlan(
  currentProductId: string,
  newProductId: string
): PlanChangeValidation {
  // Check if same tier
  if (isSameTier(currentProductId, newProductId)) {
    return {
      allowed: false,
      reason: 'You are already subscribed to this plan',
      changeType: 'same',
    }
  }

  // Check if upgrade
  if (isUpgrade(currentProductId, newProductId)) {
    const newTierName = getTierName(newProductId)
    return {
      allowed: true,
      reason: `Upgrade to ${newTierName} will be scheduled to start at the end of your current billing period`,
      changeType: 'upgrade',
    }
  }

  // Check if downgrade
  if (isDowngrade(currentProductId, newProductId)) {
    return {
      allowed: false,
      reason: 'Downgrades are not allowed. Please wait for your current plan to expire, then you can subscribe to a different plan.',
      changeType: 'downgrade',
    }
  }

  // Unknown product IDs
  return {
    allowed: false,
    reason: 'Unable to validate plan change - unknown product',
    changeType: 'unknown',
  }
}

/**
 * Get all available tier product IDs in order
 * @returns Array of product IDs from lowest to highest tier
 */
export function getAllTierProductIds(): string[] {
  return [
    SUBSCRIPTION_TIERS.WEEKLY,
    SUBSCRIPTION_TIERS.MONTHLY,
    SUBSCRIPTION_TIERS.THREE_MONTHS,
    SUBSCRIPTION_TIERS.SIX_MONTHS,
  ]
}

/**
 * Check if a product ID is a valid subscription tier
 * @param productId - Product ID to check
 * @returns True if valid tier
 */
export function isValidTier(productId: string): boolean {
  return getTierLevel(productId) > 0
}

