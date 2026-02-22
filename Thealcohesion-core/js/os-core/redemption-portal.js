/**
 * redemption-portal.js
 * SOVEREIGN_ASSET_RECOVERY // VPU_REDEMPTION_MODULE_V5
 * PURPOSE: Decodes Shadow Badges to unlock EPOS Allotments.
 */
import { ShadowWeave } from '../modules/shadow-weave.js';
import { CryptoVault } from '../modules/crypto-vault.js';
import { ShadowLink } from '../modules/shadow-link.js';

export class RedemptionPortal {
    constructor(container, userContext) {
        this.container = container;
        this.user = userContext; 
        this.transferBuffer = ""; 
        this.status = "AWAITING_BADGE";
    }

    render() {
        const mainUI = `
            <style>
                .sovereign-redemption {
                    background: #020202;
                    color: #d4af37;
                    border: 1px solid #332200;
                    padding: 30px;
                    font-family: 'Courier New', monospace;
                    position: relative;
                    overflow: hidden;
                    box-shadow: 0 0 50px rgba(0,0,0,1), inset 0 0 100px rgba(212, 175, 55, 0.05);
                    max-width: 500px;
                    margin: auto;
                }

                /* CRT Scanline & Static Overlay */
                .sovereign-redemption::before {
                    content: " ";
                    position: absolute;
                    top: 0; left: 0; width: 100%; height: 100%;
                    background: linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.2) 50%),
                                linear-gradient(90deg, rgba(255, 0, 0, 0.03), rgba(0, 255, 0, 0.01), rgba(0, 0, 255, 0.03));
                    background-size: 100% 3px, 3px 100%;
                    pointer-events: none;
                    z-index: 10;
                }

                .portal-header {
                    border-bottom: 1px solid #d4af37;
                    padding-bottom: 15px;
                    margin-bottom: 25px;
                    text-align: center;
                }

                .glitch-text {
                    font-size: 1.2rem;
                    font-weight: bold;
                    letter-spacing: 5px;
                    text-shadow: 0 0 10px #d4af37;
                    animation: text-glitch 4s infinite;
                }

                @keyframes text-glitch {
                    0% { transform: skew(0deg); }
                    1% { transform: skew(10deg); color: #ff0000; }
                    2% { transform: skew(-10deg); color: #00ff41; }
                    3% { transform: skew(0deg); color: #d4af37; }
                }

                #redemption-zone {
                    border: 1px double #d4af37;
                    height: 180px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: rgba(10, 8, 0, 0.6);
                    cursor: crosshair;
                    transition: 0.3s;
                    position: relative;
                }

                #redemption-zone.drag-over {
                    background: rgba(212, 175, 55, 0.15);
                    box-shadow: inset 0 0 30px #d4af37;
                }

                .zone-label {
                    font-size: 10px;
                    color: #555;
                    text-transform: uppercase;
                }

                .vpu-btn-primary {
                    width: 100%;
                    background: #d4af37;
                    color: #000;
                    border: none;
                    padding: 12px;
                    font-family: inherit;
                    font-weight: bold;
                    margin-top: 15px;
                    cursor: pointer;
                    transition: 0.2s;
                    clip-path: polygon(5% 0%, 100% 0%, 95% 100%, 0% 100%);
                }

                .vpu-btn-primary:hover {
                    filter: brightness(1.2);
                    box-shadow: 0 0 20px rgba(212, 175, 55, 0.5);
                }

                #status-display {
                    font-size: 11px;
                    height: 20px;
                    margin-top: 10px;
                    text-align: center;
                    color: #00ff41;
                }

                /* Data Output Area */
                #allotment-result {
                    margin-top: 25px;
                    padding: 15px;
                    border: 1px solid #00ff41;
                    background: rgba(0, 255, 65, 0.05);
                    display: none;
                }

                .result-val {
                    color: #00ff41;
                    font-size: 18px;
                    word-break: break-all;
                    text-shadow: 0 0 8px #00ff41;
                }
            </style>

            <div class="sovereign-redemption">
                <div class="portal-header">
                    <div class="glitch-text">BIRTHRIGHT_RECOVERY</div>
                    <div style="font-size: 9px; color: #888; margin-top: 5px;">VPU_SOVEREIGN_NODE // SECURE_EXTRACTION</div>
                </div>
                
                <div id="redemption-zone">
                    <div class="zone-label">DROP_SHADOW_ASSET_HERE</div>
                </div>

                <input type="file" id="badge-upload" style="display:none;" accept="image/png">
                <button class="vpu-btn-primary" onclick="document.getElementById('badge-upload').click()">
                    LOCAL_SCAN_INITIALIZE
                </button>

                <div id="status-display">SYS_IDLE</div>

                <div id="allotment-result">
                    <div style="font-size: 9px; margin-bottom: 5px; color: #00ff41;">DECODED_DATA_STREAM:</div>
                    <div id="result-text" class="result-val"></div>
                </div>
                
                <div id="p2p-anchor"></div> 
            </div>
        `;

        const investorSyncUI = `
            <div id="sync-module" style="margin-top:30px; border-top: 1px solid #332200; padding-top:20px;">
                <div style="font-size:10px; color:#555; margin-bottom:10px;">DIRECT_BEAM_RECEPTION_MODULE</div>
                <input id="offer-in" placeholder="PASTE_ARCHON_HANDSHAKE" style="width:100%; background:#000; border:1px solid #332200; color:#d4af37; padding:10px; font-size:10px; outline:none; font-family:inherit;">
                <button id="generate-answer-btn" style="width:100%; background:transparent; border: 1px solid #d4af37; color: #d4af37; padding:10px; margin-top:10px; cursor:pointer; font-family:inherit; font-size: 11px;">GENERATE_RESPONSE_SIGNAL</button>
                
                <div id="answer-section" style="display:none; margin-top:15px; background: #050505; padding: 10px; border: 1px dashed #d4af37;">
                    <div style="font-size:9px; margin-bottom:5px;">RESPONSE_SIGNAL_ENCODED:</div>
                    <textarea id="answer-out" readonly style="width:100%; background:#000; color:#00ff41; border:none; height:50px; font-size:10px; resize:none; font-family:inherit; outline:none;"></textarea>
                    <button id="copy-answer-btn" style="width:100%; background:#d4af37; color:#000; border:none; margin-top:10px; padding:8px; cursor:pointer; font-family:inherit; font-weight:bold; font-size:10px;">COPY_TO_CLIPBOARD</button>
                </div>
            </div>
        `;

        this.container.innerHTML = mainUI;
        this.container.querySelector('#p2p-anchor').innerHTML = investorSyncUI;

        this.attachEvents();
    }

    handleFileFromP2P(chunk) {
        if (chunk === "START_TRANSMISSION") {
            this.transferBuffer = "";
            this.updateStatus("INCOMING_BEAM_DETECTED", "#ffaa00");
        } else if (chunk === "END_TRANSMISSION") {
            this.updateStatus("BEAM_LOCKED. RECONSTRUCTING...", "#00ff41");
            const img = new Image();
            img.src = this.transferBuffer;
            img.onload = () => this.handleFile(img); 
        } else {
            this.transferBuffer += chunk;
            // Provide a tiny visual pulse for every chunk
            this.updateStatus(`RECEIVING_DATA: ${this.transferBuffer.length} BYTES`, "#d4af37");
        }
    }

    attachEvents() {
        const uploader = this.container.querySelector('#badge-upload');
        uploader.onchange = (e) => this.handleFile(e.target.files[0]);

        const zone = this.container.querySelector('#redemption-zone');
        zone.ondragover = (e) => { e.preventDefault(); zone.classList.add('drag-over'); };
        zone.ondragleave = () => zone.classList.remove('drag-over');
        zone.ondrop = (e) => {
            e.preventDefault();
            zone.classList.remove('drag-over');
            this.handleFile(e.dataTransfer.files[0]);
        };

        const copyBtn = this.container.querySelector('#copy-answer-btn');
        if(copyBtn) {
            copyBtn.onclick = () => {
                const txt = this.container.querySelector('#answer-out');
                navigator.clipboard.writeText(txt.value);
                this.updateStatus("SIGNAL_COPIED", "#00ff41");
            };
        }

        const genAnswerBtn = this.container.querySelector('#generate-answer-btn');
        if(genAnswerBtn) {
            genAnswerBtn.onclick = async () => {
                const offer = this.container.querySelector('#offer-in').value;
                if(!offer) return this.updateStatus("ERROR: SIGNAL_NULL", "#ff0000");
                
                this.updateStatus("GENERATING_RECON_SIGNAL...", "#d4af37");
                const answer = await this.handleP2PSync(offer); 
                
                this.container.querySelector('#answer-out').value = answer;
                this.container.querySelector('#answer-section').style.display = 'block';
            };
        }
    }

    async handleFile(fileOrImg) {
        this.updateStatus("COGNITIVE_RECONSTRUCTION...", "#d4af37");

        const processImage = async (img) => {
            const hexData = ShadowWeave.decode(img);
            if (!hexData) return this.updateStatus("ERROR: SHADOW_VOID", "#ff0000");

            this.updateStatus("BREAKING_SOVEREIGN_CIPHER...", "#d4af37");
            const allotment = await CryptoVault.decrypt(hexData, this.user.session);

            if (allotment) {
                this.completeRedemption(allotment);
            } else {
                this.updateStatus("ERROR: KEY_MISMATCH", "#ff0000");
            }
        };

        if (fileOrImg instanceof HTMLImageElement) {
            processImage(fileOrImg);
        } else {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.src = e.target.result;
                img.onload = () => processImage(img);
            };
            reader.readAsDataURL(fileOrImg);
        }
    }

    updateStatus(text, color) {
        const msg = this.container.querySelector('#status-display');
        if(msg) {
            msg.innerText = text.toUpperCase();
            msg.style.color = color;
        }
    }

    async completeRedemption(code) {
        this.updateStatus("EXTRACTION_SUCCESS", "#00ff41");
        const resultDiv = this.container.querySelector('#allotment-result');
        const resultText = this.container.querySelector('#result-text');
        
        resultDiv.style.display = "block";
        resultText.innerText = code;
        
        // Add a glitch sound/vibration effect here if desired
        console.log("UPLINK_SUCCESS:", code);
    }

    async handleP2PSync(offerCode) {
        this.shadowLink = new ShadowLink(
            (data) => this.handleFileFromP2P(data),
            (status) => this.updateStatus(`LINK_STATUS: ${status}`, "#00ff41")
        );
        return await this.shadowLink.acceptOffer(offerCode);
    }
}