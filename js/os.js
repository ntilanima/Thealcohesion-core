import { registry } from './registry.js';

class TLC_Kernel {
    constructor() {
        this.DOCK_WIDTH = 70; // Width in pixels
        this.pinnedApps = ['time', 'tnfi', 'terminal', 'files', 'browser', 'messages', 'camera', 'settings']; 
        this.runningApps = new Set(); 
        
        console.log("Kernel: Initializing Sovereign Core...");
        this.currentZoom = 1.0; // 100%
        this.vaultLocked = true; // Start locked
        this.vpuLogo = `
        _   _  ____  _   _ 
        | | | ||  _ \\| | | |
        | | | || |_) | | | |
        | |/ / |  __/| |_| |
        |___/  |_|    \\___/ 
                            
        VIRTUAL PRAGMATIC UNIVERSE
        --------------------------`;
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

    initMatrix(container) {
        const canvas = document.createElement('canvas');
        canvas.style.position = 'absolute';
        canvas.style.top = '0';
        canvas.style.left = '0';
        canvas.style.width = '100%';
        canvas.style.height = '100%';
        canvas.style.zIndex = '1';
        canvas.style.opacity = '0.3'; // Keep it subtle so you can still see text
        container.style.position = 'relative';
        container.appendChild(canvas);

        const ctx = canvas.getContext('2d');
        canvas.width = container.offsetWidth;
        canvas.height = container.offsetHeight;

        const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%^&*";
        const fontSize = 10;
        const columns = canvas.width / fontSize;
        const drops = Array(Math.floor(columns)).fill(1);

        const draw = () => {
            ctx.fillStyle = "rgba(0, 0, 0, 0.05)";
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = "#00ff41";
            ctx.font = fontSize + "px monospace";

            drops.forEach((y, i) => {
                const text = letters[Math.floor(Math.random() * letters.length)];
                ctx.fillText(text, i * fontSize, y * fontSize);
                if (y * fontSize > canvas.height && Math.random() > 0.975) drops[i] = 0;
                drops[i]++;
            });
        };
        
        const matrixInterval = setInterval(draw, 33);
        // Store interval on the window element so we can stop it if closed
        container.closest('.os-window').dataset.intervalId = matrixInterval;
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
        // 1. Hover Sensor for Dock
            const sensor = document.createElement('div');
            sensor.id = 'dock-sensor';
            sensor.onmouseenter = () => root.classList.remove('dock-hidden');
            document.body.appendChild(sensor);

            // 2. Snap Preview Shadow
            const preview = document.createElement('div');
            preview.id = 'snap-preview';
            workspace.appendChild(preview);
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
    // Application Launcher
    launchApp(appId) {
    // Close overlay if open
    const overlay = document.getElementById('app-menu-overlay');
    if (overlay) {
        overlay.classList.add('hidden');
        overlay.style.display = 'none';
    }

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

    // --- STEP: INDUSTRIAL FIXED POSITIONING ---
        const DW = 70;         // Dock width
        const margin = 5;      // Margin from dock
        const topMargin = 10;  // Margin from top bar
        const rightMargin = 20; // 20px from right edge
        const isMobile = window.innerWidth < 768;

        const stagger = (this.runningApps.size - 1) * 20;

        if (isMobile) {
            // MOBILE: Fixed margins, dynamic width
            win.style.top = `${topMargin + stagger}px`;
            win.style.left = `${DW + margin + stagger}px`;
            
            // Instead of width, we set the right property or calc the width
            // Width = Total Width - Dock(70) - LeftMargin(5) - RightMargin(20)
            win.style.width = `calc(100vw - ${DW + margin + rightMargin}px)`;
            win.style.height = `70vh`; // Adjust height for mobile visibility
        } else {
            // DESKTOP: Original fixed size
            win.style.width = "750px";
            win.style.height = "500px";
            win.style.left = `${DW + margin + stagger}px`;
            win.style.top = `${topMargin + stagger}px`;
        }
        // Use a local count for staggering to ensure it's accurate
        const staggerIndex = this.runningApps.size - 1;
        const staggerOffset = staggerIndex * 25;

        // Apply dimensions
        win.style.width = "750px";
        win.style.height = "500px";

        // Apply exact coordinates relative to the workspace
        win.style.left = (DW + margin + staggerOffset) + "px";
        win.style.top = (topMargin + staggerOffset) + "px";

        // Apply Z-Index

    // --- STEP: INDUSTRIAL ICONS (NO TRAFFIC LIGHTS) ---
    win.innerHTML = `
        <div class="window-header">
            <span class="title">${app.icon} ${app.name}</span>
            <div class="window-controls">
            <button class="win-btn hide" id="hide-${winId}">
                <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2.5" fill="none"><line x1="5" y1="12" x2="19" y2="12"></line></svg>
            </button>
            <button class="win-btn expand" id="max-${winId}">
                <svg viewBox="0 0 24 24" width="12" height="12" stroke="currentColor" stroke-width="2.5" fill="none"><rect x="3" y="3" width="18" height="18" rx="1"></rect></svg>
            </button>
            <button class="win-btn close" id="close-${winId}">
                <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2.5" fill="none"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
        </div>
        </div>
        <div class="window-content" id="canvas-${appId}">
            <div class="app-loading">System: Initializing ${app.name}...</div>
        </div>
    `;

    workspace.appendChild(win);
    
    // Trigger opening spring animation
    requestAnimationFrame(() => win.classList.add('visible'));

    // Event Listeners
    win.querySelector(`#hide-${winId}`).onclick = (e) => { e.stopPropagation(); this.minimizeWindow(winId); };
    win.querySelector(`#max-${winId}`).onclick = (e) => { e.stopPropagation(); this.toggleMaximize(winId); };
    win.querySelector(`#close-${winId}`).onclick = (e) => { e.stopPropagation(); this.closeApp(appId, winId); };
    
    win.onmousedown = () => this.focusWindow(winId);
    this.makeDraggable(win);
    this.injectAppContent(appId);
    }

    // Helper to inject app-specific content

    injectAppContent(appId) {
    const container = document.getElementById(`canvas-${appId}`);
    if (!container) return;

    if (appId === 'tnfi') {
        container.innerHTML = `
            <div style="padding:20px;">
                <h3>Bank of Sovereign</h3>
                <p>Investor Allotment: <strong>EPOS 2025</strong></p>
                <p>Status: <span style="color:#00ff00;">Liquid</span></p>
            </div>`;
    } else if (appId === 'terminal') {
        container.innerHTML = `
            <div id="vpu-terminal" style="background:#000; color:#00ff41; font-family:monospace; height:100%; display:flex; flex-direction:column; padding:15px; box-sizing:border-box;">
                <div id="term-output" style="flex:1; overflow-y:auto; margin-bottom:10px; font-size:12px; white-space:pre;">System: Initializing Command Core...</div>
                <div style="display:flex; gap:10px;">
                    <span style="color:#a445ff; font-weight:bold;">admin@vpu:~$</span>
                    <input type="text" id="term-input" autocomplete="off" style="background:transparent; border:none; color:#00ff41; font-family:inherit; outline:none; flex:1;">
                </div>
            </div>`;
        this.initTerminalLogic();
    } else {
        container.innerHTML = `<div style="padding:20px;">${appId.toUpperCase()} system online. Ready for Sovereign input.</div>`;
    }
}

//open App Menu (Sovereign Launcher)
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
    const el = document.getElementById(winId);
    const root = document.getElementById('os-root');
    const dock = document.getElementById('side-dock');

    if (el) {
        el.classList.add('closing');
        
        // --- DOCK RECOVERY LOGIC ---
        // If we are closing a maximized window or a window touching the dock
        const rect = el.getBoundingClientRect();
        if (el.classList.contains('maximized') || rect.left < this.DOCK_WIDTH) {
            // Wait slightly so the window starts fading before the dock slides back
            setTimeout(() => {
                dock.classList.add('smooth-return');
                dock.style.transform = `translateX(0%)`;
                dock.style.opacity = "1";
                root.classList.remove('dock-hidden');
            }, 100);
        }

        setTimeout(() => {
            el.remove();
            this.runningApps.delete(appId);
            this.bootShell();
            this.updateDockSafety();
        }, 300);
    }
    }

    closeWindow(id) {
        const el = document.getElementById(id);
        if (el) el.remove();
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

    toggleMaximize(id) {
    const el = document.getElementById(id);
    const root = document.getElementById('os-root');
    const dock = document.getElementById('side-dock');

    if (el) {
        const isMaximized = el.classList.toggle('maximized');
        
        // Ensure dock is in smooth-return mode for the toggle
        dock.classList.add('smooth-return');

        if (isMaximized) {
            dock.style.transform = `translateX(-100%)`;
            dock.style.opacity = "0";
            root.classList.add('dock-hidden');
        } else {
            // Restore only if the window isn't currently sitting on the dock
            const rect = el.getBoundingClientRect();
            if (rect.left >= this.DOCK_WIDTH) {
                dock.style.transform = `translateX(0%)`;
                dock.style.opacity = "1";
                root.classList.remove('dock-hidden');
            }
        }
    }
    this.updateDockSafety();
    }

    updateDockSafety() {
    const root = document.getElementById('os-root');
    const dock = document.getElementById('side-dock');
    const windows = document.querySelectorAll('.os-window:not(.closing):not(.minimizing)');
    
    let shouldHide = false;

    windows.forEach(win => {
        const rect = win.getBoundingClientRect();
        // If any window is maximized OR touching the dock zone
        if (win.classList.contains('maximized') || (rect.left < this.DOCK_WIDTH && win.style.display !== 'none')) {
            shouldHide = true;
        }
    });

    if (!shouldHide) {
        dock.classList.add('smooth-return');
        dock.style.transform = `translateX(0%)`;
        dock.style.opacity = "1";
        root.classList.remove('dock-hidden');
    }
    }

    focusWindow(id) {
        const el = document.getElementById(id);
        if (el) {
            el.style.display = 'flex'; 
            el.style.zIndex = this.getTopZIndex();
            // Trigger spring-back if it was minimized
            requestAnimationFrame(() => el.classList.add('visible'));
        }
        // Brief delay to ensure display:flex is registered before removing classes
        requestAnimationFrame(() => {
            el.classList.remove('minimizing');
        });
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
    initTerminalLogic() {
    const input = document.getElementById('term-input');
    if (!input) return;

    input.focus();
    input.onkeydown = (e) => {
        if (e.key === 'Enter') {
            const cmd = input.value;
            this.handleTerminalCommand(cmd);
            input.value = '';
        }
    };
    setTimeout(() => this.handleTerminalCommand('neofetch'), 500);
    }   
    // Terminal Command Handler
    // Terminal Command Handler
    handleTerminalCommand(cmd) {
    const output = document.getElementById('term-output');
    const termBody = document.getElementById('vpu-terminal'); 
    let response = "";
    
    const parts = cmd.trim().split(' ');
    const cleanCmd = parts[0].toLowerCase();
    const argument = parts[1] ? parts[1].toLowerCase() : null;

    switch(cleanCmd) {
        case 'neofetch':
            const specs = [
                `OS: Thealcohesion Sovereign Core`,
                `Kernel: VPU 3.5.2-Genesis`,
                `Uptime: ${Math.floor(performance.now() / 60000)} mins`,
                `Vault: ${this.vaultLocked ? 'LOCKED 🔒' : 'UNLOCKED 🔓'}`,
                `Allotment: EPOS/Investor Confirmed`,
                `Status: Verified Member`
            ];
            const logo = [
                `  _   _  ____  _   _ `,
                ` | | | ||  _ \\| | | |`,
                ` | | | || |_) | | | |`,
                ` | |/ / |  __/| |_| |`,
                ` |___/  |_|    \\___/ `
            ];
            response = logo.map((line, i) => 
                `<span style="color:#a445ff;">${line}</span>   ${specs[i] || ''}`
            ).join('\n');
            break;

        case 'unlock':
            if (argument === 'genesis2025') {
                this.vaultLocked = false;
                response = `<span style="color:#00ff41;">[SUCCESS]</span> Vault decrypted. Type 'vault' to view contents.`;
            } else {
                response = `<span style="color:#ff4545;">[ERROR]</span> Invalid Key Phrase. Access logged.`;
            }
            break;

        case 'lock':
            this.vaultLocked = true;
            response = `<span style="color:#a445ff;">[SECURED]</span> Sovereign Vault has been re-sealed.`;
            break;

        case 'vault':
            if (this.vaultLocked) {
                response = `<span class="access-denied">[ACCESS DENIED]</span>\nSystem is currently LOCKED.\nType 'unlock [key]' to proceed.`;
            } else {
                response = `
                <span style="color:#a445ff;">┌───────────────── SOVEREIGN VAULT ────────────────┐</span>
                <span style="color:#888;">FILE ID          CLASSIFICATION    CONTENT</span>
                ───────          ──────────────    ───────
                SEC-01           TOP SECRET        Investor Allotment: EPOS 2025
                SEC-02           RESTRICTED        Initial Allotment: Verified
                SEC-03           INTERNAL          Baseline: 5GB Allocation
                <span style="color:#a445ff;">└──────────────────────────────────────────────────┘</span>`;
            }
            break;

        case 'matrix':
            if (termBody) {
                this.initMatrix(termBody);
                response = "Sovereign Overlay Initialized...";
            }
            break;

        case 'help':
            response = "Available: status, allotment, clear, whoami, neofetch, matrix, v-pos, vault, unlock [key], lock";
            break;

        case 'status':
            response = "System: ONLINE\nKernel: Sovereign Core v1.0\nShield: ACTIVE";
            break;

        case 'allotment':
            response = "QUERY: Genesis Distribution...\nRESULT: EPOS and Investors confirmed for initial allotment.";
            break;

        case 'whoami':
            response = "User: Verified Member\nRole: Sovereign Access";
            break;

        case 'v-pos':
            // Shortened borders to prevent overflow on small screens
            response = `
            <span style="color:#a445ff;">┌── ALLOTMENT LEDGER ──┐</span>
            <span style="color:#888;">ENTITY    ROLE    STATUS</span>
            ──────    ────    ──────
            EPOS      Sys     <span style="color:#00ff41;">INIT</span>
            INVESTOR  Fnd     <span style="color:#00ff41;">CONF</span>
            GENESIS   Core    <span style="color:#00ff41;">5GB</span>
            <span style="color:#a445ff;">└──────────────────────┘</span>`;
            break;
        case 'ghost':
        const winContent = termBody.closest('.window-content');
        if (winContent.style.backgroundColor === 'rgba(0, 0, 0, 0.6)') {
            winContent.style.backgroundColor = '#000';
            response = "Ghost mode: DEACTIVATED";
        } else {
            winContent.style.backgroundColor = 'rgba(0, 0, 0, 0.6)';
            response = "Ghost mode: ACTIVATED";
        }
        break;
        case 'zoom':
        const level = parseFloat(argument); // Example: 'zoom 1.2'
        if (!isNaN(level) && level >= 0.5 && level <= 2.0) {
            this.currentZoom = level;
            // Apply the zoom to the terminal body
            termBody.style.fontSize = `calc(clamp(9px, 1.5vw, 14px) * ${this.currentZoom})`;
            response = `Zoom level set to ${this.currentZoom * 100}%`;
        } else {
            response = `Usage: zoom [0.5 - 2.0]. Current: ${this.currentZoom}`;
        }
        break;
        case 'clear':
            output.innerHTML = `<span style="color:#a445ff;">${this.vpuLogo}</span>\n`;
            return; 

        default:
            response = `Command not found: ${cleanCmd}`;
    }

    output.innerHTML += `\n<span style="color:#888;">> ${cmd}</span>\n${response}\n`;
    output.scrollTop = output.scrollHeight;
    }

    updateDockSafety() {
    const dock = document.getElementById('side-dock');
    if (!dock) return;

    const windows = document.querySelectorAll('.os-window:not(.closing)');
    let activeCollision = false;

    windows.forEach(win => {
        const rect = win.getBoundingClientRect();
        const isMax = win.classList.contains('maximized');
        const isVisible = win.style.display !== 'none';
        
        if (isVisible && (isMax || rect.left < this.DOCK_WIDTH)) {
            activeCollision = true;
        }
    });

    dock.classList.add('smooth-return');
    if (activeCollision) {
        dock.style.transform = `translateX(-110%)`; // Push it slightly further
        dock.style.opacity = "0";
        // Prevent accidental clicks on a hidden dock
        dock.style.pointerEvents = "none"; 
    } else {
        dock.style.transform = `translateX(0%)`;
        dock.style.opacity = "1";
        dock.style.pointerEvents = "all";
    }
    }

    makeDraggable(el) {
    const header = el.querySelector('.window-header');
    const root = document.getElementById('os-root');
    const dock = document.getElementById('side-dock');
    const preview = document.getElementById('snap-preview');
    // Force the width to 70 for the calculation
    const DW = 70; 

    const dragStart = (e) => {
        if (e.target.closest('.win-btn')) return;
        
        // Remove smooth transitions for 1:1 "push" feel
        dock.classList.remove('smooth-return');

        const clientX = e.type.includes('touch') ? e.touches[0].clientX : e.clientX;
        const clientY = e.type.includes('touch') ? e.touches[0].clientY : e.clientY;
        
        let startTop = parseInt(window.getComputedStyle(el).top) || 0;
        let startLeft = parseInt(window.getComputedStyle(el).left) || 0;

    // Inside TLC_Kernel -> makeDraggable(el)
    const move = (moveE) => {
        const curX = moveE.type.includes('touch') ? moveE.touches[0].clientX : moveE.clientX;
        const curY = moveE.type.includes('touch') ? moveE.touches[0].clientY : moveE.clientY;

        let newLeft = startLeft + (curX - clientX);
        let newTop = startTop + (curY - clientY);

        // 1. BOUNDARY: Keep window header accessible
        const viewportW = window.innerWidth;
        const viewportH = window.innerHeight;
        
        // Allow window to go mostly off-screen to the right, but keep 50px of header visible on the left
        newLeft = Math.max(50 - el.offsetWidth, Math.min(newLeft, viewportW - 50));
        newTop = Math.max(0, Math.min(newTop, viewportH - 40));

        // 2. DOCK PUSH: Calculate based on screen-absolute 'newLeft'
        const DW = this.DOCK_WIDTH || 70; 
        const dock = document.getElementById('side-dock');

        if (newLeft < DW) {
            // Linear mapping: as newLeft goes from 70 to 0, pushPercent goes from 0 to 100
            const pushPercent = Math.max(0, Math.min(100, ((DW - newLeft) / DW) * 100));
            
            dock.style.transform = `translateX(-${pushPercent}%)`;
            dock.style.opacity = 1 - (pushPercent / 100);
        } else {
            dock.style.transform = `translateX(0%)`;
            dock.style.opacity = "1";
        }

        // Apply the position to the window
        el.style.left = newLeft + "px";
        el.style.top = newTop + "px";
    };
    const stop = (stopE) => {
            const finalY = stopE.type.includes('touchend') ? stopE.changedTouches[0].clientY : stopE.clientY;
            
            dock.classList.add('smooth-return');
            preview.classList.remove('active');

            if (finalY < 40) this.toggleMaximize(el.id);
            
            // Critical: Ensure the dock is in the correct state after drop
            this.updateDockSafety();

            document.removeEventListener('mousemove', move);
            document.removeEventListener('mouseup', stop);
        };

        document.addEventListener('mousemove', move);
        document.addEventListener('mouseup', stop);
    };

    header.onmousedown = dragStart;
    }
}

window.kernel = new TLC_Kernel();