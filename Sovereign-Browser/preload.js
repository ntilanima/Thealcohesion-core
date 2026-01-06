const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('vpu', {
  sendMessage: (msg) => ipcRenderer.send('vpu-message', msg),
  onMessage: (callback) => ipcRenderer.on('vpu-reply', (event, data) => callback(data)),

  // Optional: check permissions directly in OS
  checkPermission: async (appName) => {
    return new Promise((resolve) => {
      ipcRenderer.once('vpu-reply', (event, data) => resolve(data))
      ipcRenderer.send('vpu-message', { app: appName })
    })
  }
})
