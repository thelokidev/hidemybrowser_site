import { NextRequest, NextResponse } from 'next/server'
import { getDodoPayments } from '@/lib/dodopayments/client'
import { getOrCreateDodoCustomer } from '@/lib/dodopayments/customer'
import { createClient } from '@/lib/supabase/server'

/**
 * Create a DodoPayments checkout session
 * This replaces static checkout URLs with programmatic session creation
 * Allows us to attach customer metadata and track checkout flow
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { productId } = await request.json()

    if (!productId) {
      return NextResponse.json({ error: 'Product ID required' }, { status: 400 })
    }

    const dodoClient = getDodoPayments()
    if (!dodoClient) {
      console.error('[CheckoutSession] DodoPayments client not initialized - check API keys')
      return NextResponse.json(
        { 
          error: 'Payment system not configured. Please contact support.',
          details: 'DodoPayments API keys are missing or invalid'
        }, 
        { status: 503 }
      )
    }

    console.log('[CheckoutSession] Creating session for user:', user.id, 'product:', productId)

    // Get or create DodoPayments customer with metadata
    const { dodoCustomerId } = await getOrCreateDodoCustomer({
      userId: user.id,
      email: user.email!,
      name: user.user_metadata?.full_name || user.user_metadata?.name
    })

    // Create checkout session
    const session = await dodoClient.createCheckoutSession({
      customer_id: dodoCustomerId,
      product_cart: [{ product_id: productId, quantity: 1 }],
      return_url: `${request.nextUrl.origin}/dashboard?paid=1`,
      metadata: {
        supabase_user_id: user.id,
        product_id: productId
      }
    })

    console.log('[CheckoutSession] Created session:', session.session_id)

    return NextResponse.json({
      sessionId: session.session_id,
      checkoutUrl: session.checkout_url
    })
  } catch (error) {
    console.error('[CheckoutSession] Error:', error)
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    const isDNSError = errorMessage.includes('ENOTFOUND') || errorMessage.includes('getaddrinfo')
    
    return NextResponse.json(
      { 
        error: isDNSError 
          ? 'Unable to connect to payment provider. Please check your internet connection or try again later.'
          : 'Failed to create checkout session. Please try again.',
        details: errorMessage
      },
      { status: 500 }
    )
  }
}

