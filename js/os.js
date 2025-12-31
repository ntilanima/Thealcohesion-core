import { registry } from './registry.js';

class TLC_Kernel {
    constructor() {
        console.log("Kernel: Initializing Sovereign Environment...");
        // This ensures the code waits for the HTML to be ready
        if (document.readyState === 'loading') {
            window.addEventListener('DOMContentLoaded', () => this.init());
        } else {
            this.init();
        }
    }

    init() {
        this.initListeners();
        console.log("Kernel: Systems Online.");
    }

    initListeners() {
        const loginBtn = document.getElementById('login-btn');
        if (loginBtn) {
            loginBtn.addEventListener('click', () => this.login());
        }
    }

    login() {
        console.log("Identity Verified.");
        const loginGate = document.getElementById('login-gate');
        const shell = document.getElementById('sovereign-shell');
        
        if (loginGate && shell) {
            loginGate.classList.add('hidden');
            shell.classList.remove('hidden');
            this.bootShell();
        }
    }

    bootShell() {
        const launcher = document.getElementById('bento-launcher');
        if (!launcher) {
            console.error("Layout Error: #bento-launcher not found.");
            return;
        }

        launcher.innerHTML = ''; 

        registry.forEach(app => {
            const card = document.createElement('div');
            // Uses 'small' as a fallback if size isn't defined
            card.className = `bento-card ${app.size || 'small'}`; 
            
            card.innerHTML = `
                <div class="bento-icon">${app.icon}</div>
                <div class="bento-name">${app.name}</div>
            `;
            
            card.onclick = () => this.launchApp(app.id);
            launcher.appendChild(card);
        });
        console.log("UI: Bento Grid Rendered.");
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
                <div class="controls">
                    <button class="win-btn close">×</button>
                </div>
            </div>
            <div class="window-content" id="content-${app.id}">
                <p>Accessing ${app.file}...</p>
                <div class="loading-bar"></div>
            </div>
        `;

        document.getElementById('workspace').appendChild(win);
        
        // Window close listener
        win.querySelector('.close').onclick = () => win.remove();
    }
}

// Instantiate the Kernel
const kernel = new TLC_Kernel();