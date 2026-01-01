import { registry } from './registry.js';

class TLC_Kernel {
    constructor() {
        this.pinnedApps = ['time', 'tnfi', 'terminal', 'files', 'browser', 'messages', 'camera', 'settings']; 
        this.runningApps = new Set(); 
        
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

    transitionToShell() {
        const gate = document.getElementById('login-gate');
        const root = document.getElementById('os-root');
        const top = document.getElementById('top-bar');

        if (gate) gate.style.display = 'none';
        if (top) top.classList.remove('hidden');
        
        if (root) {
            root.classList.remove('hidden');
            root.style.display = 'flex'; 
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
            dItem.className = `dock-item ${isRunning ? 'running' : ''}`;
            dItem.title = app.name;
            dItem.innerHTML = `<span>${app.icon}</span>`;
            
            dItem.onclick = () => {
                // IMPORTANT: We use the winId 'win-appId' for focusing
                isRunning ? this.focusWindow(`win-${appId}`) : this.launchApp(appId);
            };
            
            dock.appendChild(dItem);
        });

        // 2. Render Menu Button (Sovereign Launcher)
        const menuBtn = document.createElement('div');
        menuBtn.className = 'dock-bottom-trigger';
        for(let i = 0; i < 9; i++) {
            const dot = document.createElement('div');
            dot.className = 'menu-dot';
            menuBtn.appendChild(dot);
        }

        // FIXED: Changed from toggleAppMenu to openAppMenu
        menuBtn.onclick = () => this.openAppMenu();
        dock.appendChild(menuBtn);
    }

    launchApp(appId) {
    // NEW: Force close the app menu overlay whenever an app is launched/focused
        const overlay = document.getElementById('app-menu-overlay');
        if (overlay) {
            overlay.classList.add('hidden');
            overlay.style.display = 'none';
        }

        const app = registry.find(a => a.id === appId);
        const workspace = document.getElementById('workspace');
        if (!app || !workspace) return;

        const winId = `win-${appId}`;
        
        // If already running, just focus it
        if (this.runningApps.has(appId)) {
            this.focusWindow(winId);
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

    openAppMenu() {
        const overlay = document.getElementById('app-menu-overlay');
        const grid = document.getElementById('app-grid-container');
        const searchInput = document.getElementById('app-search');
        
        if (!overlay || !grid) return;

        // Toggle Logic
        if (!overlay.classList.contains('hidden')) {
            overlay.classList.add('hidden');
            overlay.style.display = 'none';
            return;
        }

        // Show Logic
        overlay.classList.remove('hidden');
        overlay.style.display = 'flex'; 
        searchInput.value = ''; 
        
        // FIX: Only focus and trigger keyboard if NOT on mobile
        if (window.innerWidth > 768) {
        searchInput.focus();}

        const renderGrid = (filter = '') => {
            grid.innerHTML = '';
            registry.filter(app => 
                app.name.toLowerCase().includes(filter.toLowerCase())
            ).forEach(app => {
                const card = document.createElement('div');
                card.className = 'launcher-card';
                card.innerHTML = `
                    <div class="icon">${app.icon}</div>
                    <div class="name">${app.name}</div>
                `;
                card.onclick = () => {
                    this.launchApp(app.id);
                    overlay.classList.add('hidden');
                    overlay.style.display = 'none';
                };
                grid.appendChild(card);
            });
        };

        // Initial render & Search listener
        renderGrid();
        searchInput.oninput = (e) => renderGrid(e.target.value);
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
        if (el) {
            el.style.display = 'flex'; // Ensure it's visible if it was minimized
            el.style.zIndex = this.getTopZIndex();
        }
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
        const dragStart = (e) => {
            if (e.target.closest('.win-btn') || el.classList.contains('maximized')) return;
            const clientX = e.type.includes('touch') ? e.touches[0].clientX : e.clientX;
            const clientY = e.type.includes('touch') ? e.touches[0].clientY : e.clientY;
            let startTop = parseInt(window.getComputedStyle(el).top);
            let startLeft = parseInt(window.getComputedStyle(el).left);
            const move = (moveE) => {
                const curX = moveE.type.includes('touch') ? moveE.touches[0].clientX : moveE.clientX;
                const curY = moveE.type.includes('touch') ? moveE.touches[0].clientY : moveE.clientY;
                el.style.top = (startTop + (curY - clientY)) + "px";
                el.style.left = (startLeft + (curX - clientX)) + "px";
            };
            const stop = () => {
                document.removeEventListener('mousemove', move);
                document.removeEventListener('mouseup', stop);
                document.removeEventListener('touchmove', move);
                document.removeEventListener('touchend', stop);
            };
            document.addEventListener('mousemove', move);
            document.addEventListener('mouseup', stop);
            document.addEventListener('touchmove', move, { passive: false });
            document.addEventListener('touchend', stop);
        };
        header.onmousedown = dragStart;
        header.ontouchstart = dragStart;
    }
}

window.kernel = new TLC_Kernel();