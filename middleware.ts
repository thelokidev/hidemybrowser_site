import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { updateSession } from '@/lib/supabase/middleware'
import { enforceAdminOr403 } from '@/lib/supabase/admin-guard'
import { checkSubscriptionAccess } from '@/lib/supabase/subscription-guard'
import { Database } from '@/types/database.types'

export async function middleware(request: NextRequest) {
  // First, keep existing behavior to refresh session and normalize cookies
  let response = await updateSession(request)

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!supabaseUrl || !supabaseKey) return response

  // Create a Supabase server client tied to this request/response
  const supabase = createServerClient<Database>(supabaseUrl, supabaseKey, {
    auth: {
      flowType: 'pkce',
      autoRefreshToken: true,
      detectSessionInUrl: true,
      persistSession: true,
    },
    cookies: {
      get: (name: string) => request.cookies.get(name)?.value,
      set: (name: string, value: string, options: CookieOptions) => {
        response.cookies.set({ name, value, ...options })
      },
      remove: (name: string, options: CookieOptions) => {
        response.cookies.set({ name, value: '', ...options })
      },
    },
  })

  const pathname = request.nextUrl.pathname

  // Admin guard for /admin routes
  if (pathname.startsWith('/admin')) {
    const { data: { user } } = await supabase.auth.getUser()
    const adminBlock = enforceAdminOr403(request, user)
    if (adminBlock) return adminBlock
    return response
  }

  // Subscription guard for app-protected routes (customize prefix as needed)
  if (pathname.startsWith('/app')) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      const url = new URL('/login', request.url)
      url.searchParams.set('redirect', pathname)
      return NextResponse.redirect(url)
    }

    const access = await checkSubscriptionAccess(supabase as any)
    if (!access.allow) {
      const url = new URL('/billing', request.url)
      url.searchParams.set('reason', access.status ?? 'no_access')
      return NextResponse.redirect(url)
    }
    if (access.inGrace) {
      response.headers.set('X-Grace-Period', 'true')
      if (access.graceEnd) response.headers.set('X-Grace-Ends-At', access.graceEnd)
    }
    return response
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next (Next.js internals, HMR, assets)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!api|_next|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|json)$).*)',
  ],
}
