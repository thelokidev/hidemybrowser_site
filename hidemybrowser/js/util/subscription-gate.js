const { SubscriptionManager } = require('../../main/subscription-manager')

// Simple singleton gate using the main process SubscriptionManager via IPC could be ideal.
// For simplicity in this scaffold, we create a renderer-side helper that queries state via a callback.

let manager

function initGate(options = {}) {
  if (!manager) manager = new SubscriptionManager(options)
  manager.start()
  return manager
}

function canUseFeature() {
  if (!manager) return false
  const s = manager.state
  return !!s.allow
}

module.exports = { initGate, canUseFeature }
