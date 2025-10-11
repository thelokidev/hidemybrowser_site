import { dodoClient, DodoPaymentsEnvironment } from "@/lib/dodopayments/client";
import { Checkout } from "@dodopayments/nextjs";
import { NextRequest } from "next/server";

/**
 * GET handler for static checkout pages
 * Uses the @dodopayments/nextjs SDK for seamless integration
 */
export const GET = async (req: NextRequest) => {
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
 */
export const POST = async (req: NextRequest) => {
  const { origin } = new URL(req.url);
  const handler = Checkout({
    bearerToken: process.env.DODO_PAYMENTS_API_KEY!,
    returnUrl: `${origin}/dashboard`,
    environment: process.env
      .DODO_PAYMENTS_ENVIRONMENT as DodoPaymentsEnvironment,
    type: "session",
  });

  return handler(req);
};


