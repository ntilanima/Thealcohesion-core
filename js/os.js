
import { registry } from './registry.js';

class TLC_Kernel {
    constructor() {
        // Ensure the system waits for the DOM to be fully loaded
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.init());
        } else {
            this.init();
        }
    }

    init() {
        console.log("Kernel: Systems Online. Awaiting Identity...");
        const loginBtn = document.getElementById('login-btn');
        
        if (loginBtn) {
            // Remove any old listeners and add a fresh one
            loginBtn.onclick = () => this.login();
        } else {
            console.error("CRITICAL: Login button not found in DOM.");
        }
    }

    login() {
        const user = document.getElementById('username').value;
        const pass = document.getElementById('password').value;

        // Simple check for now - can be linked to your auth.js later
        if (user !== "" && pass !== "") {
            console.log(`Identity Verified: Welcome, ${user}`);
            
            // 1. Hide the Login Gate
            document.getElementById('login-gate').classList.add('hidden');
            
            // 2. Reveal the Ubuntu Environment
            document.getElementById('side-dock').classList.remove('hidden');
            document.getElementById('sovereign-shell').classList.remove('hidden');
            
            this.bootShell();
        } else {
            alert("Identity Required: Please enter credentials.");
        }
    }

    bootShell() {
        const desktop = document.getElementById('desktop-icons');
        const dock = document.getElementById('side-dock');
        
        if (!desktop || !dock) return;

        desktop.innerHTML = ''; 
        // Keep the dock bottom trigger (the ⣿ icon)
        dock.innerHTML = '<div class="dock-bottom-trigger"><span class="grid-icon">⣿</span></div>';

        registry.forEach(app => {
            // Create Desktop Icon
            const iconWrap = document.createElement('div');
            iconWrap.className = 'desktop-icon';
            iconWrap.innerHTML = `
                <span>${app.icon}</span>
                <div class="icon-label">${app.name}</div>
            `;
            iconWrap.onclick = () => this.launchApp(app.id);
            desktop.appendChild(iconWrap);

            // Create Dock Icon (First 8)
            if (registry.indexOf(app) < 8) {
                const dockIcon = document.createElement('div');
                dockIcon.className = 'dock-icon';
                dockIcon.innerHTML = `<span>${app.icon}</span>`;
                dockIcon.title = app.name;
                dockIcon.onclick = () => this.launchApp(app.id);
                dock.prepend(dockIcon);
            }
        });
    }

    launchApp(appId) {
        const app = registry.find(a => a.id === appId);
        const workspace = document.getElementById('workspace');

        const win = document.createElement('div');
        win.className = 'app-window';
        win.style.left = '120px';
        win.style.top = '60px';

        win.innerHTML = `
            <div class="window-header">
                <span>${app.icon} ${app.name}</span>
                <div class="window-controls">
                    <button class="close-btn">×</button>
                </div>
            </div>
            <div class="window-content">
                <p>Accessing Mandate: ${app.id}...</p>
                <div class="loader-line"></div>
            </div>
        `;

        workspace.appendChild(win);
        win.querySelector('.close-btn').onclick = () => win.remove();
    }
}

const kernel = new TLC_Kernel();