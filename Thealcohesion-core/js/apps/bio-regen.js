/**
 * BIO_REGEN // BIOLOGICAL_STASIS_PROTOCOL
 * Sovereign Class Application - Section 8: Vitality & BBI
 */
export class BioRegenApp {
    constructor(container, api) {
        this.container = container;
        this.api = api;
        this.id = 'bio-regen';
        this.vfsPath = 'home/health/stasis_meta.json';
        
        // Internal State
        this.stasisActive = false;
        this.startTime = null;
    }

    async init() {
        await this.loadStasisRecord();
        this.render();
        this.startHeartbeat();
    }

    async loadStasisRecord() {
        try {
            const data = await this.api.vpu.readFile(this.vfsPath);
            if (data) {
                const meta = JSON.parse(data);
                this.startTime = meta.startTime;
                this.stasisActive = meta.active;
            }
        } catch (e) { console.warn("BIO_REGEN: NO_PRIOR_STASIS_FOUND"); }
    }

    async saveStasisRecord() {
        const meta = { startTime: this.startTime, active: this.stasisActive };
        await this.api.vpu.writeFile(this.vfsPath, JSON.stringify(meta));
    }

    // Advanced Phase Logic: 12h to 72h
    getBiologicalState(hours) {
        if (hours < 12) return { stage: "KETOSIS_INIT", color: "#3498db", desc: "Insulin falling. Mind: Acknowledge hunger as data, not distress." };
        if (hours < 18) return { stage: "AUTOPHAGY_START", color: "#00ff41", desc: "Cellular cleanup initiated. Workout: Light Zone 2 walking." };
        if (hours < 24) return { stage: "AUTOPHAGY_PEAK", color: "#f1c40f", desc: "Max regeneration. BBI: Cognitive clarity rising. Focus on logic." };
        if (hours < 48) return { stage: "DEEP_CLEANSE", color: "#e67e22", desc: "Neural aggregates being recycled. BBI: Enhanced sensory sync." };
        return { stage: "STEM_CELL_REGEN", color: "#9b59b6", desc: "Immune reboot. Protocol: Maximum Sovereign State achieved." };
    }


    async initializeHandshake() {
        const sensor = document.getElementById('bio-sensor');
        const progress = document.getElementById('scan-progress');
        const status = document.getElementById('handshake-status');
        let charge = 0;
        let active = false;

        const runScan = () => {
            if (!active) return;
            charge += 1.5;
            progress.style.width = `${charge}%`;
            if (charge >= 100) {
                this.toggleStasis(true);
                if (this.api.notify) this.api.notify("BIO_SIGNATURE_VERIFIED", "success");
            } else {
                requestAnimationFrame(runScan);
            }
        };

        sensor.onmousedown = () => { active = true; status.innerHTML = "SCANNING_PULSE..."; status.style.color = "#00ff41"; runScan(); };
        sensor.onmouseup = () => { active = false; if (charge < 100) { charge = 0; progress.style.width = "0%"; status.innerHTML = "HANDSHAKE_FAILED"; status.style.color = "#ff4444"; } };
    }

    async toggleStasis(active) {
        this.stasisActive = active;
        this.startTime = active ? Date.now() : null;
        await this.saveStasisRecord();
        this.render();
    }

    render() {
        const hours = this.startTime ? Math.floor((Date.now() - this.startTime) / 3600000) : 0;
        const state = this.getBiologicalState(hours);
        const refeed = this.getRefeedManifest(hours);

        this.container.innerHTML = `
            <div class="bioregen-container" style="display: grid; grid-template-columns: 1fr 350px; height: 100%; background: #000; font-family: 'Courier New', monospace; color: #fff; overflow: hidden;">
                
                <div style="padding: 40px; border-right: 1px solid #1a1a1a; overflow-y: auto;">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 30px;">
                        <h1 style="font-family: 'Orbitron'; color: #00ff41; margin:0;">BIO_REGEN // STASIS</h1>
                        <div style="background: ${state.color}; color: #000; padding: 5px 10px; font-weight: bold; font-size: 10px;">${state.stage}</div>
                    </div>

                    <div style="text-align: center; margin: 60px 0;">
                        <div style="font-size: 70px; font-family: 'Orbitron'; text-shadow: 0 0 20px ${state.color};">
                            ${this.stasisActive ? this.formatTime(Date.now() - this.startTime) : '00:00:00'}
                        </div>
                        <div style="color: #444; font-size: 12px; margin-top: 10px; letter-spacing:2px;">ELAPSED_STASIS_TIME</div>
                    </div>

                    <div style="background: #080808; border: 1px solid #222; padding: 20px; margin-bottom: 30px;">
                        <h3 style="font-size: 10px; color: #888; margin-top:0;">CELLULAR_STATUS_REPORT</h3>
                        <p style="font-size: 14px; line-height: 1.6; color: #ccc;">${state.desc}</p>
                    </div>

                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                        <div class="protocol-card refeed-card" style="border-left: 3px solid ${hours > 24 ? '#ff4444' : '#00ff41'};">
                        <div style="display:flex; justify-content:space-between; align-items:center;">
                            <h4 style="color: #00ff41; font-size: 11px; margin:0;">${refeed.title}</h4>
                            <span style="font-size:8px; color:${hours > 24 ? '#ff4444' : '#666'};">${refeed.warning}</span>
                        </div>
                        
                        <div style="margin-top:10px;">
                            ${refeed.steps.map((step, i) => `
                                <div style="font-size: 10px; margin-bottom:5px; color:#aaa; display:flex; gap:8px;">
                                    <span style="color:#444;">0${i+1}</span> <span>${step}</span>
                                </div>
                            `).join('')}
                        </div>
                        
                        ${hours > 24 ? `
                            <div style="margin-top:10px; padding:8px; background:rgba(255,68,68,0.1); font-size:9px; color:#ff4444; border:1px solid rgba(255,68,68,0.2);">
                                CRITICAL: System in sensitive state. Rapid glucose entry will cause VPU_CRASH.
                            </div>
                        ` : ''}
                    </div>
                        <div class="protocol-card">
                            <h4 style="color: #3498db; font-size: 11px;">STASIS_WORKOUT</h4>
                            <p style="font-size: 11px; color: #888;">Zone 2 Mobility. Aid lymphatic drainage. Avoid heavy CNS load.</p>
                        </div>
                    </div>
                </div>

                <div style="background: #050505; padding: 30px; display: flex; flex-direction: column;">
                    <h3 style="font-family: 'Orbitron'; font-size: 12px; color: #00ff41; border-bottom: 1px solid #222; padding-bottom: 10px;">BBI_TRAINING</h3>
                    
                    <div class="side-module">
                        <div class="label">BREATH_INTERFACE</div>
                        <div style="font-size: 11px; color: #666; margin-bottom:10px;">Protocol: BOX_BREATH (4-4-4-4)</div>
                        <div class="breath-visualizer"></div>
                    </div>

                    <div class="side-module" style="flex:1;">
                        <div class="label" id="handshake-status">${this.stasisActive ? 'STASIS_LOCKED' : 'BIO_SENSOR_IDLE'}</div>
                        ${!this.stasisActive ? `
                            <div id="bio-sensor" style="width: 80px; height: 80px; margin: 15px auto; border-radius: 50%; border: 2px solid #333; cursor: pointer; display: flex; align-items: center; justify-content: center; position: relative; overflow: hidden;">
                                <i class="fas fa-fingerprint" style="font-size: 30px; color: #333; z-index: 2;"></i>
                                <div id="scan-progress" style="position: absolute; bottom: 0; width: 0%; height: 100%; background: rgba(0,255,65,0.2); transition: width 0.1s;"></div>
                            </div>
                            <p style="font-size: 9px; color: #555; text-align: center;">HOLD_FINGERPRINT_TO_START</p>
                        ` : `
                            <div style="text-align:center; padding: 20px; border: 1px dashed #00ff41; color: #00ff41; font-size: 10px;">STASIS_IN_PROGRESS</div>
                        `}
                    </div>

                    <div style="margin-top: auto;">
                        ${this.stasisActive ? `
                            <button class="regen-btn" id="abort-btn" style="border: 1px solid #ff4444; color: #ff4444;">ABORT_STASIS</button>
                        ` : ''}
                    </div>
                </div>
            </div>

            <style>
                .protocol-card { background: #050505; border: 1px solid #1a1a1a; padding: 15px; }
                .side-module { margin-bottom: 30px; }
                .side-module .label { font-size: 10px; color: #555; font-weight: bold; margin-bottom: 10px; }
                .regen-btn { width: 100%; padding: 15px; border: none; cursor: pointer; font-family: 'Orbitron'; font-size: 10px; font-weight: bold; background:transparent; }
                .breath-visualizer { height: 4px; background: #00ff41; animation: lungExpansion 16s infinite linear; }
                @keyframes lungExpansion {
                    0%, 25% { width: 0%; opacity: 0.2; }
                    25%, 50% { width: 100%; opacity: 1; }
                    50%, 75% { width: 100%; opacity: 1; }
                    75%, 100% { width: 0%; opacity: 0.2; }
                }
                #bio-sensor:active i { color: #00ff41 !important; }
            </style>
        `;
        if (!this.stasisActive) this.initializeHandshake();
        else this.container.querySelector('#abort-btn').onclick = () => this.toggleStasis(false);
    }

    /**
 * REFEED_PROTOCOL_ENGINE
 * Generates recovery steps based on stasis duration
 */
getRefeedManifest(hours) {
    const protocols = {
        standard: {
            title: "ROUTINE_REFEED",
            steps: ["Hydration + Electrolytes", "Healthy Lipids (Avocado)", "Soft Protein (Eggs)"],
            warning: "None"
        },
        extended: {
            title: "SENSITIVE_REBOOT",
            steps: ["1st: 250ml Bone Broth", "Wait 60 mins", "2nd: Fermented Greens", "Avoid: Complex Carbs"],
            warning: "INSULIN_SENSITIVITY_HIGH"
        },
        critical: {
            title: "STEM_CELL_RECOVERY",
            steps: ["1st: Warm Salted Water", "2nd: Pure Collagen/Broth", "3rd: Small piece of Steamed Fish", "NO_STARCH_FOR_24H"],
            warning: "REFEED_SYNDROME_RISK: CRITICAL"
        }
    };

    if (hours > 48) return protocols.critical;
    if (hours > 24) return protocols.extended;
    return protocols.standard;
}

    formatTime(ms) {
        const h = Math.floor(ms / 3600000).toString().padStart(2, '0');
        const m = Math.floor((ms % 3600000) / 60000).toString().padStart(2, '0');
        const s = Math.floor((ms % 60000) / 1000).toString().padStart(2, '0');
        return `${h}:${m}:${s}`;
    }

    startHeartbeat() {
        setInterval(() => { if (this.stasisActive) this.render(); }, 1000);
    }
}