'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useAccessStatus } from '@/hooks/use-access-status'
import { useSubscription } from '@/hooks/use-subscription'

/**
 * DEBUG COMPONENT - Remove after issue is resolved
 * This component helps diagnose why subscriptions aren't displaying
 */
export function SubscriptionDebug() {
  const [user, setUser] = useState<any>(null)
  const [rawSubscriptionData, setRawSubscriptionData] = useState<any>(null)
  const [queryError, setQueryError] = useState<string | null>(null)
  const accessStatus = useAccessStatus()
  const { subscription, loading, error } = useSubscription()

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => setUser(data.user))
  }, [])

  const manualRefresh = async () => {
    if (!user) return
    
    const supabase = createClient()
    console.log('[DEBUG] Manual refresh triggered for user:', user.id)
    
    try {
      // Query 1: Get ALL subscriptions for user
      const { data: allSubs, error: allError } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
      
      console.log('[DEBUG] All subscriptions:', allSubs)
      console.log('[DEBUG] Query error:', allError)
      
      setRawSubscriptionData(allSubs)
      setQueryError(allError ? JSON.stringify(allError) : null)
      
      // Force page reload to reset all hooks
      setTimeout(() => window.location.reload(), 100)
    } catch (err) {
      console.error('[DEBUG] Error:', err)
      setQueryError(err instanceof Error ? err.message : 'Unknown error')
    }
  }

  return (
    <Card className="border-yellow-500 bg-yellow-50 dark:bg-yellow-950">
      <CardHeader>
        <CardTitle className="text-yellow-800 dark:text-yellow-200">
          🔧 Debug Information (Remove in Production)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2 text-sm font-mono">
          <div>
            <strong>User ID:</strong> {user?.id || 'Not logged in'}
          </div>
          <div>
            <strong>User Email:</strong> {user?.email || 'N/A'}
          </div>
          
          <hr className="my-4" />
          
          <div>
            <strong>Access Status Hook:</strong>
            <pre className="mt-1 p-2 bg-black/5 rounded text-xs overflow-auto">
              {JSON.stringify({
                hasAccess: accessStatus.hasAccess,
                accessType: accessStatus.accessType,
                loading: accessStatus.loading,
                error: accessStatus.error,
                subscriptionStatus: accessStatus.subscriptionStatus,
              }, null, 2)}
            </pre>
          </div>
          
          <div>
            <strong>Subscription Hook:</strong>
            <pre className="mt-1 p-2 bg-black/5 rounded text-xs overflow-auto">
              {JSON.stringify({
                subscription: subscription,
                loading: loading,
                error: error
              }, null, 2)}
            </pre>
          </div>
          
          {rawSubscriptionData && (
            <div>
              <strong>Raw DB Query Result:</strong>
              <pre className="mt-1 p-2 bg-black/5 rounded text-xs overflow-auto">
                {JSON.stringify(rawSubscriptionData, null, 2)}
              </pre>
            </div>
          )}
          
          {queryError && (
            <div className="text-red-600">
              <strong>Query Error:</strong> {queryError}
            </div>
          )}
        </div>
        
        <Button onClick={manualRefresh} variant="outline" className="w-full">
          🔄 Manual Refresh & Show Raw Data
        </Button>
        
        <div className="text-xs text-muted-foreground mt-4">
          <strong>Display Logic:</strong> Component shows subscription when BOTH:
          <ul className="list-disc ml-4 mt-1">
            <li>accessStatus.accessType === 'subscription' ✓/✗: {accessStatus.accessType === 'subscription' ? '✓ YES' : '✗ NO'}</li>
            <li>subscription object exists ✓/✗: {subscription ? '✓ YES' : '✗ NO'}</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}

