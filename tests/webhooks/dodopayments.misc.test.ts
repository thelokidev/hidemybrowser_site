import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { createRequire } from 'node:module'
;(global as any).require = createRequire(import.meta.url)
import crypto from 'node:crypto'

function createSupabaseMock(seed?: Partial<{
  subscriptions: any[]
  dodo_webhook_events: any[]
  payments: any[]
  customers: any[]
}>) {
  const db = {
    subscriptions: seed?.subscriptions ?? [],
    dodo_webhook_events: seed?.dodo_webhook_events ?? [],
    payments: seed?.payments ?? [],
    customers: seed?.customers ?? []
  }

  const api = {
    auth: { admin: { listUsers: vi.fn().mockResolvedValue({ data: { users: [] } }) } },
    from(table: keyof typeof db) {
      let filter: { column?: string; value?: any } = {}
      return {
        insert: vi.fn(async (row: any) => {
          if (table === 'dodo_webhook_events') {
            const exists = db.dodo_webhook_events.find(r => r.event_id === row.event_id)
            if (!exists) db.dodo_webhook_events.push({ ...row })
            return { data: [row], error: null }
          }
          db[table].push({ ...row })
          return { data: [row], error: null }
        }),
        select: vi.fn(function (this: any) {
          return {
            eq(col: string, val: any) {
              filter = { column: col, value: val }
              const rows = (db[table] as any[]).filter(r => r[col] === val)
              return {
                single() {
                  if (rows.length === 0) return { data: null, error: new Error('No rows') }
                  return { data: rows[0], error: null }
                },
                then: undefined as any,
              }
            }
          }
        }),
        update: vi.fn(function (this: any, values: any) {
          return {
            eq(col: string, val: any) {
              const rows = (db[table] as any[]).filter(r => r[col] === val)
              rows.forEach(r => Object.assign(r, values))
              return { select() { return { data: rows, error: null } } }
            }
          }
        })
      }
    }
  }
  return { db, api }
}

vi.mock('@/lib/supabase/admin', () => {
  let supabaseMock: any
  return {
    createAdminClient: () => supabaseMock,
    __setClient: (client: any) => { supabaseMock = client }
  }
})

vi.mock('next/server', () => ({
  NextRequest: class {},
  NextResponse: {
    json: (body: any, init?: ResponseInit & { status?: number }) => new Response(JSON.stringify(body), { status: (init as any)?.status ?? 200, headers: { 'content-type': 'application/json' } })
  }
}))

import { POST } from '@/app/api/webhooks/dodopayments/route'
import { __setClient as setSupabaseClient } from '@/lib/supabase/admin'

function signedHeaders(secret: string, body: string) {
  const webhookId = 'wh_123'
  const webhookTimestamp = `${Math.floor(Date.now() / 1000)}`
  const signedContent = `${webhookId}.${webhookTimestamp}.${body}`
  const secretBase64 = secret.startsWith('whsec_') ? secret.slice(6) : secret
  const key = Buffer.from(secretBase64, 'base64')
  const signature = crypto.createHmac('sha256', key).update(signedContent).digest('base64')
  return {
    'webhook-id': webhookId,
    'webhook-timestamp': webhookTimestamp,
    'webhook-signature': `v1,${signature}`,
    'content-type': 'application/json'
  }
}

describe('DodoPayments Webhook - misc subscription/payment events', () => {
  const rawKey = 'test_secret'
  const secret = 'whsec_' + Buffer.from(rawKey, 'utf-8').toString('base64')

  beforeEach(() => { process.env.DODO_WEBHOOK_SECRET = secret })
  afterEach(() => { vi.clearAllMocks() })

  it('subscription.canceled sets status and canceled_at', async () => {
    const { api, db } = createSupabaseMock({
      subscriptions: [{ id: 10, dodo_subscription_id: 'sub_c1', status: 'active' }]
    })
    setSupabaseClient(api)

    const event = { id: 'evt_c1', type: 'subscription.canceled', data: { id: 'sub_c1' } }
    const body = JSON.stringify(event)
    const headers = signedHeaders(secret, body)

    const res = await POST(new Request('http://localhost/api/webhooks/dodopayments', { method: 'POST', body, headers }) as any)
    expect(res.status).toBe(200)

    const sub = db.subscriptions.find(r => r.dodo_subscription_id === 'sub_c1')
    expect(sub.status).toBe('canceled')
    expect(typeof sub.canceled_at).toBe('string')
  })

  it('subscription.failed sets status failed', async () => {
    const { api, db } = createSupabaseMock({
      subscriptions: [{ id: 11, dodo_subscription_id: 'sub_f1', status: 'active' }]
    })
    setSupabaseClient(api)

    const event = { id: 'evt_f1', type: 'subscription.failed', data: { id: 'sub_f1' } }
    const body = JSON.stringify(event)
    const headers = signedHeaders(secret, body)

    const res = await POST(new Request('http://localhost/api/webhooks/dodopayments', { method: 'POST', body, headers }) as any)
    expect(res.status).toBe(200)

    const sub = db.subscriptions.find(r => r.dodo_subscription_id === 'sub_f1')
    expect(sub.status).toBe('failed')
  })

  it('subscription.on_hold sets status on_hold when customer exists', async () => {
    const { api, db } = createSupabaseMock({
      customers: [{ user_id: 'user_1', dodo_customer_id: 'cus_abc', email: 'a@b.com' }],
      subscriptions: [{ id: 12, dodo_subscription_id: 'sub_h1', status: 'active' }]
    })
    setSupabaseClient(api)

    const event = {
      id: 'evt_h1',
      type: 'subscription.on_hold',
      data: { id: 'sub_h1', customer: { id: 'cus_abc', email: 'a@b.com' } }
    }
    const body = JSON.stringify(event)
    const headers = signedHeaders(secret, body)

    const res = await POST(new Request('http://localhost/api/webhooks/dodopayments', { method: 'POST', body, headers }) as any)
    expect(res.status).toBe(200)

    const sub = db.subscriptions.find(r => r.dodo_subscription_id === 'sub_h1')
    expect(sub.status).toBe('on_hold')
  })

  it('payment.cancelled updates payment status', async () => {
    const { api, db } = createSupabaseMock({
      payments: [{ dodo_payment_id: 'pay_1', status: 'succeeded' }]
    })
    setSupabaseClient(api)

    const event = { id: 'evt_p1', type: 'payment.cancelled', data: { id: 'pay_1' } }
    const body = JSON.stringify(event)
    const headers = signedHeaders(secret, body)

    const res = await POST(new Request('http://localhost/api/webhooks/dodopayments', { method: 'POST', body, headers }) as any)
    expect(res.status).toBe(200)

    const p = db.payments.find(r => r.dodo_payment_id === 'pay_1')
    expect(p.status).toBe('cancelled')
  })
})
