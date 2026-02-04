import { triggerRealPanic } from './Thealcohesion-core/js/os-core/panic.js';
// UI REACTIVITY (Parallax)
document.addEventListener('mousemove', (e) => {
    const xPos = (e.clientX / window.innerWidth) - 0.5;
    const yPos = (e.clientY / window.innerHeight) - 0.5;
    const core = document.querySelector('.core-focus');
    const noise = document.querySelector('.noise');
    const intensity = 20;
    
    if(core) core.style.transform = `translateX(${xPos * intensity}px) translateY(${yPos * intensity}px)`;
    if(noise) noise.style.transform = `translateX(${-xPos * (intensity * 2)}px) translateY(${-yPos * (intensity * 2)}px)`;
});

function updateLiveFeed() {
    const integrity = document.querySelector('.integrity-check span:first-child');
    const blocks = ["VFS_STABLE", "GENESIS_ALIVE", "SYNC_0x1226", "CORE_LOADED"];
    if(!integrity) return;
    setInterval(() => {
        integrity.innerText = `PROTOCOL: ${blocks[Math.floor(Math.random() * blocks.length)]}`;
    }, 4000);
}

updateLiveFeed();

//The Verification Script

document.querySelector('.download-btn').onclick = function(e) {
    e.preventDefault();
    const btn = this;
    const url = this.href;

    // 1. Enter Verification State
    btn.innerHTML = `<span class="text">VERIFYING_HASH...</span>`;
    btn.style.borderColor = "#fff";
    document.body.style.animation = "flash 0.4s ease-out";

    // 2. Mock Security Sequence
    const sequence = [
        { text: "CHECKING_MD5", delay: 800 },
        { text: "SIG_GENESIS_2025_MATCH", delay: 1500 },
        { text: "DECRYPTING_BINARY", delay: 2200 },
        { text: "HANDSHAKE_COMPLETE", delay: 3000 }
    ];

    sequence.forEach((step, index) => {
        setTimeout(() => {
            btn.querySelector('.text').innerText = step.text;
            if(index === sequence.length - 1) {
                // Final Flash and Trigger Download
                document.body.style.background = "#fff";
                setTimeout(() => {
                    document.body.style.background = "#050505";
                    window.location.href = url; //Starts the download
                    // Trigger the guide after a short delay
                     setTimeout(showProvisioningGuide, 1500);
                    btn.innerHTML = `<span class="text">DOWNLOAD_STARTED</span><span class="version">HASH: 0x1226_VPU_ALPHA</span>`;
                }, 100);
            }
        }, step.delay);
    });
};
// SOUND UTILITIES
function playSound(frequency, type, duration, volume) {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, audioCtx.currentTime);
    gainNode.gain.setValueAtTime(volume, audioCtx.currentTime);

    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    oscillator.start();
    setTimeout(() => {
        oscillator.stop();
        audioCtx.close();
    }, duration * 1000);
} 

// PROVISIONING DETECTION UTILITIES

// Detects if the user is on Windows, Mac, or Linux
function detectProvisionManagement() {
    const ua = navigator.userAgent;
    if (ua.indexOf("Win") !== -1) return "Windows";
    if (ua.indexOf("Mac") !== -1) return "macOS";
    if (ua.indexOf("Linux") !== -1) return "Linux";
    return "Unknown_Arch";
}

// Generates a unique SHA-256 hash based on GPU and Hardware specs
async function generateLocalFingerprint() {
    try {
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl');
        const renderer = gl.getParameter(gl.RENDERER);
        
        // Combining hardware specs for entropy
        const entropy = [
            navigator.hardwareConcurrency, // CPU Cores
            renderer,                      // GPU Name
            screen.colorDepth,             // Display Depth
            navigator.deviceMemory         // RAM (approx)
        ].join("||");

        const msgBuffer = new TextEncoder().encode(entropy);
        const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
        return Array.from(new Uint8Array(hashBuffer))
            .map(b => b.toString(16).padStart(2, '0'))
            .join('');
    } catch (e) {
        console.warn("Fingerprint failed, using fallback hash.");
        return "0x_ANONYMOUS_GENESIS_CORE";
    }
}



/* === SOVEREIGN SNIFFER: ORCHESTRATED EXECUTION === */

async function runSovereignSniffer(btn) {
    // 1. Initial UI Transition
    btn.innerHTML = `<span class="text">ACCESSING_VPU_KERNEL...</span>`;
    await new Promise(r => setTimeout(r, 800));
    
    btn.innerHTML = `<span class="text">ISOLATING_HARDWARE_SIG...</span>`;
    await new Promise(r => setTimeout(r, 800));

    // 2. Inject High-End HUD
    const overlay = document.createElement('div');
    overlay.id = 'sniffer-overlay';
    overlay.innerHTML = `
        <div class="hud-noise"></div>
        <div class="scanner-bar"></div>
        <div class="sniffer-hud">
            <div class="status-title">SOVEREIGN_SNIFFER</div>
            <div class="sniffer-log" id="sniffer-log"></div>
        </div>
    `;
    document.body.appendChild(overlay);

    const log = document.getElementById('sniffer-log');
    const addLog = async (msg, type = '', delay = 600) => {
        const div = document.createElement('div');
        div.className = type;
        div.innerText = `[${new Date().toLocaleTimeString().split(' ')[0]}] ${msg}`;
        log.appendChild(div);
        log.scrollTop = log.scrollHeight;
        await new Promise(r => setTimeout(r, delay)); 
    };

    try {
        // Step 1: Local Forensic Layer
        await addLog("INITIALIZING_FORENSIC_BUFFER...", "", 1000);
        const hwFingerprint = await generateLocalFingerprint(); 
        const currentPlatform = detectProvisionManagement().toLowerCase(); 

        await addLog(`MACHINE_ID: ${hwFingerprint.substring(0, 24)}...`, "success", 800);
        await addLog(`LOCAL_ARCH: ${currentPlatform.toUpperCase()}`, "success", 800);

        // Step 2: Network Handshake
        await addLog("UPLINKING_TO_VPU_BRIDGE...", "", 1200);
        const response = await fetch('http://localhost:3000/api/spacs/sniffer', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ hw_id: hwFingerprint, arch: currentPlatform })
        });
        
        const status = await response.json();
        const boundPlatform = status.provision_management ? status.provision_management.toLowerCase() : null;

        await addLog("HANDSHAKE_ESTABLISHED. ANALYZING_IDENTITY_STATE...", "success", 1000);

        // Step 3: Granular Decision Logic

        // 1. CRITICAL FAILURES (REVOKED / BLACKLISTED)
        if (['REVOKED', 'BLACKLISTED'].includes(status.provision_stage)) {
            // Visual red-out
            const reticle = document.getElementById('reticle');
            if(reticle) reticle.style.borderColor = "#ff0000";
            document.body.style.boxShadow = "inset 0 0 100px #ff0000";
            
            // Audible alarm
            playSound(60, 'sawtooth', 2.0, 0.4); 

            await addLog(`!! SECURITY_ALERT: ${status.provision_stage} !!`, "critical", 1500);
            await addLog("SYSTEM_LOCK: SEIZING_VPU_RESOURCES...", "critical", 1000);
            
            setTimeout(() => {
                triggerRealPanic(
                    `0x_SOV_${status.provision_stage}`, 
                    `HW_HASH: ${hwFingerprint.substring(0, 16)} | ARCH: ${currentPlatform}`
                );
            }, 1000);
            return;
        }

        // 2. REGISTRATION STATE CHECK
        if (status.registration_state === 'incompleteRegistration') {
            await addLog("IDENTITY_FOUND: REGISTRATION_INCOMPLETE", "warning", 1200);
            await addLog("REDIRECTING TO BIO-SYNC TERMINAL...", "warning", 800);
            setTimeout(() => window.location.href = './Thealcohesion-core/index.html', 1500);
            return;
        }

        // 3. ACCESS GRANTED (PROVISIONED) + ARCH_LOCKED CHECK
        if (status.provision_stage === 'PROVISIONED') {
            // Check if the current detected 'arch' matches the DB's bound 'os_signature'
            if (status.provision_management && status.provision_management !== arch) {
                await addLog("SECURITY_BREACH: ARCHITECTURE_MISMATCH", "critical", 1500);
                await addLog(`IDENTITY_LOCKED TO: ${status.provision_management}`, "critical", 1500);
                await addLog("ACCESS_DENIED: ARCHITECTURE_DUPLICATION_DETECTED.", "critical", 2000);
                
                btn.innerHTML = `<span class="text">ARCH_LOCKED</span>`;
                btn.classList.add('btn-error'); // Optional: style this in CSS for a red glow
                return; // HALT: Do not redirect
            }

            // If match is successful
            await addLog("HARDWARE_MATCH: IDENTITY_VERIFIED.", "success", 1200);
            await addLog("BYPASSING INGRESS...", "success", 800);
            setTimeout(() => window.location.href = './Thealcohesion-core/index.html', 1000);
            return;
        }


        // 4. ARCHITECTURE LOCK (DUPLICATION PREVENTION)
        if (boundPlatform && boundPlatform.includes(currentPlatform) && status.provision_stage !== 'PROVISIONED') {
            await addLog("!! SOVEREIGN_ERROR: ARCH_DUPLICATION !!", "critical", 1500);
            await addLog(`IDENTITY ALREADY BOUND TO ${boundPlatform.toUpperCase()}.`, "critical", 2000);
            
            overlay.remove();
            btn.innerHTML = `<span class="text">ACCESS_DENIED: ARCH_LOCKED</span>`;
            setTimeout(() => {
                btn.innerHTML = `<span class="text">INITIALIZE_DOWNLOAD</span>`;
                btn.style.pointerEvents = "auto";
            }, 3000);
            return;
        }

        // 5. WAITING FOR LOGIN (KNOWN HARDWARE BUT NO ACTIVE SESSION)
        if (status.provision_stage === 'WAITING_LOGIN') {
            await addLog("HARDWARE_MATCH: IDENTITY_CHALLENGE_REQUIRED", "success", 1200);
            await addLog("OPENING SECURE_UPLINK_TERMINAL...", "success", 800);
            
            // If you have a function to show a login modal, call it here
            if (typeof showLoginInterface === "function") {
                showLoginInterface();
            } else {
                // Fallback: Redirect to a login page if no modal exists
                window.location.href = './Thealcohesion-core/index.html';
            }
            return;
        }

        // 6. INITIAL (NEW HARDWARE / NOT PROVISIONED)
        if (status.provision_stage === 'INITIAL' || status.provision_stage === 'UNPROVISIONED') {
            await addLog("STATE: INITIAL_PROVISION_REQUIRED.", "success", 1200);
            await addLog("ADMITTING_TO_TERMINAL...", "success", 800);
            setTimeout(() => window.location.href = './download.html', 1000);
        }

    } catch (err) {
        console.error("SNIFFER_CRITICAL_ERROR:", err);
        await addLog("UPLINK_FAILURE: BRIDGE_OFFLINE", "critical", 2000);
        overlay.remove();
        btn.innerHTML = `<span class="text">BRIDGE_OFFLINE</span>`;
        btn.style.pointerEvents = "auto";
    }
}
// 5. BINDING (SINGLE HANDLER)
document.querySelector('.download-btn').onclick = function(e) {
    e.preventDefault();
    this.style.pointerEvents = "none"; // Lock button during sequence
    runSovereignSniffer(this);
};