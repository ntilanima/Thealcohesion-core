//The Reactivity Script
document.addEventListener('mousemove', (e) => {
    const { clientX, clientY } = e;
    const { innerWidth, innerHeight } = window;

    // Calculate displacement from center (-1 to 1)
    const xPos = (clientX / innerWidth) - 0.5;
    const yPos = (clientY / innerHeight) - 0.5;

    // Apply subtle tilt to the main container
    const core = document.querySelector('.core-focus');
    const intensity = 20; // Max pixels of movement
    
    core.style.transform = `
        translateX(${xPos * intensity}px) 
        translateY(${yPos * intensity}px)
    `;

    // Move the noise/grain in the opposite direction for parallax
    const noise = document.querySelector('.noise');
    noise.style.transform = `
        translateX(${-xPos * (intensity * 2)}px) 
        translateY(${-yPos * (intensity * 2)}px)
    `;
});

//The "Member Only" Verification

function updateLiveFeed() {
    const integrity = document.querySelector('.integrity-check span:first-child');
    const blocks = ["VFS_STABLE", "GENESIS_ALIVE", "SYNC_0x1226", "CORE_LOADED"];
    
    setInterval(() => {
        const randomStatus = blocks[Math.floor(Math.random() * blocks.length)];
        integrity.innerText = `PROTOCOL: ${randomStatus}`;
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