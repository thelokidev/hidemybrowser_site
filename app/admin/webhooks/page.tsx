import styles from './Webhooks.module.css'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextRequest } from 'next/server'

export const revalidate = 0

async function fetchWebhooks(params: { q?: string; type?: string; processed?: string }) {
  const supabase = createAdminClient()
  let query = supabase.from('dodo_webhook_events').select('event_id, event_type, processed, error_message, created_at').order('created_at', { ascending: false }).limit(100)
  if (params.type) query = query.eq('event_type', params.type)
  if (params.processed === 'yes') query = query.eq('processed', true)
  if (params.processed === 'no') query = query.eq('processed', false)
  if (params.q) query = query.ilike('event_id', `%${params.q}%`)
  const { data } = await query

  const { data: retryItems } = await supabase.from('webhook_retry_queue').select('event_id, retry_count, next_retry_at, last_error').order('updated_at', { ascending: false }).limit(50)

  return { events: data ?? [], retry: retryItems ?? [] }
}

function Pill({ children }: { children: React.ReactNode }) {
  return <span className={styles.pill}>{children}</span>
}

export default async function WebhooksPage({ searchParams }: { searchParams: { q?: string; type?: string; processed?: string } }) {
  const { events, retry } = await fetchWebhooks(searchParams)

  return (
    <div className={styles.container}>
      <div className={styles.title}>Webhooks</div>
      <div className={styles.subtitle}>Explore events, filter, and export. Retry queue shown below.</div>

      <form className={styles.toolbar} method="get">
        <input className={styles.input} name="q" placeholder="Search by event ID" defaultValue={searchParams.q || ''} />
        <select className={styles.select} name="type" defaultValue={searchParams.type || ''}>
          <option value="">All Types</option>
          <option value="payment.succeeded">payment.succeeded</option>
          <option value="payment.failed">payment.failed</option>
          <option value="subscription.active">subscription.active</option>
          <option value="subscription.updated">subscription.updated</option>
          <option value="subscription.expired">subscription.expired</option>
        </select>
        <select className={styles.select} name="processed" defaultValue={searchParams.processed || ''}>
          <option value="">Any Status</option>
          <option value="yes">Processed</option>
          <option value="no">Unprocessed</option>
        </select>
        <button className={styles.button} type="submit">Filter</button>
        <a className={[styles.button, styles.ghost, styles.csv].join(' ')} href={`/api/admin/webhooks/export?${new URLSearchParams(searchParams as any).toString()}`}>Export CSV</a>
      </form>

      <div className={styles.card}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Event ID</th>
              <th>Type</th>
              <th>Status</th>
              <th>Error</th>
              <th>Created</th>
            </tr>
          </thead>
          <tbody>
            {events.map((e: any) => (
              <tr key={e.event_id}>
                <td>{e.event_id}</td>
                <td>{e.event_type}</td>
                <td>{e.processed ? <Pill>processed</Pill> : <Pill>pending</Pill>}</td>
                <td style={{ maxWidth: 260, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.error_message || '-'}</td>
                <td>{new Date(e.created_at).toLocaleString()}</td>
              </tr>
            ))}
            {events.length === 0 && (
              <tr><td colSpan={5} style={{ color: 'var(--muted)' }}>No events</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <div className={styles.title} style={{ marginTop: 24 }}>Retry Queue</div>
      <div className={styles.card}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Event ID</th>
              <th>Retry Count</th>
              <th>Next Retry</th>
              <th>Last Error</th>
            </tr>
          </thead>
          <tbody>
            {retry.map((r: any, idx: number) => (
              <tr key={r.event_id + idx}>
                <td>{r.event_id}</td>
                <td>{r.retry_count}</td>
                <td>{r.next_retry_at ? new Date(r.next_retry_at).toLocaleString() : '-'}</td>
                <td style={{ maxWidth: 260, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.last_error || '-'}</td>
              </tr>
            ))}
            {retry.length === 0 && (
              <tr><td colSpan={4} style={{ color: 'var(--muted)' }}>No retry items</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
