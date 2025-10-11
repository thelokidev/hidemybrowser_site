import { loadStripe } from '@stripe/stripe-js'

let stripePromise: Promise<any> | null = null

export const getStripe = () => {
  if (!stripePromise) {
    const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
    
    if (publishableKey === 'pk_test_placeholder') {
      console.warn('Using placeholder Stripe key - payments will not work until real key is provided')
      return null
    }

    stripePromise = loadStripe(publishableKey!)
  }
  return stripePromise
}
