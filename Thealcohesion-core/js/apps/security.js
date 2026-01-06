/**
 * apps/security.js - Sovereign Security Dashboard
 * v1.0.0 - Real-time Threat Visualization
 */
export class SecurityApp {
    constructor(container, api) {
        // THE GUARD
        if (!api || api.signature !== 'SOVEREIGN_CORE_V1') {
            container.innerHTML = `<div style="color:red;">UNAUTHORIZED_ACCESS</div>`;
            throw new Error("ENCLAVE_VIOLATION");
        }
        this.container = container;
        this.api = api;
    }

    init() {
        this.render();
        this.startPulse();
    }

    render() {
        const logs = JSON.parse(localStorage.getItem('SOVEREIGN_LOGS') || '[]');
        const criticalCount = logs.filter(l => l.type === 'CRITICAL').length;
        const threatLevel = criticalCount > 5 ? 'ELEVATED' : (criticalCount > 0 ? 'STABLE' : 'OPTIMAL');
        const score = Math.max(0, 100 - (criticalCount * 15));
        // Calculate Metrics
        const hwid = localStorage.getItem('VPU_HW_ID') || 'NOT_FOUND';
        const shortHWID = hwid.substring(0, 14) + "..."; // Keep it looking like a partial hash

        this.container.innerHTML = `
            <div style="background:#000; color:#00ff41; font-family:monospace; height:100%; padding:20px; display:flex; flex-direction:column; gap:20px;">
                <div style="display:flex; justify-content:space-between; border-bottom:1px solid #1a1a1a; padding-bottom:10px;">
                    <span>[ENCLAVE_SECURITY_SHIELD]</span>
                    <span id="threat-status" style="color:${this.getThreatColor(threatLevel)}">${threatLevel}</span>
                </div>

                <div style="height:150px; border:1px solid #111; position:relative; overflow:hidden; background:radial-gradient(circle, #0a1a0a 0%, #000 70%);">
                    <div id="radar-sweep" style="position:absolute; width:100%; height:100%; background:linear-gradient(90deg, transparent, rgba(0,255,65,0.1)); transform-origin:left; animation: sweep 4s linear infinite;"></div>
                    <div style="position:absolute; top:50%; left:50%; transform:translate(-50%, -50%); font-size:10px; text-align:center;">
                        SCANNING_VFS...<br>
                        <span style="color:#fff;">PARTITION_20251226: SECURE</span>
                    </div>
                </div>

                <div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px;">
                    <div style="border:1px solid #222; padding:10px;">
                        <div style="font-size:10px; color:#555;">INTEGRITY_SCORE</div>
                        <div style="font-size:20px;">${score}%</div>
                    </div>
                    <div style="border:1px solid #222; padding:10px;">
                        <div style="font-size:10px; color:#555;">ACTIVE_TRIPWIRES</div>
                        <div style="font-size:20px; color:#a445ff;">04</div>
                    </div>
                </div>

                <div style="font-size:10px; background:rgba(164,69,255,0.1); padding:10px; color:#a445ff;">
                    > ENCLAVE_KEY: AES-256-GCM ACTIVE<br>
                    > VOLATILE_MEMORY: SHIELDED
                </div>
                <div style="margin-top: auto; padding-top: 20px; border-top: 1px solid #222;">
                    <button id="destruct-btn" style="width:100%; padding:12px; background:transparent; border:1px solid #ff4444; color:#ff4444; font-family:monospace; cursor:pointer; font-weight:bold; transition: 0.3s;">
                        [!] INITIATE OMEGA_PROTOCOL
                    </button>
                </div>
                <div style="font-size:9px; color:#444; text-align:center; margin-top:10px;">
                    WARING: ACTION IS NON-REVERSIBLE
                </div>
            <div style="border: 1px solid #1a1a1a; background: #050505; padding: 15px; margin-top: 10px;">
                <div style="font-size: 10px; color: #555; margin-bottom: 8px; display: flex; justify-content: space-between;">
                    <span>TERMINAL_ID_SIGNATURE</span>
                    <span style="color: #00ff41;">VERIFIED</span>
                </div>
                <div style="font-family: 'Courier New', monospace; font-size: 14px; color: #fff; letter-spacing: 1px;">
                    ${shortHWID}
                </div>
                <div style="font-size: 9px; color: #333; margin-top: 5px;">
                    PARTITION: 2025-12-26 // GENESIS_ROOT
                </div>
        </div>
            
            <style>
                @keyframes sweep {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
            </style>
        `;

        this.container.querySelector('#destruct-btn').onclick = () => this.initiateSelfDestruct();
    }

    // --- INSERT THE METHOD HERE ---
    startPulse() {
        this.pulseInterval = setInterval(() => {
            // 1. UI Flicker effect
            const status = this.container.querySelector('#threat-status');
            if (status) {
                status.style.opacity = status.style.opacity === '0.3' ? '1' : '0.3';
            }

            // 2. LIVE HARDWARE GUARD
            if (localStorage.getItem('VPU_HW_ID') !== "SIG_2025_12_26_ALPHA_GENESIS") {
                if (window.kernel) {
                    window.kernel.triggerRealPanic("0xHW_TAMPER_10", "Hardware signature lost during active session.");
                }
            }
        }, 2000); 
    }

    // IMPORTANT: Stop the pulse when the window is closed
    destruct() {
        if (this.pulseInterval) {
            clearInterval(this.pulseInterval);
            console.log("SecurityApp: Pulse halted.");
        }
    }

    getThreatColor(level) {
        if (level === 'OPTIMAL') return '#00ff41';
        if (level === 'STABLE') return '#ffcc00';
        return '#ff4444';
    }

    startPulse() {
        // Simulate real-time monitoring
        this.pulseInterval = setInterval(() => {
            const status = this.container.querySelector('#threat-status');
            if (status) {
                status.style.opacity = status.style.opacity === '0.3' ? '1' : '0.3';
            }
        }, 800);
    }

    destruct() {
        clearInterval(this.pulseInterval);
    }

    //The "Omega Protocol" Logic

    async initiateSelfDestruct() {
        const confirmClear = confirm("OMEGA_PROTOCOL: This will permanently SHRED all encrypted partitions and wipe forensic logs. Proceed?");
        
        if (confirmClear) {
            let countdown = 5;
            const btn = this.container.querySelector('#destruct-btn');
            
            const timer = setInterval(() => {
                btn.innerText = `SHREDDING IN ${countdown}...`;
                btn.style.background = countdown % 2 === 0 ? '#ff0000' : '#000';
                btn.style.color = '#fff';
                
                if (countdown <= 0) {
                    clearInterval(timer);
                    this.executeFinalWipe();
                }
                countdown--;
            }, 1000);
        }
    }

    executeFinalWipe() {
        // 1. Wipe all Sovereign-related LocalStorage
        const keysToWipe = [
            'vpu_vfs_root', 
            'SOVEREIGN_LOGS', 
            'LAST_PANIC_CODE', 
            'LAST_PANIC_TIME',
            'member_identity'
        ];
        
        keysToWipe.forEach(key => localStorage.removeItem(key));

        // 2. Trigger a final "Melt" animation
        document.body.style.transition = "filter 2s, background 2s";
        document.body.style.filter = "brightness(5) blur(20px)";
        document.body.style.background = "#fff";

        // 3. Hard Redirect to clear RAM
        setTimeout(() => {
            window.location.href = "about:blank";
        }, 2000);
    }
}


//add later: Simulated login history: access locations, ip addresses accessed