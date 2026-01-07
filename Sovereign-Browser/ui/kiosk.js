const h1Text = "Welcome to Thealcohesion Space Native Kiosk";
const pText = "The Secured Decoupled Enclave Architecture";

let osReady = false;
const iframe = document.getElementById('os-frame');
const enterBtn = document.getElementById('enter-btn');
const errorMsg = document.getElementById('error-msg');
const syncText = document.getElementById('sync-text');
const nodeStatus = document.getElementById('node-status');

// Audio Assets
const typeSound = new Audio('keypress.mp3');
typeSound.volume = 0.2;
const powerSound = new Audio('power-up.mp3');
powerSound.volume = 0.4;

// 1. Smooth Typewriter with Progress Bar Integration
function updateProgressBar(percent) {
    const bar = document.getElementById('sync-progress');
    if (bar) bar.style.width = percent + "%";
}

function typewriter(elementId, text, speed, callback) {
    let i = 0;
    const element = document.getElementById(elementId);
    if(!element) return;
    element.innerHTML = ""; 

    function type() {
        if (i < text.length) {
            element.innerHTML += text.charAt(i);
            typeSound.currentTime = 0;
            typeSound.play().catch(() => {});
            i++;
            if (elementId === "typewriter-h1") updateProgressBar((i / text.length) * 45);
            if (elementId === "typewriter-p") updateProgressBar(45 + (i / text.length) * 45);
            setTimeout(type, speed);
        } else if (callback) {
            setTimeout(callback, 400); 
        }
    }
    type();
}

// 2. Real Hardware Manifest Logic
async function getSystemManifest() {
    const memory = navigator.deviceMemory || "UNK";
    const cores = navigator.hardwareConcurrency || "UNK";
    const res = `${window.screen.width}x${window.screen.height}`;
    const platform = navigator.platform;
    
    let batteryLevel = "AC_POWERED";
    try {
        if (navigator.getBattery) {
            const battery = await navigator.getBattery();
            batteryLevel = `${Math.round(battery.level * 100)}%`;
        }
    } catch (e) { batteryLevel = "STABLE"; }

    return [
        `CPU_CORES: ${cores}`,
        `SYS_MEMORY: ${memory}GB`,
        `DISP_RES: ${res}`,
        `POWER_CELL: ${batteryLevel}`,
        `OS_KERNEL: ${platform}`,
        `ENCLAVE_STATE: SECURED`
    ];
}

// 3. System Status & Readiness
function checkSystemStatus() {
    if (!navigator.onLine) {
        nodeStatus.innerText = "OFFLINE";
        nodeStatus.style.color = "#ff4b4b";
        errorMsg.style.display = "block";
        errorMsg.innerHTML = `[!] CONNECTION INTERRUPTED: Please verify your uplink.`;
        enterBtn.classList.add('hidden-element');
        return false;
    }

    if (!osReady) {
        nodeStatus.innerText = "SYNCING";
        errorMsg.style.display = "block";
        errorMsg.innerHTML = `[i] Kiosk not ready: Binding Sovereign Kernel...`;
        setTimeout(checkSystemStatus, 1000);
        return false;
    }

    nodeStatus.innerText = "ENCLAVE_ACTIVE";
    nodeStatus.style.color = "var(--primary-purple)";
    errorMsg.style.display = "none";
    syncText.innerText = "SYNCHRONIZATION COMPLETE";
    updateProgressBar(100);
    
    enterBtn.classList.remove('hidden-element');
    enterBtn.style.display = "inline-block";
}

// 4. Main Access Navigation
enterBtn.addEventListener('click', async (e) => {
    e.preventDefault();

    const specs = await getSystemManifest();
    const nativeID = localStorage.getItem('spaceNativeID') || "NATIVE-GENESIS";
    const lastLogin = localStorage.getItem('lastEnclaveLogin') || "INITIAL_INITIALIZATION";
    const now = new Date();
    const currentTimeStr = `${now.toLocaleDateString()} // ${now.toLocaleTimeString()}`;

    const orbs = document.querySelectorAll('.ambient-orb');
    const container = document.querySelector('.kiosk-container');
    const welcome = document.getElementById('welcome-overlay');
    const manifest = document.getElementById('system-manifest');
    const percentEl = document.getElementById('scan-percentage');
    const statusEl = document.getElementById('scan-status');

    // Initial Setup
    document.getElementById('native-display-id').innerText = nativeID;
    document.getElementById('last-login-display').innerText = `LAST_ACCESS: ${lastLogin}`;
    manifest.innerHTML = ""; 

    // Trigger Visual Surge
    orbs.forEach(orb => orb.classList.add('orb-active'));
    container.classList.add('kiosk-fade-out');
    if (powerSound) powerSound.play().catch(() => {});

    // Reveal Overlay
    welcome.style.display = 'flex'; 
    
    setTimeout(() => {
        welcome.classList.add('welcome-active'); 
        localStorage.setItem('lastEnclaveLogin', currentTimeStr);
        
        // 5. Percentage Counter (0 to 100 over ~3.5 seconds)
        let count = 0;
        const counterInterval = setInterval(() => {
            count += Math.floor(Math.random() * 3) + 1; 
            if (count >= 100) {
                count = 100;
                clearInterval(counterInterval);
                statusEl.innerText = "IDENTITY RECOGNIZED";
                statusEl.style.color = "#00ff41";
                statusEl.style.textShadow = "0 0 10px #00ff41";
            }
            if(percentEl) percentEl.innerText = count.toString().padStart(2, '0');
        }, 35);

        // 6. Print real-time system manifest
        specs.forEach((spec, index) => {
            setTimeout(() => {
                const line = document.createElement('div');
                line.className = 'manifest-line';
                line.innerText = `> ${spec}`;
                manifest.appendChild(line);
                typeSound.currentTime = 0;
                typeSound.play().catch(() => {});
            }, index * 300); 
        });
    }, 50); 

    // 7. Navigation (Dwell for 6 seconds total)
    setTimeout(() => {
        welcome.style.opacity = '0';
        setTimeout(() => {
            window.location.href = "os-index.html"; 
        }, 1000);
    }, 6000); 
}); 

// 8. Iframe Logic
iframe.onload = () => { 
    osReady = true; 
    console.log("Sovereign OS Loaded.");
};

// 9. Ambient Mouse Tracking
document.addEventListener('mousemove', (e) => {
    const orb1 = document.querySelector('.orb-1');
    const orb2 = document.querySelector('.orb-2');
    if(!orb1 || !orb2) return;
    const moveX = (e.clientX - window.innerWidth / 2) / 25;
    const moveY = (e.clientY - window.innerHeight / 2) / 25;
    orb1.style.transform = `translate(${moveX}px, ${moveY}px)`;
    orb2.style.transform = `translate(${-moveX * 1.5}px, ${-moveY * 1.5}px)`;
});

// 10. Initialization
window.onload = () => {
    typewriter("typewriter-h1", h1Text, 40, () => {
        typewriter("typewriter-p", pText, 25, () => {
            checkSystemStatus();
        });
    });
};

window.addEventListener('offline', checkSystemStatus);
window.addEventListener('online', checkSystemStatus);