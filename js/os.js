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

    // Create the Window Shell
    const win = document.createElement('div');
    win.className = 'os-window';
    win.id = `window-${app.id}`;
    
    // Position it randomly so windows don't stack perfectly
    win.style.top = (100 + Math.random() * 50) + "px";
    win.style.left = (200 + Math.random() * 50) + "px";

    win.innerHTML = `
        <div class="window-header">
            <span class="title">${app.icon} ${app.name}</span>
            <div class="window-controls">
                <button class="win-btn close">×</button>
            </div>
        </div>
        <div class="window-content" id="window-body-${app.id}">
            <p>Booting ${app.name}...</p>
        </div>
    `;

    document.getElementById('workspace').appendChild(win);
    win.querySelector('.close').onclick = () => win.remove();

    // Specific Logic for the Temporal Engine
    if (appId === 'time') {
        window.thealTimeApp.renderHUD(`window-body-${app.id}`);
    } 
    
    // Specific Logic for TNFI / Allotments
    if (appId === 'tnfi') {
        this.loadFinancialData(`window-body-${app.id}`);
    }

    // LINKING THEAL TIME APP TO THE OS
    if (appId === 'time') {
        const body = document.getElementById(`app-body-${app.id}`);
        // Inject the HTML from your time.js render function
        body.innerHTML = thealTimeApp.render();
    }
}

/**
 * Recalls EPOS and Investor data for initial allotment
 */
loadFinancialData(containerId) {
    const target = document.getElementById(containerId);
    target.innerHTML = `
        <h3>Genesis Allotment Ledger</h3>
        <ul>
            <li><strong>EPOS:</strong> Initial Allotment Managed</li>
            <li><strong>Investors:</strong> Strategic Pool Allocated</li>
        </ul>
        <div class="loading-bar"></div>
    `;
}
}

// Global kernel instance
window.kernel = new TLC_Kernel();