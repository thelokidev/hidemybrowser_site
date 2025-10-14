import { NextResponse, type NextRequest } from 'next/server'

export interface AdminCheckResult {
  isAdmin: boolean
  reason?: string
}

/**
 * Check if the given user is an admin based on best practices:
 * - Match email with ADMIN_EMAIL
 * - Or user_metadata.role === 'admin'
 */
export function isAdminUser(user: { email?: string | null; user_metadata?: Record<string, any> | null } | null): boolean {
  if (!user) return false
  const adminEmail = process.env.ADMIN_EMAIL?.toLowerCase().trim()
  const email = user.email?.toLowerCase().trim()
  const role = (user.user_metadata as any)?.role
  if (adminEmail && email && email === adminEmail) return true
  if (role === 'admin') return true
  return false
}

/**
 * Enforce admin-only access. Returns a NextResponse if blocked; otherwise undefined.
 */
export function enforceAdminOr403(request: NextRequest, user: { email?: string | null; user_metadata?: Record<string, any> | null } | null): NextResponse | undefined {
  if (!user) {
    const url = new URL('/login', request.url)
    url.searchParams.set('redirect', request.nextUrl.pathname)
    return NextResponse.redirect(url)
  }
  if (!isAdminUser(user)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  return undefined
}
