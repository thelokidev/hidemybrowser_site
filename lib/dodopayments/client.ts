import DodoPayments from "dodopayments";

/**
 * DodoPayments environment type
 */
export type DodoPaymentsEnvironment = "live_mode" | "test_mode";

// Singleton instance (lazy initialization)
let dodoClientInstance: DodoPayments | null = null;

/**
 * Get the DodoPayments client instance (server-side only)
 * This is lazily initialized to avoid module-load-time errors
 * @returns DodoPayments client or null if not configured
 */
export const dodoClient = (): DodoPayments => {
  if (!dodoClientInstance) {
    const apiKey = process.env.DODO_PAYMENTS_API_KEY;
    const environment = process.env.DODO_PAYMENTS_ENVIRONMENT as DodoPaymentsEnvironment;

    if (!apiKey) {
      throw new Error('DODO_PAYMENTS_API_KEY environment variable is required');
    }

    if (apiKey === 'dp_test_placeholder' || apiKey === 'dp_live_placeholder') {
      throw new Error('Invalid DodoPayments API key - please use a real key');
    }

    dodoClientInstance = new DodoPayments({
      bearerToken: apiKey,
      environment: environment || 'test_mode',
    });
  }

  return dodoClientInstance;
};

/**
 * Get the DodoPayments client instance (legacy method)
 * @returns DodoPayments client or null if not configured
 */
export const getDodoPayments = (): DodoPayments | null => {
  try {
    return dodoClient();
  } catch (error) {
    console.warn('[DodoPayments]', error instanceof Error ? error.message : 'Failed to initialize client');
    return null;
  }
};

export { DodoPayments };
