export function nextRetryAt(failureCount: number): string | null {
  if (failureCount <= 0) return new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
  if (failureCount === 1) return new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString()
  return null
}
