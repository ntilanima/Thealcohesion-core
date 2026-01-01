import { registry } from './registry.js';

class TLC_Kernel {
    constructor() {
        this.pinnedApps = ['time', 'tnfi', 'terminal', 'files', 'browser', 'messages', 'camera', 'settings', 'notes', 'music', 'maps', 'store']; 
        this.runningApps = new Set(); 
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
        const user = document.getElementById('username').value;
        if (user.trim() !== "") {
            this.transitionToShell();
        } else {
            alert("Sovereign Identity Required.");
        }
    }

    transitionToShell() {
        document.getElementById('login-gate').style.display = 'none';
        document.getElementById('top-bar').classList.remove('hidden');
        const osRoot = document.getElementById('os-root');
        osRoot.style.display = 'flex';
        
        this.bootShell();
    }

    bootShell() {
        const dock = document.getElementById('side-dock');
        if (!dock) return;
        dock.innerHTML = ''; 

        // 1. Loop through the 12 Pinned Slots
        this.pinnedApps.forEach((appId) => {
            const app = registry.find(a => a.id === appId);
            
            const dItem = document.createElement('div');
            dItem.className = `dock-item ${this.runningApps.has(appId) ? 'running' : ''}`;
            
            // If the app exists in registry, show icon; otherwise show placeholder
            if (app) {
                dItem.innerHTML = `<span>${app.icon}</span>`;
                dItem.onclick = () => this.launchApp(appId);
            } else {
                dItem.innerHTML = `<span style="opacity:0.2">·</span>`;
            }
            dock.appendChild(dItem);
        });

        // 2. FORCE the App Menu Grid Icon at the bottom
        const menuBtn = document.createElement('div');
        menuBtn.className = 'dock-bottom-trigger';
        menuBtn.innerHTML = '⣿'; // This is your app menu button
        menuBtn.onclick = () => this.openAppMenu();
        dock.appendChild(menuBtn);
    }

    launchApp(appId) {
        const app = registry.find(a => a.id === appId);
        if (!app) return;

        const winId = `win-${appId}`;
        if (this.runningApps.has(appId)) return this.focusWindow(winId);

        this.runningApps.add(appId);
        this.bootShell(); // Refresh indicators

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
                <div style="padding:20px;">Loading ${app.name}...</div>
            </div>
        `;

        document.getElementById('workspace').appendChild(win);
        this.makeDraggable(win);

        // App Content Routing
        const container = document.getElementById(`canvas-${appId}`);
        if (appId === 'time') {
            container.innerHTML = thealTimeApp.render();
            requestAnimationFrame(() => thealTimeApp.reboot());
        } else {
            container.innerHTML = `<div style="padding:20px; text-align:center;"><h2>${app.icon}</h2><p>${app.name} Module Active</p></div>`;
        }
    }

    openAppMenu() {
        const winId = 'win-app-menu';
        if (document.getElementById(winId)) return this.closeWindow(winId);

        const win = document.createElement('div');
        win.className = 'os-window maximized'; 
        win.id = winId;
        
        let gridHTML = '<div class="app-drawer-grid" style="display:grid; grid-template-columns: repeat(4, 1fr); gap:20px; padding:40px;">';
        registry.forEach(app => {
            gridHTML += `
                <div class="drawer-icon" style="text-align:center; cursor:pointer;" onclick="kernel.launchApp('${app.id}'); kernel.closeWindow('win-app-menu');">
                    <div style="font-size:3rem; margin-bottom:10px;">${app.icon}</div>
                    <p>${app.name}</p>
                </div>`;
        });
        gridHTML += '</div>';

        win.innerHTML = `
            <div class="window-header"><span>System Applications</span><button onclick="kernel.closeWindow('${winId}')">×</button></div>
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