/**
 * DodoPayments Checkout Helper
 * Based on the reference architecture from dodo-supabase-subscription-starter
 */

export interface CheckoutParams {
  productId: string
  quantity?: number
  returnUrl?: string
  customerId?: string
  customerEmail?: string
  customerName?: string
}

/**
 * Generate a DodoPayments checkout URL with proper parameters
 * Uses static checkout links for simplicity and reliability
 */
export function generateCheckoutUrl(params: CheckoutParams): string {
  const baseUrl = process.env.NEXT_PUBLIC_DODO_PAYMENTS_ENVIRONMENT === 'live_mode'
    ? 'https://checkout.dodopayments.com'
    : 'https://test.checkout.dodopayments.com'
  
  const url = new URL(`${baseUrl}/buy/${params.productId}`)
  
  // Add quantity
  url.searchParams.set('quantity', String(params.quantity || 1))
  
  // Add return URL (redirect after successful payment)
  if (params.returnUrl) {
    url.searchParams.set('redirect_url', params.returnUrl)
  } else {
    // Default return URL
    const origin = typeof window !== 'undefined' ? window.location.origin : ''
    url.searchParams.set('redirect_url', `${origin}/dashboard?paid=1`)
  }
  
  // Add customer information if provided
  if (params.customerEmail) {
    url.searchParams.set('customer_email', params.customerEmail)
  }
  
  if (params.customerName) {
    url.searchParams.set('customer_name', params.customerName)
  }
  
  return url.toString()
}

/**
 * Product IDs for different subscription tiers
 * These can be overridden by environment variables
 */
export const SUBSCRIPTION_PRODUCTS = {
  WEEKLY: process.env.NEXT_PUBLIC_DODO_PRODUCT_WEEKLY || 'pdt_5ypSpqAzpNPQIBIw2Y66S',
  MONTHLY: process.env.NEXT_PUBLIC_DODO_PRODUCT_MONTHLY || 'pdt_EUozfisbUTWeqXfagMOlc',
  THREE_MONTHS: process.env.NEXT_PUBLIC_DODO_PRODUCT_3_MONTH || 'pdt_tmsm2z2gKcT5azrdecgyD',
  SIX_MONTHS: process.env.NEXT_PUBLIC_DODO_PRODUCT_6_MONTH || 'pdt_lq0xS7T3B921STb4Ys6D0',
} as const

/**
 * Get product ID by plan name
 */
export function getProductIdByPlan(planName: string): string | null {
  const planMap: Record<string, string> = {
    'Weekly': SUBSCRIPTION_PRODUCTS.WEEKLY,
    'Monthly': SUBSCRIPTION_PRODUCTS.MONTHLY,
    '3 Months': SUBSCRIPTION_PRODUCTS.THREE_MONTHS,
    '6 Months': SUBSCRIPTION_PRODUCTS.SIX_MONTHS,
  }
  
  return planMap[planName] || null
}

/**
 * Initiate checkout for a subscription plan
 */
export function initiateCheckout(planName: string, userEmail?: string, userName?: string): void {
  const productId = getProductIdByPlan(planName)
  
  if (!productId) {
    throw new Error(`Invalid plan: ${planName}`)
  }
  
  const checkoutUrl = generateCheckoutUrl({
    productId,
    quantity: 1,
    customerEmail: userEmail,
    customerName: userName,
  })
  
  // Redirect to checkout
  window.location.href = checkoutUrl
}

