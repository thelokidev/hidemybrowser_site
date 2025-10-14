import styles from './AdminDashboard.module.css'
import { createAdminClient } from '@/lib/supabase/admin'

export const revalidate = 0

async function getMetrics() {
  const supabase = createAdminClient()

  const since30 = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()

  const [subsActive, subsSuspended, subsExpired, subsOnHold, webhookUnprocessed, webhookErrors, retryQueue, recentPayments, recentWebhooks, revenueRows, customersTotal] = await Promise.all([
    supabase.from('subscriptions').select('id', { count: 'exact', head: true }).eq('status', 'active'),
    supabase.from('subscriptions').select('id', { count: 'exact', head: true }).eq('status', 'suspended'),
    supabase.from('subscriptions').select('id', { count: 'exact', head: true }).eq('status', 'expired'),
    supabase.from('subscriptions').select('id', { count: 'exact', head: true }).eq('status', 'on_hold'),
    supabase.from('dodo_webhook_events').select('event_id', { count: 'exact', head: true }).eq('processed', false),
    supabase.from('dodo_webhook_events').select('event_id', { count: 'exact', head: true }).not('error_message', 'is', null),
    supabase.from('webhook_retry_queue').select('id', { count: 'exact', head: true }),
    supabase.from('payments').select('dodo_payment_id, status, amount, currency, updated_at').order('updated_at', { ascending: false }).limit(8),
    supabase.from('dodo_webhook_events').select('event_id, event_type, processed, error_message').order('created_at', { ascending: false }).limit(10),
    supabase.from('payments').select('amount, currency, updated_at').eq('status','succeeded').gte('updated_at', since30),
    supabase.from('customers').select('user_id', { count: 'exact', head: true })
  ])

  // Aggregate last 30 days revenue by day (in major units)
  const byDay: Record<string, number> = {}
  for (const r of revenueRows.data ?? []) {
    const day = new Date(r.updated_at).toISOString().slice(0,10)
    const amt = typeof r.amount === 'number' ? r.amount / 100 : Number(r.amount) || 0
    byDay[day] = (byDay[day] || 0) + amt
  }
  const labels: string[] = []
  const values: number[] = []
  for (let i = 29; i >= 0; i--) {
    const d = new Date(Date.now() - i*24*60*60*1000).toISOString().slice(0,10)
    labels.push(d)
    values.push(byDay[d] || 0)
  }
  const total30 = values.reduce((a,b)=>a+b,0)
  const mrrEstimate = total30 // heuristic: last 30d revenue

  return {
    active: subsActive.count ?? 0,
    suspended: subsSuspended.count ?? 0,
    expired: subsExpired.count ?? 0,
    on_hold: subsOnHold.count ?? 0,
    webhookUnprocessed: webhookUnprocessed.count ?? 0,
    webhookErrors: webhookErrors.count ?? 0,
    retryQueueCount: retryQueue.count ?? 0,
    recentPayments: recentPayments.data ?? [],
    recentWebhooks: recentWebhooks.data ?? [],
    revenueLabels: labels,
    revenueValues: values,
    mrrEstimate,
    customers: customersTotal.count ?? 0,
  }
}

function Pill({ children, tone }: { children: React.ReactNode; tone?: 'success' | 'danger' | 'warn' | 'muted' }) {
  const toneClass = tone === 'success' ? styles.badgeSuccess : tone === 'danger' ? styles.badgeDanger : tone === 'warn' ? styles.badgeWarn : styles.badgeMuted
  return <span className={[styles.pill, toneClass].join(' ')}>{children}</span>
}

export default async function AdminDashboardPage() {
  const metrics = await getMetrics()

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <div className={styles.title}>Admin Dashboard</div>
          <div className={styles.subtitle}>Operational overview of subscriptions, payments, and webhooks</div>
        </div>
      </div>

      <div className={styles.grid}>
        {/* Revenue Trend */}
        <div className={[styles.card, styles.chartCard].join(' ')}>
          <div className={styles.cardHeader}><span>Revenue (Last 30 Days)</span><Pill tone="muted">MRR est: ${(metrics.mrrEstimate).toFixed(2)}</Pill></div>
          <div className={styles.chartWrap}>
            <svg className={styles.chartWrap} viewBox="0 0 600 220" preserveAspectRatio="none">
              {(() => {
                const max = Math.max(1, ...metrics.revenueValues)
                const points = metrics.revenueValues.map((v, i) => {
                  const x = (i/(metrics.revenueValues.length-1)) * 580 + 10
                  const y = 200 - (v/max)*180 + 10
                  return `${x},${y}`
                }).join(' ')
                return (
                  <>
                    <polyline fill="none" stroke="url(#grad)" strokeWidth="3" points={points} />
                    <defs>
                      <linearGradient id="grad" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#7c3aed" />
                        <stop offset="100%" stopColor="#06b6d4" />
                      </linearGradient>
                    </defs>
                  </>
                )
              })()}
            </svg>
          </div>
          <div className={styles.footerNote}>Heuristic MRR ≈ sum of succeeded payments in last 30 days.</div>
        </div>

        {/* KPIs */}
        <div className={[styles.card, styles.kpi].join(' ')}>
          <div className={styles.cardHeader}><span>Active</span><Pill tone="success">healthy</Pill></div>
          <div className={styles.cardValue}>{metrics.active}</div>
        </div>
        <div className={[styles.card, styles.kpi].join(' ')}>
          <div className={styles.cardHeader}><span>Suspended</span><Pill tone="warn">grace</Pill></div>
          <div className={styles.cardValue}>{metrics.suspended}</div>
        </div>
        <div className={[styles.card, styles.kpi].join(' ')}>
          <div className={styles.cardHeader}><span>Expired</span><Pill tone="danger">action</Pill></div>
          <div className={styles.cardValue}>{metrics.expired}</div>
        </div>
        <div className={[styles.card, styles.kpi].join(' ')}>
          <div className={styles.cardHeader}><span>On Hold</span><Pill tone="muted">pending</Pill></div>
          <div className={styles.cardValue}>{metrics.on_hold}</div>
        </div>

        {/* Webhook Health */}
        <div className={[styles.card, styles.panel].join(' ')}>
          <div className={styles.cardHeader}><span>Webhook Health</span><Pill tone={metrics.webhookErrors > 0 ? 'danger' : 'success'}>{metrics.webhookErrors > 0 ? 'errors' : 'ok'}</Pill></div>
          <div className={styles.row}>
            <Pill tone={metrics.webhookUnprocessed > 0 ? 'warn' : 'success'}>Unprocessed: {metrics.webhookUnprocessed}</Pill>
            <Pill tone={metrics.retryQueueCount > 0 ? 'warn' : 'muted'}>Retry Queue: {metrics.retryQueueCount}</Pill>
          </div>
          <div className={styles.footerNote}>Investigate errors and ensure retry queue drains over time.</div>
        </div>

        {/* Conversion Snapshot */}
        <div className={[styles.card, styles.panel].join(' ')}>
          <div className={styles.cardHeader}><span>Conversion Snapshot</span><Pill tone="muted">last 30d</Pill></div>
          <div className={styles.row}>
            <Pill tone="muted">Users: {metrics.customers}</Pill>
            <Pill tone="success">Active Subs: {metrics.active}</Pill>
            <Pill tone="warn">Suspended: {metrics.suspended}</Pill>
          </div>
          <div className={styles.footerNote}>Basic funnel approximation using user and subscription counts.</div>
        </div>

        {/* Recent Payments */}
        <div className={[styles.card, styles.panel].join(' ')}>
          <div className={styles.cardHeader}><span>Recent Payments</span></div>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>ID</th>
                <th>Status</th>
                <th>Amount</th>
                <th>Updated</th>
              </tr>
            </thead>
            <tbody>
              {metrics.recentPayments.map((p: any) => (
                <tr key={p.dodo_payment_id}>
                  <td>{p.dodo_payment_id}</td>
                  <td><Pill tone={p.status === 'succeeded' ? 'success' : p.status === 'failed' ? 'danger' : 'muted'}>{p.status}</Pill></td>
                  <td>{typeof p.amount === 'number' ? (p.amount / 100).toFixed(2) : p.amount} {p.currency}</td>
                  <td>{new Date(p.updated_at).toLocaleString()}</td>
                </tr>
              ))}
              {metrics.recentPayments.length === 0 && (
                <tr><td colSpan={4} style={{ color: 'var(--muted)' }}>No payments yet</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Recent Webhooks */}
        <div className={[styles.card, styles.panel].join(' ')}>
          <div className={styles.cardHeader}><span>Recent Webhooks</span></div>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>ID</th>
                <th>Type</th>
                <th>Status</th>
                <th>Error</th>
              </tr>
            </thead>
            <tbody>
              {metrics.recentWebhooks.map((w: any) => (
                <tr key={w.event_id}>
                  <td>{w.event_id}</td>
                  <td>{w.event_type}</td>
                  <td>{w.processed ? <Pill tone="success">processed</Pill> : <Pill tone="warn">pending</Pill>}</td>
                  <td style={{ maxWidth: 260, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{w.error_message || '-'}</td>
                </tr>
              ))}
              {metrics.recentWebhooks.length === 0 && (
                <tr><td colSpan={4} style={{ color: 'var(--muted)' }}>No webhook events yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
