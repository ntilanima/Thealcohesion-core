const { contextBridge, ipcRenderer } = require('electron')

if (!ipcRenderer) throw new Error('ipcRenderer is undefined! Check preload path.')

contextBridge.exposeInMainWorld('vpu', {
  sendMessage: (msg) => ipcRenderer.send('vpu-message', msg),
  onMessage: (callback) => ipcRenderer.on('vpu-reply', (event, data) => callback(data)),

  checkPermission: async (appName) => {
    if (!ipcRenderer) throw new Error('ipcRenderer not available')
    return new Promise((resolve) => {
      const listener = (data) => {
        if (data.app === appName || data.success || data.error) {
          ipcRenderer.removeListener('vpu-reply', listener)
          resolve(data)
        }
      }
      ipcRenderer.on('vpu-reply', listener)
      ipcRenderer.send('vpu-message', { app: appName })
    })
  }
})
