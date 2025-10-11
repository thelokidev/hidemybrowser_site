import { dodoClient } from './client'
import { createAdminClient } from '@/lib/supabase/admin'

/**
 * Get or create a DodoPayments customer for a Supabase user
 * This ensures customers are linked between both systems
 * Reference: dodo-supabase-subscription-starter pattern
 */
export async function getOrCreateDodoCustomer(params: {
  userId: string
  email: string
  name?: string
}): Promise<{ dodoCustomerId: string; isNew: boolean }> {
  const supabase = createAdminClient()

  console.log('[DodoCustomer] Getting or creating customer for user:', params.userId)

  // Check if customer already exists in Supabase
  const { data: existingCustomer } = await supabase
    .from('customers')
    .select('dodo_customer_id')
    .eq('user_id', params.userId)
    .single()

  if (existingCustomer?.dodo_customer_id) {
    console.log('[DodoCustomer] Found existing customer:', existingCustomer.dodo_customer_id)
    return { dodoCustomerId: existingCustomer.dodo_customer_id, isNew: false }
  }

  console.log('[DodoCustomer] Creating new DodoPayments customer')

  // Create new customer in DodoPayments using official SDK
  const dodoCustomer = await dodoClient().customers.create({
    email: params.email,
    name: params.name || params.email.split('@')[0],
  })

  console.log('[DodoCustomer] Created DodoPayments customer:', dodoCustomer.customer_id)

  // Update Supabase customer record with DodoPayments ID
  await supabase
    .from('customers')
    .update({
      dodo_customer_id: dodoCustomer.customer_id,
      updated_at: new Date().toISOString()
    })
    .eq('user_id', params.userId)

  console.log('[DodoCustomer] Updated Supabase customer record')

  return { dodoCustomerId: dodoCustomer.customer_id, isNew: true }
}

