import { registry } from './registry.js';

class TLC_Kernel {
    constructor() {
        console.log("Kernel: Initializing Focal Fossa Environment...");
        this.init();
    }

    init() {
        const loginBtn = document.getElementById('login-btn');
        if (loginBtn) {
            loginBtn.addEventListener('click', () => this.login());
        }
    }

    login() {
        console.log("Kernel: Identity Verified.");
        // UI Transitions
        document.getElementById('login-gate').classList.add('hidden');
        document.getElementById('side-dock').classList.remove('hidden');
        document.getElementById('sovereign-shell').classList.remove('hidden');
        
        this.bootShell();
    }

    bootShell() {
        const desktop = document.getElementById('desktop-icons');
        const dock = document.getElementById('side-dock');
        
        if (!desktop || !dock) return;

        desktop.innerHTML = ''; // Clear workspace

        registry.forEach(app => {
            // Create Desktop Icon (The Grid)
            const iconWrap = document.createElement('div');
            iconWrap.className = 'desktop-icon';
            iconWrap.innerHTML = `
                <span>${app.icon}</span>
                <div class="icon-label">${app.name}</div>
            `;
            iconWrap.onclick = () => this.launchApp(app.id);
            desktop.appendChild(iconWrap);

            // Create Dock Icon (The Sidebar) - only first 7 for cleanliness
            if (registry.indexOf(app) < 7) {
                const dockIcon = document.createElement('div');
                dockIcon.className = 'dock-icon';
                dockIcon.innerHTML = `<span>${app.icon}</span>`;
                dockIcon.title = app.name;
                dockIcon.onclick = () => this.launchApp(app.id);
                dock.appendChild(dockIcon);
            }
        });
    }

    launchApp(appId) {
        const app = registry.find(a => a.id === appId);
        const workspace = document.getElementById('workspace');

        const win = document.createElement('div');
        win.className = 'app-window';
        win.style.left = '100px';
        win.style.top = '50px';

        win.innerHTML = `
            <div class="window-header">
                <span>${app.icon} ${app.name}</span>
                <div class="window-controls">
                    <button class="close-btn">×</button>
                </div>
            </div>
            <div class="window-content">
                <h3>${app.name}</h3>
                <p>Loading module from ./js/mandates/${app.file}...</p>
                <div class="loader-line"></div>
            </div>
        `;

        workspace.appendChild(win);
        win.querySelector('.close-btn').onclick = () => win.remove();
        
        this.makeDraggable(win);
    }

    makeDraggable(el) {
        let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
        const header = el.querySelector('.window-header');
        
        header.onmousedown = dragMouseDown;

        function dragMouseDown(e) {
            e.preventDefault();
            pos3 = e.clientX;
            pos4 = e.clientY;
            document.onmouseup = closeDragElement;
            document.onmousemove = elementDrag;
        }

        function elementDrag(e) {
            e.preventDefault();
            pos1 = pos3 - e.clientX;
            pos2 = pos4 - e.clientY;
            pos3 = e.clientX;
            pos4 = e.clientY;
            el.style.top = (el.offsetTop - pos2) + "px";
            el.style.left = (el.offsetLeft - pos1) + "px";
        }

        function closeDragElement() {
            document.onmouseup = null;
            document.onmousemove = null;
        }
    }
}

new TLC_Kernel();