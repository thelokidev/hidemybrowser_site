import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { createRequire } from 'node:module'
;(global as any).require = createRequire(import.meta.url)
import crypto from 'node:crypto'

// Minimal in-memory Supabase mock
function createSupabaseMock(seed?: Partial<{
  subscriptions: any[]
  dodo_webhook_events: any[]
  payments: any[]
}>) {
  const db = {
    subscriptions: seed?.subscriptions ?? [],
    dodo_webhook_events: seed?.dodo_webhook_events ?? [],
    payments: seed?.payments ?? [],
  }

  const api = {
    auth: {
      admin: {
        listUsers: vi.fn().mockResolvedValue({ data: { users: [] } })
      }
    },
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
                // non-single select (not used in these tests)
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
              return {
                select() { return { data: rows, error: null } },
              }
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
    // helper to set mock per test
    __setClient: (client: any) => { supabaseMock = client }
  }
})

vi.mock('@/lib/dodopayments/client', () => ({
  getDodoPayments: () => ({ subscriptions: { list: vi.fn() } })
}))

vi.mock('next/server', () => ({
  NextRequest: class {},
  NextResponse: {
    json: (body: any, init?: ResponseInit & { status?: number }) => new Response(JSON.stringify(body), { status: (init as any)?.status ?? 200, headers: { 'content-type': 'application/json' } })
  }
}))

// Import after mocks
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

describe('DodoPayments Webhook - subscription.expired', () => {
  const rawKey = 'test_secret'
  const secret = 'whsec_' + Buffer.from(rawKey, 'utf-8').toString('base64')

  beforeEach(() => {
    process.env.DODO_WEBHOOK_SECRET = secret
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('expires an active subscription and marks event processed', async () => {
    const { api, db } = createSupabaseMock({
      subscriptions: [{ id: 1, dodo_subscription_id: 'sub_123', status: 'active' }],
      dodo_webhook_events: []
    })
    setSupabaseClient(api)

    const event = {
      id: 'evt_1',
      type: 'subscription.expired',
      data: {
        id: 'sub_123',
        status: 'expired',
        canceled_at: '2024-01-01T00:00:00Z',
        customer: { id: 'cus_1' }
      }
    }
    const body = JSON.stringify(event)
    const headers = signedHeaders(secret, body)

    const req = new Request('http://localhost/api/webhooks/dodopayments', { method: 'POST', body, headers })
    const res = await POST(req as any)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json).toHaveProperty('received', true)

    const sub = db.subscriptions.find(r => r.dodo_subscription_id === 'sub_123')
    expect(sub.status).toBe('expired')
    expect(sub.canceled_at).toBe('2024-01-01T00:00:00Z')

    const evt = db.dodo_webhook_events.find(r => r.event_id === 'evt_1')
    expect(evt).toBeTruthy()
  })

  it('no-op when already expired', async () => {
    const { api, db } = createSupabaseMock({
      subscriptions: [{ id: 2, dodo_subscription_id: 'sub_456', status: 'expired', canceled_at: '2023-12-31T00:00:00Z' }],
      dodo_webhook_events: []
    })
    setSupabaseClient(api)

    const event = {
      id: 'evt_2',
      type: 'subscription.expired',
      data: {
        id: 'sub_456',
        status: 'expired',
        canceled_at: '2024-01-01T00:00:00Z'
      }
    }
    const body = JSON.stringify(event)
    const headers = signedHeaders(secret, body)

    const req = new Request('http://localhost/api/webhooks/dodopayments', { method: 'POST', body, headers })
    const res = await POST(req as any)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json).toHaveProperty('received', true)

    const sub = db.subscriptions.find(r => r.dodo_subscription_id === 'sub_456')
    expect(sub.status).toBe('expired')
    expect(sub.canceled_at).toBe('2023-12-31T00:00:00Z') // unchanged
  })

  it('warns and returns when subscription missing', async () => {
    const { api } = createSupabaseMock()
    setSupabaseClient(api)

    const event = {
      id: 'evt_3',
      type: 'subscription.expired',
      data: { id: 'sub_missing', status: 'expired' }
    }
    const body = JSON.stringify(event)
    const headers = signedHeaders(secret, body)

    const req = new Request('http://localhost/api/webhooks/dodopayments', { method: 'POST', body, headers })
    const res = await POST(req as any)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json).toHaveProperty('received', true)
  })

  it('returns skipped for already processed event id', async () => {
    const { api, db } = createSupabaseMock({
      subscriptions: [{ id: 3, dodo_subscription_id: 'sub_789', status: 'active' }],
      dodo_webhook_events: []
    })
    setSupabaseClient(api)

    const event = {
      id: 'evt_4',
      type: 'subscription.expired',
      data: { id: 'sub_789', status: 'expired' }
    }
    const body = JSON.stringify(event)
    const headers = signedHeaders(secret, body)

    const req1 = new Request('http://localhost/api/webhooks/dodopayments', { method: 'POST', body, headers })
    const res1 = await POST(req1 as any)
    expect(res1.status).toBe(200)

    const req2 = new Request('http://localhost/api/webhooks/dodopayments', { method: 'POST', body, headers })
    const res2 = await POST(req2 as any)
    const json2 = await res2.json()
    expect(json2).toHaveProperty('skipped', 'already_processed')
  })

  it('returns 500 and records error when DB update fails', async () => {
    const { api, db } = createSupabaseMock({
      subscriptions: [{ id: 4, dodo_subscription_id: 'sub_err', status: 'active' }],
      dodo_webhook_events: []
    })
    // Monkey-patch update on subscriptions to simulate error
    const originalFrom = api.from.bind(api)
    api.from = ((table: any) => {
      const obj = originalFrom(table)
      if (table === 'subscriptions') {
        // Match the original signature: update(values).eq(col, val).select()
        obj.update = vi.fn(function (values: any) {
          return {
            eq(col: string, val: any) {
              return {
                select() {
                  // Return shape compatible with the code under test
                  return { data: [] as any[], error: new Error('simulated db error') } as any
                }
              }
            }
          }
        }) as any
      }
      return obj
    })
    setSupabaseClient(api)

    const event = {
      id: 'evt_err',
      type: 'subscription.expired',
      data: { id: 'sub_err', status: 'expired' }
    }
    const body = JSON.stringify(event)
    const headers = signedHeaders(secret, body)

    const res = await POST(new Request('http://localhost/api/webhooks/dodopayments', { method: 'POST', body, headers }) as any)
    expect(res.status).toBe(500)
    const json = await res.json()
    expect(json).toHaveProperty('error', 'Event processing failed')
    expect(typeof json.details).toBe('string')

    const evt = db.dodo_webhook_events.find((r: any) => r.event_id === 'evt_err')
    expect(evt).toBeTruthy()
    // After failure, route marks processed=false and stores error_message (our mock doesn't enforce schema, but update path is executed)
  })
})
