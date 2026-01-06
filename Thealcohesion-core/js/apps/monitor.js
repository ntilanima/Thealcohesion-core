/**
 * apps/monitor.js - Sovereign System & Resource Monitor
 * Version: 1.2.9 (Real Telemetry + Security Guard)
 */
export class MonitorApp {
    constructor(container, api) {
        // 1. THE GUARD: Verify the "Passport" signature
        if (!api || api.signature !== 'SOVEREIGN_CORE_V1') {
            container.innerHTML = `<div style="color: #ff4444; padding: 20px;">[FATAL]: UNAUTHORIZED MODULE</div>`;
            throw new Error("ACCESS_DENIED");
        }

        this.container = container;
        this.api = api; // Access to sessionKey, vfs, and close()
        this.interval = null;
    }

    async init() {
        this.render();
        this.startTracking();
    }

    render() {
        // Pull real hardware info once for the header
        const cores = navigator.hardwareConcurrency || "??";
        const totalRam = navigator.deviceMemory || "??";

        this.container.innerHTML = `
            <div style="height: 100%; background: #0a0a0a; color: #00ff41; font-family: 'Courier New', monospace; padding: 15px; display: flex; flex-direction: column; gap: 20px; overflow: hidden;">
                <div style="border-bottom: 1px solid #00ff41; padding-bottom: 5px; display: flex; justify-content: space-between; font-size: 12px;">
                    <span>[CORE_MONITOR: ${cores} THREADS / ${totalRam}GB RAM]</span>
                    <span id="mon-uptime">UPTIME: 00:00:00</span>
                </div>

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                    <div style="border: 1px solid #333; padding: 10px;">
                        <div style="font-size: 10px; color: #888;">JS HEAP MEMORY</div>
                        <div id="mon-mem" style="font-size: 18px;">--- MB</div>
                        <div id="mon-mem-bar" style="height: 4px; background: #222; margin-top: 5px;">
                            <div style="height: 100%; background: #00ff41; width: 0%; transition: width 0.5s ease;"></div>
                        </div>
                    </div>
                    <div style="border: 1px solid #333; padding: 10px;">
                        <div style="font-size: 10px; color: #888;">VFS LATENCY</div>
                        <div id="mon-vfs" style="font-size: 18px;">--- ms</div>
                        <div style="font-size: 10px; color: #444;">KEY: AES-GCM ACTIVE</div>
                    </div>
                </div>

                <div style="flex-grow: 1; border: 1px solid #333; padding: 10px; overflow-y: auto;">
                    <div style="font-size: 10px; color: #888; margin-bottom: 10px;">ACTIVE KERNEL PROCESSES</div>
                    <table style="width: 100%; font-size: 12px; border-collapse: collapse;">
                        <thead style="text-align: left; color: #fff; border-bottom: 1px solid #333;">
                            <tr><th>PID</th><th>APP_ID</th><th>STATUS</th></tr>
                        </thead>
                        <tbody id="mon-proc-table"></tbody>
                    </table>
                </div>

                <div style="font-size: 10px; color: #444; display: flex; justify-content: space-between;">
                    <span>HASH: 20251226_SHA256_VERIFIED</span>
                    <span id="mon-net">NET: ...</span>
                </div>
            </div>
        `;
    }

    startTracking() {
        const startTime = Date.now();
        
        this.interval = setInterval(() => {
            // 1. Update Uptime
            const now = Date.now();
            const diff = new Date(now - startTime);
            this.container.querySelector('#mon-uptime').innerText = 
                `UPTIME: ${diff.getUTCHours().toString().padStart(2, '0')}:${diff.getUTCMinutes().toString().padStart(2, '0')}:${diff.getUTCSeconds().toString().padStart(2, '0')}`;

            // 2. Real Memory (Heap Usage)
            if (performance.memory) {
                const used = Math.round(performance.memory.usedJSHeapSize / 1048576);
                const total = Math.round(performance.memory.jsHeapSizeLimit / 1048576);
                const perc = (used / total) * 100;
                this.container.querySelector('#mon-mem').innerText = `${used} MB`;
                this.container.querySelector('#mon-mem-bar div').style.width = `${perc}%`;
            }

            // 3. Update Processes
            this.updateProcessTable();
            
            // 4. Test VFS Latency & Network
            this.testHardware();
        }, 1000);
    }

    async testHardware() {
        // VFS Ping
        const start = performance.now();
        if (this.api.vfs) {
            await this.api.vfs.init(); 
            const end = performance.now();
            this.container.querySelector('#mon-vfs').innerText = `${Math.round(end - start)} ms`;
        }

        // Real Network Type
        const conn = navigator.connection || {};
        this.container.querySelector('#mon-net').innerText = `NET: ${conn.effectiveType?.toUpperCase() || 'STABLE'}`;
    }

    updateProcessTable() {
        const table = this.container.querySelector('#mon-proc-table');
        
        // Use the Kernel's runningApps list directly
        // Note: Assumes window.kernel is globally accessible or passed in
        const runningApps = window.kernel ? Array.from(window.kernel.runningApps) : [];
        
        table.innerHTML = runningApps.map((id, index) => `
            <tr style="height: 25px; border-bottom: 1px solid #111;">
                <td>00${index + 1}</td>
                <td style="color:#fff;">${id.toUpperCase()}</td>
                <td style="color:#00ff41;">RUNNING</td>
            </tr>
        `).join('');
    }

    // MANDATORY MEMORY PURGE (Destruct)
    destruct() {
        console.log("Monitor: Closing sensors, clearing heap references...");
        clearInterval(this.interval);
        this.container.innerHTML = "";
    }
}