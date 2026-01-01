import { registry } from './registry.js';

class TLC_Kernel {
    constructor() {
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

        this.pinnedApps.forEach((appId) => {
            const app = registry.find(a => a.id === appId);
            const dItem = document.createElement('div');
            dItem.className = `dock-item ${this.runningApps.has(appId) ? 'running' : ''}`;
            
            if (app) {
                dItem.innerHTML = `<span>${app.icon}</span>`;
                // Use addEventListener instead of string onclick to avoid scope issues
                dItem.onclick = () => this.launchApp(appId);
            } else {
                dItem.innerHTML = `<span style="opacity: 0.2">·</span>`;
            }
            dock.appendChild(dItem);
        });

        const menuBtn = document.createElement('div');
        menuBtn.className = 'dock-bottom-trigger';
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
        const workspace = document.getElementById('workspace');
        if (!app || !workspace) return;

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
        // Forced initial positioning to prevent NaN errors
        win.style.top = "60px";
        win.style.left = "20px";
        win.style.zIndex = this.getTopZIndex();

        win.innerHTML = `
            <div class="window-header">
                <span class="title">${app.icon} ${app.name}</span>
                <div class="window-controls">
                    <button class="win-btn close" id="close-${winId}">×</button>
                </div>
            </div>
            <div class="window-content" id="canvas-${appId}">
                <div class="app-loading">Connecting...</div>
            </div>
        `;

        workspace.appendChild(win);
        
        // Manual event binding to bypass global scope issues
        win.querySelector(`#close-${winId}`).onclick = () => this.closeApp(appId, winId);
        win.onmousedown = () => this.focusWindow(winId);
        win.ontouchstart = () => this.focusWindow(winId);

        this.makeDraggable(win);

        // App Content Routing
        const container = document.getElementById(`canvas-${appId}`);
        if (appId === 'time' && window.thealTimeApp) {
            container.innerHTML = thealTimeApp.render();
            requestAnimationFrame(() => thealTimeApp.reboot());
        } else if (appId === 'tnfi') {
            container.innerHTML = `
                <div style="padding:20px;">
                    <h3>Bank of Sovereign</h3>
                    <p>Investor Status: <strong>Verified</strong></p>
                    <p>2025 Allotment: <strong>EPOS Initial</strong></p>
                </div>`;
        } else {
            container.innerHTML = `<div style="padding:20px;">${app.name} system online.</div>`;
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
        win.style.zIndex = 9998;
        
        let gridHTML = '<div class="app-drawer-grid" style="display:grid; grid-template-columns:repeat(3,1fr); gap:20px; padding:20px;">';
        registry.forEach(app => {
            gridHTML += `
                <div class="drawer-icon" style="text-align:center; cursor:pointer;" id="launch-${app.id}">
                    <div style="font-size:2rem;">${app.icon}</div>
                    <div style="font-size:0.7rem;">${app.name}</div>
                </div>`;
        });
        gridHTML += '</div>';

        win.innerHTML = `
            <div class="window-header"><span>Sovereign Apps</span><button id="close-menu">×</button></div>
            <div class="window-content">${gridHTML}</div>
        `;
        document.getElementById('workspace').appendChild(win);

        // Bind grid clicks
        win.querySelector('#close-menu').onclick = () => this.closeWindow(winId);
        registry.forEach(app => {
            const btn = document.getElementById(`launch-${app.id}`);
            if(btn) btn.onclick = () => { this.launchApp(app.id); this.closeWindow(winId); };
        });
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

            let startTop = parseInt(window.getComputedStyle(el).top) || 60;
            let startLeft = parseInt(window.getComputedStyle(el).left) || 20;
            
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

// Global exposure
window.kernel = new TLC_Kernel();