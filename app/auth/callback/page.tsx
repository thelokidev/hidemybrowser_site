"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Loader2 } from "lucide-react"

export default function AuthCallbackPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()
  const [error, setError] = useState<string | null>(null)
  const [debugInfo, setDebugInfo] = useState<string>('')

  useEffect(() => {
    const run = async () => {
      try {
        setDebugInfo('Checking session...')
        // Get the current session first to check if already authenticated
        const { data: { session: existingSession } } = await supabase.auth.getSession()
        
        if (existingSession) {
          // Already authenticated, check for next param
          const next = searchParams.get('next')
          const target = next && next.startsWith('/') ? next : "/dashboard"

          const isDesktop = (() => {
            const d = searchParams.get('desktop')
            return d === '1' || d === 'true' || d === 'yes'
          })()
          
          setDebugInfo(`Desktop: ${isDesktop}, Return: ${searchParams.get('return')}`)
          
          if (isDesktop) {
            const returnProto = searchParams.get('return') || 'hidemybrowser://auth'
            const state = searchParams.get('state') // CSRF protection token from desktop
            const token = existingSession.access_token
            console.log('[Auth] Desktop mode detected, redirecting to app with token')
            console.log('[Auth] Return protocol:', returnProto)
            console.log('[Auth] Token length:', token?.length)
            console.log('[Auth] State:', state ? 'present' : 'missing')
            setDebugInfo(`Redirecting to desktop app: ${returnProto}`)
            
            if (token) {
              // Build redirect URL with access_token and state (for CSRF protection)
              const redirectUrl = `${returnProto}?access_token=${encodeURIComponent(token)}${state ? `&state=${encodeURIComponent(state)}` : ''}`
              console.log('[Auth] Full redirect URL:', redirectUrl.replace(/access_token=[^&]+/, 'access_token=***'))
              
              // Try the protocol multiple times with increasing delays
              window.location.href = redirectUrl
              setTimeout(() => {
                try { window.location.href = redirectUrl } catch {}
              }, 1000)
              setTimeout(() => {
                try { window.location.href = redirectUrl } catch {}
              }, 3000)
              setTimeout(() => {
                try { window.location.href = redirectUrl } catch {}
              }, 6000)
              
              // Show success message after 2 seconds
              setTimeout(() => {
                setDebugInfo('✓ Authentication successful! Redirecting to desktop app...')
              }, 2000)
              
              // Try to close the window after 5 seconds
              setTimeout(() => {
                try {
                  window.close()
                } catch {
                  // If can't close, show message
                  setDebugInfo('✓ Authentication successful! You can close this window now.')
                }
              }, 5000)
              
              return // Stop here, don't navigate to dashboard
            }
          }

          console.log('[Auth] Already authenticated, redirecting to', target)
          router.replace(target)
          return
        }

        // Try to exchange code for session
        const { error, data } = await supabase.auth.exchangeCodeForSession(window.location.href)
        
        if (error) {
          // Check if it's a PKCE error
          if (error.message.includes('code verifier') || error.message.includes('invalid request')) {
            console.warn('[Auth] PKCE error, checking if already authenticated...')
            
            // Wait a bit and check session again
            await new Promise(resolve => setTimeout(resolve, 1000))
            const { data: { session: retrySession } } = await supabase.auth.getSession()
            
            if (retrySession) {
              // User is actually logged in!
              const next = searchParams.get('next')
              const target = next && next.startsWith('/') ? next : "/dashboard"

              const isDesktop = (() => {
                const d = searchParams.get('desktop')
                return d === '1' || d === 'true' || d === 'yes'
              })()
              if (isDesktop) {
                const returnProto = searchParams.get('return') || 'hidemybrowser://auth'
                const state = searchParams.get('state') // CSRF protection token from desktop
                const token = retrySession.access_token
                console.log('[Auth] Desktop mode detected (retry), redirecting to app with token')
                if (token) {
                  const redirectUrl = `${returnProto}?access_token=${encodeURIComponent(token)}${state ? `&state=${encodeURIComponent(state)}` : ''}`
                  // Try the protocol multiple times with increasing delays
                  window.location.href = redirectUrl
                  setTimeout(() => {
                    try { window.location.href = redirectUrl } catch {}
                  }, 1000)
                  setTimeout(() => {
                    try { window.location.href = redirectUrl } catch {}
                  }, 3000)
                  setTimeout(() => {
                    try { window.location.href = redirectUrl } catch {}
                  }, 6000)
                  // Show success and try to close
                  setTimeout(() => {
                    try {
                      window.close()
                    } catch {
                      console.log('[Auth] Could not auto-close window')
                    }
                  }, 5000)
                  return // Stop here, don't navigate to dashboard
                }
              }

              console.log('[Auth] User is authenticated despite error, redirecting to', target)
              router.replace(target)
              return
            }
            
            // Not logged in, clear storage and retry
            console.warn('[Auth] Not authenticated, clearing storage...')
            Object.keys(localStorage).forEach(key => {
              if (key.includes('supabase') || key.includes('sb-') || key.includes('pkce')) {
                localStorage.removeItem(key)
              }
            })
            
            setError("Session expired. Please try signing in again.")
            setTimeout(() => {
              router.replace("/auth")
            }, 2000)
            return
          }
          
          throw error
        }

        // Success: send user to next or dashboard
        if (data.session) {
          const next = searchParams.get('next')
          const target = next && next.startsWith('/') ? next : "/dashboard"

          const isDesktop = (() => {
            const d = searchParams.get('desktop')
            return d === '1' || d === 'true' || d === 'yes'
          })()
          if (isDesktop) {
            const returnProto = searchParams.get('return') || 'hidemybrowser://auth'
            const state = searchParams.get('state') // CSRF protection token from desktop
            const token = data.session.access_token
            console.log('[Auth] Desktop mode detected (success), redirecting to app with token')
            if (token) {
              const redirectUrl = `${returnProto}?access_token=${encodeURIComponent(token)}${state ? `&state=${encodeURIComponent(state)}` : ''}`
              // Try the protocol multiple times with increasing delays
              window.location.href = redirectUrl
              setTimeout(() => {
                try { window.location.href = redirectUrl } catch {}
              }, 1000)
              setTimeout(() => {
                try { window.location.href = redirectUrl } catch {}
              }, 3000)
              setTimeout(() => {
                try { window.location.href = redirectUrl } catch {}
              }, 6000)
              // Show success and try to close
              setTimeout(() => {
                try {
                  window.close()
                } catch {
                  console.log('[Auth] Could not auto-close window')
                }
              }, 5000)
              return // Stop here, don't navigate to dashboard
            }
          }

          console.log('[Auth] Authentication successful, redirecting to', target)
          router.replace(target)
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Authentication failed"
        console.error('[Auth] Error:', errorMessage)
        setError(errorMessage)
      }
    }

    run()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="max-w-sm w-full border rounded-lg p-6">
          <h1 className="text-lg font-medium mb-2">Authentication error</h1>
          <p className="text-sm text-muted-foreground mb-4">{error}</p>
          <button
            onClick={() => router.replace("/auth")}
            className="inline-flex h-9 items-center justify-center rounded-md border px-4 text-sm"
          >
            Back to sign in
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="flex flex-col items-center gap-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Signing you in...
        </div>
        {debugInfo && (
          <div className="text-xs text-muted-foreground/60 max-w-md text-center">
            {debugInfo}
          </div>
        )}
      </div>
    </div>
  )
}
