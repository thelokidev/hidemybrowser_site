type AccessStatus = {
  hasAccess: boolean
  accessType: 'subscription' | 'trial' | 'none'
  subscriptionStatus?: string
  subscriptionExpiresAt?: string
  subscriptionProductId?: string
  trialIsActive?: boolean
  trialExpiresAt?: string
  trialMinutesRemaining?: number
}

const TTL_MINUTES = Number(process.env.CACHE_TTL_MINUTES || 15)
const store = new Map<string, { value: AccessStatus; expiresAt: number }>()

export function get(userId: string): AccessStatus | null {
  const item = store.get(userId)
  if (!item) return null
  if (Date.now() > item.expiresAt) {
    store.delete(userId)
    return null
  }
  return item.value
}

export function set(userId: string, value: AccessStatus) {
  const ttlMs = TTL_MINUTES * 60 * 1000
  store.set(userId, { value, expiresAt: Date.now() + ttlMs })
}

export function invalidate(userId: string) {
  store.delete(userId)
}

export function clear() {
  store.clear()
}
