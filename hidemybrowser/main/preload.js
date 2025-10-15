const { contextBridge, shell } = require('electron')

contextBridge.exposeInMainWorld('electron', {
  openExternal: (link) => {
    try { shell.openExternal(link) } catch {}
  },
})
