export interface DodoSubscription {
  id: string
  user_id: string
  dodo_customer_id?: string
  dodo_subscription_id?: string
  dodo_product_id?: string
  dodo_price_id?: string
  status: 'active' | 'canceled' | 'past_due' | 'incomplete' | 'trialing'
  current_period_start?: string
  current_period_end?: string
  cancel_at_period_end?: boolean
  canceled_at?: string
  trial_start?: string
  trial_end?: string
  is_upgrade_scheduled?: boolean
  scheduled_product_id?: string
  scheduled_start_date?: string
  metadata?: Record<string, any>
  created_at: string
  updated_at: string
}

export interface DodoCustomer {
  id: string
  user_id: string
  dodo_customer_id?: string
  email?: string
  name?: string
  created_at: string
  updated_at: string
}

export interface DodoPayment {
  id: string
  user_id: string
  dodo_payment_id?: string
  dodo_checkout_session_id?: string
  amount: number
  currency: string
  status: string
  payment_method?: string
  description?: string
  metadata?: Record<string, any>
  created_at: string
  updated_at: string
}
