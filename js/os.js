import { registry } from './registry.js';

class TLC_Kernel {
    constructor() {
        console.log("Kernel: Initializing Sovereign Core...");
        // This ensures the login button works when the page is ready
        window.addEventListener('DOMContentLoaded', () => this.init());
    }

    init() {
    console.log("Kernel: Searching for Login Gate...");
    const loginBtn = document.getElementById('login-btn');
    
    if (loginBtn) {
        loginBtn.onclick = (e) => {
            e.preventDefault();
            console.log("Login Button Clicked!");
            this.verifyIdentity();
        };
    } else {
        console.error("CRITICAL: #login-btn not found in HTML!");
    }
    }

    verifyIdentity() {
        const user = document.getElementById('username').value;
        const pass = document.getElementById('password').value;
        
        // Identity Verification Logic
        if (user.trim() !== "" && pass.trim() !== "") {
            console.log("Identity Verified. Bypassing Login Gate...");
            this.transitionToShell();
        } else {
            alert("Sovereign Identity Required.");
        }
    }

    transitionToShell() {
        const loginGate = document.getElementById('login-gate');
        const topBar = document.getElementById('top-bar');
        const osRoot = document.getElementById('os-root');
        const sideDock = document.getElementById('side-dock');
        const workspace = document.getElementById('workspace');
        
        if (loginGate) loginGate.style.display = 'none';
        
        // Reveal Core UI
        if (topBar) topBar.classList.remove('hidden');
        if (osRoot) {
            osRoot.style.display = 'flex'; // Force grid/flex visibility
            if (sideDock) sideDock.classList.remove('hidden');
            if (workspace) workspace.classList.remove('hidden');
        }

        this.bootShell();
    }

    bootShell() {
        const dock = document.getElementById('side-dock');
        const desktop = document.getElementById('desktop-icons');
        if (!dock || !desktop) return;

        // Preserve the grid icon if it exists
        const gridIcon = dock.querySelector('.dock-bottom-trigger');
        dock.innerHTML = '';
        desktop.innerHTML = '';

        registry.forEach(app => {
            // Render Sidebar Item
            const dItem = document.createElement('div');
            dItem.className = 'dock-item';
            dItem.innerHTML = `<span>${app.icon}</span>`;
            dItem.title = app.name;
            dItem.onclick = () => this.launchApp(app.id);
            dock.appendChild(dItem);

            // Render Desktop Item
            const deskIcon = document.createElement('div');
            deskIcon.className = 'desktop-icon';
            deskIcon.innerHTML = `<span>${app.icon}</span><p>${app.name}</p>`;
            deskIcon.onclick = () => this.launchApp(app.id);
            desktop.appendChild(deskIcon);
        });

        if (gridIcon) dock.appendChild(gridIcon);
    }

    // --- WINDOW CAPABILITIES ---

    launchApp(appId) {
    const app = registry.find(a => a.id === appId);
    if (!app) return;

    const winId = `win-${appId}-${Date.now()}`;
    const win = document.createElement('div');
    win.className = 'os-window';
    win.id = winId;
    win.style.zIndex = this.getTopZIndex();
    win.style.left = '100px';
    win.style.top = '100px';

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
    
    // FIX 1: Pass the element directly to the draggable function
    this.makeDraggable(win);

    // FIX 2: Target the specific dynamic ID
    if (appId === 'time') {
        const container = document.getElementById(`canvas-${winId}`);
        if (container) {
            container.innerHTML = thealTimeApp.render();
            // Wait for DOM to paint before rebooting engine
            requestAnimationFrame(() => {
                if (typeof thealTimeApp.reboot === 'function') {
                    thealTimeApp.reboot(`canvas-${winId}`);
                }
            });
        }
    }
    }

    getTopZIndex() {
        const wins = document.querySelectorAll('.os-window');
        let max = 1000;
        wins.forEach(w => { 
            const z = parseInt(w.style.zIndex) || 1000;
            if (z > max) max = z; 
        });
        return max + 1;
    }

    focusWindow(id) {
        const el = document.getElementById(id);
        if (el) el.style.zIndex = this.getTopZIndex();
    }

    closeWindow(id) {
        const el = document.getElementById(id);
        if (el) el.remove();
    }

    minimizeWindow(id) {
        const el = document.getElementById(id);
        if (!el) return;
        el.style.transform = "scale(0.7) translateY(200px)";
        el.style.opacity = "0";
        setTimeout(() => el.style.display = "none", 300);
    }

    toggleMaximize(id) {
        const el = document.getElementById(id);
        if (!el) return;
        el.classList.toggle('maximized');
    }

    makeDraggable(el) {
    const header = el.querySelector('.window-header');
    if (!header) return;

    header.onmousedown = (e) => {
        if (e.target.closest('.win-btn') || el.classList.contains('maximized')) return;
        
        // Bring to front on click
        this.focusWindow(el.id);

        let startX = e.clientX;
        let startY = e.clientY;
        let startTop = parseInt(window.getComputedStyle(el).top);
        let startLeft = parseInt(window.getComputedStyle(el).left);

        console.log("Drag Started at:", startLeft, startTop);

        const onMouseMove = (e) => {
            const deltaX = e.clientX - startX;
            const deltaY = e.clientY - startY;
            
            el.style.top = (startTop + deltaY) + "px";
            el.style.left = (startLeft + deltaX) + "px";
        };

        const onMouseUp = () => {
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
            console.log("Drag Ended.");
        };

        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
    };
    }
}

// Global instance so HTML 'onclick' can find it
const kernel = new TLC_Kernel();
window.kernel = kernel; // This is the "bridge" to your HTML