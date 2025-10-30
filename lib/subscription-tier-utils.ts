/**
 * Subscription Tier Management Utilities
 * 
 * Handles tier comparison, upgrade/downgrade detection,
 * and validation logic for subscription plan changes.
 */

/**
 * Product ID mapping for subscription tiers
 * Supports both old and new product IDs for backward compatibility
 */
export const SUBSCRIPTION_TIERS = {
  WEEKLY: process.env.NEXT_PUBLIC_DODO_PRODUCT_WEEKLY || 'pdt_5ypSpqAzpNPQIBIw2Y66S',
  MONTHLY: process.env.NEXT_PUBLIC_DODO_PRODUCT_MONTHLY || 'pdt_EUozfisbUTWeqXfagMOlc',
  THREE_MONTHS: process.env.NEXT_PUBLIC_DODO_PRODUCT_3_MONTH || 'pdt_tmsm2z2gKcT5azrdecgyD',
  SIX_MONTHS: process.env.NEXT_PUBLIC_DODO_PRODUCT_6_MONTH || 'pdt_lq0xS7T3B921STb4Ys6D0',
} as const

// Legacy product IDs mapping for backward compatibility
export const LEGACY_SUBSCRIPTION_TIERS = {
  WEEKLY: 'pdt_v0slst9k4JI0Q2qUDkIAW',
  MONTHLY: 'pdt_ugqyKXMT219386BcoejVN',
  THREE_MONTHS: 'pdt_W4YuF093U2MSpABbJ7miA',
  SIX_MONTHS: 'pdt_Ah7DRDitJbvGcaFMrqrOf',
} as const

/**
 * Tier levels for comparison (higher = better tier)
 */
const TIER_LEVELS: Record<string, number> = {
  // New product IDs
  [SUBSCRIPTION_TIERS.WEEKLY]: 1,
  [SUBSCRIPTION_TIERS.MONTHLY]: 2,
  [SUBSCRIPTION_TIERS.THREE_MONTHS]: 3,
  [SUBSCRIPTION_TIERS.SIX_MONTHS]: 4,
  // Legacy product IDs for backward compatibility
  [LEGACY_SUBSCRIPTION_TIERS.WEEKLY]: 1,
  [LEGACY_SUBSCRIPTION_TIERS.MONTHLY]: 2,
  [LEGACY_SUBSCRIPTION_TIERS.THREE_MONTHS]: 3,
  [LEGACY_SUBSCRIPTION_TIERS.SIX_MONTHS]: 4,
}

/**
 * Human-readable tier names
 */
export const TIER_NAMES: Record<string, string> = {
  // New product IDs
  [SUBSCRIPTION_TIERS.WEEKLY]: 'Weekly Plan',
  [SUBSCRIPTION_TIERS.MONTHLY]: 'Monthly Plan',
  [SUBSCRIPTION_TIERS.THREE_MONTHS]: '3 Months Plan',
  [SUBSCRIPTION_TIERS.SIX_MONTHS]: '6 Months Plan',
  // Legacy product IDs for backward compatibility
  [LEGACY_SUBSCRIPTION_TIERS.WEEKLY]: 'Weekly Plan',
  [LEGACY_SUBSCRIPTION_TIERS.MONTHLY]: 'Monthly Plan',
  [LEGACY_SUBSCRIPTION_TIERS.THREE_MONTHS]: '3 Months Plan',
  [LEGACY_SUBSCRIPTION_TIERS.SIX_MONTHS]: '6 Months Plan',
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
 * - All plan changes are blocked - user must wait for current plan to expire
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

  // Block ALL changes - user must wait for current plan to expire
  return {
    allowed: false,
    reason: 'Please wait for your current plan to expire, then you can subscribe to a different plan.',
    changeType: isUpgrade(currentProductId, newProductId) ? 'upgrade' : 'downgrade',
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

