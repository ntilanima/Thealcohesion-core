const { contextBridge, ipcRenderer } = require('electron')

if (!ipcRenderer) throw new Error('ipcRenderer is undefined! Check preload path.')

const { contextBridge } = require('electron')

contextBridge.exposeInMainWorld('kiosk', {
  isOnline: () => navigator.onLine
})

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

//The Genesis Handshake
contextBridge.exposeInMainWorld('vpu', {
  sendMessage: (msg) => ipcRenderer.send('vpu-message', msg),
  onMessage: (callback) => ipcRenderer.on('vpu-reply', (event, data) => callback(data)),

  // NEW: Secure Handshake for the 2025-12-26 Allotment
  verifyAllotment: async (investorKey) => {
    return await ipcRenderer.invoke('get-allotment-status', investorKey);
  },

  checkPermission: async (appName) => {
    // ... your existing checkPermission logic ...
  }
})
