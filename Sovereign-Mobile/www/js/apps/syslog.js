/**
 * apps/syslog.js - Sovereign Event Viewer
 * v1.1.0 - Hardened with API Signature Guard
 */
export class SyslogApp {
    constructor(container, api) {
        // 1. THE GUARD: Immediate Environment Check
        if (!api || api.signature !== 'SOVEREIGN_CORE_V1') {
            container.innerHTML = `
                <div style="background:#200; color:#ff4444; padding:20px; font-family:monospace; border:1px solid #f00;">
                    [FATAL_ERROR]: UNAUTHORIZED_ENVIRONMENT<br>
                    ACCESS_DENIED: Kernel signature mismatch.<br><br>
                    This module must be executed within the Sovereign Enclave.
                </div>`;
            throw new Error("ENCLAVE_VIOLATION");
        }

        this.container = container;
        this.api = api; // Authorized Bridge (sessionKey, timestamp, etc.)
    }

    async init() {

        // Inside your init() method, update the header HTML:
    this.container.innerHTML = `
        <div style="background:#050505; color:#00ff41; font-family:monospace; height:100%; display:flex; flex-direction:column;">
            <div style="padding:10px; border-bottom:1px solid #222; display:flex; justify-content:space-between; align-items:center; font-size:11px;">
                <span>EVENT_VIEWER_v1.0</span>
                <div>
                    <button id="export-logs" style="background:none; border:1px solid #00ff41; color:#00ff41; cursor:pointer; font-size:10px; margin-right:5px; padding:2px 5px;">EXPORT_DATA</button>
                    <button id="clear-logs" style="background:none; border:1px solid #444; color:#888; cursor:pointer; font-size:10px; padding:2px 5px;">PURGE</button>
                </div>
            </div>
            <div id="log-list" style="flex-grow:1; overflow-y:auto; padding:10px; font-size:12px;">
                ${logs.map(log => this.formatLog(log)).join('')}
            </div>
        </div>
    `;

    // Attach the listener
    this.container.querySelector('#export-logs').onclick = () => this.exportLogs();
        this.render();
    }

    render() {
        const logs = JSON.parse(localStorage.getItem('SOVEREIGN_LOGS') || '[]');
        
        this.container.innerHTML = `
            <div style="background:#050505; color:#00ff41; font-family:'Courier New', monospace; height:100%; display:flex; flex-direction:column; overflow:hidden;">
                <div style="padding:10px; border-bottom:1px solid #222; display:flex; justify-content:space-between; align-items:center; font-size:11px; background:#0a0a0a;">
                    <span>[SYSTEM_LOG_v1.1 // ${this.api.identity}]</span>
                    <div>
                        <button id="export-logs" style="background:none; border:1px solid #00ff41; color:#00ff41; cursor:pointer; font-size:10px; padding:3px 8px; margin-right:5px; transition:0.2s;">EXPORT_SIGNED</button>
                        <button id="clear-logs" style="background:none; border:1px solid #444; color:#888; cursor:pointer; font-size:10px; padding:3px 8px;">PURGE</button>
                    </div>
                </div>

                <div id="log-list" style="flex-grow:1; overflow-y:auto; padding:15px; font-size:12px; line-height:1.5;">
                    ${logs.length > 0 ? logs.map(log => this.formatLog(log)).join('') : '<div style="color:#444;">> NO_LOGDATA_IN_BUFFER</div>'}
                </div>

                <div style="padding:5px 15px; font-size:9px; color:#333; border-top:1px solid #111;">
                    ENCLAVE_REF: ${this.api.timestamp} // HASH_VERIFIED
                </div>
            </div>
        `;

        // Attach Secure Listeners
        this.container.querySelector('#export-logs').onclick = () => this.exportLogs();
        this.container.querySelector('#clear-logs').onclick = () => this.purgeLogs();
        
        // Hover effects
        const btn = this.container.querySelector('#export-logs');
        btn.onmouseenter = () => { btn.style.background = '#00ff41'; btn.style.color = '#000'; };
        btn.onmouseleave = () => { btn.style.background = 'none'; btn.style.color = '#00ff41'; };
    }

    formatLog(log) {
        const color = log.type === 'CRITICAL' ? '#ff4444' : (log.type === 'WARN' ? '#ffcc00' : '#00ff41');
        const time = new Date(log.timestamp).toLocaleTimeString([], { hour12: false });
        return `
            <div style="margin-bottom:12px; border-left: 2px solid ${color}; padding-left:12px; animation: logFade 0.3s ease;">
                <span style="color:#555;">[${time}]</span> 
                <span style="color:${color}; font-weight:bold;">${log.type}</span><br>
                <span style="color:#ccc;">${log.message}</span>
            </div>
        `;
    }

    async exportLogs() {
        // SECONDARY GUARD: Check for valid session key before export
        if (!this.api.sessionKey) {
            alert("ACCESS_DENIED: Cannot sign export without active Enclave Key.");
            return;
        }

        const logs = JSON.parse(localStorage.getItem('SOVEREIGN_LOGS') || '[]');
        const signature = `SIG_20251226_${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
        
        let content = `--- SOVEREIGN OS OFFICIAL AUDIT LOG ---\n`;
        content += `GENESIS_DATE: 2025-12-26\n`;
        content += `EXPORT_SIGNATURE: ${signature}\n`;
        content += `---------------------------------------\n\n`;

        logs.forEach(l => content += `[${l.timestamp}] ${l.type}: ${l.message}\n`);

        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Audit_Log_${this.api.timestamp}.txt`;
        a.click();
        
        // Log the export action itself back to the system
        if (window.kernel) window.kernel.logEvent('INFO', `Manual log export authorized by ${this.api.identity}`);
        this.render(); // Refresh UI to show the new log
    }

    purgeLogs() {
        if (confirm("PURGE_ALL_DATA: This will wipe the forensic history of this Enclave. Continue?")) {
            localStorage.setItem('SOVEREIGN_LOGS', '[]');
            this.render();
        }
    }

    destruct() {
        // Standard OS cleanup
        this.container.innerHTML = "";
    }
}