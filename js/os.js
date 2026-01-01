import { registry } from './registry.js';

class TLC_Kernel {
    constructor() {
        // Force the 12 apps we want to see
        this.pinnedApps = ['time', 'tnfi', 'terminal', 'files', 'browser', 'messages', 'camera', 'settings', 'notes', 'music', 'maps', 'store']; 
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
        // Simplified login for testing
        this.transitionToShell();
    }

    transitionToShell() {
        const gate = document.getElementById('login-gate');
        const root = document.getElementById('os-root');
        const top = document.getElementById('top-bar');

        if (gate) gate.style.display = 'none';
        if (top) top.classList.remove('hidden');
        if (root) {
            root.style.display = 'flex'; // Unlock the layout
        }
        
        this.bootShell();
    }

    bootShell() {
        const dock = document.getElementById('side-dock');
        if (!dock) return;
        
        // Clear everything out first
        dock.innerHTML = ''; 

        // 1. Create exactly 12 slots based on pinnedApps
        this.pinnedApps.forEach((appId) => {
            const app = registry.find(a => a.id === appId);
            const dItem = document.createElement('div');
            
            // Apply 'running' class if active
            dItem.className = `dock-item ${this.runningApps.has(appId) ? 'running' : ''}`;
            
            if (app) {
                dItem.innerHTML = `<span>${app.icon}</span>`;
                dItem.title = app.name;
                dItem.onclick = () => this.launchApp(appId);
            } else {
                // Placeholder for apps not yet in registry
                dItem.innerHTML = `<span style="opacity: 0.2">·</span>`;
                dItem.style.cursor = "default";
            }
            dock.appendChild(dItem);
        });

        // 2. Add the App Menu Trigger (The '⣿' icon)
        const menuBtn = document.createElement('div');
        menuBtn.className = 'dock-bottom-trigger';
        menuBtn.innerHTML = '⣿';
        menuBtn.style.marginTop = "auto"; // Push to very bottom
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
        this.bootShell(); // Re-render dock to show indicators

        const win = document.createElement('div');
        win.className = 'os-window';
        win.id = winId;
        win.style.top = "100px";
        win.style.left = "120px";
        win.style.zIndex = this.getTopZIndex();

        win.innerHTML = `
            <div class="window-header" onmousedown="kernel.focusWindow('${winId}')">
                <span class="title">${app.icon} ${app.name}</span>
                <div class="window-controls">
                    <button class="win-btn close" onclick="kernel.closeApp('${appId}', '${winId}')"></button>
                </div>
            </div>
            <div class="window-content" id="canvas-${appId}">
                <div style="padding: 20px;">Connecting to ${app.name} service...</div>
            </div>
        `;

        document.getElementById('workspace').appendChild(win);
        this.makeDraggable(win);

        // Content Routing
        if (appId === 'time') {
            document.getElementById(`canvas-${appId}`).innerHTML = thealTimeApp.render();
            requestAnimationFrame(() => thealTimeApp.reboot());
        }
    }

    openAppMenu() {
        alert("App Menu Triggered! Opening Grid...");
        // (Menu window logic goes here)
    }

    closeApp(appId, winId) {
        const el = document.getElementById(winId);
        if (el) el.remove();
        this.runningApps.delete(appId);
        this.bootShell();
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
            if (el.classList.contains('maximized')) return;
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