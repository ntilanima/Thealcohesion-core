import { registry } from './registry.js';

class TLC_Kernel {
    constructor() {
        // App Management State
        this.pinnedApps = [
            'time', 'tnfi', 'terminal', 'files', 
            'browser', 'messages', 'camera', 'settings',
            'notes', 'music', 'maps', 'store'
        ]; 
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
        const user = document.getElementById('username').value;
        const pass = document.getElementById('password').value;
        if (user.trim() !== "" && pass.trim() !== "") {
            this.transitionToShell();
        } else {
            alert("Sovereign Identity Required.");
        }
    }

    transitionToShell() {
        const elements = ['login-gate', 'top-bar', 'os-root', 'side-dock', 'workspace'];
        elements.forEach(id => {
            const el = document.getElementById(id);
            if (!el) return;
            if (id === 'login-gate') el.style.display = 'none';
            else if (id === 'os-root') el.style.display = 'flex';
            else el.classList.remove('hidden');
        });
        this.bootShell();
    }

    /**
     * DOCK & SHELL LOGIC
     * Handles the 8 (mobile) / 12 (desktop) split via CSS classes
     */
    bootShell() {
        const dock = document.getElementById('side-dock');
        const desktop = document.getElementById('desktop-icons');
        if (!dock || !desktop) return;

        dock.innerHTML = '';
        desktop.innerHTML = '';

        // Render Pinned Apps
        this.pinnedApps.forEach((appId, index) => {
            const app = registry.find(a => a.id === appId);
            if (!app) return;

            // Create Dock Item
            const dItem = document.createElement('div');
            // Class 'mobile-hide' applied to apps 9-12 for A16 scale
            dItem.className = `dock-item ${this.runningApps.has(appId) ? 'running' : ''} ${index >= 8 ? 'mobile-hide' : ''}`;
            dItem.setAttribute('data-app-id', appId);
            dItem.innerHTML = `<span>${app.icon}</span>`;
            dItem.onclick = () => this.launchApp(appId);
            dock.appendChild(dItem);

            // Create Desktop Icon
            const deskIcon = document.createElement('div');
            deskIcon.className = 'desktop-icon';
            deskIcon.innerHTML = `<span>${app.icon}</span><p>${app.name}</p>`;
            deskIcon.onclick = () => this.launchApp(appId);
            desktop.appendChild(deskIcon);
        });

        // Add App Menu Trigger (Grid)
        const menuBtn = document.createElement('div');
        menuBtn.className = 'dock-bottom-trigger';
        menuBtn.innerHTML = '⣿';
        menuBtn.onclick = () => this.openAppMenu();
        dock.appendChild(menuBtn);
    }

    // --- WINDOW CAPABILITIES ---

    launchApp(appId) {
        const app = registry.find(a => a.id === appId);
        if (!app) return;

        const winId = `win-${appId}`;
        
        // Focus if already open
        if (this.runningApps.has(appId)) {
            this.focusWindow(winId);
            const win = document.getElementById(winId);
            if (win && win.style.display === 'none') {
                win.style.display = 'flex';
                win.style.opacity = '1';
                win.style.transform = 'scale(1)';
            }
            return;
        }

        this.runningApps.add(appId);
        this.bootShell(); // Update dock indicators

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
                <div class="app-loading-state">Initializing Sovereign Core...</div>
            </div>
        `;

        document.getElementById('workspace').appendChild(win);
        this.makeDraggable(win);

        // Content Routing
        const container = document.getElementById(`canvas-${appId}`);
        if (appId === 'time') {
            container.innerHTML = thealTimeApp.render();
            requestAnimationFrame(() => thealTimeApp.reboot());
        } else {
            setTimeout(() => {
                container.innerHTML = `
                    <div style="padding:20px; text-align:center;">
                        <h2>${app.icon} ${app.name}</h2>
                        <p>Module active. Data stream synchronized.</p>
                    </div>`;
            }, 300);
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
            <div class="window-header"><span>Applications</span></div>
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
        if (!el) return;
        el.style.transform = "scale(0.7) translateY(200px)";
        el.style.opacity = "0";
        setTimeout(() => el.style.display = "none", 300);
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