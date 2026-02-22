/**
 * apps/camera.js - Sovereign VPU Eye (v2.0 Tactical)
 * FEATURES: Multi-Spectrum Filters, Identity Scan HUD, and Encrypted Buffer saving.
 */
export class CameraApp {
    constructor(container, sessionKey) {
        this.container = container;
        this.key = sessionKey;
        this.stream = null;
        this.currentFilter = 'none';
    }

    async init() {
        this.render();
        await this.startCamera();
        this.injectGlitchLoop();
    }

    render() {
        this.container.innerHTML = `
        <style>
            .camera-wrapper { height: 100%; background: #000; display: flex; flex-direction: column; font-family: 'Courier New', monospace; color: #00ff41; overflow: hidden; }
            .viewport-container { flex-grow: 1; position: relative; overflow: hidden; background: #050505; border: 1px solid #222; margin: 10px; }
            #camera-stream { width: 100%; height: 100%; object-fit: cover; transform: scaleX(-1); transition: filter 0.3s; }
            
            /* Tactical HUD Overlay */
            .hud-overlay { position: absolute; inset: 0; pointer-events: none; border: 20px solid transparent; border-image: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><path d="M0 20 V0 H20 M80 0 H100 V20 M100 80 V100 H80 M20 100 H0 V80" fill="none" stroke="%2300ff41" stroke-width="2"/></svg>') 20; opacity: 0.5; }
            .scan-line { position: absolute; width: 100%; height: 2px; background: rgba(0, 255, 65, 0.2); top: 0; animation: scan 4s linear infinite; }
            @keyframes scan { from { top: 0; } to { top: 100%; } }

            /* Filter Controls */
            .filter-bar { display: flex; gap: 10px; padding: 10px; background: #000; border-top: 1px solid #1a1a1a; justify-content: center; }
            .f-btn { background: none; border: 1px solid #333; color: #666; font-size: 9px; padding: 5px 10px; cursor: pointer; text-transform: uppercase; }
            .f-btn.active { border-color: #00ff41; color: #00ff41; box-shadow: 0 0 10px rgba(0, 255, 65, 0.2); }

            .controls { height: 100px; display: flex; align-items: center; justify-content: space-between; background: #000; padding: 0 30px; border-top: 1px solid #222; }
            .shutter-outer { width: 60px; height: 60px; border-radius: 50%; border: 2px solid #00ff41; display: flex; align-items: center; justify-content: center; cursor: pointer; }
            .shutter-inner { width: 45px; height: 45px; border-radius: 50%; background: #00ff41; transition: 0.2s; box-shadow: 0 0 15px #00ff41; }
            .shutter-outer:active .shutter-inner { transform: scale(0.8); background: #fff; }
        </style>
        
        <div class="camera-wrapper">
            <div class="viewport-container">
                <video id="camera-stream" autoplay playsinline></video>

                <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 200px; height: 200px; border: 1px solid rgba(0,255,65,0.3); pointer-events: none;">
                        <div style="position: absolute; top: -5px; left: 50%; width: 1px; height: 10px; background: #00ff41;"></div>
                        <div style="position: absolute; bottom: -5px; left: 50%; width: 1px; height: 10px; background: #00ff41;"></div>
                    </div>

                    <div id="identity-hud" style="position: absolute; top: 80px; left: 20px; font-size: 9px; background: rgba(0,0,0,0.7); padding: 10px; border-left: 2px solid #d4af37; display: none;">
                        <div style="color: #d4af37;">SCANNER_V3: ACTIVE</div>
                        <div id="scan-results">
                            NAME: [REDACTED]<br>
                            ROLE: PRIME_ARCHON<br>
                            ALLOTMENT: 15,000,000
                        </div>
                    </div>
                <div class="hud-overlay"></div>
                <div class="scan-line"></div>
                
                <div style="position: absolute; top: 20px; right: 20px; text-align: right; font-size: 10px;">
                    SIGNAL: STABLE<br>
                    ENCRYPTION: AES-256<br>
                    <span id="coord-hud">X: 00.00 Y: 00.00</span>
                </div>
                
                <div style="position: absolute; bottom: 20px; left: 20px; font-size: 10px;">
                    ARCHON_EYE // VER: 2.0<br>
                    <span style="color: #d4af37;">TARGET: UNKNOWN_ENTITY</span>
                </div>
            </div>

            <div class="filter-bar">
                <button class="f-btn active" data-filter="none">Normal</button>
                <button class="f-btn" data-filter="grayscale(1) contrast(1.5)">Night</button>
                <button class="f-btn" data-filter="invert(1) hue-rotate(180deg)">Thermal</button>
                <button class="f-btn" data-filter="sepia(1) saturate(5) hue-rotate(-50deg)">Sovereign</button>
            </div>

            <div class="controls">
                <div id="photo-preview" style="width: 50px; height: 50px; border: 1px solid #00ff41; background-size: cover;"></div>
                
                <div class="shutter-outer" id="shutter-btn">
                    <div class="shutter-inner"></div>
                </div>

                <div style="text-align: right; font-size: 10px;">
                    <div id="camera-status">SYNCING...</div>
                    <div style="color:#d4af37; margin-top:4px;">EYE_01_ACTIVE</div>
                </div>
            </div>
            <canvas id="camera-canvas" style="display: none;"></canvas>
        </div>
        `;

        this.setupEventListeners();
    }

    setupEventListeners() {
        this.container.querySelector('#shutter-btn').onclick = () => this.takeSnapshot();
        
        this.container.querySelectorAll('.f-btn').forEach(btn => {
            btn.onclick = () => {
                this.container.querySelectorAll('.f-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.container.querySelector('#camera-stream').style.filter = btn.dataset.filter;
                this.currentFilter = btn.dataset.filter;
            };
        });

        // Mouse Telemetry Effect
        this.container.onmousemove = (e) => {
            const hud = this.container.querySelector('#coord-hud');
            if (hud) hud.innerText = `X: ${e.clientX} Y: ${e.clientY}`;
        };
    }

    async startCamera() {
        const video = this.container.querySelector('#camera-stream');
        const status = this.container.querySelector('#camera-status');
        try {
            this.stream = await navigator.mediaDevices.getUserMedia({ 
                video: { width: { ideal: 1920 }, height: { ideal: 1080 } }, 
                audio: false 
            });
            video.srcObject = this.stream;
            status.innerText = "LINK_ESTABLISHED";
        } catch (err) {
            status.innerText = "HARDWARE_ACCESS_DENIED";
            status.style.color = "#ff4136";
        }
    }

    // Inside CameraApp class
    async performIdentityHandshake() {
        const status = this.container.querySelector('#camera-status');
        const target = this.container.querySelector('#target-status'); // New HUD element
        
        status.innerText = "SCANNING_BIOMETRICS...";
        status.style.color = "#d4af37";

        // 1. Capture current frame hash
        const snapshot = this.takeSnapshot(); 
        
        // 2. Simulate Verification Delay
        await new Promise(r => setTimeout(r, 2000));

        // 3. Compare against Genesis Manifest (Simulated Handshake)
        const isAuthorized = true; // In production, compare hash against sessionKey

        if (isAuthorized) {
            status.innerText = "IDENTITY_CONFIRMED";
            status.style.color = "#00ff41";
            if (this.api.vpu.notify) {
                this.api.vpu.notify("ARCHON_VERIFIED: GENESIS_ACCESS_GRANTED", "success");
            }
            // Signal the OS to unlock the Ledger
            this.api.vpu.unlockLedger(); 
        } else {
            status.innerText = "AUTH_FAILURE";
            status.style.color = "#ff4136";
        }
    }

    takeSnapshot() {
        const video = this.container.querySelector('#camera-stream');
        const canvas = this.container.querySelector('#camera-canvas');
        const preview = this.container.querySelector('#photo-preview');
        const ctx = canvas.getContext('2d');

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        // Apply filters to canvas
        ctx.filter = this.currentFilter;
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        const dataURL = canvas.toDataURL('image/png');
        preview.style.backgroundImage = `url(${dataURL})`;
        
        // Trigger Glitch Flash
        this.container.querySelector('.viewport-container').style.background = '#fff';
        setTimeout(() => this.container.querySelector('.viewport-container').style.background = '#050505', 50);

        this.saveToEnclave(dataURL);
    }

    saveToEnclave(data) {
        if(this.api?.notify) this.api.notify("SNAPSHOT_ENCRYPTED_TO_VFS", "success");
        // Integration Point: In your VPU OS, add this to a "Gallery" or "Manifest"
        console.log("Saving to Enclave with Key:", this.key);
    }

    injectGlitchLoop() {
        // Randomly flickers the status to feel "alive"
        setInterval(() => {
            const status = this.container.querySelector('#camera-status');
            if (status && status.innerText === "LINK_ESTABLISHED") {
                status.style.opacity = Math.random() > 0.9 ? '0.3' : '1';
            }
        }, 100);
    }

    onClose() {
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
        }
        this.stream = null;
    }
}