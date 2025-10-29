import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

const FeedbackSchema = z.object({
  name: z.string().min(2).max(80).optional().or(z.literal('')),
  email: z.string().email().max(120),
  category: z.enum(['Bug', 'Feature Request', 'General', 'Praise']),
  message: z.string().min(10).max(2000),
  rating: z.number().int().min(1).max(5).optional(),
})

export async function POST(req: Request) {
  try {
    const json = await req.json()
    const parsed = FeedbackSchema.safeParse(json)
    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: 'Invalid payload', issues: parsed.error.flatten() },
        { status: 400 },
      )
    }

    const { name, email, category, message, rating } = parsed.data

    // Try to store in Supabase if configured and table exists
    try {
      const supabase = await createClient()
      const { data: userData } = await supabase.auth.getUser()
      const user_id = userData?.user?.id ?? null

      const { error } = await (supabase as any)
        .from('feedback')
        .insert([
          {
            name: name || null,
            email,
            category,
            message,
            rating: rating ?? null,
            user_id,
            created_at: new Date().toISOString(),
          },
        ])

      if (error) {
        console.warn('[Feedback] Insert failed, falling back:', error)
        return NextResponse.json({ ok: true, stored: false }, { status: 202 })
      }

      return NextResponse.json({ ok: true, stored: true })
    } catch (e) {
      console.warn('[Feedback] Supabase unavailable, falling back:', e)
      return NextResponse.json({ ok: true, stored: false }, { status: 202 })
    }
  } catch (err) {
    return NextResponse.json({ ok: false, error: 'Server error' }, { status: 500 })
  }
}
