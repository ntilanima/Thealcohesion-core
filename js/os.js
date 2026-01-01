import { registry } from './registry.js';

class TLC_Kernel {
    constructor() {
        // Reduced to 8 Pinned Apps for consistent mobile/desktop scale
        this.pinnedApps = ['time', 'tnfi', 'terminal', 'files', 'browser', 'messages', 'camera', 'settings']; 
        this.runningApps = new Set(); 
        
        console.log("Kernel: Initializing Sovereign Core...");
        window.addEventListener('DOMContentLoaded', () => this.init());
    }

    init() {
        const loginBtn = document.getElementById('login-btn');
        if (loginBtn) {
            loginBtn.onclick = (e) => {
                e.preventDefault();
                this.verifyIdentity();
            };
        }
    }

    verifyIdentity() {
        this.transitionToShell();
    }

    transitionToShell() {
        const gate = document.getElementById('login-gate');
        const root = document.getElementById('os-root');
        const top = document.getElementById('top-bar');

        if (gate) gate.style.display = 'none';
        if (top) top.classList.remove('hidden');
        if (root) root.style.display = 'flex'; 
        
        this.bootShell();
    }

    bootShell() {
        const dock = document.getElementById('side-dock');
        if (!dock) return;
        
        dock.innerHTML = ''; 

        // 1. Render exactly 8 slots
        this.pinnedApps.forEach((appId) => {
            const app = registry.find(a => a.id === appId);
            const dItem = document.createElement('div');
            
            dItem.className = `dock-item ${this.runningApps.has(appId) ? 'running' : ''}`;
            
            if (app) {
                dItem.innerHTML = `<span>${app.icon}</span>`;
                dItem.title = app.name;
                dItem.onclick = () => this.launchApp(appId);
            } else {
                dItem.innerHTML = `<span style="opacity: 0.2">·</span>`;
            }
            dock.appendChild(dItem);
        });

        // 2. The "⣿" Menu Button - CSS margin-top: auto will push this to the far bottom
        const menuBtn = document.createElement('div');
        menuBtn.className = 'dock-bottom-trigger';

        // Create 9 dots for a professional launcher look
        menuBtn.innerHTML = `
            <div class="menu-dot"></div><div class="menu-dot"></div><div class="menu-dot"></div>
            <div class="menu-dot"></div><div class="menu-dot"></div><div class="menu-dot"></div>
            <div class="menu-dot"></div><div class="menu-dot"></div><div class="menu-dot"></div>
        `;

        menuBtn.onclick = () => this.openAppMenu();
        dock.appendChild(menuBtn);
    }

    launchApp(appId) {
        const app = registry.find(a => a.id === appId);
        if (!app) return;

        const winId = `win-${appId}`;
        if (this.runningApps.has(appId)) {
            this.focusWindow(winId);
            return;
        }

        this.runningApps.add(appId);
        this.bootShell(); 

        const win = document.createElement('div');
        win.className = 'os-window';
        win.id = winId;
        win.style.top = "80px";
        win.style.left = "100px";
        win.style.zIndex = this.getTopZIndex();

        win.innerHTML = `
            <div class="window-header" onmousedown="kernel.focusWindow('${winId}')">
                <span class="title">${app.icon} ${app.name}</span>
                <div class="window-controls">
                    <button class="win-btn hide" onclick="kernel.minimizeWindow('${winId}')">─</button>
                    <button class="win-btn expand" onclick="kernel.toggleMaximize('${winId}')">▢</button>
                    <button class="win-btn close" onclick="kernel.closeApp('${appId}', '${winId}')">×</button>
                </div>
            </div>
            <div class="window-content" id="canvas-${appId}">
                <div class="app-loading">Synchronizing...</div>
            </div>
        `;

        document.getElementById('workspace').appendChild(win);
        this.makeDraggable(win);

        // App Content Routing
        const container = document.getElementById(`canvas-${appId}`);
        if (appId === 'time') {
            container.innerHTML = thealTimeApp.render();
            requestAnimationFrame(() => thealTimeApp.reboot());
        } else if (appId === 'tnfi') {
            // Integration of Saved Investor Data
            container.innerHTML = `
                <div style="padding:20px;">
                    <h3>Bank of Sovereign</h3>
                    <hr style="opacity:0.1">
                    <p>Status: <strong>Verified Investor</strong></p>
                    <p>Allotment: <strong>EPOS Initial Grant</strong></p>
                    <div style="background:rgba(255,255,255,0.05); padding:15px; border-radius:8px; margin-top:10px;">
                        Accessing 2025 Allotment Records...
                    </div>
                </div>`;
        } else {
            container.innerHTML = `<div style="padding:20px; text-align:center;"><h2>${app.icon}</h2><p>${app.name} Active</p></div>`;
        }
    }

    openAppMenu() {
        const winId = 'win-app-menu';
        if (document.getElementById(winId)) {
            this.closeWindow(winId);
            return;
        }

        const win = document.createElement('div');
        win.className = 'os-window maximized'; 
        win.id = winId;
        
        let gridHTML = '<div class="app-drawer-grid">';
        registry.forEach(app => {
            gridHTML += `
                <div class="drawer-icon" onclick="kernel.launchApp('${app.id}'); kernel.closeWindow('win-app-menu');">
                    <span>${app.icon}</span>
                    <p>${app.name}</p>
                </div>`;
        });
        gridHTML += '</div>';

        win.innerHTML = `
            <div class="window-header"><span>Sovereign Applications</span></div>
            <div class="window-content">${gridHTML}</div>
        `;
        document.getElementById('workspace').appendChild(win);
    }

    closeApp(appId, winId) {
        this.closeWindow(winId);
        this.runningApps.delete(appId);
        this.bootShell();
    }

    closeWindow(id) {
        const el = document.getElementById(id);
        if (el) el.remove();
    }

    minimizeWindow(id) {
        const el = document.getElementById(id);
        if (el) el.style.display = 'none';
    }

    toggleMaximize(id) {
        const el = document.getElementById(id);
        if (el) el.classList.toggle('maximized');
    }

    focusWindow(id) {
        const el = document.getElementById(id);
        if (el) el.style.zIndex = this.getTopZIndex();
    }

    getTopZIndex() {
        const wins = document.querySelectorAll('.os-window');
        let max = 1000;
        wins.forEach(w => { 
            const z = parseInt(w.style.zIndex) || 1000;
            if (z > max) max = z; 
        });
        return max + 1;
    }

    makeDraggable(el) {
        const header = el.querySelector('.window-header');
        header.onmousedown = (e) => {
            if (e.target.closest('.win-btn') || el.classList.contains('maximized')) return;
            this.focusWindow(el.id);
            let startX = e.clientX, startY = e.clientY;
            let startTop = parseInt(window.getComputedStyle(el).top);
            let startLeft = parseInt(window.getComputedStyle(el).left);
            const move = (e) => {
                el.style.top = (startTop + (e.clientY - startY)) + "px";
                el.style.left = (startLeft + (e.clientX - startX)) + "px";
            };
            const stop = () => {
                document.removeEventListener('mousemove', move);
                document.removeEventListener('mouseup', stop);
            };
            document.addEventListener('mousemove', move);
            document.addEventListener('mouseup', stop);
        };
    }
}

const kernel = new TLC_Kernel();
window.kernel = kernel;