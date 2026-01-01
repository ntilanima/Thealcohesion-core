import { registry } from './registry.js';

class TLC_Kernel {
    constructor() {
        // App State
        this.pinnedApps = ['time', 'tnfi', 'terminal', 'files', 'browser', 'messages', 'camera', 'settings']; 
        this.runningApps = new Set(); 
        
        // UI State
        this.dockPosition = 'left'; // Initial Positionable State
        
        console.log("Kernel: Initializing Sovereign Core...");
        this.init();
    }

    init() {
        const loginBtn = document.getElementById('login-btn');
        if (loginBtn) {
            loginBtn.onclick = (e) => {
                e.preventDefault();
                console.log("Kernel: Identity Verified.");
                this.transitionToShell();
            };
        } else {
            setTimeout(() => this.init(), 100);
        }
    }

    // --- DOCK POSITIONING LOGIC ---
    setDockPosition(position) {
        const root = document.getElementById('os-root');
        if (!root) return;

        // Apply attribute for CSS: 'left', 'right', or 'bottom'
        this.dockPosition = position;
        root.setAttribute('data-dock', position);
        
        // Re-render to ensure 9-dot menu and running indicators align
        this.bootShell();
    }

    transitionToShell() {
        const gate = document.getElementById('login-gate');
        const root = document.getElementById('os-root');
        const top = document.getElementById('top-bar');

        if (gate) gate.style.display = 'none';
        if (top) top.classList.remove('hidden');
        
        if (root) {
            root.classList.remove('hidden');
            root.style.display = 'flex'; 
            // Apply current dock position to root
            root.setAttribute('data-dock', this.dockPosition);
        }
        
        this.bootShell();
    }

    bootShell() {
        const dock = document.getElementById('side-dock');
        if (!dock) return;
        
        dock.innerHTML = ''; 

        // 1. Render Pinned & Running Apps
        this.pinnedApps.forEach((appId) => {
            const app = registry.find(a => a.id === appId);
            if (!app) return;

            const dItem = document.createElement('div');
            const isRunning = this.runningApps.has(appId);
            
            // Ubuntu dot indicator + dock styling
            dItem.className = `dock-item ${isRunning ? 'running' : ''}`;
            dItem.title = app.name;
            dItem.style.position = 'relative';
            
            dItem.innerHTML = `<span>${app.icon}</span>`;
            
            dItem.onclick = () => {
                if (isRunning) {
                    this.focusWindow(`win-${appId}`);
                } else {
                    this.launchApp(appId);
                }
            };
            
            dock.appendChild(dItem);
        });

        // 2. Render Position-Aware 9-Dot Menu
        const menuBtn = document.createElement('div');
        menuBtn.className = 'dock-bottom-trigger';
        menuBtn.title = "Show Applications";
        
        // Push menu to bottom/side based on margin-top:auto (CSS handled)
        for(let i = 0; i < 9; i++) {
            const dot = document.createElement('div');
            dot.className = 'menu-dot';
            menuBtn.appendChild(dot);
        }

        menuBtn.onclick = () => this.openAppMenu();
        dock.appendChild(menuBtn);
    }

    // --- WINDOW MANAGEMENT ---
    launchApp(appId) {
        const app = registry.find(a => a.id === appId);
        const workspace = document.getElementById('workspace');
        if (!app || !workspace) return;

        const winId = `win-${appId}`;
        if (this.runningApps.has(appId)) {
            const existingWin = document.getElementById(winId);
            if (existingWin) {
                existingWin.style.display = 'flex';
                this.focusWindow(winId);
            }
            return;
        }

        this.runningApps.add(appId);
        this.bootShell(); 

        const win = document.createElement('div');
        win.className = 'os-window';
        win.id = winId;
        win.style.top = "60px";
        win.style.left = "80px";
        win.style.zIndex = this.getTopZIndex();

        win.innerHTML = `
            <div class="window-header">
                <span class="title">${app.icon} ${app.name}</span>
                <div class="window-controls">
                    <button class="win-btn hide" id="hide-${winId}">─</button>
                    <button class="win-btn expand" id="max-${winId}">▢</button>
                    <button class="win-btn close" id="close-${winId}">×</button>
                </div>
            </div>
            <div class="window-content" id="canvas-${appId}">
                <div class="app-loading">System: Initializing ${app.name}...</div>
            </div>
        `;

        workspace.appendChild(win);
        
        win.querySelector(`#hide-${winId}`).onclick = (e) => { e.stopPropagation(); this.minimizeWindow(winId); };
        win.querySelector(`#max-${winId}`).onclick = (e) => { e.stopPropagation(); this.toggleMaximize(winId); };
        win.querySelector(`#close-${winId}`).onclick = (e) => { e.stopPropagation(); this.closeApp(appId, winId); };
        
        win.onmousedown = () => this.focusWindow(winId);
        this.makeDraggable(win);

        // App Content Injection
        const container = document.getElementById(`canvas-${appId}`);
        if (appId === 'tnfi') {
            container.innerHTML = `
                <div style="padding:20px;">
                    <h3>Bank of Sovereign</h3>
                    <p>Investor Allotment: <strong>EPOS 2025</strong></p>
                    <p>Status: <span style="color:#00ff00;">Liquid</span></p>
                </div>`;
        } else {
            container.innerHTML = `<div style="padding:20px;">${app.name} system online.</div>`;
        }
    }

    // Support Methods
    minimizeWindow(id) { document.getElementById(id).style.display = 'none'; }
    toggleMaximize(id) { document.getElementById(id).classList.toggle('maximized'); }
    closeApp(appId, winId) {
        document.getElementById(winId).remove();
        this.runningApps.delete(appId);
        this.bootShell();
    }
    focusWindow(id) {
        const el = document.getElementById(id);
        if (el) el.style.zIndex = this.getTopZIndex();
    }
    getTopZIndex() {
        const wins = document.querySelectorAll('.os-window');
        let max = 100; 
        wins.forEach(w => { 
            const z = parseInt(w.style.zIndex) || 100;
            if (z > max) max = z; 
        });
        return max + 1;
    }

    makeDraggable(el) {
        const header = el.querySelector('.window-header');
        header.onmousedown = (e) => {
            if (e.target.closest('.win-btn') || el.classList.contains('maximized')) return;
            let startTop = parseInt(window.getComputedStyle(el).top);
            let startLeft = parseInt(window.getComputedStyle(el).left);
            const move = (moveE) => {
                el.style.top = (startTop + (moveE.clientY - e.clientY)) + "px";
                el.style.left = (startLeft + (moveE.clientX - e.clientX)) + "px";
            };
            const stop = () => {
                document.removeEventListener('mousemove', move);
                document.removeEventListener('mouseup', stop);
            };
            document.addEventListener('mousemove', move);
            document.addEventListener('mouseup', stop);
        };
    }

    openAppMenu() {
        // App grid overlay logic remains the same
        console.log("App menu triggered for dock pos:", this.dockPosition);
        // ... (existing overlay logic)
    }
}

window.kernel = new TLC_Kernel();