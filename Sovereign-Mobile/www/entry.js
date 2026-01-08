// landing.js

async function startGenesis() {
    const statusDisplay = document.getElementById('status-text'); // Assuming you have a status label
    console.log("Initializing Sovereign Handshake...");
    
    try {
        // Call the bridge we built in preload.js
        const status = await window.vpu.verifyAllotment('EPOS-ALPHA-2025');
        
        if (status.active) {
            // Transition the UI to the OS environment
            document.body.classList.add('os-booting');
            document.body.innerHTML = `
                <div class="boot-container">
                    <h1 class="glow">THEALCOHESION OS</h1>
                    <p class="typewriter">PARTITION: ${status.partition} ACTIVE...</p>
                    <p class="typewriter">INITIALIZING VFS... SUCCESS</p>
                </div>
            `;
        }
    } catch (error) {
        console.error("Handshake Failed:", error);
    }
}

window.addEventListener('DOMContentLoaded', () => {
    let progress = 0;
    const bar = document.getElementById('splash-bar');
    const percent = document.getElementById('splash-percent');
    const logs = document.getElementById('log-content');

    const interval = setInterval(() => {
        progress += Math.random() * 10;
        if (progress >= 100) {
            progress = 100;
            clearInterval(interval);
            // Hide splash and show login gate
            setTimeout(() => {
                document.getElementById('os-splash').style.display = 'none';
                logs.innerText = "Kernel Handshake: 2025-12-26 Partition Confirmed.";
            }, 500);
        }
        bar.style.width = progress + '%';
        percent.innerText = Math.floor(progress) + '%';
    }, 150);
});