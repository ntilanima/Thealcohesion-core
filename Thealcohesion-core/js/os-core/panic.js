/**
 * Sovereign OS - Level 0 Panic Handler
 * EXECUTION: IMMEDIATE
 */
export function triggerRealPanic(errorCode, details) {
    // 1. Lock down the hardware (Browser)
    document.body.style.cursor = 'none';
    document.body.style.overflow = 'hidden';
    
    // Disable all future keyboard interactions except 'R' for Reboot
    window.addEventListener('keydown', (e) => {
        e.preventDefault();
        if (e.key.toLowerCase() === 'r') window.location.reload();
    }, { capture: true });

    // 2. Wipe the Enclave Memory
    if (window.kernel) {
        window.kernel.sessionKey = null;
        window.kernel.runningApps = new Set();
    }

    // 3. Inject the "Red Screen of Death"
    document.body.innerHTML = `
        <div id="kernel-panic-overlay">
            <div class="panic-content">
                <div class="panic-header">!!! FATAL KERNEL PANIC !!!</div>
                <div class="panic-code">STOP_CODE: ${errorCode}</div>
                <div class="panic-trace">
                    [REGISTER_DUMP]<br>
                    EAX: 0x0020251226 | EBX: 0xFFFFFFFF | CRITICAL_FAILURE<br>
                    STACK_TRACE: ${details}<br>
                    --------------------------------------------------<br>
                    A critical security breach or hardware mismatch has been detected.<br>
                    Sovereign OS has been halted to protect member data assets.
                </div>
                <div class="memory-dump">
                    Dumping physical RAM to disk... <span id="dump-percent">0</span>%
                </div>
                <div class="reboot-msg">PRESS [R] TO REBOOT ENCLAVE</div>
            </div>
            <div class="scanline"></div>
        </div>
    `;

    // 4. Start the Fake Memory Dump (Visual progression)
    let progress = 0;
    const interval = setInterval(() => {
        progress += Math.floor(Math.random() * 7);
        if (progress >= 100) {
            progress = 100;
            clearInterval(interval);
        }
        const el = document.getElementById('dump-percent');
        if (el) el.innerText = progress;
    }, 150);
}