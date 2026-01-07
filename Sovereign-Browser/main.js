const { app, BrowserWindow, globalShortcut, ipcMain, session } = require('electron')
const path = require('path')
const keyboardPolicies = require('./keyboard-policies')
const fs = require('fs'); // <--- ADD THIS LINE HERE

// Disable GPU to avoid libva errors
app.disableHardwareAcceleration()

let mainWindow

// Permissions for OS apps
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

// Create the main window
function createWindow() {
  mainWindow = new BrowserWindow({
    fullscreen: true,
    kiosk: true,
    autoHideMenuBar: true,
    frame: false,
    icon: path.join(__dirname, 'assets/icon.png'), // Browser icon
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js') // Preload script
    }
  })

  //Load Browser Kiosk welcome page
    // ✅ LOAD ONLY THE KIOSK
  mainWindow.loadFile(path.join(__dirname, 'ui/kiosk.html'))

   // Logic to prevent "White Flash" on load
  mainWindow.once('ready-to-show', () => mainWindow.show())
  
  // 3. THEALCOHESION SECURITY POLICIES
  // Block window close
  mainWindow.on('close', (e) => {
    e.preventDefault()
    console.log('Window close blocked. Use safe exit procedure.')
  })

  // Block external navigation & reload
  mainWindow.webContents.on('will-navigate', (event, url) => {
    if (!url.startsWith('file://')) {
      event.preventDefault()
      console.log('External navigation blocked:', url)
    }
  })

  mainWindow.webContents.on('will-redirect', (event, url) => {
    if (!url.startsWith('file://')) {
      event.preventDefault()
      console.log('Redirect blocked:', url)
    }
  })

  // Disable reloading via keyboard (F5, Ctrl+R)
  mainWindow.webContents.on('before-input-event', (event, input) => {
    if ((input.key === 'F5') || (input.control && input.key.toLowerCase() === 'r')) {
      event.preventDefault()
      console.log('Reload blocked')
    }
  })

  // Block all external HTTP requests
  session.defaultSession.webRequest.onBeforeRequest((details, callback) => {
    if (!details.url.startsWith('file://')) {
      console.log('External request blocked:', details.url)
      callback({ cancel: true })
    } else {
      callback({ cancel: false })
    }
  })
}


// VPU messaging & permissions
// 5. IPC HANDLERS (The Bridge)
// Handler to trigger the OS boot from the Kiosk
ipcMain.handle('boot-os-core', async () => {
  const osPath = path.join(__dirname, '../Thealcohesion-core/index.html');
  
  if (fs.existsSync(osPath)) {
    mainWindow.loadFile(osPath);
    return { success: true };
  } else {
    console.error("OS Core not found at:", osPath);
    return { success: false, error: "OS_NOT_FOUND" };
  }
});

// ADD THE NEW HANDSHAKE LOGIC HERE:
ipcMain.handle('get-allotment-status', async (event, investorKey) => {
  console.log(`Verifying Handshake for: ${investorKey}`);
  return {
    system: "Thealcohesion OS",
    partition: "Genesis",
    active: true
  };
}); 

// App ready
app.whenReady().then(() => {
  createWindow()
  registerGlobalKeys()

// ADD EXTRA SHORTCUTS HERE:
  globalShortcut.register('Escape', () => {
    console.log('Escape blocked via GlobalShortcut');
  }); // This is the }) for the shortcut

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
}) 

// Close app on all windows closed (except macOS)
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

// Unregister shortcuts on quit
app.on('will-quit', () => {
  globalShortcut.unregisterAll()
})

