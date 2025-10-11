import { createClient } from "@/lib/supabase/server"
import { AuthProvider } from "@/contexts/auth-context"
import type { User } from "@supabase/supabase-js"

/**
 * Sanitize user object to remove potentially invalid UTF-8 characters
 * This prevents "Invalid UTF-8 sequence" errors during React Server Component serialization
 */
function sanitizeUser(user: User | null): User | null {
  if (!user) return null

  try {
    // Deep clone and sanitize the user object
    // This handles the case where OAuth providers return invalid UTF-8 in metadata
    const sanitizedMetadata = sanitizeObject(user.user_metadata || {})
    const sanitizedAppMetadata = sanitizeObject(user.app_metadata || {})

    const safeUser: User = {
      id: user.id,
      aud: user.aud,
      role: user.role,
      email: user.email,
      email_confirmed_at: user.email_confirmed_at,
      phone: user.phone,
      confirmed_at: user.confirmed_at,
      last_sign_in_at: user.last_sign_in_at,
      app_metadata: sanitizedAppMetadata,
      user_metadata: sanitizedMetadata,
      identities: Array.isArray(user.identities) ? sanitizeObject(user.identities) : [],
      created_at: user.created_at,
      updated_at: user.updated_at,
    }

    return safeUser
  } catch (error) {
    console.error('[AuthProviderWrapper] Error sanitizing user:', error)
    // Return minimal safe user object
    return {
      id: user.id,
      aud: user.aud,
      role: user.role,
      email: user.email,
      email_confirmed_at: user.email_confirmed_at,
      phone: user.phone,
      confirmed_at: user.confirmed_at,
      last_sign_in_at: user.last_sign_in_at,
      app_metadata: {},
      user_metadata: {},
      identities: [],
      created_at: user.created_at,
      updated_at: user.updated_at,
    }
  }
}

/**
 * Recursively sanitize an object to ensure UTF-8 safety
 */
function sanitizeObject(obj: any): any {
  if (obj === null || obj === undefined) {
    return obj
  }

  if (typeof obj === 'string') {
    try {
      // Test if string can be safely serialized
      JSON.stringify(obj)
      return obj
    } catch {
      // If serialization fails, return safe placeholder
      return '[invalid-utf8]'
    }
  }

  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item))
  }

  if (typeof obj === 'object') {
    const sanitized: any = {}
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        try {
          sanitized[key] = sanitizeObject(obj[key])
        } catch {
          // Skip problematic keys
          continue
        }
      }
    }
    return sanitized
  }

  return obj
}

export async function AuthProviderWrapper({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  
  try {
    // Use getUser() instead of getSession() for secure server-side authentication
    const { data: { user }, error } = await supabase.auth.getUser()

    // Handle "Auth session missing!" gracefully - this is expected for non-authenticated users
    if (error) {
      // Only log errors that are not about missing auth sessions
      if (error.message !== 'Auth session missing!') {
        console.error('[AuthProviderWrapper] Error fetching user:', error.message)
      }
      return (
        <AuthProvider initialUser={null}>
          {children}
        </AuthProvider>
      )
    }

    // Sanitize user object to prevent UTF-8 errors
    const safeUser = sanitizeUser(user)

    return (
      <AuthProvider initialUser={safeUser}>
        {children}
      </AuthProvider>
    )
  } catch (error) {
    console.error('[AuthProviderWrapper] Unexpected error:', error)
    return (
      <AuthProvider initialUser={null}>
        {children}
      </AuthProvider>
    )
  }
}
