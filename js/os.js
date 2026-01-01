import { registry } from './registry.js';

class TLC_Kernel {
    constructor() {
        console.log("Kernel: Initializing...");
        window.addEventListener('load', () => this.init());
    }

    init() {
        const loginBtn = document.getElementById('login-btn');
        if (loginBtn) {
            loginBtn.addEventListener('click', () => this.verifyIdentity());
        }
    }

    verifyIdentity() {
        const user = document.getElementById('username').value;
        const pass = document.getElementById('password').value;

        // Basic check - Section 0.5.2 Compliance
        if (user.trim() !== "" && pass.trim() !== "") {
            console.log("Identity Verified. Initiating Transition...");
            this.transitionToShell();
        } else {
            alert("Sovereign Identity Required.");
        }
    }

    /**
     * THE TRANSITION: Logic to switch from Login to Desktop
     */
    transitionToShell() {
    const loginGate = document.getElementById('login-gate');
    const topBar = document.getElementById('top-bar');
    const osRoot = document.getElementById('os-root');
    const sideDock = document.getElementById('side-dock');
    const workspace = document.getElementById('workspace');

    // 1. Hide Login
    if (loginGate) loginGate.style.display = 'none';

    // 2. Reveal Top Bar
    if (topBar) topBar.classList.remove('hidden');

    // 3. Reveal the Parent Container and its Children
    if (osRoot) {
        osRoot.style.display = 'flex'; // This is the 'Master Switch'
        
        if (sideDock) sideDock.classList.remove('hidden');
        if (workspace) workspace.classList.remove('hidden');
    }

    // 4. Run the Boot sequence to draw icons
    this.bootShell();
    }

    bootShell() {
    const dock = document.getElementById('side-dock');
    const desktop = document.getElementById('desktop-icons');
    
    // We need to keep the ⣿ icon, so we save it first
    const gridTrigger = dock.querySelector('.dock-bottom-trigger');
    dock.innerHTML = ''; 
    desktop.innerHTML = '';

    registry.forEach(app => {
        // Render Dock Item
        const dItem = document.createElement('div');
        dItem.className = 'dock-item';
        dItem.innerHTML = `<span>${app.icon}</span>`;
        dItem.onclick = () => this.launchApp(app.id);
        dock.appendChild(dItem);

        // Render Desktop Icon
        const deskIcon = document.createElement('div');
        deskIcon.className = 'desktop-icon';
        deskIcon.innerHTML = `<span>${app.icon}</span><p>${app.name}</p>`;
        deskIcon.onclick = () => this.launchApp(app.id);
        desktop.appendChild(deskIcon);
    });

    if (gridTrigger) dock.appendChild(gridTrigger);
    }

    /**
     * Renders Dock items and Desktop icons from registry.js
     */
    bootShell() {
        const dock = document.getElementById('side-dock');
        const desktop = document.getElementById('desktop-icons');
        
        if (!dock || !desktop) return;

        // Clear existing content (except the grid-icon trigger)
        const gridIcon = dock.querySelector('.dock-bottom-trigger');
        dock.innerHTML = '';
        desktop.innerHTML = '';

        registry.forEach(app => {
            // Create Sidebar Dock Item
            const dockItem = document.createElement('div');
            dockItem.className = 'dock-item';
            dockItem.innerHTML = `<span>${app.icon}</span>`;
            dockItem.title = app.name;
            dockItem.onclick = () => this.launchApp(app.id);
            dock.appendChild(dockItem);

            // Create Desktop Icon Item
            const deskIcon = document.createElement('div');
            deskIcon.className = 'desktop-icon';
            deskIcon.innerHTML = `<span>${app.icon}</span><p>${app.name}</p>`;
            deskIcon.onclick = () => this.launchApp(app.id);
            desktop.appendChild(deskIcon);
        });

        // Re-append the grid icon at the bottom
        if (gridIcon) dock.appendChild(gridIcon);
        
        console.log("Sovereign Shell: Active.");
    }

    launchApp(appId) {
        // ... (Existing launchApp code from previous turns)
    }
}

const kernel = new TLC_Kernel();