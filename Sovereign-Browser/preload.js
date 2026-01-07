const { contextBridge, ipcRenderer } = require('electron');

// 1. Safety Check
if (!ipcRenderer) {
    console.error('IPC Renderer is unavailable. Bridging failed.');
}

// 2. The Unified Bridge
// We expose everything under one 'vpu' or 'api' object to keep it clean.
contextBridge.exposeInMainWorld('vpu', {
    // Basic Connectivity
    isOnline: () => navigator.onLine,

    // The Genesis Handshake (Allotment Verification)
    verifyAllotment: async (investorKey) => {
        return await ipcRenderer.invoke('get-allotment-status', investorKey);
    },

    // System Transition (Switching from Kiosk to OS)
    bootOS: async () => {
        return await ipcRenderer.invoke('boot-os-core');
    },

    // Messaging System
    sendMessage: (msg) => ipcRenderer.send('vpu-message', msg),
    
    // Improved Listener (prevents memory leaks)
    onMessage: (callback) => {
        const subscription = (event, data) => callback(data);
        ipcRenderer.on('vpu-reply', subscription);
        
        // Return a cleanup function
        return () => ipcRenderer.removeListener('vpu-reply', subscription);
    },

    // Permission Logic
    checkPermission: async (appName) => {
        return new Promise((resolve) => {
            const listener = (event, data) => {
                if (data.app === appName || data.success || data.error) {
                    ipcRenderer.removeListener('vpu-reply', listener);
                    resolve(data);
                }
            };
            ipcRenderer.on('vpu-reply', listener);
            ipcRenderer.send('vpu-message', { app: appName });
        });
    }
});