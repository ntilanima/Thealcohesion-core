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

    getAuthorizedApps(role) {
    const registry = [
        { id: 'governance', name: 'Governance', icon: 'governance', roles: ['MEMBER', 'STEWARD', 'ADMIN'] },
        { id: 'storage', name: 'My Storage', icon: 'storage', roles: ['MEMBER', 'STEWARD', 'ADMIN'] }
    ];
    return registry.filter(app => app.roles.includes(role));
    },
};