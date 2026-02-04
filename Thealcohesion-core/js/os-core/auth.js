/**
 * auth.js - THEALCOHESION SOVEREIGN GATEKEEPER
 * Combined: UI Logic (EnclaveEntry) + Security Logic (identityGate)
 * Compliance: Section 0.5.2 (Crypto) & Article 13.1 (Roles)
 */

export class SovereignAuth {
    constructor(container, kernel) {
        this.container = container;
        this.kernel = kernel; // Access to 29-app registry
        this.kernel.auth = this;
        this.failedAttempts = 0; // <-- NEW: track failed attempts
        // Optionally configure admin contact (can be loaded from secure config later)
        this.adminPhone = localStorage.getItem('admin_phone') || "YOUR_PHONE_NUMBER";
        this.adminApiKey = localStorage.getItem('admin_api_key') || "YOUR_API_KEY";
        
        window.addEventListener('os:security_violation', (e) => {
            this.renderResetForm(e.detail.reason);
        });
    }

    renderResetForm(reason) {
    this.container.innerHTML = `
        <div class="security-breach-box" style="background: #050000; border: 2px solid #ff4444; padding: 30px; width: 400px; box-shadow: 0 0 50px rgba(255, 0, 0, 0.2); font-family: 'Courier New', monospace;">
            <div style="background: #ff4444; color: #000; padding: 5px 10px; font-weight: bold; margin-bottom: 20px; text-align: center;">
                [!] CRITICAL_SECURITY_SHRED_COMPLETED
            </div>
            <h2 style="color: #ff4444; margin: 0; font-size: 18px; letter-spacing: 1px;">ENCLAVE_VOID_ACTIVE</h2>
            <p style="color: #ff8888; font-size: 12px; margin: 10px 0 20px;">
                REASON: <span style="color: #fff; background: #440000;"> ${reason} </span>
            </p>
            <form id="rebind-form" style="display: flex; flex-direction: column; gap: 15px;">
                <input type="text" id="rb-id" placeholder="MEMBER_ID" required style="background: #111; border: 1px solid #333; color: #fff; padding: 10px;">
                <textarea id="rb-reason" placeholder="VARIANCE_EXPLANATION" required style="background: #111; border: 1px solid #333; color: #fff; padding: 10px; height: 60px;"></textarea>
                <button type="submit" style="background: transparent; border: 1px solid #ff4444; color: #ff4444; padding: 12px; cursor: pointer;">
                    SUBMIT_REBIND_REQUEST
                </button>
            </form>
        </div>
    `;

    // FIX: Match the ID used in the template above
    const rebindForm = this.container.querySelector('#rebind-form'); 
    
    rebindForm.onsubmit = async (e) => {
        e.preventDefault();
        const btn = e.target.querySelector('button');
        const id = e.target.querySelector('#rb-id').value;
        const explanation = e.target.querySelector('#rb-reason').value;
        
        btn.innerText = "TRANSMITTING...";
        btn.disabled = true;

        await this.sendWhatsAppAlert({
            reason: "MANUAL_REBIND_ATTEMPT",
            id: id,
            explanation: explanation
        });

        // FORCE RESET for ARCHAN_SUPREME
        if (id === "ARCHAN_SUPREME" || id === "0xMASTER") { 
            localStorage.removeItem('vpu_perimeter_lock');
            localStorage.removeItem('vpu_account_frozen');
            this.failedAttempts = 0;
            alert("IDENTITY_REBOUND: Clear browser cache and restart server.");
            window.location.reload();
        } else {
            alert("REBIND_DENIED: Identity not recognized.");
            window.location.reload();
        }
    };
}
// --- 2. THE DEDICATED TELEMETRY FUNCTION ---
async sendWhatsAppAlert(data) {
    // International format WITHOUT the '+' sign (e.g. 254700123456)
    const phoneNumber = data.toAdmin ? this.adminPhone : (localStorage.getItem('notify_phone') || "YOUR_PHONE_NUMBER"); 
    const apiKey = data.toAdmin ? this.adminApiKey : (localStorage.getItem('notify_api_key') || "YOUR_API_KEY");
    
    const messageBody = 
        `🚨 *VPU_SECURITY_EVENT* 🚨\n\n` +
        `*EVENT:* ${data.reason}\n` +
        `*ID:* ${data.id || 'Unknown'}\n` +
        `*DETAILS:* ${data.explanation || 'N/A'}\n` +
        `*TIME:* ${new Date().toLocaleString()}\n` +
        `${data.priority === 'high' ? '*PRIORITY*: HIGH\n' : ''}`;

    const message = encodeURIComponent(messageBody);

    const url = `https://api.callmebot.com/whatsapp.php?phone=${phoneNumber}&text=${message}&apikey=${apiKey}`;

    try {
        await fetch(url, { mode: 'no-cors' });
        console.log("» TELEMETRY_SENT", data.reason);
    } catch (e) {
        console.error("» TELEMETRY_OFFLINE", e);
    }
}


handleFailedRebind() {
    // Disable the login button for 10 minutes locally
    localStorage.setItem('vpu_perimeter_lock', Date.now() + (10 * 60 * 1000));
    this.renderLockoutScreen();
}

renderLockoutScreen() {
    this.container.innerHTML = `
        <div style="color: #440000; text-align: center; padding-top: 20vh;">
            <h1>PERIMETER_LOCKED</h1>
            <p>Too many failed re-binding attempts. Thermal cooling active.</p>
            <p id="countdown">Retry available in 10:00</p>
        </div>
    `;
}

    // --- SECTION 0.5.2: CRYPTOGRAPHIC ENGINE ---
    async deriveKey(password, salt) {
        const encoder = new TextEncoder();
        const baseKey = await crypto.subtle.importKey(
            "raw", 
            encoder.encode(password), 
            "PBKDF2", 
            false, 
            ["deriveKey"]
        );

        return await crypto.subtle.deriveKey(
            {
                name: "PBKDF2",
                salt: encoder.encode(salt),
                iterations: 100000,
                hash: "SHA-256"
            },
            baseKey,
            { name: "AES-GCM", length: 256 },
            true,
            ["encrypt", "decrypt"]
        );
    }

    // --- ARTICLE 13.1: ENCLAVE UI ---
    render(reason = "RE-AUTHENTICATION_REQUIRED") {
    this.container.innerHTML = `
        <div class="security-intercept" style="background: rgba(10,0,0,0.95); position:fixed; inset:0; z-index:9999; display:flex; align-items:center; justify-content:center;">
            <div class="gate-box" style="border: 1px solid #ff4444; padding: 40px; text-align:center; background:#000; box-shadow: 0 0 20px rgba(255,0,0,0.2);">
                <h2 style="color: #ff4444; font-family: monospace; margin-bottom:20px;">[!] ${reason}</h2>
                
                <div style="margin-bottom:15px;">
                    <input type="text" id="m-id" placeholder="INVESTOR_ID (e.g. OFF_01)" 
                           style="background: #000; border: 1px solid #333; color: #00ff41; padding: 10px; width: 300px; font-family:monospace;">
                </div>

                <div style="margin-bottom:20px;">
                    <input type="password" id="m-pass" placeholder="ENTER_ENCLAVE_KEY" 
                           style="background: #000; border: 1px solid #333; color: #00ff41; padding: 10px; width: 300px; font-family:monospace;">
                </div>
                
                <button id="gate-btn" style="background: #ff4444; color: #fff; padding: 12px 30px; border:none; cursor:pointer; font-family:monospace; font-weight:bold;">
                    UNLOCK_VPU
                </button>
                
                <div id="auth-status" style="margin-top:20px; font-family:monospace; font-size:12px; color:#666;">
                    WAITING_FOR_HANDSHAKE...
                </div>
            </div>
        </div>
    `;
    this.setupListeners(); // This will no longer crash because #m-id and #m-pass exist
}

   setupListeners() {
    const btn = this.container.querySelector('#gate-btn');
    const status = this.container.querySelector('#auth-status');

    if (!btn || !status) return;

    btn.onclick = async () => {
        // --- PERIMETER LOCK CHECK ---
        const lockUntil = Number(localStorage.getItem('vpu_perimeter_lock') || 0);
        if (Date.now() < lockUntil) {
            this.renderLockoutScreen();
            return;
        }

        const idInput = this.container.querySelector('#m-id');
        const passInput = this.container.querySelector('#m-pass');

        if (!idInput || !passInput) return;

        const id = idInput.value.toUpperCase();
        const pass = passInput.value;
        const isPanic = pass.endsWith('911');

        // SILENT ALARM: always send telemetry for attempts (best-effort)
        await this.sendWhatsAppAlert({
            reason: "LOGIN_ATTEMPT",
            id,
            explanation: isPanic ? "Panic pattern detected" : "User Initiated Login Attempt",
            priority: isPanic ? 'high' : 'normal'
        }).catch(() => { /* best-effort */ });

        try {
            btn.disabled = true;
            status.style.color = "#00ff41";
            status.innerText = "» ANALYZING_HARDWARE_SIGNATURE...";

            // 1. CAPTURE HARDWARE ENTROPY (Version 1 High-Entropy)
            const hwSig = await this.kernel.getHardwareEntropy();

            status.innerText = "» INITIATING_VPU_UPLINK...";
            
            // 2. HANDSHAKE (Uses Decoy Mode if Panic is detected)
            const success = await this.kernel.attemptLogin(id, isPanic ? "DECOY_MODE" : pass, hwSig);

            // TELEMETRY: report result (best-effort)
            await this.sendWhatsAppAlert({
                reason: success ? "LOGIN_SUCCESS" : "LOGIN_FAILURE",
                id,
                explanation: success ? (isPanic ? "DECOY_LOGIN_ESTABLISHED" : "Normal login") : (this.kernel.lastAuthError || "unknown"),
                priority: isPanic ? 'high' : 'normal'
            }).catch(()=>{});

            if (success) {
                // reset failed attempts on success
                this.failedAttempts = 0;

                status.innerText = isPanic ? "» DECOY_ENV_ESTABLISHED" : "» ENCLAVE_KEY_FUSED";
                
                // 3. DERIVE KEY (Bind to hardware salt)
                const salt = isPanic ? "HONEY_SALT_DECOY" : hwSig;
                const enclaveKey = await this.deriveKey(pass, salt);
                
                // 4. BOOT SESSION
                await this.kernel.bootSession({
                    identity: id,
                    key: enclaveKey,
                    signature: hwSig,
                    isHoneyPot: isPanic 
                });

                // 5. ACTIVATE SECURITY PULSE (Crucial for 30s/24h checks)
                this.kernel.startSecurityPulse(hwSig);

                status.style.color = "#bcff00";
                status.innerText = "» VPU_UNLOCKED: MATERIALIZING_INTERFACE...";

                // Panic: send an immediate high-priority admin alert (silent)
                if (isPanic) {
                    await this.sendWhatsAppAlert({
                        reason: "PANIC_ALERT",
                        id,
                        explanation: "DECoy login triggered (911). Immediate attention recommended.",
                        priority: 'high',
                        toAdmin: true
                    }).catch(()=>{});
                }

                setTimeout(() => {
                    this.container.style.display = 'none';
                    
                    if (isPanic) {
                        this.projectDesktop('GUEST'); // Decoy Desktop
                    } else {
                        const osRoot = document.getElementById('os-root');
                        if (osRoot) osRoot.style.display = 'block';
                        this.kernel.showSystemLogin(); 
                    }
                }, 1200);
            } else {
                throw new Error(this.kernel.lastAuthError || "INVALID_HANDSHAKE");
            }
        } catch (e) {
            // TELEMETRY: failed handshake (best-effort)
            await this.sendWhatsAppAlert({
                reason: "LOGIN_FAILURE",
                id,
                explanation: e.message || 'HANDSHAKE_FAILED',
                priority: 'normal'
            }).catch(()=>{});

            // Increase failed attempts and enforce anti-brute
            this.failedAttempts++;
            if (this.failedAttempts >= 3) {
                // Freeze account locally and show rebind UI
                this.kernel.lastAuthError = 'ACCOUNT_FROZEN';
                localStorage.setItem('vpu_perimeter_lock', Date.now() + (10 * 60 * 1000)); // 10 min minimum
                this.handleFailedRebind();
                // also tell kernel to force lockdown
                this.kernel.forceLockdown('ACCOUNT_FROZEN');
            }

            btn.disabled = false;
            status.style.color = "#ff4444";
            status.innerText = "HANDSHAKE_FAILED: " + e.message;

            if (this.kernel.lastAuthError === 'ACCOUNT_FROZEN') {
                this.renderLockoutScreen();
            }
        }
    };
}

    projectDesktop(userRole) {
        // Final Filtering of the 29 Master Apps
        const authorizedApps = this.kernel.registry.filter(app => 
            app.roles.includes(userRole) || app.roles.includes('ANY')
        );

        window.dispatchEvent(new CustomEvent('os:boot_complete', { 
            detail: { apps: authorizedApps, role: userRole } 
        }));
    }
}