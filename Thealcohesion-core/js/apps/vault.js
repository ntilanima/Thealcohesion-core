/**
 * VPU_MODULE: VAULT_ENCLAVE (v2.0.0)
 * Security: AES-GCM Volatile Buffer
 * Target: Genesis Allotment [2025-12-26]
 */

export class VaultApp {
    constructor(container, kernel) {
        this.container = container;
        this.kernel = kernel;
        this.sessionTimer = null;
        this.timer = null;
        this.timeLeft = 60;
        this.isLocked = true;
    }

    async init() {
        this.render();
        this.kernel.logEvent('INFO', 'Vault: Enclave Buffer Primed.');
    }

    render() {
    this.container.innerHTML = `
        <div class="vault-root">
            <div class="vault-overlay"></div>
            
            <header class="vault-header">
                <div class="vault-brand">
    <div class="brand-stack">
        <span class="glitch" data-text="SOVEREIGN_VAULT">SOVEREIGN_VAULT</span>
        <span class="security-tier">PROTOCOL: 12.26_GENESIS</span>
    </div>
    <button class="nuclear-btn" onclick="window.vaultApp.terminateSession()">[TERMINATE_SESSION]</button>
</div>
                <div class="vault-timer-box">
                    <span id="countdown-text">ENCLAVE_ACTIVE</span>
                    <div class="vault-progress-bg">
                        <div id="vault-bar"></div>
                    </div>
                </div>
            </header>

            <div id="vault-main" class="vault-grid">
                
                <div class="vault-card secure" onclick="window.vaultApp.openFile('vaultfiles/investors.txt')">
                    <div class="card-edge"></div>
                    <span class="card-icon">📊</span>
                    <span class="card-title">investors.txt</span>
                    <span class="card-tag">ALLOTMENT_12.26</span>
                </div>

                <div class="vault-card secure" onclick="window.vaultApp.openFile('vaultfiles/shares_registry.json')">
                    <div class="card-edge"></div>
                    <span class="card-icon">📈</span>
                    <span class="card-title">shares.json</span>
                    <span class="card-tag">EPOS_EQUITY</span>
                </div>

                <div class="vault-card secure danger" onclick="window.vaultApp.openFile('vaultfiles/bridge_keys.pem')">
                    <div class="card-edge"></div>
                    <span class="card-icon">🔑</span>
                    <span class="card-title">bridge_keys.pem</span>
                    <span class="card-tag">SOVEREIGN_AUTH</span>
                </div>

                <div class="vault-card secure" onclick="window.vaultApp.openFile('directives.txt')">
                    <div class="card-edge"></div>
                    <span class="card-icon">📜</span>
                    <span class="card-title">directives.txt</span>
                    <span class="card-tag">BYLAWS_V1</span>
                </div>

                <div class="vault-card audit" onclick="window.vaultApp.openFile('vaultfiles/access_log.bin')">
                    <div class="card-edge"></div>
                    <span class="card-icon">📟</span>
                    <span class="card-title">access_log.bin</span>
                    <span class="card-tag">AUDIT_TRAIL</span>
                </div>
                </div>
            </div>

            <footer class="vault-footer">
                <div class="audit-line">
                    <span class="label">SEC_STATUS:</span> 
                    <span id="audit-text">BUFFER_SANITIZED</span>
                </div>
                <div class="identity-lock">OFFICER_RANK: ${this.kernel.userRole}</div>
            </footer>

            <div id="vault-viewer" class="vault-viewer-layer" style="display:none;">
                <div class="viewer-controls">
                    <span id="path-display">VAULT://VOLATILE/NULL</span>
                    <button class="purge-trigger" onclick="window.vaultApp.purge()">FORCE_PURGE</button>
                </div>
                <pre id="vault-stream" class="vault-text-stream"></pre>
            </div>
        </div>
    `;
    // Critical: Attach instance to window for HTML onclick handlers
    window.vaultApp = this;
}

// 1. NUCLEAR OPTION: Kills the session at the Kernel level
async terminateSession() {
    this.logEvent('CRITICAL', 'NUCLEAR_PURGE: Nullifying Session Keys...');
    this.kernel.sessionKey = null; // Kill the key
    this.kernel.userRole = 'GUEST'; // Reset rank
    
    document.querySelector('.vault-root').classList.add('shredding');
    setTimeout(() => location.reload(), 1000); // Kick back to login/reboot
}

// 2. ENHANCED OPENER: Detects JSON for visualization
async openFile(path) {
    // 1. Handshake with Kernel
    const data = await this.kernel.enclaveBridge('vault', { operation: 'READ_SECURE', path });
    if (!data) return;

    const stream = document.getElementById('vault-stream');
    const viewer = document.getElementById('vault-viewer');
    
    // Clear previous view state
    stream.classList.remove('audit-matrix');
    stream.style.display = 'block';
    stream.innerHTML = '';

    // 2. Multi-Format Handling
    if (path.endsWith('.json')) {
        this.renderVisualAllotment(JSON.parse(data));
        stream.style.display = 'none';
    } 
    else if (path.endsWith('.bin')) {
        this.renderAuditLog(data);
    } 
    else {
        stream.innerText = data; 
    }

    // 3. UI Activation
    document.getElementById('path-display').innerText = `VAULT://${path.toUpperCase()}`;
    viewer.style.display = 'flex';
    this.startDeadManSwitch(); // Use your timer logic
    
    if (!path.includes('access_log.bin')) {
        this.logAccess(path);
    }
}
// 3. THE VISUALIZER: Renders the 12.26 Cap Table
renderVisualAllotment(json) {
    const viz = document.getElementById('vault-visualizer');
    viz.style.display = 'block';
    
    const total = json.total_supply || 100000000;
    
    let html = `<h3>CAP_TABLE_DISTRIBUTION</h3><div class="viz-bar-container">`;
    json.allotments.forEach(item => {
        const percent = (item.shares / total) * 100;
        html += `
            <div class="viz-segment" style="width: ${percent}%" title="${item.entity}">
                <span class="viz-label">${item.entity} (${percent}%)</span>
            </div>`;
    });
    html += `</div>`;
    viz.innerHTML = html;
}

renderAuditLog(rawData) {
    const stream = document.getElementById('vault-stream');
    stream.classList.add('audit-matrix'); // Add special styling
    
    // Split entries and format with security prefixes
    const lines = rawData.split('\n');
    const formatted = lines.map(line => {
        if (!line) return '';
        return `<div class="audit-entry"><span class="audit-prefix">[AUDIT_LOG]</span> ${line}</div>`;
    }).join('');

    stream.innerHTML = formatted;
    
    // Auto-scroll to the bottom of the log
    setTimeout(() => {
        stream.scrollTop = stream.scrollHeight;
    }, 100);
}

async logAccess(path) {
    const logPath = 'vaultfiles/access_log.bin';
    const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
    
    // Use the Kernel's Member ID or fallback to GUEST
    const actor = this.kernel.memberId || "GUEST_UNAUTH";
    const entry = `[${timestamp}] | AUTH: ${actor} | ACTION: READ | TARGET: ${path}\n`;
    
    try {
        const existingLog = await this.kernel.enclaveBridge('vault', { 
            operation: 'READ_SECURE', 
            path: logPath 
        }) || "";
        
        await this.kernel.enclaveBridge('vault', { 
            operation: 'WRITE_SECURE', 
            path: logPath, 
            data: existingLog + entry 
        });
    } catch (err) {
        console.error("Audit Write Failure:", err);
    }
}

    startDeadManSwitch() {
        if (this.timer) clearInterval(this.timer);
        this.timeLeft = 60;
        const bar = this.container.querySelector('#vault-bar');
        const text = this.container.querySelector('#countdown-text');

        this.timer = setInterval(() => {
            this.timeLeft--;
            bar.style.width = `${(this.timeLeft / 60) * 100}%`;
            text.innerText = `SESSION_EXPIRES: ${this.timeLeft}s`;
            
            if (this.timeLeft <= 10) bar.style.background = '#ff4444';
            if (this.timeLeft <= 0) this.purge();
        }, 1000);
    }

    purge() {
        clearInterval(this.timer);
        const viewer = this.container.querySelector('#vault-viewer');
        const stream = this.container.querySelector('#vault-stream');
        viewer.classList.add('shredding'); // Trigger CSS shred
        
        stream.innerText = "PURGING_MEMORY_BUFFER...";

        setTimeout(() => {
        this.stream.innerText = "MEMORY_PURGED";
        viewer.style.display = 'none';
        stream.innerText = "";
        this.container.querySelector('#countdown-text').innerText = "BUFFER_PURGED";
        viewer.classList.remove('shredding');
        this.logEvent('WARN', 'SEC_PURGE: Volatile buffer wiped.');
    }, 800);
    }
}