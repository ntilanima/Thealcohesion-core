import { registry } from './registry.js';

class TLC_Kernel {
    constructor() {
        this.initListeners();
    }

    initListeners() {
        document.getElementById('login-btn').addEventListener('click', () => this.login());
    }

    login() {
        // Here you would check credentials against auth.js logic
        console.log("Identity Verified.");
        document.getElementById('login-gate').classList.add('hidden');
        document.getElementById('sovereign-shell').classList.remove('hidden');
        this.bootShell();
    }

    bootShell() {
    const launcher = document.getElementById('bento-launcher');
    launcher.innerHTML = ''; 

    registry.forEach(app => {
        const card = document.createElement('div');
        // Add the 'wide' or 'large' class if specified in registry
        card.className = `bento-card ${app.size || ''}`; 
        
        card.innerHTML = `
            <div class="bento-icon">${app.icon}</div>
            <div class="bento-name">${app.name}</div>
        `;
        
        card.onclick = () => this.launchApp(app.id);
        launcher.appendChild(card);
    });
    }
    // 6. Application Launch Handler
    launchApp(appId) {
    const app = registry.find(a => a.id === appId);
    if (!app) return;

    // Create a DamianB-style Window
    const win = document.createElement('div');
    win.className = 'os-window';
    win.style.zIndex = 1000; // Ensure it's on top
    
    win.innerHTML = `
        <div class="window-header">
            <span class="title">${app.icon} ${app.name}</span>
            <div class="controls">
                <button class="win-btn min">-</button>
                <button class="win-btn close" onclick="this.closest('.os-window').remove()">×</button>
            </div>
        </div>
        <div class="window-content" id="content-${app.id}">
            <p>Initializing ${app.name} from ${app.file}...</p>
        </div>
    `;

    document.getElementById('workspace').appendChild(win);
    
    // Add Draggable logic here if needed
}
}

const kernel = new TLC_Kernel();