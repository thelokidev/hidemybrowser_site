/**
 * DodoPayments Webhook Handler Types
 * Based on the reference architecture
 * 
 * NOTE: These handlers are for reference only.
 * Actual webhook processing is done in app/api/webhooks/dodopayments/route.ts
 * which uses the admin Supabase client for server-side operations.
 */

export interface DodoWebhookEvent {
  type: string
  data: any
}

