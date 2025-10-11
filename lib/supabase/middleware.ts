import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { Database } from '@/types/database.types'

/**
 * Safely get cookie from request, handling Invalid UTF-8 sequences
 */
function safeCookieGet(request: NextRequest, name: string): string | undefined {
  try {
    const value = request.cookies.get(name)?.value
    if (value) {
      // Test if value can be safely used
      JSON.stringify(value)
    }
    return value
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    if (errorMessage.includes('Invalid UTF-8')) {
      console.warn(`[Middleware] Skipping corrupted cookie: ${name}`)
      return undefined
    }
    throw error
  }
}

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: new Headers(request.headers),
    },
  })

  // Validate Supabase configuration
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  if (!supabaseUrl || !supabaseKey || 
      supabaseUrl === 'your-supabase-project-url' || 
      supabaseKey === 'your-supabase-anon-key') {
    console.warn('[Middleware] Supabase not configured - skipping auth middleware')
    return response
  }

  try {
    const supabase = createServerClient<Database>(
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
            return safeCookieGet(request, name)
          },
          set(name: string, value: string, options: CookieOptions) {
            response.cookies.set({ name, value, ...options })
          },
          remove(name: string, options: CookieOptions) {
            response.cookies.set({ name, value: '', ...options })
          },
        },
      }
    )

    await supabase.auth.getUser()

    return response
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    
    if (errorMessage.includes('Invalid UTF-8')) {
      console.error('[Middleware] Invalid UTF-8 in cookies detected - clearing auth cookies')
      
      // Clear all Supabase cookies to fix the issue
      const cookiesToClear = ['sb-access-token', 'sb-refresh-token']
      request.cookies.getAll().forEach(cookie => {
        if (cookie.name.startsWith('sb-')) {
          cookiesToClear.push(cookie.name)
        }
      })
      
      cookiesToClear.forEach(name => {
        response.cookies.set({
          name,
          value: '',
          expires: new Date(0),
          path: '/',
        })
      })
      
      return response
    }
    
    // Re-throw other errors
    throw error
  }
}
