/**
 * apps/tactical_command.js - Sovereign Tactical Command
 * Merged: System Monitor + Task Manager + Event Viewer
 */
export class TacticalCommandApp {
    constructor(container, api) {
        if (!api || api.signature !== 'SOVEREIGN_CORE_V1') {
            container.innerHTML = `<div style="color:#f44;padding:20px;">[FATAL] SIGNATURE_MISMATCH</div>`;
            throw new Error("ENCLAVE_VIOLATION");
        }
        this.container = container;
        this.api = api;
        this.activeTab = 'TASKS'; // Default Tab
        this.selectedProcessId = null;
        this.updateInterval = null;
    }

    async init() {
        this.renderShell();
        this.switchTab(this.activeTab);
        this.updateInterval = setInterval(() => this.refreshData(), 1000);
        if(this.api.log) this.api.log("Tactical Command Linked", "success");
    }

    renderShell() {
        this.container.innerHTML = `
            <div style="height: 100%; background: #050505; color: #00ff41; font-family: 'JetBrains Mono', monospace; display: flex; flex-direction: column; border: 1px solid #1a1a1a; overflow: hidden;">
                <div style="display: flex; background: #000; border-bottom: 1px solid #00ff4133; font-size: 10px;">
                    <div id="tab-TASKS" class="stc-tab" style="padding: 12px 20px; cursor: pointer; border-right: 1px solid #111;">[01] PROCESSES</div>
                    <div id="tab-MONITOR" class="stc-tab" style="padding: 12px 20px; cursor: pointer; border-right: 1px solid #111;">[02] TELEMETRY</div>
                    <div id="tab-LOGS" class="stc-tab" style="padding: 12px 20px; cursor: pointer; border-right: 1px solid #111;">[03] AUDIT_LOG</div>
                </div>

                <div id="stc-content" style="flex: 1; overflow-y: auto; padding: 15px; position: relative;"></div>

                <div style="padding: 8px 15px; background: #000; border-top: 1px solid #1a1a1a; display: flex; justify-content: space-between; align-items: center; font-size: 9px; color: #444;">
                    <span id="stc-footer-mem">MEM: -- MB</span>
                    <span>ENCLAVE_ACTIVE // ${this.api.timestamp}</span>
                    <span id="stc-footer-net">NET: --</span>
                </div>
            </div>
            <style>
                .stc-tab:hover { background: #00ff4111; color: #fff; }
                .stc-tab.active { background: #00ff4122; color: #00ff41; border-bottom: 2px solid #00ff41; }
                .t-row:hover { background: #00ff4108; }
                .t-row.selected { background: #00ff4115 !important; color: #fff; }
                .danger-btn:hover { background: #ff4444 !important; color: #000 !important; border-color: #ff4444 !important; }
            </style>
        `;

        // Tab Listeners
        ['TASKS', 'MONITOR', 'LOGS'].forEach(tabId => {
            this.container.querySelector(`#tab-${tabId}`).onclick = () => this.switchTab(tabId);
        });
    }

    switchTab(tabId) {
        this.activeTab = tabId;
        this.container.querySelectorAll('.stc-tab').forEach(t => t.classList.remove('active'));
        this.container.querySelector(`#tab-${tabId}`).classList.add('active');
        this.renderActiveTab();
    }

    renderActiveTab() {
        const content = this.container.querySelector('#stc-content');
        if (this.activeTab === 'TASKS') {
            content.innerHTML = `
                <table style="width: 100%; border-collapse: collapse; font-size: 11px;">
                    <thead style="color: #444; border-bottom: 1px solid #1a1a1a; text-align: left;">
                        <tr><th style="padding: 10px;">PID_ID</th><th>STATUS</th><th style="text-align:right;">ACTION</th></tr>
                    </thead>
                    <tbody id="stc-task-list"></tbody>
                </table>
            `;
        } else if (this.activeTab === 'MONITOR') {
            content.innerHTML = `
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                    <div style="border: 1px solid #111; padding: 15px; background: #080808;">
                        <div style="font-size: 10px; color: #444;">HEAP_CONSUMPTION</div>
                        <div id="stc-mon-mem-val" style="font-size: 24px; margin: 10px 0;">-- MB</div>
                        <div style="height: 2px; background: #111;"><div id="stc-mon-mem-bar" style="height: 100%; background: #a445ff; width: 0%;"></div></div>
                    </div>
                    <div style="border: 1px solid #111; padding: 15px; background: #080808;">
                        <div style="font-size: 10px; color: #444;">VFS_CRYPTO_LATENCY</div>
                        <div id="stc-mon-vfs" style="font-size: 24px; margin: 10px 0;">-- ms</div>
                        <div style="font-size: 9px; color: #222;">AES-GCM-256 VERIFIED</div>
                    </div>
                </div>
            `;
        } else if (this.activeTab === 'LOGS') {
            content.innerHTML = `
                <div style="display:flex; justify-content:space-between; margin-bottom:10px;">
                    <span style="font-size:9px; color:#444;">FORENSIC_BUFFER</span>
                    <button id="stc-purge-logs" style="background:none; border:1px solid #333; color:#666; font-size:9px; cursor:pointer; padding:2px 5px;">PURGE_BUFFER</button>
                </div>
                <div id="stc-log-container" style="font-size: 11px; line-height: 1.6;"></div>
            `;
            this.container.querySelector('#stc-purge-logs').onclick = () => {
                if(confirm("WIPE_FORENSICS?")) { localStorage.setItem('SOVEREIGN_LOGS', '[]'); this.refreshData(); }
            };
        }
        this.refreshData();
    }

    refreshData() {
        const apps = window.kernel ? Array.from(window.kernel.runningApps) : [];
        
        // Update Footer stats
        if (performance.memory) {
            const used = Math.round(performance.memory.usedJSHeapSize / 1048576);
            this.container.querySelector('#stc-footer-mem').innerText = `MEM: ${used} MB / 100 MB`;
            if (this.activeTab === 'MONITOR') {
                this.container.querySelector('#stc-mon-mem-val').innerText = `${used} MB`;
                this.container.querySelector('#stc-mon-mem-bar').style.width = `${(used/100)*100}%`;
            }
        }

        // Update Tab Specifics
        if (this.activeTab === 'TASKS') {
            const list = this.container.querySelector('#stc-task-list');
            if (list) {
                list.innerHTML = apps.map(id => `
                <tr class="t-row ${this.selectedProcessId === id ? 'selected' : ''}" 
                    data-task-id="${id}" 
                    style="border-bottom: 1px solid #111;">
                    <td style="padding: 12px;">${id.toUpperCase()}</td>
                    <td style="color: #00ff41; font-size: 10px;">ACTIVE</td>
                    <td style="text-align: right; padding: 5px;">
                        <button class="danger-btn kill-trigger" data-task-id="${id}" 
                            style="background:none; border:1px solid #333; color:#444; font-size:9px; cursor:pointer; padding:3px 8px;">KILL</button>
                    </td>
                </tr>
            `).join('');
            }
        } else if (this.activeTab === 'LOGS') {
            const logBox = this.container.querySelector('#stc-log-container');
            if (logBox) {
                const logs = JSON.parse(localStorage.getItem('SOVEREIGN_LOGS') || '[]').slice(-20).reverse();
                logBox.innerHTML = logs.map(l => `
                    <div style="margin-bottom:8px; border-left:1px solid #222; padding-left:10px;">
                        <span style="color:#333;">[${new Date(l.timestamp).toLocaleTimeString()}]</span> 
                        <span style="color:${l.type === 'CRITICAL' ? '#f44' : '#00ff41'}">${l.message}</span>
                    </div>
                `).join('');
            }
        }
        
        // Logic for VFS Ping
        if (this.activeTab === 'MONITOR' && this.api.vfs) {
            const s = performance.now();
            this.api.vfs.init().then(() => {
                const val = this.container.querySelector('#stc-mon-vfs');
                if(val) val.innerText = `${Math.round(performance.now() - s)} ms`;
            });
        }

        // Attach global reference for onclicks
        window.commandApp = this;
    }
    

    selectTask(id) {
        this.selectedProcessId = id;
        this.refreshData();
    }

    killTask(id) {
        if (this.api.notify) this.api.notify(`TERMINATING: ${id}`, "warn");
        window.kernel.killProcess(id);
        this.selectedProcessId = null;
        this.refreshData();
    }

    destruct() {
        clearInterval(this.updateInterval);
        delete window.commandApp;
    }
}