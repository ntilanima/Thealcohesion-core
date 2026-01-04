/**
 * boot.js - Refined for exact video motion & reliable transition
 */
export function startBootSequence(onComplete) {
    const splash = document.getElementById('os-splash');
    const bar = document.getElementById('splash-bar');
    const text = document.getElementById('splash-percent');
    const logs = document.getElementById('log-content');
    const loginGate = document.getElementById('login-gate');

    // DEBUG: Check if elements exist. Open Console (F12) to see this.
    console.table({
        "Splash Found": !!splash,
        "Bar Found": !!bar,
        "Text Found": !!text,
        "LoginGate Found": !!loginGate
    });

    if (!bar || !text) {
        console.error("BOOT ERROR: Progress bar elements missing from DOM.");
        if (onComplete) onComplete(); 
        return;
    }

    // 1. Initial Title Animation
    const title = splash?.querySelector('h1');
    if (title) {
        title.style.letterSpacing = "10px";
        setTimeout(() => {
            title.style.transition = "letter-spacing 4s ease-out";
            title.style.letterSpacing = "2px";
        }, 50);
    }

    let progress = 0;
    const bootMessages = [
        "Initializing Thealcohesion framework...",
        "Establishing Secure Enclave...",
        "Verifying EPOS 2025-12-26 Allotment...",
        "Kernel Ignition: v1.2.8 Online",
        "Decryption Keys Ready."
    ];

    let messageIndex = 0;

    const interval = setInterval(() => {
        // Increment progress
        const jump = Math.random() > 0.85 ? 4 : 1.2; 
        progress += jump;
        
        if (progress >= 100) {
            progress = 100;
            clearInterval(interval);
            
            // Completion sequence
            setTimeout(() => {
                splash.style.transition = 'opacity 0.8s ease';
                splash.style.opacity = '0';

                if (loginGate) {
                    loginGate.style.display = 'flex';
                    loginGate.style.opacity = '0'; 
                    loginGate.style.pointerEvents = 'auto';
                }

                setTimeout(() => {
    if (splash) {
        splash.style.display = 'none';
        splash.style.pointerEvents = 'none';
    }
    if (loginGate) loginGate.style.opacity = '1';
    if (typeof onComplete === 'function') onComplete();
}, 800);
            }, 600);
        }

        // --- THE FIX: Force the update ---
        // Using setAttribute ensures we override the inline HTML style
        bar.setAttribute('style', `width: ${progress}%; height: 100%; background: #a445ff; transition: width 0.1s linear;`);
        text.innerText = `${Math.floor(progress)}%`;

        // Logs
        if (progress > (messageIndex + 1) * 18 && messageIndex < bootMessages.length) {
            const line = document.createElement('div');
            line.style.color = "#00ff41";
            line.style.textShadow = "0 0 5px rgba(0, 255, 65, 0.5)";
            line.innerText = `> ${bootMessages[messageIndex]}`;
            if (logs) {
                logs.appendChild(line);
                logs.scrollTop = logs.scrollHeight;
            }
            messageIndex++;
        }
    }, 50);
}