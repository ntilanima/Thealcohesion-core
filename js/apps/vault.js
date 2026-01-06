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
        this.timeLeft = 60;
        this.isLocked = true;
    }

    async init() {
        this.render();
        this.setupListeners();
        this.kernel.logEvent('INFO', 'Vault Enclave Initialized.');
    }

    render() {
        this.container.innerHTML = `
            <div class="vault-root">
                <header class="vault-header">
                    <div class="brand">
                        <span class="glitch" data-text="SOVEREIGN_VAULT">SOVEREIGN_VAULT</span>
                        <div class="security-chip">RSA_4096_GCM</div>
                    </div>
                    <div class="session-monitor">
                        <div id="countdown-label">ENCLAVE_LOCKED</div>
                        <div class="progress-track">
                            <div id="session-bar"></div>
                        </div>
                    </div>
                </header>

                <main id="vault-explorer" class="file-grid">
                    <div class="vault-card" data-file="investors.txt">
                        <div class="card-glow"></div>
                        <div class="card-inner">
                            <div class="icon">📁</div>
                            <div class="info">
                                <span class="filename">investors.txt</span>
                                <span class="allotment-tag">EPOS_ALLOTMENT_12.26</span>
                            </div>
                        </div>
                    </div>

                    <div class="vault-card" data-file="readme.txt">
                        <div class="card-inner">
                            <div class="icon">📄</div>
                            <div class="info">
                                <span class="filename">readme.txt</span>
                                <span class="allotment-tag">BOOT_PROTOCOL</span>
                            </div>
                        </div>
                    </div>
                </main>

                <section id="vault-viewer" class="volatile-viewer" style="display:none;">
                    <nav class="viewer-nav">
                        <span id="active-path">ENCLAVE://NULL</span>
                        <button id="close-btn">PURGE_BUFFER</button>
                    </nav>
                    <div id="content-stream" class="terminal-text"></div>
                </section>

                <footer class="vault-footer">
                    <div class="audit-line">> <span id="audit-text">AWAITING_BRIDGE_HANDSHAKE...</span></div>
                    <div class="enc-status">SESSION: ${this.kernel.sessionKey ? 'ENCRYPTED' : 'UNSECURED'}</div>
                </footer>
            </div>
        `;
    }

    setupListeners() {
        this.container.querySelectorAll('.vault-card').forEach(card => {
            card.onclick = () => this.requestBridgeAccess(card.dataset.file);
        });

        this.container.querySelector('#close-btn').onclick = () => this.purgeMemory();
    }

    async requestBridgeAccess(filename) {
        const audit = this.container.querySelector('#audit-text');
        const viewer = this.container.querySelector('#vault-viewer');
        const stream = this.container.querySelector('#content-stream');
        
        audit.innerText = "HANDSHAKE_INITIATED...";

        // Calling the Kernel Bridge
        const content = await this.kernel.enclaveBridge('vault', {
            operation: 'READ_SECURE',
            path: filename === 'investors.txt' ? `home/documents/${filename}` : `home/${filename}`
        });

        if (content) {
            audit.innerText = "BRIDGE_STABLE: DATA_DECRYPTED";
            stream.innerText = content;
            viewer.style.display = 'flex'; // Ensure CSS handles this as an overlay
            this.container.querySelector('#active-path').innerText = `ENCLAVE://VOLATILE/${filename}`;
            this.startDeadManSwitch();
        } else {
            audit.style.color = "#ff4444";
            audit.innerText = "BRIDGE_REFUSED: INVALID_IDENTITY OR LOCKED_VFS";
        }
    }

    startDeadManSwitch() {
        this.stopDeadManSwitch(); 
        this.timeLeft = 60;
        const bar = this.container.querySelector('#session-bar');
        const label = this.container.querySelector('#countdown-label');

        this.sessionTimer = setInterval(() => {
            this.timeLeft--;
            const width = (this.timeLeft / 60) * 100;
            bar.style.width = `${width}%`;
            label.innerText = `SECURE_SESSION: ${this.timeLeft}s`;

            if (this.timeLeft <= 0) this.purgeMemory();
        }, 1000);

        // RESET TIMER ON ACTIVITY (Fixed for smoother UI)
        const viewer = this.container.querySelector('#vault-viewer');
        viewer.onmousemove = viewer.onkeydown = () => {
            if (this.timeLeft > 0) {
                this.timeLeft = 60;
                bar.style.width = '100%';
                label.innerText = `SECURE_SESSION: 60s`;
            }
        };
    }

    purgeMemory() {
        this.stopDeadManSwitch();
        const stream = this.container.querySelector('#content-stream');
        const viewer = this.container.querySelector('#vault-viewer');
        const audit = this.container.querySelector('#audit-text');
        
        stream.innerHTML = `<span style="color:red;">WIPING_VOLATILE_MEMORY...</span>`;
        
        setTimeout(() => {
            stream.innerText = "";
            viewer.style.display = 'none';
            audit.style.color = "#a445ff";
            audit.innerText = "MEMORY_SANITIZED_BY_KERNEL";
        }, 500);
    }

    stopDeadManSwitch() {
        if (this.sessionTimer) clearInterval(this.sessionTimer);
    }
}