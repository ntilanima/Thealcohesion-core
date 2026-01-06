const { app, BrowserWindow, globalShortcut, ipcMain } = require('electron')
const path = require('path')
const keyboardPolicies = require('./keyboard-policies')

app.disableHardwareAcceleration() // remove GPU warnings

let mainWindow
const appPermissions = {
  terminal: true,
  browser: true,
  files: false
}

// Register global keyboard policies
function registerGlobalKeys() {
  keyboardPolicies.global.forEach(policy => {
    globalShortcut.register(policy.key, () => {
      if (policy.action === 'block') console.log(`Global key blocked: ${policy.key}`)
    })
  })
}

function createWindow() {
  mainWindow = new BrowserWindow({
    fullscreen: true,
    autoHideMenuBar: true,
    icon: path.join(__dirname, 'assets/icon.png'), // <-- window icon
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  })

  mainWindow.loadFile(path.join(__dirname, '../Thealcohesion-core/index.html'))

  // Block window close
  mainWindow.on('close', (e) => {
    e.preventDefault()
    console.log('Window close blocked. Implement safe exit logic if needed.')
  })

  // Block external navigation
  mainWindow.webContents.on('will-navigate', (event, url) => {
    if (!url.startsWith('file://')) {
      event.preventDefault()
      console.log('Navigation blocked:', url)
    }
  })
}

app.whenReady().then(() => {
  createWindow()
  registerGlobalKeys()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// VPU messaging & permissions
ipcMain.on('vpu-message', (event, data) => {
  if (data.app && appPermissions[data.app] === false) {
    event.reply('vpu-reply', { error: 'Permission denied for ' + data.app })
  } else {
    event.reply('vpu-reply', { success: 'Action allowed' })
  }
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

app.on('will-quit', () => {
  globalShortcut.unregisterAll()
})
