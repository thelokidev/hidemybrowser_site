import { createBrowserClient } from '@supabase/ssr'
import { Database } from '@/types/database.types'

function getAuthStorageKey(supabaseUrl: string): string | null {
  try {
    const url: URL = new URL(supabaseUrl)
    const subdomain: string = url.hostname.split('.')[0]
    return `sb-${subdomain}-auth-token`
  } catch {
    return null
  }
}

function sanitizeAuthStorage(): void {
  if (typeof window === 'undefined') return
  const supabaseUrl: string | undefined = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!supabaseUrl) return
  const key: string | null = getAuthStorageKey(supabaseUrl)
  if (!key) return
  const raw: string | null = window.localStorage.getItem(key)
  if (!raw) return
  try {
    // Handle values that were accidentally stringified twice
    let parsed: unknown = JSON.parse(raw)
    if (typeof parsed === 'string') {
      parsed = JSON.parse(parsed)
    }
    if (parsed && typeof parsed === 'object') {
      window.localStorage.setItem(key, JSON.stringify(parsed))
      return
    }
  } catch {
    // Fall through and remove the corrupted key
  }
  window.localStorage.removeItem(key)
}

/**
 * Clear corrupted auth cookies
 * This handles Invalid UTF-8 sequence errors in Supabase SSR cookies
 */
function clearCorruptedCookies(): void {
  if (typeof document === 'undefined') return
  
  try {
    // Get all cookies
    const cookies = document.cookie.split(';')
    
    // Clear all Supabase auth cookies
    for (const cookie of cookies) {
      const [name] = cookie.split('=')
      const trimmedName = name.trim()
      
      // Clear Supabase auth cookies (they start with 'sb-')
      if (trimmedName.startsWith('sb-')) {
        // Delete cookie by setting it to expire in the past
        document.cookie = `${trimmedName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`
        document.cookie = `${trimmedName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=localhost;`
        console.log(`[Supabase] Cleared corrupted cookie: ${trimmedName}`)
      }
    }
  } catch (error) {
    console.error('[Supabase] Error clearing cookies:', error)
  }
}

export function createClient() {
  // Validate Supabase configuration
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  if (!supabaseUrl || !supabaseKey || 
      supabaseUrl === 'your-supabase-project-url' || 
      supabaseKey === 'your-supabase-anon-key') {
    throw new Error('Supabase credentials not configured. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your .env.local file.')
  }

  sanitizeAuthStorage()
  
  try {
    return createBrowserClient<Database>(
      supabaseUrl,
      supabaseKey,
      {
        auth: {
          flowType: 'pkce',
          autoRefreshToken: true,
          detectSessionInUrl: true,
          persistSession: true,
          storage: typeof window !== 'undefined' ? window.localStorage : undefined,
        },
      }
    )
  } catch (error) {
    // If we get an Invalid UTF-8 error, clear cookies and retry
    const errorMessage = error instanceof Error ? error.message : String(error)
    if (errorMessage.includes('Invalid UTF-8')) {
      console.warn('[Supabase] Detected corrupted auth cookies, clearing and retrying...')
      clearCorruptedCookies()
      sanitizeAuthStorage()
      
      // Retry creating the client
      try {
        return createBrowserClient<Database>(
          supabaseUrl,
          supabaseKey,
          {
            auth: {
              flowType: 'pkce',
              autoRefreshToken: true,
              detectSessionInUrl: true,
              persistSession: true,
              storage: typeof window !== 'undefined' ? window.localStorage : undefined,
            },
          }
        )
      } catch (retryError) {
        console.error('[Supabase] Failed to create client after clearing cookies:', retryError)
        throw retryError
      }
    }
    throw error
  }
}
