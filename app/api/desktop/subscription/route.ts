import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { checkSubscriptionAccess } from '@/lib/supabase/subscription-guard'

// POST or GET allowed. Authorization: Bearer <supabase_access_token>
export async function GET(request: NextRequest) {
  return handle(request)
}

export async function POST(request: NextRequest) {
  return handle(request)
}

async function handle(request: NextRequest) {
  try {
    const auth = request.headers.get('authorization') || request.headers.get('Authorization')
    const token = auth?.toLowerCase().startsWith('bearer ')
      ? auth.slice(7).trim()
      : null

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized: missing bearer token' }, { status: 401 })
    }

    const supabaseAdmin = createAdminClient()

    // Validate the access token and get the user
    const { data: userData, error: userErr } = await supabaseAdmin.auth.getUser(token)
    if (userErr || !userData?.user) {
      return NextResponse.json({ error: 'Unauthorized: invalid token' }, { status: 401 })
    }

    // Create a user-scoped supabase client by passing the bearer token on each request
    // We can reuse the admin client and set the token via headers using the Postgrest client
    const supabaseUser = supabaseAdmin
    ;(supabaseUser as any).rest.headers = {
      ...(supabaseUser as any).rest.headers,
      Authorization: `Bearer ${token}`,
    }

    const access = await checkSubscriptionAccess(supabaseUser as any)

    return NextResponse.json({
      success: true,
      allow: access.allow,
      status: access.status ?? null,
      inGrace: access.inGrace,
      graceEnd: access.graceEnd ?? null,
    })
  } catch (error) {
    console.error('[Desktop Subscription] Error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
