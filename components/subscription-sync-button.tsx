'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { RefreshCw, AlertCircle, CheckCircle2 } from 'lucide-react'

interface SyncResult {
  success: boolean
  message: string
  syncedCount?: number
  totalCount?: number
  results?: Array<{
    subscriptionId: string
    success: boolean
    status?: string
    error?: string
  }>
}

/**
 * Subscription Sync Button Component
 * Allows users to manually sync their subscription from DodoPayments
 * Useful when webhooks fail or are delayed
 */
export function SubscriptionSyncButton() {
  const [isSyncing, setIsSyncing] = useState(false)
  const [syncResult, setSyncResult] = useState<SyncResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleSync = async () => {
    setIsSyncing(true)
    setError(null)
    setSyncResult(null)

    try {
      const response = await fetch('/api/subscriptions/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || data.details || 'Failed to sync subscription')
      }

      setSyncResult(data)

      // Refresh the page after successful sync
      if (data.success && data.syncedCount > 0) {
        setTimeout(() => {
          window.location.reload()
        }, 2000)
      }

    } catch (err) {
      console.error('Sync error:', err)
      setError(err instanceof Error ? err.message : 'Failed to sync subscription')
    } finally {
      setIsSyncing(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3">
        <Button
          onClick={handleSync}
          disabled={isSyncing}
          variant="outline"
          size="sm"
          className="gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
          {isSyncing ? 'Syncing...' : 'Sync Subscription'}
        </Button>
        
        <p className="text-sm text-muted-foreground max-w-md">
          If you just completed a payment but don't see your subscription, click this button to manually sync from the payment provider.
        </p>
      </div>

      {syncResult && (
        <Alert className={syncResult.success ? 'border-green-500' : 'border-yellow-500'}>
          <div className="flex items-start gap-2">
            {syncResult.success ? (
              <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
            ) : (
              <AlertCircle className="h-5 w-5 text-yellow-500 mt-0.5" />
            )}
            <div className="flex-1">
              <AlertDescription>
                <p className="font-medium">{syncResult.message}</p>
                {syncResult.syncedCount !== undefined && (
                  <p className="text-sm mt-1">
                    Synced {syncResult.syncedCount} of {syncResult.totalCount} subscriptions
                  </p>
                )}
                {syncResult.success && syncResult.syncedCount && syncResult.syncedCount > 0 && (
                  <p className="text-sm text-green-600 mt-2">
                    ✓ Success! Page will reload in 2 seconds...
                  </p>
                )}
                {syncResult.results && syncResult.results.length > 0 && (
                  <details className="mt-2">
                    <summary className="text-sm cursor-pointer hover:underline">
                      View details
                    </summary>
                    <ul className="text-sm mt-2 space-y-1">
                      {syncResult.results.map((result, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className={result.success ? 'text-green-600' : 'text-red-600'}>
                            {result.success ? '✓' : '✗'}
                          </span>
                          <span>
                            {result.subscriptionId}
                            {result.status && ` (${result.status})`}
                            {result.error && `: ${result.error}`}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </details>
                )}
              </AlertDescription>
            </div>
          </div>
        </Alert>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <p className="font-medium">Sync Failed</p>
            <p className="text-sm mt-1">{error}</p>
            <p className="text-sm mt-2">
              If this persists, please contact support with this error message.
            </p>
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}

