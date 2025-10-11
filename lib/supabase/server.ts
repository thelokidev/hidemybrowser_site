import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { Database } from '@/types/database.types'

/**
 * Safely get a cookie value, handling Invalid UTF-8 sequences
 */
function safeCookieGet(cookieStore: ReturnType<typeof cookies> extends Promise<infer T> ? T : never, name: string): string | undefined {
  try {
    const value = cookieStore.get(name)?.value
    if (value) {
      // Test if value is valid UTF-8 by trying to stringify it
      JSON.stringify(value)
    }
    return value
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    if (errorMessage.includes('Invalid UTF-8')) {
      console.warn(`[Supabase Server] Skipping cookie with invalid UTF-8: ${name}`)
      return undefined
    }
    throw error
  }
}

export async function createClient() {
  const cookieStore = await cookies()

  // Validate Supabase configuration
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  if (!supabaseUrl || !supabaseKey || 
      supabaseUrl === 'your-supabase-project-url' || 
      supabaseKey === 'your-supabase-anon-key') {
    throw new Error('Supabase credentials not configured. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your .env.local file.')
  }

  try {
    return createServerClient<Database>(
      supabaseUrl,
      supabaseKey,
      {
        auth: {
          flowType: 'pkce',
          autoRefreshToken: true,
          detectSessionInUrl: true,
          persistSession: true,
        },
        cookies: {
          get(name: string) {
            return safeCookieGet(cookieStore, name)
          },
          set(name: string, value: string, options: CookieOptions) {
            try {
              cookieStore.set({ name, value, ...options })
            } catch (error) {
              // The `set` method was called from a Server Component.
              // This can be ignored if you have middleware refreshing
              // user sessions.
            }
          },
          remove(name: string, options: CookieOptions) {
            try {
              cookieStore.set({ name, value: '', ...options })
            } catch (error) {
              // The `delete` method was called from a Server Component.
              // This can be ignored if you have middleware refreshing
              // user sessions.
            }
          },
        },
      }
    )
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    if (errorMessage.includes('Invalid UTF-8')) {
      console.error('[Supabase Server] Critical: Invalid UTF-8 detected in auth cookies.')
      console.error('[Supabase Server] User must clear browser cookies manually.')
      
      // Return a fallback client with no cookies
      return createServerClient<Database>(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          auth: {
            flowType: 'pkce',
            autoRefreshToken: true,
            detectSessionInUrl: true,
            persistSession: true,
          },
          cookies: {
            get() { return undefined },
            set() {},
            remove() {},
          },
        }
      )
    }
    throw error
  }
}
