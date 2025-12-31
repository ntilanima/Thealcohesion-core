import { registry } from './registry.js';

class TLC_Kernel {
    constructor() {
        console.log("Kernel: Initializing Sovereign Environment...");
        // Wait for the window to load so it can find the HTML elements
        window.addEventListener('load', () => this.init());
    }

    init() {
        this.initListeners();
        console.log("Kernel: Systems Online.");
    }

    initListeners() {
        const loginBtn = document.getElementById('login-btn');
        if (loginBtn) {
            loginBtn.addEventListener('click', () => this.verifyIdentity());
        } else {
            // Fallback for your current HTML button without an ID
            const legacyBtn = document.querySelector('button[onclick="kernel.login()"]');
            if (legacyBtn) {
                legacyBtn.removeAttribute('onclick');
                legacyBtn.addEventListener('click', () => this.verifyIdentity());
            }
        }
    }

    /**
     * Authentication Logic
     * Ensures compliance with Section 0.5.2 of the Charter
     */
    verifyIdentity() {
        const userField = document.getElementById('username');
        const passField = document.getElementById('password');

        if (!userField || !passField) {
            console.error("Critical: Identity fields not found in DOM.");
            return;
        }

        const username = userField.value.trim();
        const password = passField.value.trim();

        // Basic verification (expand this using your auth.js logic later)
        if (username !== "" && password !== "") {
            console.log(`Identity Verified: ${username}`);
            this.transitionToShell();
        } else {
            alert("Sovereign Identity Required. Please enter credentials.");
        }
    }

    /**
     * Transition UI from Login Gate to Desktop Shell
     */
    transitionToShell() {
        const loginGate = document.getElementById('login-gate');
        const shell = document.getElementById('sovereign-shell');
        const status = document.getElementById('session-status');

        if (loginGate) loginGate.style.display = 'none';
        if (shell) {
            shell.classList.remove('hidden');
            shell.style.display = 'grid'; // Ensures grid layout triggers
        }
        if (status) status.innerText = "Identity: Verified Member";

        this.bootShell();
    }

    /**
     * Renders the Ubuntu-style Desktop Environment
     */
    bootShell() {
        const desktop = document.getElementById('workspace');
        const dock = document.getElementById('side-dock');

        // Clear existing content
        if (desktop) desktop.innerHTML = '';
        if (dock) dock.innerHTML = '';

        registry.forEach(app => {
            // 1. Create Desktop Icon
            const dIcon = document.createElement('div');
            dIcon.className = 'desktop-icon';
            dIcon.innerHTML = `<span>${app.icon}</span><p>${app.name}</p>`;
            dIcon.onclick = () => this.launchApp(app.id);
            if (desktop) desktop.appendChild(dIcon);

            // 2. Create Sidebar/Dock Icon
            const sIcon = document.createElement('div');
            sIcon.className = 'dock-item';
            sIcon.innerHTML = `<span>${app.icon}</span>`;
            sIcon.title = app.name;
            sIcon.onclick = () => this.launchApp(app.id);
            if (dock) dock.appendChild(sIcon);
        });

        console.log("UI: Desktop Environment Rendered.");
    }

    launchApp(appId) {
        const app = registry.find(a => a.id === appId);
        if (!app) return;

        console.log(`Launching ${app.name}...`);

        const win = document.createElement('div');
        win.className = 'os-window';
        win.innerHTML = `
            <div class="window-header">
                <span class="title">${app.icon} ${app.name}</span>
                <button class="close-btn" onclick="this.closest('.os-window').remove()">×</button>
            </div>
            <div class="window-content">
                <p>Accessing ${app.name} VFS...</p>
                <div class="spinner"></div>
            </div>
        `;
        document.getElementById('workspace').appendChild(win);
    }
}

// Global kernel instance
window.kernel = new TLC_Kernel();