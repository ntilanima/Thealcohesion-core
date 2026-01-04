/**
 * apps/settings.js - Enhanced with Security Audits
 */
export class SettingsApp {
    constructor(container, sessionKey) {
        this.container = container;
        this.key = sessionKey;
    }

    async init() {
        this.render();
        await this.runSecurityAudit(); // Run audit on boot
    }

    async runSecurityAudit() {
        const statusEl = document.getElementById('audit-status');
        if (!statusEl) return;

        statusEl.innerHTML = "Scanning Enclave...";
        
        try {
            const VFS = window.SovereignVFS;
            const data = await VFS.read("home/documents/investors.txt", this.key);
            
            if (data && data.includes("15,000,000")) {
                statusEl.innerHTML = "✅ GENESIS ALLOTMENT VERIFIED (2025-12-26)";
                statusEl.style.color = "#00ff41";
            } else {
                throw new Error("Data Mismatch");
            }
        } catch (e) {
            statusEl.innerHTML = "⚠️ SECURITY BREACH: Genesis Data Corrupted or Locked";
            statusEl.style.color = "#ff4444";
        }
    }

    render() {
        this.container.innerHTML = `
            <div class="settings-wrapper" style="padding: 20px; color: #fff; font-family: 'Courier New', monospace; background: #000; height: 100%; overflow-y: auto;">
                <h2 style="color: #00ff41; border-bottom: 2px solid #00ff41; padding-bottom: 5px;">SYSTEM CONFIG</h2>
                
                <div class="section" style="margin-bottom: 25px; border: 1px solid #333; padding: 15px;">
                    <h3 style="font-size: 12px; color: #888;">ENCLAVE INTEGRITY AUDIT</h3>
                    <div id="audit-status" style="font-size: 13px; margin: 10px 0;">Awaiting Diagnostic...</div>
                    <button onclick="this.closest('.settings-wrapper').parentElement.dataset.instance.runSecurityAudit()" 
                            style="background: none; border: 1px solid #00ff41; color: #00ff41; padding: 5px 10px; cursor: pointer; font-size: 11px;">
                        RE-SCAN VAULT
                    </button>
                </div>

                <div class="section" style="margin-bottom: 25px; border: 1px solid #333; padding: 15px;">
                    <h3 style="font-size: 12px; color: #888;">CRYPTOGRAPHIC PARAMETERS</h3>
                    <div style="font-size: 12px; line-height: 1.6; color: #aaa;">
                        <div>ALGORITHM: <span style="color:#fff;">AES-GCM 256-bit</span></div>
                        <div>KDF: <span style="color:#fff;">PBKDF2-SHA256</span></div>
                        <div>ITERATIONS: <span style="color:#fff;">100,000</span></div>
                        <div>SALT: <span style="color:#fff;">sovereign_MEMBER_001</span></div>
                    </div>
                </div>

                <div class="section" style="margin-bottom: 25px; border: 1px solid #333; padding: 15px;">
                    <h3 style="font-size: 12px; color: #888;">OS VISUALS</h3>
                    <div style="display: flex; gap: 10px; margin-top: 10px;">
                        <button onclick="document.body.classList.add('crt-effect')" style="background:#222; color:#fff; border:1px solid #444; padding:5px; cursor:pointer;">ENABLE CRT SCANLINES</button>
                        <button onclick="document.body.classList.remove('crt-effect')" style="background:#222; color:#fff; border:1px solid #444; padding:5px; cursor:pointer;">DISABLE CRT</button>
                    </div>
                </div>

                <div class="section" style="margin-bottom: 25px; border: 1px solid #333; padding: 15px;">
                    <h3 style="font-size: 12px; color: #888;">DATA PORTABILITY</h3>
                    <p style="font-size: 11px; color: #666;">Backup your encrypted vault to a local JSON file.</p>
                    <button onclick="this.closest('.settings-wrapper').parentElement.dataset.instance.exportEnclave()" 
                            style="background: #222; color: #00ff41; border: 1px solid #00ff41; padding: 5px 10px; cursor: pointer; width: 100%;">
                        DOWNLOAD ENCRYPTED BACKUP
                    </button>
                </div>

                <div style="margin-top: 50px; text-align: center;">
                    <button id="wipe-vfs" style="background: #440000; color: #ff4444; border: 1px solid #ff4444; padding: 10px; width: 100%; cursor: pointer;">
                        EXECUTE PROTOCOL: PURGE ALL DATA
                    </button>
                </div>
            </div>
        `;

        this.container.querySelector('#wipe-vfs').onclick = () => this.purgeVFS();
    }

    async purgeVFS() {
        if (confirm("WARNING: This will permanently delete the 2025-12-26 Investor Allotment data. Proceed?")) {
            const req = indexedDB.deleteDatabase("SovereignCore_VFS");
            req.onsuccess = () => {
                alert("Vault Purged. System rebooting...");
                window.location.reload();
            };
        }
    }

    async exportEnclave() {
    const db = await window.SovereignVFS.init();
    const tx = db.transaction("vault", "readonly");
    const store = tx.objectStore("vault");
    const allRecords = await new Promise(res => {
        store.getAll().onsuccess = (e) => res(e.target.result);
    });

    const blob = new Blob([JSON.stringify(allRecords)], {type: "application/json"});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Sovereign_Backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
}
}