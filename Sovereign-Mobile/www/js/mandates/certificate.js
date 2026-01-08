const AllotmentEngine = {
    showCertificate() {
        const overlay = document.createElement('div');
        overlay.id = "cert-overlay";
        overlay.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0, 0, 0, 0.85); backdrop-filter: blur(10px);
            display: flex; justify-content: center; align-items: center;
            z-index: 20000; animation: fadeIn 0.5s ease;
        `;

        overlay.innerHTML = `
            <div class="cert-card" style="
                width: 600px; padding: 40px; background: linear-gradient(135deg, #1a1a2e 0%, #0f0f1a 100%);
                border: 2px solid #a445ff; border-radius: 20px; position: relative;
                box-shadow: 0 0 50px rgba(164, 69, 255, 0.3); color: white; text-align: center;
                font-family: 'serif';
            ">
                <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); 
                     font-size: 150px; color: rgba(164, 69, 255, 0.03); pointer-events: none; font-weight: bold;">
                    EPOS
                </div>

                <h1 style="letter-spacing: 5px; color: #a445ff; margin-bottom: 10px;">CERTIFICATE OF ALLOTMENT</h1>
                <p style="font-size: 12px; color: #888; text-transform: uppercase;">Thealcohesion Sovereign Law - Genesis Phase</p>
                
                <hr style="border: 0; border-top: 1px solid #333; margin: 30px 0;">

                <div style="margin: 40px 0;">
                    <p style="font-style: italic; color: #ccc;">This document confirms the initial distribution of sovereignty units to</p>
                    <h2 style="font-size: 28px; margin: 10px 0; color: #fff; letter-spacing: 2px;">VPU INVESTOR & EPOS</h2>
                    <p style="font-style: italic; color: #ccc;">on the inaugural date of</p>
                    <h3 style="color: #d586ff;">December 26th, 2025</h3>
                </div>

                <div style="display: flex; justify-content: space-around; margin-top: 50px;">
                    <div style="text-align: center;">
                        <div style="border-top: 1px solid #555; width: 150px; padding-top: 5px; font-size: 10px; color: #888;">TEMPORAL STEWARD</div>
                    </div>
                    <div style="text-align: center;">
                         <div style="width: 60px; height: 60px; border: 2px solid #a445ff; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: -30px auto 10px;">
                            <span style="font-size: 20px;">★</span>
                         </div>
                         <div style="font-size: 10px; color: #a445ff;">GENESIS SEAL</div>
                    </div>
                    <div style="text-align: center;">
                        <div style="border-top: 1px solid #555; width: 150px; padding-top: 5px; font-size: 10px; color: #888;">VPU PROTOCOL</div>
                    </div>
                </div>
                <button onclick="window.print()" 
                    style="margin-top: 40px; margin-right: 10px; background: #a445ff; border: none; color: white; cursor: pointer; padding: 10px 20px; border-radius: 5px; font-weight: bold; box-shadow: 0 4px 15px rgba(164, 69, 255, 0.3);">
                    Download PDF
                </button>
                <button onclick="document.getElementById('cert-overlay').remove()" 
                    style="margin-top: 40px; background: transparent; border: 1px solid #444; color: #666; cursor: pointer; padding: 10px 20px; border-radius: 5px;">
                    Close Record
                </button>
            </div>
        `;

        document.body.appendChild(overlay);
    }
};