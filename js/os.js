import { registry } from './registry.js';

class TLC_Kernel {
    constructor() {
        this.DOCK_WIDTH = 70; 
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

        // --- MOBILE ORIENTATION & RESIZE AUTO-FIT ---
        window.addEventListener('resize', () => {
            const isMobile = window.innerWidth < 768;
            if (isMobile) {
                document.querySelectorAll('.os-window').forEach(win => {
                    // Re-apply the initial 75px left / 20px right rule on orientation change
                    win.style.left = `75px`;
                    win.style.width = `calc(100vw - 95px)`; 
                    let currentTop = parseInt(win.style.top);
                    if (currentTop < 0 || isNaN(currentTop)) {
                        win.style.top = "10px";
                    }
                });
            }
        });
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

    transitionToShell() {
        const gate = document.getElementById('login-gate');
        const root = document.getElementById('os-root');
        const top = document.getElementById('top-bar');
        const workspace = document.getElementById('workspace');

        if (gate) gate.style.display = 'none';
        if (top) top.classList.remove('hidden');
        
        if (root) {
            root.classList.remove('hidden');
            // MUST be block for stable absolute positioning
            root.style.display = 'block'; 

            const sensor = document.createElement('div');
            sensor.id = 'dock-sensor';
            sensor.onmouseenter = () => root.classList.remove('dock-hidden');
            document.body.appendChild(sensor);

            const preview = document.createElement('div');
            preview.id = 'snap-preview';
            if (workspace) workspace.appendChild(preview);
        }
        
        this.bootShell();
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

        const DW = 70; 
        const margin = 5;
        const topMargin = 10;
        const rightMargin = 20;
        const isMobile = window.innerWidth < 768;
        const stagger = (this.runningApps.size - 1) * 20;

        if (isMobile) {
                // STRICT MOBILE RULE: 75px from left, 20px from right
                win.style.left = "75px"; 
                win.style.top = `${10 + stagger}px`;
                // Width = Full width - (75px left + 20px right)
                win.style.width = "calc(100vw - 95px)"; 
                win.style.height = "60vh";
            } else {
                // Desktop Default
                win.style.width = "750px";
                win.style.height = "500px";
                win.style.left = `${this.DOCK_WIDTH + 10 + stagger}px`;
                win.style.top = `${10 + stagger}px`;
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
            <div class="window-content" id="canvas-${appId}">
                <div class="app-loading">System: Initializing ${app.name}...</div>
            </div>`;

        workspace.appendChild(win);
        requestAnimationFrame(() => win.classList.add('visible'));

        win.querySelector(`#hide-${winId}`).onclick = (e) => { e.stopPropagation(); this.minimizeWindow(winId); };
        win.querySelector(`#max-${winId}`).onclick = (e) => { e.stopPropagation(); this.toggleMaximize(winId); };
        win.querySelector(`#close-${winId}`).onclick = (e) => { e.stopPropagation(); this.closeApp(appId, winId); };
        
        win.onmousedown = () => this.focusWindow(winId);
        win.addEventListener('touchstart', () => this.focusWindow(winId), {passive: true});
        
        this.makeDraggable(win);
        this.injectAppContent(appId);
    }

    injectAppContent(appId) {
        const container = document.getElementById(`canvas-${appId}`);
        if (!container) return;

        if (appId === 'tnfi') {
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
        const dock = document.getElementById('side-dock');
        const DW = 70;

        const dragStart = (e) => {
            if (e.target.closest('.win-btn')) return;
            dock.classList.remove('smooth-return');

            const clientX = e.type.includes('touch') ? e.touches[0].clientX : e.clientX;
            const clientY = e.type.includes('touch') ? e.touches[0].clientY : e.clientY;
            
            let startTop = parseInt(window.getComputedStyle(el).top) || 0;
            let startLeft = parseInt(window.getComputedStyle(el).left) || 0;

            const move = (moveE) => {
                if (moveE.cancelable) moveE.preventDefault();

                const curX = moveE.type.includes('touch') ? moveE.touches[0].clientX : moveE.clientX;
                const curY = moveE.type.includes('touch') ? moveE.touches[0].clientY : moveE.clientY;

                let newLeft = startLeft + (curX - clientX);
                let newTop = startTop + (curY - clientY);

                const viewportW = window.innerWidth;
                const viewportH = window.innerHeight;
                
                const minLeft = 0; 
                const maxLeft = viewportW - el.offsetWidth;
                const maxTop = (viewportH - 35) - el.offsetHeight;

                newLeft = Math.max(minLeft, Math.min(newLeft, maxLeft));
                newTop = Math.max(0, Math.min(newTop, maxTop));

                const isMobile = window.innerWidth < 768;

                // --- DOCK PUSH LOGIC (Disabled on mobile to stop balloon effect) ---
                if (!isMobile && newLeft < DW) {
                    const pushPercent = Math.max(0, Math.min(100, ((DW - newLeft) / DW) * 100));
                    dock.style.transform = `translateX(-${pushPercent}%)`;
                    dock.style.opacity = 1 - (pushPercent / 100);
                } else if (!isMobile) {
                    dock.style.transform = `translateX(0%)`;
                    dock.style.opacity = "1";
                }

                el.style.left = newLeft + "px";
                el.style.top = newTop + "px";
            };

            const stop = () => {
                dock.classList.add('smooth-return');
                this.updateDockSafety();
                document.removeEventListener('mousemove', move);
                document.removeEventListener('touchmove', move);
                document.removeEventListener('mouseup', stop);
                document.removeEventListener('touchend', stop);
            };

            document.addEventListener('mousemove', move);
            document.addEventListener('touchmove', move, { passive: false });
            document.addEventListener('mouseup', stop);
            document.addEventListener('touchend', stop);
        };

        header.onmousedown = dragStart;
        header.addEventListener('touchstart', dragStart, { passive: false });
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
        const dock = document.getElementById('side-dock');
        if (el) {
            const isMax = el.classList.toggle('maximized');
            dock.classList.add('smooth-return');
            if (isMax) {
                dock.style.transform = `translateX(-110%)`;
                dock.style.opacity = "0";
            } else {
                this.updateDockSafety();
            }
        }
    }

    updateDockSafety() {
        const dock = document.getElementById('side-dock');
        const windows = document.querySelectorAll('.os-window:not(.closing):not(.minimizing)');
        let hide = false;
        windows.forEach(win => {
            const rect = win.getBoundingClientRect();
            if (win.classList.contains('maximized') || (rect.left < this.DOCK_WIDTH && win.style.display !== 'none')) {
                hide = true;
            }
        });
        dock.style.transform = hide ? `translateX(-110%)` : `translateX(0%)`;
        dock.style.opacity = hide ? "0" : "1";
        dock.style.pointerEvents = hide ? "none" : "all";
    }

    focusWindow(id) {
        const el = document.getElementById(id);
        if (el) {
            el.style.display = 'flex'; 
            el.style.zIndex = this.getTopZIndex();
            requestAnimationFrame(() => el.classList.add('visible'));
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