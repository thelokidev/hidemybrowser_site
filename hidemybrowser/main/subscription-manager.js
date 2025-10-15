const { loadAccessToken, clearAccessToken } = require('./auth-manager')

const DEFAULT_INTERVAL_MS = 5 * 60 * 1000 // 5 minutes

class SubscriptionManager {
  constructor(options = {}) {
    this.baseUrl = options.baseUrl || process.env.WEB_BASE || process.env.APP_BASE_URL || 'http://localhost:3000'
    this.intervalMs = options.intervalMs || DEFAULT_INTERVAL_MS
    this._timer = null
    this._state = { allow: false, status: null, inGrace: false, graceEnd: null, lastCheckedAt: null }
  }

  get state() { return this._state }

  async validateOnce() {
    const token = loadAccessToken()
    if (!token) {
      this._state = { allow: false, status: 'no_token', inGrace: false, graceEnd: null, lastCheckedAt: new Date() }
      return this._state
    }

    const url = new URL('/api/desktop/subscription', this.baseUrl).toString()

    // Prefer global fetch (Node 18+/Electron 20+).
    let fetcher = global.fetch
    if (!fetcher) {
      fetcher = (...args) => import('node-fetch').then(m => m.default(...args))
    }

    try {
      const res = await fetcher(url, {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) {
        if (res.status === 401) {
          // token invalid
          this._state = { allow: false, status: 'unauthorized', inGrace: false, graceEnd: null, lastCheckedAt: new Date() }
          return this._state
        }
        throw new Error(`HTTP ${res.status}`)
      }
      const json = await res.json()
      this._state = {
        allow: !!json.allow,
        status: json.status ?? null,
        inGrace: !!json.inGrace,
        graceEnd: json.graceEnd ?? null,
        lastCheckedAt: new Date(),
      }
      return this._state
    } catch (e) {
      console.warn('[SubscriptionManager] validate failed:', e)
      this._state = { allow: false, status: 'error', inGrace: false, graceEnd: null, lastCheckedAt: new Date() }
      return this._state
    }
  }

  start() {
    if (this._timer) return
    this.validateOnce()
    this._timer = setInterval(() => this.validateOnce(), this.intervalMs)
  }

  stop() {
    if (this._timer) clearInterval(this._timer)
    this._timer = null
  }
}

module.exports = { SubscriptionManager }
