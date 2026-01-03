import { registry } from './registry.js';

class TLC_Kernel {
    constructor() {
        this.isDraggingWindow = false;
        this.DOCK_WIDTH = parseInt(
            getComputedStyle(document.documentElement)
            .getPropertyValue('--dock-width')); 
        this.pinnedApps = ['time', 'tnfi', 'terminal', 'files', 'browser', 'messages', 'camera', 'settings']; 
        this.runningApps = new Set(); 
        
        console.log("Kernel: Initializing Sovereign Core...");
        this.currentZoom = 1.0; 
        this.vaultLocked = true; 
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

    getDockWidth() {
        return parseInt(
            getComputedStyle(document.documentElement)
                .getPropertyValue('--dock-width')
        ) || 70;
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
    }

    initMatrix(container) {
        const canvas = document.createElement('canvas');
        canvas.style.position = 'absolute';
        canvas.style.top = '0';
        canvas.style.left = '0';
        canvas.style.width = '100%';
        canvas.style.height = '100%';
        canvas.style.zIndex = '1';
        canvas.style.opacity = '0.3'; 
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
        container.closest('.os-window').dataset.intervalId = matrixInterval;
    }

    async transitionToShell() {
        const gate = document.getElementById('login-gate');
        const root = document.getElementById('os-root');
        const top = document.getElementById('top-bar');
        const workspace = document.getElementById('workspace');

        // Hide login, show system UI
        if (gate) gate.style.display = 'none';
        if (top) top.classList.remove('hidden');
        
        if (root) {
            root.classList.remove('hidden');
            root.style.display = 'block'; 

            const sensor = document.createElement('div');
            sensor.id = 'dock-sensor';
            sensor.onmouseenter = () => root.classList.remove('dock-hidden');
            document.body.appendChild(sensor);

            const preview = document.createElement('div');
            preview.id = 'snap-preview';
            if (workspace) workspace.appendChild(preview);
        }

        // Boot Temporal Engine for the Top Bar Clock
        try {
            const { TimeApp } = await import('./time.js');
            const bootClock = new TimeApp();
            // This ignites the interval that updates #top-bar-time immediately
            bootClock.app.startClock(); 
        } catch (e) {
            console.error("Temporal Engine failed to ignite on boot:", e);
        }
        
        // Initialize interactive elements
        this.setupTopBarInteractions(); 
        this.bootShell();
    }

    // NEW: Handle Top Bar Clock Interaction
    setupTopBarInteractions() {
    const topBarTime = document.getElementById('top-bar-time');
    if (topBarTime) {
        topBarTime.style.cursor = 'pointer';
        topBarTime.onclick = async () => {
            const existingHud = document.getElementById('temporal-hud');
            
            // Toggle: If it exists, kill it. If not, build it.
            if (existingHud) {
                existingHud.style.opacity = '0';
                existingHud.style.transform = 'translateX(-50%) translateY(-10px)';
                setTimeout(() => existingHud.remove(), 200);
                return;
            }

            try {
                const { TimeApp } = await import('./time.js');
                const tempEngine = new TimeApp();
                tempEngine.app.renderHUD(); 
            } catch (err) {
                console.error("HUD Ignition Failure:", err);
            }
        };
    }
}

    bootShell() {
        const dock = document.getElementById('side-dock');
        if (!dock) return;
        dock.innerHTML = ''; 

        this.pinnedApps.forEach((appId) => {
            const app = registry.find(a => a.id === appId);
            if (!app) return;

            const dItem = document.createElement('div');
            const isRunning = this.runningApps.has(appId);
            dItem.className = `dock-item ${isRunning ? 'running' : ''}`;
            dItem.title = app.name;
            dItem.innerHTML = `<span>${app.icon}</span>`;
            dItem.onclick = () => {
                isRunning ? this.focusWindow(`win-${appId}`) : this.launchApp(appId);
            };
            dock.appendChild(dItem);
        });

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
    
    launchApp(appId) {
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

        win.style.top = "10px";
        win.style.left = "5px";
        win.style.width = "clamp(320px, 65vw, 900px)";
        win.style.height = "clamp(300px, 65vh, 720px)";

        if (window.innerWidth < 480) {
            win.style.width = "calc(100vw - (var(--dock-width) + 10px))";
        }

        win.style.zIndex = this.getTopZIndex();

        win.innerHTML = `
            <div class="window-header">
                <span class="title">${app.icon} ${app.name}</span>
                <div class="window-controls">
                    <button class="win-btn hide" id="hide-${winId}"><svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" fill="none" stroke-width="2.5"><line x1="5" y1="12" x2="19" y2="12"></line></svg></button>
                    <button class="win-btn expand" id="max-${winId}"><svg viewBox="0 0 24 24" width="12" height="12" stroke="currentColor" fill="none" stroke-width="2.5"><rect x="3" y="3" width="18" height="18" rx="1"></rect></svg></button>
                    <button class="win-btn close" id="close-${winId}"><svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" fill="none" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></button>
                </div>
            </div>
            <div class="window-content" id="canvas-${appId}" style="height: calc(100% - 50px); overflow: auto;">
                <div class="app-loading">System: Initializing ${app.name}...</div>
            </div>`;

        workspace.appendChild(win);
        
        requestAnimationFrame(() => {
            win.style.opacity = "0";
            requestAnimationFrame(() => {
                win.style.transition = "opacity 0.25s ease";
                win.style.opacity = "1";
            });
            setTimeout(() => {
                win.style.transition = "all 0.3s cubic-bezier(0.165, 0.84, 0.44, 1)";
                win.style.opacity = "1";
                win.style.transform = "translateY(0)";
            }, 10);
        });

        win.querySelector(`#hide-${winId}`).onclick = (e) => { e.stopPropagation(); this.minimizeWindow(winId); };
        win.querySelector(`#max-${winId}`).onclick = (e) => { e.stopPropagation(); this.toggleMaximize(winId); };
        win.querySelector(`#close-${winId}`).onclick = (e) => { e.stopPropagation(); this.closeApp(appId, winId); };
        
        win.onmousedown = () => this.focusWindow(winId);
        win.addEventListener('touchstart', () => this.focusWindow(winId), {passive: true});
        
        this.makeDraggable(win);
        this.injectAppContent(appId);
    }

    async injectAppContent(appId) {
        const container = document.getElementById(`canvas-${appId}`);
        if (!container) return;
        if (appId === 'time') {
            const module = await import('./time.js');
            const engine = new module.TimeApp(container);
            engine.init();
            container.closest('.os-window').dataset.engineInstance = engine;
        } else if (appId === 'tnfi') {
            container.innerHTML = `<div style="padding:20px;"><h3>Bank of Sovereign</h3><p>Investor Allotment: <strong>EPOS 2025</strong></p><p>Status: <span style="color:#00ff00;">Liquid</span></p></div>`;
        } else if (appId === 'terminal') {
            container.innerHTML = `
                <div id="vpu-terminal" style="background:#000; color:#00ff41; font-family:monospace; height:100%; display:flex; flex-direction:column; padding:15px; box-sizing:border-box;">
                    <div id="term-output" style="flex:1; overflow-y:auto; margin-bottom:10px; font-size:12px; white-space:pre-wrap;">System: Initializing Command Core...</div>
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
            const dx = e.clientX - startX;
            const dy = e.clientY - startY;
            let newLeft = startLeft + dx;
            let newTop = startTop + dy;
            newLeft = Math.max(5, Math.min(newLeft, el.parentElement.clientWidth - el.offsetWidth - 5));
            newTop = Math.max(5, Math.min(newTop, window.innerHeight - el.offsetHeight - 5));
            el.style.left = `${newLeft}px`;
            el.style.top = `${newTop}px`;
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

    closeApp(appId, winId) {
        const el = document.getElementById(winId);
        if (el) {
            // NEW: Kill the Temporal Engine Instance on close
            if (el.dataset.engineInstance) {
                try {
                    const engine = el.dataset.engineInstance;
                    // Check if the module has a destruct or stop timer method
                    if (engine.destruct) engine.destruct();
                } catch (e) { console.warn("Engine cleanup failed"); }
            }

            el.classList.add('closing');
            setTimeout(() => {
                el.remove();
                this.runningApps.delete(appId);
                this.bootShell();
                this.updateDockSafety();
            }, 300);
        }
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
        if (el) el.style.zIndex = this.getTopZIndex();
    }

    initTerminalLogic() {
        const input = document.getElementById('term-input');
        if (input) {
            input.focus();
            input.onkeydown = (e) => {
                if (e.key === 'Enter') {
                    this.handleTerminalCommand(input.value);
                    input.value = '';
                }
            };
        }
    }

    handleTerminalCommand(cmd) {
        const output = document.getElementById('term-output');
        let response = "";
        const cleanCmd = cmd.trim().toLowerCase();
        
        if (cleanCmd === 'help') response = "status, clear, neofetch, allotment";
        else if (cleanCmd === 'neofetch') response = `<pre style="color:#a445ff;">${this.vpuLogo}</pre>`;
        else if (cleanCmd === 'allotment') response = "Investor Allotment: EPOS 2025 Confirmed.";
        else if (cleanCmd === 'clear') { output.innerHTML = ''; return; }
        else response = `Command not found: ${cleanCmd}`;

        output.innerHTML += `\n<span style="color:#888;">> ${cmd}</span>\n${response}\n`;
        output.scrollTop = output.scrollHeight;
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