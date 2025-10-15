const { app, safeStorage } = require('electron')
const fs = require('fs')
const path = require('path')

const TOKENS_DIR = path.join(app.getPath('userData'), 'tokens')
const TOKEN_FILE = path.join(TOKENS_DIR, 'supabase_token.bin')

function ensureDir() {
  if (!fs.existsSync(TOKENS_DIR)) fs.mkdirSync(TOKENS_DIR, { recursive: true })
}

function saveAccessToken(token) {
  ensureDir()
  try {
    const buffer = Buffer.from(String(token), 'utf8')
    const encrypted = safeStorage.isEncryptionAvailable()
      ? safeStorage.encryptString(token)
      : buffer
    fs.writeFileSync(TOKEN_FILE, encrypted)
    return true
  } catch (e) {
    console.error('[AuthManager] Failed to save token:', e)
    return false
  }
}

function loadAccessToken() {
  try {
    if (!fs.existsSync(TOKEN_FILE)) return null
    const data = fs.readFileSync(TOKEN_FILE)
    if (safeStorage.isEncryptionAvailable()) {
      return safeStorage.decryptString(data)
    }
    return data.toString('utf8')
  } catch (e) {
    console.warn('[AuthManager] Failed to load token:', e)
    return null
  }
}

function clearAccessToken() {
  try {
    if (fs.existsSync(TOKEN_FILE)) fs.rmSync(TOKEN_FILE)
    return true
  } catch (e) {
    console.warn('[AuthManager] Failed to clear token:', e)
    return false
  }
}

module.exports = { saveAccessToken, loadAccessToken, clearAccessToken }
