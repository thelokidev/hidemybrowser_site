const { app, BrowserWindow, shell, protocol } = require('electron')
const path = require('path')
const url = require('url')
const { saveAccessToken } = require('./auth-manager')
const { SubscriptionManager } = require('./subscription-manager')

let mainWindow
let subManager

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 420,
    height: 520,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  })

  const authHtml = path.join(__dirname, '..', 'pages', 'auth', 'auth-window.html')
  mainWindow.loadFile(authHtml)
}

function handleDeepLink(deepLinkUrl) {
  try {
    const parsed = new URL(deepLinkUrl)
    if (parsed.protocol !== 'hidemybrowser:') return
    const token = parsed.searchParams.get('access_token')
    if (token) {
      saveAccessToken(token)
      if (!subManager) subManager = new SubscriptionManager({ baseUrl: process.env.WEB_BASE || process.env.APP_BASE_URL })
      subManager.start()
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.executeJavaScript(`document.getElementById('hint').textContent = 'Authenticated. Subscription state will update shortly.'`)
      }
    }
  } catch (e) {
    console.warn('[Main] Deep link parse error:', e)
  }
}

const gotLock = app.requestSingleInstanceLock()
if (!gotLock) {
  app.quit()
} else {
  app.on('second-instance', (_event, argv) => {
    // Windows passes deep link as arg
    const linkArg = argv.find(a => typeof a === 'string' && a.startsWith('hidemybrowser://'))
    if (linkArg) handleDeepLink(linkArg)
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore()
      mainWindow.focus()
    }
  })
}

app.whenReady().then(() => {
  // Register protocol handler
  if (process.platform === 'win32') {
    app.setAsDefaultProtocolClient('hidemybrowser')
  } else if (process.platform === 'darwin') {
    app.setAsDefaultProtocolClient('hidemybrowser')
  }

  createWindow()

  // macOS deep link handling
  app.on('open-url', (event, deepLinkUrl) => {
    event.preventDefault()
    handleDeepLink(deepLinkUrl)
  })
})

app.on('will-finish-launching', () => {
  app.on('open-url', (event, deepLinkUrl) => {
    event.preventDefault()
    handleDeepLink(deepLinkUrl)
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow()
})
