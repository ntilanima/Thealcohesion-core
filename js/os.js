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
    const app = registry.find(a => a.id === appId);
    if (!app) return;

    // 1. Create Window Wrapper
    const win = document.createElement('div');
    win.className = 'os-window';
    win.id = `win-${appId}`;
    win.style.left = '100px';
    win.style.top = '100px';

    // 2. Build Structure
    win.innerHTML = `
        <div class="window-header">
            <span class="title">${app.icon} ${app.name}</span>
            <div class="window-controls">
                <button class="win-btn close">×</button>
            </div>
        </div>
        <div class="window-content" id="canvas-${appId}">
            <div class="boot-loader">Initializing ${app.name}...</div>
        </div>
    `;

    document.getElementById('workspace').appendChild(win);
    this.makeDraggable(win);
    win.querySelector('.close').onclick = () => win.remove();

    // 3. ENGINE TRIGGER: This is the critical part
    if (appId === 'time') {
    const container = document.getElementById(`canvas-${appId}`);
    
    // 1. Inject the HTML Structure
    container.innerHTML = thealTimeApp.render();

    // 2. Wait for DOM ready, then bind the engine
    requestAnimationFrame(() => {
        thealTimeApp.reboot(`canvas-${appId}`);
        
        // Ensure the Top Bar also updates immediately
        const topBarTime = document.getElementById("top-bar-time");
        if (topBarTime) topBarTime.onclick = () => thealTimeApp.renderHUD();
    });
    }

    makeDraggable(el) {
    const header = el.querySelector('.window-header');
    let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;

    header.onmousedown = (e) => {
        e.preventDefault();
        // Get mouse position at startup
        pos3 = e.clientX;
        pos4 = e.clientY;
        document.onmouseup = () => {
            document.onmouseup = null;
            document.onmousemove = null;
        };
        document.onmousemove = (e) => {
            e.preventDefault();
            // Calculate new cursor position
            pos1 = pos3 - e.clientX;
            pos2 = pos4 - e.clientY;
            pos3 = e.clientX;
            pos4 = e.clientY;
            // Set element's new position
            el.style.top = (el.offsetTop - pos2) + "px";
            el.style.left = (el.offsetLeft - pos1) + "px";
        };
    };
    }
}

const kernel = new TLC_Kernel();