/**
 * Thealcohesion Sovereign UI Controller
 * Managing the VPU Shell and User Experience
 */
const vpuUI = {
    dockPosition: 'left',

    init() {
        this.setupClock();
        this.setupContextMenu();
        this.renderDock();
        this.renderDesktopIcons(); // New addition
        console.log("Sovereign UI Initialized: Calm and Dignified.");
    },
    // 1. Ubuntu-aligned Top Bar Clock [cite: 151-152]
    setupClock() {
        const update = () => {
            const now = new Date();
            document.getElementById('system-time').innerText = 
                now.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
        };
        setInterval(update, 60000);
        update();
    },

    // 2. Custom Context Menu (Right-Click) logic
    setupContextMenu() {
        const menu = document.createElement('div');
        menu.id = 'context-menu';
        menu.className = 'menu-container';
        menu.innerHTML = `
            <div class="menu-item" onclick="vpuUI.createFolder()">New Folder</div>
            <hr>
            <div class="menu-item" onclick="vpuUI.toggleDock()">Move Dock to Bottom/Left</div>
            <div class="menu-item">Display Settings</div>
        `;
        document.body.appendChild(menu);

        document.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            menu.style.display = 'block';
            menu.style.left = `${e.pageX}px`;
            menu.style.top = `${e.pageY}px`;
        });

        document.addEventListener('click', () => menu.style.display = 'none');
    },

    // 3. Role-Based App Dock [cite: 156]
    renderDock() {
        const dock = document.getElementById('side-dock');
        const role = kernel.member ? kernel.member.role : 'GUEST';
        
        // Only show apps authorized for the member's specific role [cite: 156]
        const apps = this.getAuthorizedApps(role);
        
        dock.innerHTML = apps.map(app => `
            <div class="dock-icon" onclick="vpuUI.launchApp('${app.id}')" title="${app.name}">
                <div class="app-dot"></div>
                <img src="icons/${app.icon}.png" alt="${app.name}">
            </div>
        `).join('');
    },

    // 4. Windowed Internal Apps
    launchApp(appId) {
    const workspace = document.getElementById('workspace');
    const window = document.createElement('div');
    window.className = 'app-window';
    
    let content = '';
    if (appId === 'governance') {
        content = governanceApp.render();
    } else if (appId === 'marketplace') {
        // Renders the App Center View
        const apps = vpuRegistry.getAppsForMember(kernel.member.role);
        content = `
            <div class="marketplace-grid">
                <h3>App Center (Registry)</h3>
                ${apps.map(a => `<div class="app-card">${a.name} <button onclick="vpuRegistry.activateModule('${a.id}')">Activate</button></div>`).join('')}
            </div>
        `;
    } else if (appId === 'audit') {
    content = auditApp.render();
    } else if (appId === 'mediation') {
    content = mediationApp.render();
    }else if (appId === 'resource-pool') {
    content = resourcePoolApp.render();
    }else if (appId === 'values-council') {
    content = valuesCouncilApp.render();
    }

    window.innerHTML = `
        <div class="window-header">
            <span>Thealcohesion: ${appId.toUpperCase()}</span>
            <button onclick="this.parentElement.parentElement.remove()">×</button>
        </div>
        <div class="window-content">${content}</div>
    `;
    workspace.appendChild(window);
    },
    // Helper to create a new folder on the workspace
    toggleDock() {
        const dock = document.getElementById('side-dock');
        const workspace = document.getElementById('workspace');
        if (this.dockPosition === 'left') {
            dock.style.width = '100%';
            dock.style.height = '60px';
            dock.style.bottom = '0';
            dock.style.left = '0';
            dock.style.top = 'auto';
            dock.style.flexDirection = 'row';
            workspace.style.marginLeft = '0';
            this.dockPosition = 'bottom';
        } else {
            dock.style.width = '60px';
            dock.style.height = 'calc(100% - 30px)';
            dock.style.top = '30px';
            dock.style.flexDirection = 'column';
            workspace.style.marginLeft = '60px';
            this.dockPosition = 'left';
        }
    },
    // Helper to get apps based on role
    getAuthorizedApps(role) {
    const registry = [
        { id: 'governance', name: 'Governance', icon: 'governance', roles: ['MEMBER', 'STEWARD', 'ADMIN'] },
        { id: 'storage', name: 'My Storage', icon: 'storage', roles: ['MEMBER', 'STEWARD', 'ADMIN'] }
    ];
    return registry.filter(app => app.roles.includes(role));
    },

    // 5. Emergency Lockdown Screen
    renderLockdownScreen() {
    const shield = document.createElement('div');
    shield.id = 'sovereign-shield';
    shield.innerHTML = `
        <div class="lockdown-message">
            <h1>SYSTEM LOCKED</h1>
            <p>Thealcohesion Core has entered Emergency Protocol.</p>
            <p>Contact the Values Council or a System Steward for details.</p>
            <div class="shield-icon">🛡️</div>
        </div>
    `;
    document.body.appendChild(shield);
    },

    // 6. Refresh App Content
    refreshApp(appId) {
    // Finds the open window for this app and re-renders the content
    const windows = document.querySelectorAll('.app-window');
    windows.forEach(win => {
        if (win.innerHTML.includes(`Thealcohesion: ${appId.toUpperCase()}`)) {
            const contentArea = win.querySelector('.window-content');
            if (appId === 'mediation') contentArea.innerHTML = mediationApp.render();
            if (appId === 'resource-pool') contentArea.innerHTML = resourcePoolApp.render();
            if (appId === 'values-council') contentArea.innerHTML = valuesCouncilApp.render();
            // Add other apps here as needed
        }
    });
    },

    // 7. Desktop Icons (Static for MVP)
    renderDesktopIcons() {
        const workspace = document.getElementById('workspace');
        // Clear workspace but keep existing windows
        const existingIcons = workspace.querySelectorAll('.desktop-icon');
        existingIcons.forEach(icon => icon.remove());

        const defaultIcons = [
            { id: 'storage', name: 'My Files', icon: 'folder' },
            { id: 'governance', name: 'Mandates', icon: 'scroll' },
            { id: 'resource-pool', name: 'Treasury', icon: 'bank' }
        ];

        defaultIcons.forEach(data => {
            const icon = document.createElement('div');
            icon.className = 'desktop-icon';
            icon.innerHTML = `
                <div class="icon-visual">${this.getIconSVG(data.icon)}</div>
                <span class="icon-label">${data.name}</span>
            `;
            icon.onclick = () => this.launchApp(data.id);
            workspace.appendChild(icon);
        });
    },

    getIconSVG(type) {
        // Simple placeholder SVGs for a clean Ubuntu look
        const icons = {
            folder: `<svg viewBox="0 0 24 24" width="48" height="48" fill="#e95420"><path d="M10 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z"/></svg>`,
            scroll: `<svg viewBox="0 0 24 24" width="48" height="48" fill="#e95420"><path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/></svg>`,
            bank: `<svg viewBox="0 0 24 24" width="48" height="48" fill="#e95420"><path d="M11.5 1L2 6v2h19V6L11.5 1zM2 22h19v-3H2v3zm18.5-13H17v8h3.5V9zM15 9h-2.5v8H15V9zm-4 0H8.5v8H11V9zM7 9H3.5v8H7V9z"/></svg>`
        };
        return icons[type] || '';
    }
};