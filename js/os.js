import { registry } from './registry.js';

class TLC_Kernel {
    constructor() {
        this.pinnedApps = ['time', 'tnfi', 'terminal', 'files', 'browser', 'messages', 'camera', 'settings'];
        this.runningApps = new Set();
        console.log("Kernel: Sovereign Core Online.");
    }

    // Force initialization
    init() {
        const loginBtn = document.getElementById('login-btn');
        if (loginBtn) {
            loginBtn.onclick = (e) => {
                e.preventDefault();
                console.log("Kernel: Identity Verified.");
                this.transitionToShell();
            };
        }
    }

    transitionToShell() {
        document.getElementById('login-gate').style.display = 'none';
        document.getElementById('top-bar').classList.remove('hidden');
        const root = document.getElementById('os-root');
        root.style.display = 'flex';
        this.bootShell();
    }

    bootShell() {
        const dock = document.getElementById('side-dock');
        if (!dock) return;
        dock.innerHTML = '';

        this.pinnedApps.forEach(appId => {
            const app = registry.find(a => a.id === appId);
            const dItem = document.createElement('div');
            dItem.className = `dock-item ${this.runningApps.has(appId) ? 'running' : ''}`;
            dItem.innerHTML = `<span>${app ? app.icon : '·'}</span>`;
            dItem.onclick = () => this.launchApp(appId);
            dock.appendChild(dItem);
        });

        // Add Menu Button
        const menuBtn = document.createElement('div');
        menuBtn.className = 'dock-bottom-trigger';
        for(let i=0; i<9; i++) menuBtn.innerHTML += `<div class="menu-dot"></div>`;
        menuBtn.onclick = () => this.openAppMenu();
        dock.appendChild(menuBtn);
    }

    launchApp(appId) {
        const app = registry.find(a => a.id === appId);
        if (!app) return;

        const winId = `win-${appId}`;
        if (this.runningApps.has(appId)) return;

        this.runningApps.add(appId);
        this.bootShell();

        const win = document.createElement('div');
        win.className = 'os-window';
        win.id = winId;
        win.style.zIndex = 100;

        win.innerHTML = `
            <div class="window-header">
                <span>${app.icon} ${app.name}</span>
                <div class="window-controls">
                    <button onclick="window.kernel.closeApp('${appId}', '${winId}')">×</button>
                </div>
            </div>
            <div class="window-content" id="canvas-${appId}">Loading ${app.name}...</div>
        `;
        document.getElementById('workspace').appendChild(win);

        if (appId === 'time' && window.thealTimeApp) {
            document.getElementById(`canvas-${appId}`).innerHTML = thealTimeApp.render();
            thealTimeApp.reboot();
        }
    }

    closeApp(appId, winId) {
        const win = document.getElementById(winId);
        if (win) win.remove();
        this.runningApps.delete(appId);
        this.bootShell();
    }

    openAppMenu() {
        alert("Sovereign App Menu: " + registry.length + " apps found.");
    }
}

// CRITICAL: Initialize and attach to window
const kernelInstance = new TLC_Kernel();
window.kernel = kernelInstance; 
window.addEventListener('DOMContentLoaded', () => kernelInstance.init());