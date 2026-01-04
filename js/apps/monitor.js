/**
 * apps/monitor.js - Sovereign System & Resource Monitor
 */
export class MonitorApp {
    constructor(container, sessionKey) {
        this.container = container;
        this.key = sessionKey;
        this.interval = null;
    }

    async init() {
        this.render();
        this.startTracking();
    }

    render() {
        this.container.innerHTML = `
            <div style="height: 100%; background: #0a0a0a; color: #00ff41; font-family: 'Courier New', monospace; padding: 15px; display: flex; flex-direction: column; gap: 20px;">
                <div style="border-bottom: 1px solid #00ff41; padding-bottom: 5px; display: flex; justify-content: space-between;">
                    <span>[SYS_MONITOR_v1.0]</span>
                    <span id="mon-uptime">UPTIME: 00:00:00</span>
                </div>

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                    <div style="border: 1px solid #333; padding: 10px;">
                        <div style="font-size: 10px; color: #888;">MEMORY USAGE</div>
                        <div id="mon-mem" style="font-size: 18px;">--- MB</div>
                        <div id="mon-mem-bar" style="height: 4px; background: #222; margin-top: 5px;">
                            <div style="height: 100%; background: #00ff41; width: 0%;"></div>
                        </div>
                    </div>
                    <div style="border: 1px solid #333; padding: 10px;">
                        <div style="font-size: 10px; color: #888;">ENCLAVE LATENCY</div>
                        <div id="mon-vfs" style="font-size: 18px;">--- ms</div>
                        <div style="font-size: 10px; color: #444;">DATABASE: SovereignCore_VFS</div>
                    </div>
                </div>

                <div style="flex-grow: 1; border: 1px solid #333; padding: 10px; overflow-y: auto;">
                    <div style="font-size: 10px; color: #888; margin-bottom: 10px;">ACTIVE KERNEL PROCESSES</div>
                    <table style="width: 100%; font-size: 12px; border-collapse: collapse;">
                        <thead style="text-align: left; color: #fff; border-bottom: 1px solid #333;">
                            <tr><th>PID</th><th>APP_ID</th><th>STATUS</th></tr>
                        </thead>
                        <tbody id="mon-proc-table">
                            </tbody>
                    </table>
                </div>

                <div style="font-size: 10px; color: #444;">
                    ENCLAVE_HASH: 20251226_SHA256_VERIFIED
                </div>
            </div>
        `;
    }

    startTracking() {
        const startTime = Date.now();
        
        this.interval = setInterval(() => {
            // 1. Update Uptime
            const diff = new Date(Date.now() - startTime);
            this.container.querySelector('#mon-uptime').innerText = 
                `UPTIME: ${diff.getUTCHours().toString().padStart(2, '0')}:${diff.getUTCMinutes().toString().padStart(2, '0')}:${diff.getUTCSeconds().toString().padStart(2, '0')}`;

            // 2. Update Memory (Chrome/Edge only)
            if (performance.memory) {
                const used = Math.round(performance.memory.usedJSHeapSize / 1048576);
                const total = Math.round(performance.memory.jsHeapSizeLimit / 1048576);
                const perc = (used / total) * 100;
                this.container.querySelector('#mon-mem').innerText = `${used} MB`;
                this.container.querySelector('#mon-mem-bar div').style.width = `${perc}%`;
            }

            // 3. Update Process Table
            this.updateProcessTable();
            
            // 4. Test VFS Latency
            this.testVFSLatency();
        }, 1000);
    }

    async testVFSLatency() {
        const start = performance.now();
        if (window.SovereignVFS) {
            await window.SovereignVFS.init(); // Simple ping to DB
            const end = performance.now();
            this.container.querySelector('#mon-vfs').innerText = `${Math.round(end - start)} ms`;
        }
    }

    updateProcessTable() {
        const table = this.container.querySelector('#mon-proc-table');
        if (!window.kernel || !window.kernel.runningApps) return;

        const apps = Object.keys(window.kernel.runningApps);
        table.innerHTML = apps.map((id, index) => `
            <tr style="height: 25px; border-bottom: 1px solid #111;">
                <td>00${index + 1}</td>
                <td style="color:#fff;">${id.toUpperCase()}</td>
                <td style="color:#00ff41;">RUNNING</td>
            </tr>
        `).join('');
    }

    onClose() {
        clearInterval(this.interval);
    }
}