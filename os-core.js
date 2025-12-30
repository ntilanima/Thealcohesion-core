const WindowManager = {
    activeWindows: {},

    open(app) {
        if (this.activeWindows[app.id]) {
            this.restore(app.id);
            return;
        }

        const win = document.createElement('div');
        win.id = `win-${app.id}`;
        win.className = 'vpu-window';
        win.style.width = app.width || '800px';
        win.style.height = app.height || '500px';
        win.style.top = '50px';
        win.style.left = '50px';
        win.style.zIndex = Object.keys(this.activeWindows).length + 1000;

        win.innerHTML = `
            <div class="window-header" style="display:flex; justify-content:space-between; align-items:center; background:#1a1a2e; padding:8px 12px; cursor:move; user-select:none;">
                <div style="display:flex; align-items:center; gap:8px;">
                    <span style="color:#a445ff; font-size:12px;">★</span>
                    <span style="color:#eee; font-size:11px; font-weight:bold; letter-spacing:1px;">${app.name.toUpperCase()}</span>
                </div>
                <div style="display:flex; gap:12px;">
                    <button onclick="WindowManager.minimize('${app.id}')" style="background:none; border:none; color:#666; cursor:pointer;">_</button>
                    <button onclick="WindowManager.maximize('${app.id}')" style="background:none; border:none; color:#666; cursor:pointer;">❐</button>
                    <button onclick="WindowManager.close('${app.id}')" style="background:none; border:none; color:#ff4545; cursor:pointer; font-weight:bold;">×</button>
                </div>
            </div>
            <div class="window-content" style="flex:1; overflow:auto; position:relative;">
                ${app.render()}
            </div>
        `;

        document.body.appendChild(win);
        this.activeWindows[app.id] = win;
        this.addToTaskbar(app);
        this.makeDraggable(win);
    },

    minimize(id) {
        this.activeWindows[id].classList.add('minimized');
    },

    restore(id) {
        this.activeWindows[id].classList.remove('minimized');
        this.activeWindows[id].style.zIndex = Date.now(); // Bring to front
    },

    close(id) {
        this.activeWindows[id].remove();
        delete this.activeWindows[id];
        document.getElementById(`task-icon-${id}`).remove();
    },

    addToTaskbar(app) {
        const taskbar = document.getElementById('vpu-taskbar');
        const icon = document.createElement('div');
        icon.id = `task-icon-${app.id}`;
        icon.innerHTML = app.name[0]; // First letter as icon
        icon.className = 'taskbar-item';
        icon.style.cssText = `
            width: 32px; height: 32px; background: #1a1a2e; border: 1px solid #a445ff;
            color: #a445ff; display: flex; align-items: center; justify-content: center;
            border-radius: 6px; cursor: pointer; font-weight: bold;
        `;
        icon.onclick = () => this.restore(app.id);
        taskbar.appendChild(icon);
    },

    makeDraggable(el) {
        let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
        const header = el.querySelector('.window-header');
        header.onmousedown = (e) => {
            e.preventDefault();
            pos3 = e.clientX;
            pos4 = e.clientY;
            document.onmouseup = () => { document.onmouseup = null; document.onmousemove = null; };
            document.onmousemove = (e) => {
                pos1 = pos3 - e.clientX;
                pos2 = pos4 - e.clientY;
                pos3 = e.clientX;
                pos4 = e.clientY;
                el.style.top = (el.offsetTop - pos2) + "px";
                el.style.left = (el.offsetLeft - pos1) + "px";
            };
        };
    }
};