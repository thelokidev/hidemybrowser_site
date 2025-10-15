<!-- b4099801-2208-415d-b967-862eece211ef 28596079-8ad0-491a-b845-b30d540de088 -->
# Non-Breaking Desktop Auth + Subscription Plan (Refined with References)

### Goals

- Preserve existing deep-link Supabase PKCE flow for desktop auth; no regressions.
- Add a clean renewal/paywall loop when a subscription expires.
- Optionally introduce device tokens behind a feature flag, without changing defaults.

### Current Flow (kept as default)

- Desktop opens `/auth?desktop=1&return=hidemybrowser://auth` in system browser; web callback redirects back with `access_token`.
- Electron saves token (encrypted) and polls `GET/POST /api/desktop/subscription` with `Authorization: Bearer <token>`.
- If `allow === true` → unlock; if false → show login layer/paywall and route user to login + pricing.

### Adjustments (additive, safe)

- Electron
- Continue storing the token via `safeStorage`. Treat `allow` as the single source of truth for unlock.
- Expose poll interval via env: `DESKTOP_SUBSCRIPTION_POLL_MS` (default 300000). Do not change default behavior.
- When `allow === false` (expired or unauthorized), show login layer and open web to `/auth?desktop=1&return=hidemybrowser://auth`, then pricing if still no active sub.
- Server
- Keep `app/api/desktop/subscription/route.ts` request/response stable: `{ allow, status, inGrace?, graceEnd? }`.
- Optionally mirror `graceEnd` as headers (ignored by existing clients).
- Web UX
- Keep DodoPayments checkout; after success, webhooks update Supabase and desktop unlocks on next poll automatically.

### Renewal/Expiry Behavior (precise)

- While subscription is active (or within grace), `allow === true` → desktop unlocked.
- On expiry (and no grace), `allow === false` → desktop shows login layer and opens web to login + pricing.
- After payment succeeds and webhooks sync, next poll flips `allow === true` and desktop auto-unlocks; re-auth not required unless user signed out.
- If strict re-auth desired, set server to invalidate desktop tokens on expiry (applies to device tokens in Phase 2).

### Optional Device Tokens (behind flag `DESKTOP_DEVICE_TOKENS=1`)

- Why: Avoid storing raw Supabase JWT on desktop; enable per-device revocation/limits; smoother renewals (Cursor/Windsurf-like experience).
- DB (additive): `desktop_devices(id, user_id, device_name, created_at, last_seen_at, revoked_at, token_hash, expires_at)` with indexes on `user_id`, `revoked_at`.
- API (additive; RFC 8628 aligned fields)
- `POST /api/desktop/register` → `{ device_code, user_code, verification_uri, verification_uri_complete, expires_in, interval }`.
- `POST /api/desktop/token` → exchanges `{ device_code }` for opaque device token; on pending auth return RFC 8628 errors (`authorization_pending`, `slow_down`).
- `POST /api/desktop/introspect` → validates device token, returns `{ user_id }` and optionally rotates token (return new token via header `x-device-token`).
- `POST /api/desktop/revoke` → revoke device token by id.
- Electron (flagged)
- Show device-code pairing UI; display `user_code` + `verification_uri_complete` (or QR).
- Store opaque token via `safeStorage`; use it for `introspect`/`subscription`. If flag off, use current JWT flow.
- Dashboard (flagged)
- Devices list and per-device revoke; optional device limits per user.

### Platform Protocol Registration (required for deep links)

- Windows: Register URL protocol during installation (Registry `HKEY_CLASSES_ROOT\<scheme>` with `URL Protocol`); runtime `app.setAsDefaultProtocolClient('<scheme>')` is helpful but not sufficient for fresh installs.
- macOS: Add `CFBundleURLTypes` to `Info.plist` for the custom scheme and handle `open-url`.

### Supabase Auth Token Notes

- Access tokens are short-lived; refresh/session lifetimes are configurable in Supabase Auth settings. The desktop flow does not rely on refresh tokens; it validates access server-side. Expect occasional re-auth prompts in Phase 1 when JWT expires or is invalid. Phase 2 avoids this by using device tokens.

### Security and Resilience

- Never log tokens; keep Electron storage encrypted.
- Handle network failures as temporary lock; retry with backoff to avoid flapping.
- Webhook latency can be seconds to minutes; keep a visible “processing” state.
- Rate-limit device-code polling; short device-code TTL (5–10 minutes), single-use; store only `token_hash` at rest.

### Rollout

- Ship Adjustments + Renewal behavior first (no schema changes). Zero behavior change expected.
- Merge device-token feature behind `DESKTOP_DEVICE_TOKENS`. Keep default OFF. Toggle ON per environment when ready.

### References

- OAuth 2.0 Device Authorization Grant (RFC 8628): `https://datatracker.ietf.org/doc/html/rfc8628`
- OAuth device flow overview: `https://oauth.net/2/device-flow/`
- Electron protocol/deep linking (default protocol client, open-url handling): Electron documentation on custom protocols
- Windows URL protocol registration: Microsoft documentation on URL protocol handlers (`HKEY_CLASSES_ROOT`, `URL Protocol`)
- macOS custom URL schemes: Apple documentation for `CFBundleURLTypes`
- Supabase Auth token/session TTLs: Supabase Auth documentation (JWT lifetime, refresh behavior)

### Work Items (ordered, non-breaking)

1. Electron: ensure UI lock toggles on `allow` with no other conditions; read poll interval from `DESKTOP_SUBSCRIPTION_POLL_MS`.
2. Server: keep `/api/desktop/subscription` contract; optionally add grace headers (ignored by clients).
3. Web UX: confirm `/auth/callback` maintains `desktop=1` deep-link redirect.
4. Optional (flagged): DB migration for `desktop_devices`; add `register/token/introspect/revoke` routes (RFC 8628 aligned); implement device-code UI; add Dashboard Devices page.

### To-dos

- [ ] Gate desktop unlock strictly on allow from subscription API
- [ ] Add DESKTOP_SUBSCRIPTION_POLL_MS env support in desktop poller
- [ ] Keep desktop subscription API response stable; add optional grace headers
- [ ] Verify desktop deep-link redirect remains intact in auth callback
- [ ] Add desktop_devices table and indexes (flagged)
- [ ] Implement register/token/introspect/revoke endpoints (flagged)
- [ ] Add device-code pairing UI and token storage (flagged)
- [ ] Add devices management UI in dashboard (flagged)