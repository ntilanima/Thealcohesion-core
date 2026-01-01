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
        if (user.trim() !== "" && pass.trim() !== "") {
            this.transitionToShell();
        } else {
            alert("Sovereign Identity Required.");
        }
    }

    transitionToShell() {
        const loginGate = document.getElementById('login-gate');
        const topBar = document.getElementById('top-bar');
        const osRoot = document.getElementById('os-root');
        
        if (loginGate) loginGate.style.display = 'none';
        if (topBar) topBar.classList.remove('hidden');
        if (osRoot) {
            osRoot.style.display = 'flex';
            document.getElementById('side-dock').classList.remove('hidden');
            document.getElementById('workspace').classList.remove('hidden');
        }
        this.bootShell();
    }

    bootShell() {
        const dock = document.getElementById('side-dock');
        const desktop = document.getElementById('desktop-icons');
        if (!dock || !desktop) return;

        const gridIcon = dock.querySelector('.dock-bottom-trigger');
        dock.innerHTML = '';
        desktop.innerHTML = '';

        registry.forEach(app => {
            // Sidebar Dock
            const dItem = document.createElement('div');
            dItem.className = 'dock-item';
            dItem.innerHTML = `<span>${app.icon}</span>`;
            dItem.onclick = () => this.launchApp(app.id);
            dock.appendChild(dItem);

            // Desktop Icon
            const deskIcon = document.createElement('div');
            deskIcon.className = 'desktop-icon';
            deskIcon.innerHTML = `<span>${app.icon}</span><p>${app.name}</p>`;
            deskIcon.onclick = () => this.launchApp(app.id);
            desktop.appendChild(deskIcon);
        });

        if (gridIcon) dock.appendChild(gridIcon);
    }

    // --- WINDOW MANAGEMENT CAPABILITIES ---

    launchApp(appId) {
        const app = registry.find(a => a.id === appId);
        if (!app) return;

        const winId = `win-${appId}-${Date.now()}`;
        const win = document.createElement('div');
        win.className = 'os-window';
        win.id = winId;
        win.style.zIndex = this.getTopZIndex();

        win.innerHTML = `
            <div class="window-header" onmousedown="kernel.focusWindow('${winId}')">
                <span class="title">${app.icon} ${app.name}</span>
                <div class="window-controls">
                    <button class="win-btn hide" onclick="kernel.minimizeWindow('${winId}')">─</button>
                    <button class="win-btn expand" onclick="kernel.toggleMaximize('${winId}')">▢</button>
                    <button class="win-btn close" onclick="kernel.closeWindow('${winId}')">×</button>
                </div>
            </div>
            <div class="window-content" id="canvas-${winId}">
                <div class="boot-loader">Syncing Sovereign Systems...</div>
            </div>
        `;

        document.getElementById('workspace').appendChild(win);
        this.makeDraggable(win);

        if (appId === 'time') {
            document.getElementById(`canvas-${winId}`).innerHTML = thealTimeApp.render();
            requestAnimationFrame(() => thealTimeApp.reboot());
        }
    }

    getTopZIndex() {
        const wins = document.querySelectorAll('.os-window');
        let max = 1000;
        wins.forEach(w => { if (parseInt(w.style.zIndex) > max) max = parseInt(w.style.zIndex); });
        return max + 1;
    }

    focusWindow(id) { document.getElementById(id).style.zIndex = this.getTopZIndex(); }

    closeWindow(id) { document.getElementById(id).remove(); }

    minimizeWindow(id) {
        const el = document.getElementById(id);
        el.style.transform = "scale(0.7) translateY(200px)";
        el.style.opacity = "0";
        setTimeout(() => el.style.display = "none", 300);
    }

    toggleMaximize(id) {
        const el = document.getElementById(id);
        el.classList.toggle('maximized');
    }

    makeDraggable(el) {
        const header = el.querySelector('.window-header');
        let p1 = 0, p2 = 0, p3 = 0, p4 = 0;
        header.onmousedown = (e) => {
            if (el.classList.contains('maximized')) return; // No drag if maximized
            e.preventDefault();
            p3 = e.clientX; p4 = e.clientY;
            document.onmouseup = () => { document.onmouseup = null; document.onmousemove = null; };
            document.onmousemove = (e) => {
                if (el.classList.contains('maximized')) return; // STOP dragging if maximized
                p1 = p3 - e.clientX; p2 = p4 - e.clientY;
                p3 = e.clientX; p4 = e.clientY;
                el.style.top = (el.offsetTop - p2) + "px";
                el.style.left = (el.offsetLeft - p1) + "px";
            };
        };
    }
}

// Global instance for onclick events
window.kernel = new TLC_Kernel();