/**
 * apps/taskman.js - Sovereign Task Manager (Final Patch)
 */
export class TaskManagerApp {
    constructor(container, sessionKey) {
        this.container = container;
        this.key = sessionKey;
        this.selectedId = null;
    }

    async init() {
        this.render();
        window.addEventListener('process-killed', () => this.renderList());
        // Auto-refresh every 2 seconds to ensure sync
        this.timer = setInterval(() => this.renderList(), 2000);
    }

    render() {
        this.container.innerHTML = `
            <div style="height: 100%; background: #f0f0f0; font-family: sans-serif; display: flex; flex-direction: column;">
                <div style="padding: 10px; background: #fff; border-bottom: 1px solid #ccc; font-weight: bold;">
                    Active Processes
                </div>
                <div id="task-container" style="flex: 1; overflow: auto; background: #fff;"></div>
                <div style="padding: 10px; text-align: right; background: #eee;">
                    <button id="kill-btn" disabled style="padding: 5px 15px; cursor:pointer;">End Task</button>
                </div>
            </div>
        `;
        this.renderList();
    }

    renderList() {
        const cont = this.container.querySelector('#task-container');
        const btn = this.container.querySelector('#kill-btn');
        if (!cont || !window.kernel) return;

        // Force conversion of Set to Array
        const apps = Array.from(window.kernel.runningApps);

        if (apps.length === 0) {
            cont.innerHTML = `<div style="padding:20px; color:#888;">No processes found in Set.</div>`;
            return;
        }

        cont.innerHTML = `
            <table style="width: 100%; border-collapse: collapse;">
                ${apps.map(id => `
                    <tr class="t-row" data-id="${id}" style="border-bottom: 1px solid #eee; cursor: pointer; background: ${this.selectedId === id ? '#0078d7' : 'transparent'}; color: ${this.selectedId === id ? '#fff' : '#000'}">
                        <td style="padding: 10px;">${id.toUpperCase()}</td>
                        <td style="padding: 10px; text-align: right; font-size: 10px;">RUNNING</td>
                    </tr>
                `).join('')}
            </table>
        `;

        cont.querySelectorAll('.t-row').forEach(row => {
            row.onclick = () => {
                this.selectedId = row.dataset.id;
                btn.disabled = false;
                this.renderList();
            };
        });

        btn.onclick = () => {
            if (this.selectedId) {
                window.kernel.killProcess(this.selectedId);
                this.selectedId = null;
                btn.disabled = true;
                this.renderList();
            }
        };
    }

    onClose() {
        if (this.timer) clearInterval(this.timer);
    }
}