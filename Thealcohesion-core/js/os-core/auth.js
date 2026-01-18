/**
 * auth.js - THEALCOHESION SOVEREIGN GATEKEEPER
 * Combined: UI Logic (EnclaveEntry) + Security Logic (identityGate)
 * Compliance: Section 0.5.2 (Crypto) & Article 13.1 (Roles)
 */

export class SovereignAuth {
    constructor(container, kernel) {
        this.container = container;
        this.kernel = kernel; // Access to 29-app registry
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
    render() {
        this.container.innerHTML = `
            <div class="auth-wrapper" style="height: 100vh; background: #000; display: flex; align-items: center; justify-content: center;">
                <div class="gate-box" style="text-align: center; width: 350px; border: 1px solid #1a1a1a; padding: 40px; background: #050505;">
                    <h1 style="color: #a445ff; letter-spacing: 5px; font-weight: 300;">ENCLAVE</h1>
                    <div id="auth-status" style="font-size: 10px; color: #666; margin-bottom: 20px;">WAITING_FOR_IDENTITY</div>
                    
                    <input type="text" id="m-id" placeholder="MEMBER ID" style="width: 100%; background: #111; border: 1px solid #333; padding: 12px; color: #00ff41; margin-bottom: 10px; outline: none; font-family: monospace;">
                    <input type="password" id="m-pass" placeholder="SECURITY KEY" style="width: 100%; background: #111; border: 1px solid #333; padding: 12px; color: #00ff41; margin-bottom: 20px; outline: none;">
                    
                    <button id="gate-btn" style="width: 100%; background: #a445ff; color: white; border: none; padding: 14px; cursor: pointer; font-weight: bold; letter-spacing: 1px;">INITIATE HANDSHAKE</button>
                </div>
            </div>`;
        this.setupListeners();
    }

    setupListeners() {
        const btn = this.container.querySelector('#gate-btn');
        btn.onclick = async () => {
            const id = this.container.querySelector('#m-id').value.toUpperCase();
            const pass = this.container.querySelector('#m-pass').value;
            const status = this.container.querySelector('#auth-status');

            try {
                status.innerText = "DERIVING_KEY...";
                // Execute Section 0.5.2 Logic
                const cryptoKey = await this.deriveKey(pass, id);
                
                // Determine Role for Article 13.1 Projection
                let role = 'NATIVE';
                if (id.startsWith('MEGA')) role = 'MEGA_PERSONNEL';
                if (id.startsWith('OFF')) role = 'OFFICER';

                // Handshake with Kernel
                const success = await this.kernel.bootSession({
                    identity: id,
                    role: role,
                    key: cryptoKey,
                    signature: 'SOVEREIGN_CORE_V1'
                });

                if (success) {
                    status.style.color = "#00ff41";
                    status.innerText = `ACCESS_GRANTED: [${role}]`;
                    setTimeout(() => this.projectDesktop(role), 500);
                }
            } catch (e) {
                status.style.color = "#ff4444";
                status.innerText = "HANDSHAKE_FAILED: INVALID_CREDENTIALS";
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