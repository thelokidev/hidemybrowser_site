import { dodoClient, DodoPaymentsEnvironment } from "@/lib/dodopayments/client";
import { Checkout } from "@dodopayments/nextjs";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { Database } from "@/types/database.types";

type Subscription = Database['public']['Tables']['subscriptions']['Row']

/**
 * Guard: Check if user has an active subscription before allowing checkout
 */
async function checkActiveSubscription(req: NextRequest): Promise<NextResponse | null> {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    // If not authenticated, allow checkout (they'll need to sign in during checkout)
    if (authError || !user) {
      return null
    }

    // Check for active subscription
    const { data: activeSub } = await supabase
      .from('subscriptions')
      .select('id, status, current_period_end')
      .eq('user_id', user.id)
      .in('status', ['active', 'trialing', 'renewed'])
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (activeSub) {
      const sub = activeSub as Pick<Subscription, 'id' | 'status' | 'current_period_end'>
      console.log('[Checkout] Blocked - user has active subscription:', sub.id)
      
      // Return error response
      return NextResponse.json(
        { 
          error: 'You already have an active subscription. Please wait until your current plan ends before purchasing a new one.',
          current_period_end: sub.current_period_end || null
        },
        { status: 409 }
      )
    }

    return null // No active subscription, allow checkout
  } catch (error) {
    console.error('[Checkout] Error checking subscription:', error)
    // On error, allow checkout to proceed (fail open)
    return null
  }
}

/**
 * GET handler for static checkout pages
 * Uses the @dodopayments/nextjs SDK for seamless integration
 * Guards against purchases when user already has active subscription
 */
export const GET = async (req: NextRequest) => {
  // Check for active subscription
  const guardResponse = await checkActiveSubscription(req)
  if (guardResponse) {
    return guardResponse
  }

  const { origin } = new URL(req.url);
  const handler = Checkout({
    bearerToken: process.env.DODO_PAYMENTS_API_KEY!,
    returnUrl: `${origin}/dashboard`,
    environment: process.env
      .DODO_PAYMENTS_ENVIRONMENT as DodoPaymentsEnvironment,
    type: "static",
  });

  return handler(req);
};

/**
 * POST handler for programmatic checkout sessions
 * Creates a checkout session with customer data
 * Guards against purchases when user already has active subscription
 */
export const POST = async (req: NextRequest) => {
  // Check for active subscription
  const guardResponse = await checkActiveSubscription(req)
  if (guardResponse) {
    return guardResponse
  }

  // Log configuration for debugging
  const apiKey = process.env.DODO_PAYMENTS_API_KEY!
  const environment = process.env.DODO_PAYMENTS_ENVIRONMENT as DodoPaymentsEnvironment
  console.log('[Checkout] Configuration:', {
    hasApiKey: !!apiKey,
    apiKeyPrefix: apiKey?.substring(0, 10) + '...',
    environment,
    environmentSource: process.env.DODO_PAYMENTS_ENVIRONMENT
  })

  const { origin } = new URL(req.url);
  const handler = Checkout({
    bearerToken: apiKey,
    returnUrl: `${origin}/dashboard`,
    environment: environment,
    type: "session",
  });

  return handler(req);
};



