function showProvisioningGuide() {
    const guide = document.createElement('div');
    guide.id = 'provisioning-guide';
    guide.style = `
        position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
        width: 450px; background: rgba(10, 10, 10, 0.95); border: 1px solid #333;
        padding: 40px; color: #eee; font-family: monospace; z-index: 2000;
        box-shadow: 0 50px 100px rgba(0,0,0,0.8); backdrop-filter: blur(10px);
        opacity: 0; transition: opacity 0.8s ease;
    `;

    guide.innerHTML = `
        <h2 style="color: var(--core-glow); letter-spacing: 2px; margin-bottom: 20px;">INGRESS_INSTRUCTIONS</h2>
        <div style="font-size: 12px; line-height: 1.6; color: #888;">
            <p style="margin-bottom: 15px;">The Sovereign OS binary is now local. To link your <span style="color:#fff;">2025-12-26 Allotment</span>, follow the Genesis Protocol:</p>
            
            <ul style="list-style: none; padding: 0;">
                <li style="margin-bottom: 10px;">
                    <span style="color: var(--core-glow);">01.</span> EXECUTE the binary in a sandboxed environment.
                </li>
                <li style="margin-bottom: 10px;">
                    <span style="color: var(--core-glow);">02.</span> PROVISION the Hardware Signature [SIG_2025_12_26] when prompted.
                </li>
                <li style="margin-bottom: 10px;">
                    <span style="color: var(--core-glow);">03.</span> DERIVE your Session Key using your primary investor credential.
                </li>
            </ul>

            <div style="margin-top: 30px; padding: 15px; border-left: 2px solid var(--core-glow); background: rgba(164, 69, 255, 0.05);">
                <span style="color: #fff; font-size: 10px;">CRITICAL:</span> Never share the derived AES-GCM key. The Kernel will shred volatile memory on perimeter breach.
            </div>
        </div>
        <button onclick="this.parentElement.remove()" style="margin-top: 30px; width: 100%; padding: 12px; background: transparent; border: 1px solid #444; color: #fff; cursor: pointer; letter-spacing: 2px;">CLOSE_BRIEFING</button>
    `;

    document.body.appendChild(guide);
    setTimeout(() => guide.style.opacity = '1', 100);
}