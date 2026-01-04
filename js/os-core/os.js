/**
 * VPU KERNEL - SOVEREIGN OS (v1.2.8)
 * Core: TLC_Kernel
 * Logic: Window Management & Advanced App Routing
 */

import { SystemTray } from '../apps/tray.js';
import { registry } from './registry.js';
import { SovereignVFS } from '../apps/vfs.js'; // Ensure VFS is imported for secure file handling
import { startBootSequence } from './boot.js'; // Refined boot sequence
class TLC_Kernel {
    constructor() {
        this.isDraggingWindow = false;
        this.runningApps = new Set(); 
        this.sessionKey = null; 
        this.pinnedApps = ['time', 'tnfi', 'terminal', 'files', 'browser', 'messages', 'camera','vscode', 'settings']; 
        this.idleTimer = null;

        console.log("Kernel: Initializing Sovereign Core...");
        
        // 1. GLOBAL ROUTING LISTENER
        window.addEventListener('launchApp', (e) => {
            const appId = e.detail.appId;
            if (this.runningApps.has(appId)) {
                this.focusWindow(`win-${appId}`);
            } else {
                this.launchApp(appId);
            }
        });

        // 2. HIDE UI INITIALLY
        const osRoot = document.getElementById('os-root');
        const loginGate = document.getElementById('login-gate');
        const topBar = document.getElementById('top-bar');
        
        if(osRoot) osRoot.style.display = 'none';
        if(loginGate) {
            loginGate.style.display = 'none';
            loginGate.style.opacity = '0';
        }
        if(topBar) topBar.classList.add('hidden');

        // 3. START BOOT SEQUENCE (Handover Logic)
        startBootSequence(() => {
            console.log("Kernel: Boot Successful. Displaying Identity Access.");
            
            // Show login gate with transition
            if(loginGate) {
                loginGate.style.display = 'flex';
                setTimeout(() => loginGate.style.opacity = '1', 50);
            }
            
            // Only initialize subsystems AFTER the splash screen is gone
            this.init(); 
            this.systemTray = new SystemTray(this);
            this.setupIdleLock(300000); 
        }); // 5 minutes

        window.addEventListener('keydown', (e) => {
    // Escape key to exit Overview
    if (e.key === 'Escape' && document.body.classList.contains('task-overview-active')) {
        this.toggleTaskOverview();
    }
    
    // Ctrl + Space to open Overview (Standard Pro Shortcut)
    if (e.ctrlKey && e.code === 'Space') {
        e.preventDefault();
        this.toggleTaskOverview();
    }
});
    }

    // IDLE LOCK SYSTEM
    setupIdleLock(timeout) {
        const resetTimer = () => {
            clearTimeout(this.idleTimer);
            this.idleTimer = setTimeout(() => {
                // Ensure lockSystem exists before calling
                if (this.lockSystem) this.lockSystem();
            }, timeout);
        };

        // Listen for activity to reset the 5-minute clock
        window.addEventListener('mousemove', resetTimer);
        window.addEventListener('mousedown', resetTimer);
        window.addEventListener('keydown', resetTimer);
        window.addEventListener('touchstart', resetTimer);
        
        resetTimer(); // Start the first countdown
    }

    /**
     * ADVANCED ROUTING TABLE
     * Centralized definitions for app initialization.
     */
    get APP_ROUTES() {
        return {
            'terminal': async (container) => {
                const m = await import('../apps/terminal.js');
                const instance = new m.TerminalApp(container);
                instance.init();
                return instance;
            },
            'time': async (container) => {
                const m = await import('../apps/time.js');
                const instance = new m.TimeApp(container);
                instance.init();
                return instance;
            },
            'tnfi': (container) => {
                return this.renderTNFIDashboard(container);
            }
        };
    }

    init() {
        const loginBtn = document.getElementById('login-btn');
        if (loginBtn) {
            loginBtn.onclick = (e) => {
                e.preventDefault();
                this.transitionToShell();
            };
        } else {
            setTimeout(() => this.init(), 100);
        }
        this.setupContextMenu();

        // Quick Lock: Ctrl + L
window.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.key === 'l') {
        e.preventDefault();
        this.lockSystem(); 
    }
});
    }

    async transitionToShell() {
        console.log("Kernel: Initiating Security Handshake...");
        
        // 1. DOM REFERENCE CHECK
        const gate = document.getElementById('login-gate');
        const root = document.getElementById('os-root');
        const top = document.getElementById('top-bar');
        const workspace = document.getElementById('workspace');
        const passInput = document.getElementById('pass-input');

        const password = passInput ? passInput.value : "default_gateway";
        const memberId = document.getElementById('username')?.value || "GUEST";

        try {
            // 2. CRYPTOGRAPHIC KEY DERIVATION
            // We use PBKDF2 to turn the password into a raw AES-GCM key
            this.sessionKey = await SovereignVFS.deriveKey(password, memberId);
            
            if (!this.sessionKey) throw new Error("Key Derivation Failed");

            // 3. ENCLAVE PROVISIONING
            // Critical: Ensure Investor Allotment (2025-12-26) is written to IndexedDB
            await this.provisionInitialFiles();
            
            console.log("Kernel: Sovereign Enclave Unlocked. Validating Genesis Block...");
        } catch (e) {
            console.error("VFS CRITICAL ERROR:", e);
            alert("SECURITY PROTOCOL FAILURE: Handshake Denied.");
            return; // STOP: Do not transition to shell if key is invalid
        }

        // 4. UI TRANSITION (Only occurs on success)
        if (gate) gate.style.display = 'none';
        
        if (root) {
            root.classList.remove('hidden');
            root.style.display = 'block'; 

            // Initialize Dock Auto-Hide Sensor
            if (!document.getElementById('dock-sensor')) {
                const sensor = document.createElement('div');
                sensor.id = 'dock-sensor';
                sensor.onmouseenter = () => root.classList.remove('dock-hidden');
                document.body.appendChild(sensor);
            }

            // Snap Preview Layer
            if (workspace && !document.getElementById('snap-preview')) {
                const preview = document.createElement('div');
                preview.id = 'snap-preview';
                workspace.appendChild(preview);
            }
        }

        // 5. SUBSYSTEM IGNITION
        try {
            // Boot Clock Engine
            const { TimeApp } = await import('../apps/time.js');
            const bootClock = new TimeApp();
            if (bootClock.app && bootClock.app.startClock) {
                bootClock.app.startClock(); 
            }
        } catch (e) {
            console.warn("Temporal Engine: Secondary ignition failed, but system remains stable.");
        }

        if (top) {
            top.classList.remove('hidden');
            top.style.display = 'flex'; // Ensures layout matches VPU style
            top.style.opacity = '0';
            requestAnimationFrame(() => {
                top.style.transition = 'opacity 0.5s ease';
                top.style.opacity = '1';
            });
        }
        
        this.setupTopBarInteractions(); 
        this.bootShell();
        
        console.log("Kernel: Sovereign OS Shell Online.");
    }

    async provisionInitialFiles() {
        try {
            // Check if the drive is already provisioned by trying to read the readme
            const check = await SovereignVFS.read("home/readme.txt", this.sessionKey);
            
            if (!check) {
                console.log("Kernel: Genesis Boot. Provisioning encrypted volumes...");
                
                // Write the 2025-12-26 Investor Allotment Data
                await SovereignVFS.write(
                    "home/documents/investors.txt", 
                    "OFFICIAL RECORD: EPOS 2025-12-26\n--------------------------------\nAllotment: 15,000,000 VPU\nStatus: Verified & Locked\nTrust Tier: Root", 
                    this.sessionKey
                );

                await SovereignVFS.write(
                    "home/readme.txt", 
                    "Welcome to Sovereign OS. Your data is encrypted locally using AES-GCM.", 
                    this.sessionKey
                );
            }
        } catch (err) {
            console.warn("Provisioning skipped or drive already exists.");
        }
    }

    /**
     * SECURE FILE BRIDGE
     * This allows any app to request a decrypted file content
     */
    async openSecureFile(path) {
        // 1. SAFETY CHECK: If no key, don't even try the VFS
        if (!this.sessionKey) {
            console.error("Kernel: Access Denied. No Session Key found.");
            alert("Security Error: System Enclave is locked.");
            return;
        }

        try {
            console.log(`Kernel: Decrypting ${path}...`);
            
            // 2. USE THE IMPORTED VFS:
            // Ensure 'SovereignVFS' is correctly imported at the top of kernel.js
            const content = await SovereignVFS.read(path, this.sessionKey);
            
            if (content) {
                // SUCCESS: Data is now plain text
                alert(`[SECURE_VIEW] - ${path}\n\n${content}`);
            } else {
                console.warn("Kernel: File is empty or does not exist.");
            }
        } catch (e) {
            // This usually triggers if the password/key is wrong
            console.error("Decryption failed. Key mismatch or Corrupted Block.", e);
            alert("VFS Error: Decryption failed. Possible data corruption.");
        }

        console.log(`Kernel: Requesting secure access to ${path}`);
    // Logic to find the 'files' app and tell it to open this specific path
    const event = new CustomEvent('launchApp', { detail: { appId: 'files', filePath: path } });
    window.dispatchEvent(event);
    }

    setupContextMenu() {
    // 1. Create the Menu Element
    const menu = document.createElement('div');
    menu.id = 'global-context-menu';
    menu.style.cssText = `
        position: fixed; z-index: 10000; background: #1a1a1a; 
        border: 1px solid #333; border-radius: 8px; width: 180px;
        display: none; padding: 5px 0; box-shadow: 0 10px 25px rgba(0,0,0,0.5);
        font-family: 'Inter', sans-serif; font-size: 13px; color: #eee;
    `;
    document.body.appendChild(menu);

    // 2. Listen for Right Click
    window.addEventListener('contextmenu', (e) => {
        e.preventDefault(); // Stop browser menu
        
        const { clientX: x, clientY: y } = e;
        menu.style.top = `${y}px`;
        menu.style.left = `${x}px`;
        menu.style.display = 'block';

        // Dynamic Menu Content based on what was clicked
        this.renderMenuContent(menu, e.target);
    });

    // 3. Hide menu on click elsewhere
    window.addEventListener('click', () => {
        menu.style.display = 'none';
    });
}

// RENDER CONTEXT MENU ITEMS
renderMenuContent(menu, target) {
    // Check if we clicked on a window, a file, or the desktop
    const isWindow = target.closest('.os-window');
    
    let items = [
        { label: '📊 System Monitor', action: () => this.launchApp('monitor') },
        { label: '📝 Task Manager', action: () => this.launchApp('taskman') },
        { divider: true },
        { label: '🖼️ Change Wallpaper', action: () => alert('Wallpaper settings coming soon.') }
    ];

    if (isWindow) {
        items.unshift(
            { label: '❌ Close Window', action: () => {
                const appId = isWindow.id.replace('win-', '');
                this.closeApp(appId, isWindow.id);
            }},
            { divider: true }
        );
    }
    if (target.closest('#canvas-bank')) {
    items.push({ label: '💳 Copy VPU Address', action: () => {
        navigator.clipboard.writeText('0xVPU_GENESIS_2025_12_26');
        alert('Address Copied');
    }});
}

// security action at the end
    items.push({ divider: true });
items.push({ 
    label: '🔒 Lock Enclave', 
    action: () => this.lockSystem(),
    style: 'color: #f87171;' // Red text for security actions
});

// Update the rendering loop to apply custom styles if they exist:
menu.innerHTML = items.map(item => {
    if (item.divider) return `<div style="height:1px; background:#333; margin:5px 0;"></div>`;
    return `<div class="menu-item" style="padding: 8px 15px; cursor: pointer; transition: 0.2s; ${item.style || ''}">${item.label}</div>`;
}).join('');

    // Attach click events
    menu.querySelectorAll('.menu-item').forEach((el, i) => {
        const actionableItems = items.filter(item => !item.divider);
        el.onclick = actionableItems[i].action;
        el.onmouseenter = () => el.style.background = '#38bdf8';
        el.onmouseleave = () => el.style.background = 'transparent';
    });
}

// SECURITY PROTOCOL: LOCK SYSTEM
lockSystem() {
    console.warn("Kernel: SECURITY PROTOCOL ACTIVE. Purging Session Key...");

    // 1. Wipe the sensitive AES key from memory
    this.sessionKey = null;

    // 2. Close all running applications to clear decrypted data from the DOM
    Object.keys(this.runningApps).forEach(appId => {
        this.killProcess(appId);
    });

    // 3. Clear the workspace and show the login gate
    const gate = document.getElementById('login-gate');
    const root = document.getElementById('os-root');
    const top = document.getElementById('top-bar');
    const passInput = document.getElementById('pass-input');

    if (gate) gate.style.display = 'flex';
    if (root) root.style.display = 'none';
    if (top) top.classList.add('hidden');
    if (passInput) passInput.value = ''; // Clear password field

    console.log("Kernel: System Enclave Locked.");
}
    setupTopBarInteractions() {
        const topBarTime = document.getElementById('top-bar-time');
        if (topBarTime) {
            topBarTime.style.cursor = 'pointer';
            topBarTime.onclick = async () => {
                const existingHud = document.getElementById('temporal-hud');
                if (existingHud) {
                    existingHud.style.opacity = '0';
                    setTimeout(() => existingHud.remove(), 200);
                    return;
                }
                const { TimeApp } = await import('../apps/time.js');
                new TimeApp().app.renderHUD(); 
            };
        }
    }

    bootShell() {
    const dock = document.getElementById('side-dock');
    if (!dock) return;
    dock.innerHTML = ''; 
    // --- ADDED: TASK VIEW BUTTON (Far Left) ---
    const taskViewBtn = document.createElement('div');
    taskViewBtn.className = 'dock-item task-view-trigger';
    taskViewBtn.title = "View Open Apps";
    taskViewBtn.innerHTML = `<span><svg viewBox="0 0 24 24" width="20" height="20" stroke="#a445ff" fill="none" stroke-width="2"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg></span>`;
    taskViewBtn.onclick = () => this.toggleTaskOverview();
    dock.appendChild(taskViewBtn);
    // --- END ADDITION ---
    this.pinnedApps.forEach((appId) => {
        const app = registry.find(a => a.id === appId);
        if (!app) return;

        const dItem = document.createElement('div');
        const isRunning = this.runningApps.has(appId);
        dItem.className = `dock-item ${isRunning ? 'running' : ''}`;
        dItem.title = app.name;
        dItem.innerHTML = `<span>${app.icon}</span>`;
        
        dItem.onclick = () => {
            // 1. Handle the Menu Overlay (Close it if it's open)
            const overlay = document.getElementById('app-menu-overlay');
            if (overlay) {
                overlay.classList.add('hidden');
                overlay.style.display = 'none';
            }

            // 2. Handle the App Logic
            if (isRunning) {
                // This calls focusWindow which now includes display: block
                this.focusWindow(`win-${appId}`);
            } else {
                this.launchApp(appId);
            }
        };
        
        dock.appendChild(dItem);
    });

    // App Menu Dot Trigger
    const menuBtn = document.createElement('div');
    menuBtn.className = 'dock-bottom-trigger';
    for(let i = 0; i < 9; i++) {
        const dot = document.createElement('div');
        dot.className = 'menu-dot';
        menuBtn.appendChild(dot);
    }
    menuBtn.onclick = () => this.openAppMenu();
    dock.appendChild(menuBtn);
}

    toggleTaskOverview() {
    const workspace = document.getElementById('workspace');
    const windows = document.querySelectorAll('.os-window');
    
    // Toggle the state
    const isEntering = !document.body.classList.contains('task-overview-active');
    document.body.classList.toggle('task-overview-active');

    if (isEntering) {
        // 1. Create Blur Overlay
        const blur = document.createElement('div');
        blur.id = 'overview-blur';
        blur.innerHTML = `
            <div id="overview-search-wrap"><input type="text" id="overview-search" placeholder="FILTER ENCLAVES..." autofocus></div>
            <button id="purge-all-btn">TERMINATE ALL</button>
            <div id="overview-grid"></div>
        `;
        workspace.appendChild(blur);

        const grid = document.getElementById('overview-grid');

        // 2. Prepare Windows for Grid
        windows.forEach((win) => {
            // Save current state so we can perfectly restore it
            win.dataset.oldTransform = win.style.transform;
            win.dataset.oldLeft = win.style.left;
            win.dataset.oldTop = win.style.top;
            win.dataset.oldWidth = win.style.width;

            win.classList.add('in-overview');
            grid.appendChild(win); // Move window into the grid container for auto-layout

            win.onclick = (e) => {
                e.stopPropagation();
                this.exitOverview(win.id);
            };
        });

        // Setup Search
        const searchInput = document.getElementById('overview-search');
        searchInput.oninput = (e) => {
            const query = e.target.value.toLowerCase();
            windows.forEach(win => {
                const match = win.querySelector('.title').innerText.toLowerCase().includes(query);
                win.style.display = match ? "block" : "none";
            });
        };

    } else {
        this.exitOverview();
    }
}

// 3. New Helper to Restore Windows Properly
exitOverview(focusId = null) {
    const workspace = document.getElementById('workspace');
    const windows = document.querySelectorAll('.os-window');
    const blur = document.getElementById('overview-blur');

    windows.forEach(win => {
        win.classList.remove('in-overview');
        // Restore original geometry
        win.style.transform = win.dataset.oldTransform || "";
        win.style.left = win.dataset.oldLeft || "50px";
        win.style.top = win.dataset.oldTop || "50px";
        win.style.width = win.dataset.oldWidth || "clamp(320px, 65vw, 900px)";
        win.style.display = "block";
        
        workspace.appendChild(win); // Move back to main workspace
    });

    document.body.classList.remove('task-overview-active');
    if (blur) blur.remove();
    
    if (focusId) this.focusWindow(focusId);
}
    launchApp(appId) {
        // 1. Close the overlay menu immediately
        const overlay = document.getElementById('app-menu-overlay');
        if (overlay) {
            overlay.classList.add('hidden');
            overlay.style.display = 'none';
        }

        const app = registry.find(a => a.id === appId);
        const workspace = document.getElementById('workspace');
        if (!app || !workspace) return;

        const winId = `win-${appId}`;
        
        // Prevent duplicate windows
        if (this.runningApps.has(appId)) {
            this.focusWindow(winId);
            return;
        }

        this.runningApps.add(appId);
        this.bootShell(); // Refresh dock icons to show "running" state

        const win = document.createElement('div');
        win.className = 'os-window';
        win.id = winId;

        // --- RESTORED GOLD GEOMETRY ---
        win.style.position = "absolute"; 
        win.style.top = "10px";
        win.style.left = "5px";
        
        // Use clamp to ensure windows don't get too small or too large
        win.style.width = "clamp(320px, 65vw, 900px)";
        win.style.height = "clamp(300px, 65vh, 720px)";

        // Responsive mobile override
        if (window.innerWidth < 480) {
            win.style.width = "calc(100vw - (var(--dock-width, 70px) + 10px))";
        }

        win.style.zIndex = this.getTopZIndex();

        // Standard OS Window structure
        win.innerHTML = `
            <div class="window-header">
                <span class="title">${app.icon} ${app.name}</span>
                <div class="window-controls">
                    <button class="win-btn hide" id="hide-${winId}">
                        <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" fill="none" stroke-width="2.5"><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                    </button>
                    <button class="win-btn expand" id="max-${winId}">
                        <svg viewBox="0 0 24 24" width="12" height="12" stroke="currentColor" fill="none" stroke-width="2.5"><rect x="3" y="3" width="18" height="18" rx="1"></rect></svg>
                    </button>
                    <button class="win-btn close" id="close-${winId}">
                        <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" fill="none" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    </button>
                </div>
            </div>
            <div class="window-content" id="canvas-${appId}" style="height: calc(100% - 50px); overflow: auto;">
                <div class="app-loading">System: Initializing ${app.name}...</div>
            </div>`;

        workspace.appendChild(win);
        
        // --- RESTORED ANIMATION SEQUENCE ---
        requestAnimationFrame(() => {
            win.style.opacity = "0";
            win.style.transform = "translateY(10px)"; // Start slightly lower
            requestAnimationFrame(() => {
                win.style.transition = "all 0.3s cubic-bezier(0.165, 0.84, 0.44, 1)";
                win.style.opacity = "1";
                win.style.transform = "translateY(0)";
            });
        });

        // Controls & Interactivity
        win.querySelector(`#hide-${winId}`).onclick = (e) => { e.stopPropagation(); this.minimizeWindow(winId); };
        win.querySelector(`#max-${winId}`).onclick = (e) => { e.stopPropagation(); this.toggleMaximize(winId); };
        win.querySelector(`#close-${winId}`).onclick = (e) => { e.stopPropagation(); this.closeApp(appId, winId); };
        
        win.onmousedown = () => this.focusWindow(winId);
        win.addEventListener('touchstart', () => this.focusWindow(winId), {passive: true});
        
        this.makeDraggable(win);
        this.injectAppContent(appId);
    }

    /**
     * UPDATED INJECTOR: This version combines hardcoded routes 
     * with your new Dynamic Registry Loader.
     */
    async injectAppContent(appId) {
        const container = document.getElementById(`canvas-${appId}`);
        if (!container) return;
        const win = container.closest('.os-window');

        // 1. Check Hardcoded Routes
        const route = this.APP_ROUTES[appId];
        if (route) {
            try {
                const instance = await route(container);
                if (instance) win.dataset.engineInstance = instance;
                return; 
            } catch (err) {
                console.error(`Kernel: Route failed for ${appId}:`, err);
            }
        }

        // 2. Dynamic Registry Loading (Security-Aware)
        const appData = registry.find(a => a.id === appId);
        if (appData && appData.file) {
            try {
                const filePath = appData.file.startsWith('./') ? appData.file : `./${appData.file}`;
                const module = await import(filePath);
                
                // Construct class name (e.g., "FilesApp")
                const className = appId.charAt(0).toUpperCase() + appId.slice(1) + "App";
                
                if (module[className]) {
                    // CRITICAL: Pass the sessionKey here so the app can decrypt files
                    const instance = new module[className](container, this.sessionKey);
                    
                    // We MUST await init() or the "initializing" div won't be replaced
                    if (instance.init) {
                        await instance.init(); 
                    }
                    
                    win.dataset.engineInstance = instance;
                }
            } catch (err) {
                console.error(`Kernel: Handshake failed for ${appId}:`, err);
                container.innerHTML = `<div style="padding:20px; color:#ff4444;">[SYS_ERR]: Handshake Failed. Verify VFS Key.</div>`;
            }
        } else {
            // 3. Last Resort
            container.innerHTML = `<div style="padding:20px; color:#00ff41;">${appId.toUpperCase()} online. Awaiting module deployment.</div>`;
        }
    }
    renderTNFIDashboard(container) {
        container.innerHTML = `
            <div class="tnfi-app" style="padding:25px; color:#a445ff; font-family: 'Courier New', monospace;">
                <h2 style="margin:0; letter-spacing:2px;">BANK OF SOVEREIGN</h2>
                <div style="font-size:12px; color:#00ff41; margin-bottom:20px;">GENESIS ALLOTMENT VERIFIED // LOCK_DATE: 2025-12-26</div>
                
                <div style="background:rgba(164, 69, 255, 0.05); padding:15px; border-left:3px solid #00ff41; margin-bottom:20px;">
                    <div style="font-size:10px; opacity:0.7;">TOTAL SUPPLY</div>
                    <div style="font-size:18px; color:#fff;">100,000,000 VPU</div>
                </div>

                <table style="width:100%; border-collapse:collapse; font-size:13px;">
                    <thead style="color:rgba(255,255,255,0.5); text-align:left; border-bottom:1px solid #333;">
                        <tr><th style="padding:10px 0;">ENTITY</th><th>ALLOTMENT</th><th>STATUS</th></tr>
                    </thead>
                    <tbody style="color:#00ff41;">
                        <tr style="border-bottom:1px solid #222;"><td style="padding:12px 0;">EPOS CORE</td><td>50,000,000</td><td>LOCKED</td></tr>
                        <tr style="border-bottom:1px solid #222;"><td style="padding:12px 0;">INVESTORS</td><td>15,000,000</td><td>10% TGE</td></tr>
                        <tr><td style="padding:12px 0;">LIQUIDITY</td><td>20,000,000</td><td>UNLOCKED</td></tr>
                    </tbody>
                </table>
            </div>`;
        return { id: "TNFI_STUB" };
    }

    makeDraggable(el) {
        const header = el.querySelector('.window-header');
        if (!header) return;

        let dragging = false;
        let startX = 0, startY = 0;
        let startLeft = 0, startTop = 0;

        const onDown = (e) => {
            if (e.target.closest('.win-btn')) return;
            dragging = true;
            this.isDraggingWindow = true;
            el.style.transition = 'none';
            el.style.transform = 'none';
            startX = e.clientX;
            startY = e.clientY;
            startLeft = el.offsetLeft;
            startTop  = el.offsetTop;
            try { el.setPointerCapture(e.pointerId); } catch (_) {}
            e.preventDefault();
        };

        const onMove = (e) => {
    if (!dragging) return;
    
    // 1. Get the current workspace dimensions
    const workspace = el.parentElement;
    const workWidth = workspace.clientWidth;
    const workHeight = workspace.clientHeight; // This is the key!

    // 2. Calculate requested position
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    let newLeft = startLeft + dx;
    let newTop = startTop + dy;

    // 3. Apply strict boundaries
    // Horizontal: 5px margin from left and right
    newLeft = Math.max(5, Math.min(newLeft, workWidth - el.offsetWidth - 5));

    // Vertical: 5px margin from top and bottom
    // We use workHeight instead of window.innerHeight to prevent bleeding
    const maxTop = workHeight - el.offsetHeight - 5;
    newTop = Math.max(5, Math.min(newTop, maxTop));

    // 4. Update element
    el.style.left = `${newLeft}px`;
    el.style.top = `${newTop}px`;
    this.checkDockCollision(); // Call the collision logic here
    e.preventDefault();
};

        const onUp = () => {
            if (!dragging) return;
            dragging = false;
            this.isDraggingWindow = false;
            el.style.transition = 'all 0.25s cubic-bezier(0.2, 0.8, 0.3, 1)';
            this.updateDockSafety(false);
        };

        header.addEventListener('pointerdown', onDown, { passive: false });
        el.addEventListener('pointermove', onMove, { passive: false });
        el.addEventListener('pointerup', onUp);
        el.addEventListener('pointercancel', onUp);
    }

     checkDockCollision() {
    const windows = document.querySelectorAll('.os-window');
    const threshold = 100; // Pixels from left edge
    let shouldHide = false;

    windows.forEach(win => {
        const left = parseInt(win.style.left);
        // If window is minimized, we ignore it
        if (!win.classList.contains('minimized') && left < threshold) {
            shouldHide = true;
        }
    });

    if (shouldHide) {
        document.getElementById('os-root').classList.add('dock-retracted');
    } else {
        document.getElementById('os-root').classList.remove('dock-retracted');
    }
}

    openAppMenu() {
        const overlay = document.getElementById('app-menu-overlay');
        const grid = document.getElementById('app-grid-container');
        const searchInput = document.getElementById('app-search');
        if (!overlay || !grid) return;

        if (!overlay.classList.contains('hidden')) {
            overlay.classList.add('hidden');
            overlay.style.display = 'none';
            return;
        }

        overlay.classList.remove('hidden');
        overlay.style.display = 'flex'; 
        searchInput.value = ''; 
        if (window.innerWidth > 768) searchInput.focus();

        const renderGrid = (filter = '') => {
            grid.innerHTML = '';
            registry.filter(app => app.name.toLowerCase().includes(filter.toLowerCase())).forEach(app => {
                const card = document.createElement('div');
                card.className = 'launcher-card';
                card.innerHTML = `<div class="icon">${app.icon}</div><div class="name">${app.name}</div>`;
                card.onclick = () => {
                    this.launchApp(app.id);
                    overlay.classList.add('hidden');
                    overlay.style.display = 'none';
                };
                grid.appendChild(card);
            });
        };
        renderGrid();
        searchInput.oninput = (e) => renderGrid(e.target.value);
    }

 killProcess(appId) {
    const winId = `win-${appId}`;
    const win = document.getElementById(winId);
    
    // 1. Clean up the Engine Instance (Destructors)
    if (win && win.dataset.engineInstance) {
        const instance = win.dataset.engineInstance;
        if (instance.destruct) instance.destruct(); // Stop intervals/telemetry
    }

    // 2. Remove from DOM and State
    if (win) win.remove();
    this.runningApps.delete(appId);
    
    // 3. Refresh UI
    this.bootShell(); 
    this.checkDockCollision();
}

closeApp(appId, winId) {
    const win = document.getElementById(winId);
    if (!win) return;
    
    win.classList.add('closing'); // Trigger CSS animation
    setTimeout(() => {
        this.killProcess(appId);
    }, 300);
}

// Ensure closeWindow also uses the correct Set syntax
closeWindow(appId) {
    this.runningApps.delete(appId);
    const windowElement = document.getElementById(`win-${appId}`);
    if (windowElement) windowElement.remove();
    this.bootShell();
    window.dispatchEvent(new CustomEvent('process-killed', { detail: { appId } }));
}


    minimizeWindow(id) {
        const el = document.getElementById(id);
        if (el) {
            el.classList.add('minimizing');
            setTimeout(() => {
                el.style.display = 'none';
                el.classList.remove('minimizing');
                this.updateDockSafety();
            }, 400);
        }
    }

    getTopZIndex() {
    const windows = document.querySelectorAll('.os-window');
    let max = 100;
    windows.forEach(win => {
        const z = parseInt(win.style.zIndex) || 100;
        if (z > max) max = z;
    });
    return max + 1;
}

    toggleMaximize(id) {
        const el = document.getElementById(id);
        if (!el) return;
        el.classList.toggle('maximized');
        this.updateDockSafety();
    }

    updateDockSafety() {
        const dock = document.getElementById('side-dock');
        const osRoot = document.getElementById('os-root');
        const windows = document.querySelectorAll('.os-window:not(.closing):not(.minimizing)');
        const shouldHide = [...windows].some(win => win.classList.contains('maximized'));

        if (shouldHide) {
            osRoot.classList.add('dock-hidden');
            dock.style.opacity = '0';
            dock.style.pointerEvents = 'none';
        } else {
            osRoot.classList.remove('dock-hidden');
            dock.style.opacity = '1';
            dock.style.pointerEvents = 'auto';
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

    focusWindow(winId) {
    const el = document.getElementById(winId);
    if (el) {
        // Ensure the window is visible if it was previously minimized
        el.style.display = 'block'; 
        el.style.zIndex = this.getTopZIndex();
        
        // Optional: remove any 'minimizing' classes if you use them for animations
        el.classList.remove('minimizing');
    }
}
}

window.kernel = new TLC_Kernel();

window.addEventListener('resize', () => {
    if (window.innerWidth <= 768) {
        document.querySelectorAll('.os-window').forEach(win => {
            win.style.top = '0';
            win.style.left = '0';
            win.style.width = '100vw';
            win.style.height = '100vh';
            win.style.borderRadius = '0';
        });
    }
});
