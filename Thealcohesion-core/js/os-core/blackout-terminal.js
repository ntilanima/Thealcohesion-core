/**
 * blackout-terminal.js
 * SOVEREIGN_SHADOW_INTERFACE // OS_MODULE_V4 // HIGH_FIDELITY_UI
 */
import { ShadowWeave } from '../modules/shadow-weave.js';
import { CryptoVault } from '../modules/crypto-vault.js';
import { FounderBadge } from '../modules/founder-badge.js';
import { BadgeGenerator } from '../modules/badge-generator.js';
import { ShadowLink } from '../modules/shadow-link.js';

export class BlackoutTerminal {
    constructor(container, userContext) {
        this.container = container;
        this.user = userContext; 
        this.history = [];
        this.isBurnEnabled = true;
        this.isLinking = false;
        this.offerCode = '';
        this.lastGeneratedBadge = null;
    }

    init() {
        this.addLog("CORE_INIT: SUCCESS", "#004400");
        this.addLog("UPLINK_ESTABLISHED: SHADOW_LINK_V4", "#00ff41");
        this.addLog(`ARCHON_KEY: ${this.user.identity || 'NULL_PROXY'}`, "#008800");
        this.addLog("TYPE 'HELP' FOR TACTICAL_COMMANDS", "#d4af37");
        this.render();
    }

    async handleCommand(rawInput) {
        const [cmd, ...args] = rawInput.trim().split(" ");
        const input = cmd.toUpperCase();
        this.addLog(`ARCHON@VPU:~$ ${rawInput}`, "#666");

        switch (input) {
            case 'HELP':
                this.addLog("--- SYSTEM_INSTRUCTIONS ---", "#d4af37");
                this.addLog("STEG [TEXT] - Encrypt into ghost icon", "#00ff41");
                this.addLog("MINT_ALLOTMENT [NAME] [VAL] - Issue Founder Asset", "#00ff41");
                this.addLog("GENERATE [PROMPT] - Synthesis visual", "#00ff41");
                this.addLog("LINK_START - Initialize Handshake", "#ffaa00");
                this.addLog("BEAM - Execute P2P Transfer", "#ffaa00");
                this.addLog("BURN [ON/OFF] - Auto-Purge Protocol", "#ff0000");
                break;

            case 'STEG':
                if (args.length < 1) return this.addLog("ERR: DATA_REQ", "#ff0000");
                const rawData = args.join(" ");
                this.addLog("WEAVING_SHADOW_DATA...", "#ffaa00");
                try {
                    const encrypted = await CryptoVault.encrypt(rawData, this.user.session);
                    const img = new Image();
                    img.crossOrigin = "anonymous";
                    img.src = `https://api.dicebear.com/7.x/identicon/svg?seed=${Math.random()}`;
                    img.onload = () => {
                        const result = ShadowWeave.encode(encrypted, img);
                        this.lastGeneratedBadge = result;
                        this.addLog("STEG_COMPLETE. ASSET_BUFFERED.", "#00ff41");
                        const link = document.createElement('a');
                        link.download = `SOV_DATA_${Date.now()}.png`;
                        link.href = result;
                        link.click();
                    };
                } catch (e) { this.addLog(`STEG_ERR: ${e.message}`, "#ff0000"); }
                break;

            case 'MINT_ALLOTMENT':
                const targetName = args[0] || "PROSPECT";
                const allotmentValue = args[1] || "100MB";
                this.addLog(`MINTING_ASSET: ${targetName}...`, "#d4af37");
                try {
                    const carrierImg = await FounderBadge.getCanvasImage(targetName, "FOUNDER");
                    const secretData = `EPOS_CODE:${allotmentValue}_${Math.random().toString(36).substring(7)}`;
                    const encryptedPayload = await CryptoVault.encrypt(secretData, this.user.session);
                    const finalBadge = ShadowWeave.encode(encryptedPayload, carrierImg);
                    this.lastGeneratedBadge = finalBadge;
                    this.addLog("FOUNDER_ASSET_LOCKED.", "#00ff41");
                    const link = document.createElement('a');
                    link.download = `VPU_${targetName}.png`;
                    link.href = finalBadge;
                    link.click();
                } catch (err) { this.addLog(`MINT_ERR: ${err.message}`, "#ff0000"); }
                break;

            case 'GENERATE':
                const prompt = args.join(" ");
                if(!prompt) return this.addLog("ERR: PROMPT_REQ", "#ff0000");
                this.addLog(`SYNTH_VISUAL: ${prompt}`, "#ffaa00");
                const newCanvas = await BadgeGenerator.generateFromInstructions(prompt);
                const secretGen = `EPOS_PROMPT_ALLOTMENT_${Date.now()}`;
                const encGen = await CryptoVault.encrypt(secretGen, this.user.session);
                this.lastGeneratedBadge = ShadowWeave.encode(encGen, newCanvas);
                this.addLog("SYNTH_COMPLETE. READY_FOR_BEAM.", "#00ff41");
                break;

            case 'LINK_START':
                this.addLog("OPENING_HANDSHAKE_CHANNEL...", "#ffaa00");
                this.isLinking = true;
                this.render();
                this.shadowLink = new ShadowLink(
                    (data) => this.addLog(`SIGNAL_RECV: ${data.length}b`, "#00ff41"),
                    (status) => this.addLog(`P2P_STATUS: ${status}`, "#d4af37")
                );
                this.offerCode = await this.shadowLink.createOffer();
                this.render();
                break;

            case 'BEAM':
                if (!this.lastGeneratedBadge) return this.addLog("ERR: BUFFER_EMPTY", "#ff0000");
                if (!this.shadowLink) return this.addLog("ERR: LINK_NULL", "#ff0000");
                this.shadowLink.send(this.lastGeneratedBadge);
                this.addLog("TRANSMISSION_DISPATCHED.", "#d4af37");
                break;

            case 'BURN':
                this.isBurnEnabled = (args[0] === 'ON');
                this.addLog(`BURN_PROTOCOL: ${this.isBurnEnabled ? 'ACTIVE' : 'IDLE'}`, "#ff0000");
                break;

            case 'CLEAR':
                this.history = [];
                break;

            default:
                this.addLog(`ERR: CMD_UNKNOWN [${input}]`, "#ff0000");
        }
        this.render();
    }

    addLog(text, color) {
        const log = { text, color, id: Math.random(), time: new Date().toLocaleTimeString().split(' ')[0] };
        this.history.push(log);
        if (this.isBurnEnabled) {
            setTimeout(() => {
                this.history = this.history.filter(l => l.id !== log.id);
                this.render();
            }, 30000); 
        }
    }

    render() {
        const handshakeUI = this.isLinking ? `
            <div id="handshake-module" style="background: rgba(0, 10, 0, 0.98); border: 1px solid #00ff41; padding: 15px; margin: 15px 0; font-size: 11px; box-shadow: 0 0 20px #002200;">
                <div style="display:flex; justify-content:space-between; color:#00ff41; margin-bottom:10px; border-bottom: 1px solid #004400; padding-bottom: 5px; font-weight:bold;">
                    <span>[P2P_SIGNAL_MODULATOR]</span>
                    <button id="close-link-ui" style="background:none; border:none; color:#ff0000; cursor:pointer;">[X]</button>
                </div>
                <div style="color: #888; font-size: 9px; margin-bottom:4px;">OFFER_HASH (SEND TO INVESTOR):</div>
                <textarea id="offer-out" readonly style="width:100%; background:#000; color:#00ff41; border:1px solid #004400; height:45px; font-size:9px; resize:none; margin-bottom:8px; padding:5px; outline:none;">${this.offerCode || 'GENERATING_CARRIER...'}</textarea>
                <button id="copy-offer-btn" style="width:100%; background:#004400; color:#00ff41; border:1px solid #00ff41; padding: 6px; cursor:pointer; font-family:inherit; font-size:10px; font-weight:bold;">COPY_OFFER_DATA</button>
                <div style="margin-top:15px; padding-top: 10px; border-top: 1px dashed #004400;">
                    <div style="color: #d4af37; font-size: 9px; margin-bottom:4px;">INCOMING_ANSWER_TOKEN:</div>
                    <input id="answer-in" style="width:100%; background:#000; color:#d4af37; border:1px solid #d4af37; padding:8px; outline:none; font-family:inherit; font-size:10px;">
                    <button id="finalize-btn" style="width:100%; background:#332200; color:#d4af37; border:1px solid #d4af37; margin-top:8px; padding: 8px; cursor:pointer; font-family:inherit; font-weight:bold; font-size:10px;">LATCH_SHADOW_LINK</button>
                </div>
            </div>
        ` : '';

        this.container.innerHTML = `
            <style>
                @keyframes crt-flicker {
                    0% { opacity: 0.985; } 100% { opacity: 1; }
                }
                .blackout-wrapper {
                    position: relative;
                    background: #000;
                    padding: 5px;
                    border-radius: 15px;
                    overflow: hidden;
                    box-shadow: 0 0 40px rgba(0,0,0,1);
                }
                #blackout-ui {
                    background: radial-gradient(circle at center, #0a0d0a 0%, #000 100%) !important;
                    height: 600px;
                    padding: 30px;
                    font-family: 'Courier New', monospace;
                    display: flex;
                    flex-direction: column;
                    border: 2px solid #111;
                    position: relative;
                    overflow: hidden;
                    animation: crt-flicker 0.1s infinite alternate;
                }
                /* CRT Curvature Overlay */
                #blackout-ui::before {
                    content: " ";
                    position: absolute;
                    top: 0; left: 0; bottom: 0; right: 0;
                    background: linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.15) 50%), 
                                linear-gradient(90deg, rgba(255, 0, 0, 0.03), rgba(0, 255, 0, 0.01), rgba(0, 0, 255, 0.03));
                    background-size: 100% 3px, 3px 100%;
                    pointer-events: none;
                    z-index: 100;
                }
                /* Phosphor Glow */
                #blackout-ui::after {
                    content: " ";
                    position: absolute;
                    top: 0; left: 0; bottom: 0; right: 0;
                    box-shadow: inset 0 0 100px rgba(0, 255, 65, 0.05);
                    pointer-events: none;
                    z-index: 101;
                }
                #terminal-output::-webkit-scrollbar { width: 4px; }
                #terminal-output::-webkit-scrollbar-thumb { background: #002200; }
                .log-line { 
                    margin-bottom: 6px; 
                    line-height: 1.3; 
                    text-shadow: 0 0 5px currentColor;
                    font-size: 13px;
                }
                .cursor {
                    display: inline-block;
                    width: 8px;
                    height: 15px;
                    background: #00ff41;
                    margin-left: 5px;
                    animation: blink 1s steps(2) infinite;
                }
                @keyframes blink { 0% { opacity: 0; } }
            </style>

            <div class="blackout-wrapper">
                <div id="blackout-ui">
                    <div style="display:flex; justify-content:space-between; font-size:9px; color:#004400; margin-bottom:15px; border-bottom:1px solid #002200; padding-bottom:5px;">
                        <span>SOVEREIGN_OS_V4.2</span>
                        <span>ENC: AES-256-VPU</span>
                        <span>PWR: 98%</span>
                    </div>
                    
                    <div id="terminal-output" style="flex:1; overflow-y:auto; margin-bottom:15px; position:relative; z-index:20;">
                        ${this.history.map(l => `
                            <div class="log-line" style="color:${l.color}">
                                <span style="opacity: 0.3; font-size: 10px; margin-right:8px;">${l.time}</span>${l.text}
                            </div>
                        `).join('')}
                    </div>

                    ${handshakeUI}

                    <div style="display:flex; color:#00ff41; border-top:1px solid #002200; padding-top:15px; z-index:110; position:relative; align-items:center;">
                        <span style="margin-right:12px; font-weight:bold; letter-spacing:1px; text-shadow: 0 0 10px #00ff41;">UPLINK></span>
                        <input id="terminal-input" autofocus autocomplete="off" style="background:transparent; border:none; color:#00ff41; outline:none; flex:1; font-family:inherit; font-size: 14px; text-shadow: 0 0 5px #00ff41;">
                        <div class="cursor"></div>
                    </div>
                </div>
            </div>
        `;

        this.attachListeners();
    }

    attachListeners() {
        const input = this.container.querySelector('#terminal-input');
        if (input) {
            input.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    this.handleCommand(input.value);
                    input.value = '';
                }
            });
            // Focus lock for immersion
            input.focus();
            document.addEventListener('click', () => input.focus());
        }

        const closeBtn = this.container.querySelector('#close-link-ui');
        if (closeBtn) closeBtn.onclick = () => { this.isLinking = false; this.render(); };

        const copyBtn = this.container.querySelector('#copy-offer-btn');
        if (copyBtn) copyBtn.onclick = () => {
            navigator.clipboard.writeText(this.container.querySelector('#offer-out').value);
            this.addLog("OFFER_HASH_COPIED", "#00ff41");
        };

        const finalizeBtn = this.container.querySelector('#finalize-btn');
        if (finalizeBtn) {
            finalizeBtn.onclick = async () => {
                const answer = this.container.querySelector('#answer-in').value;
                if (!answer) return;
                this.addLog("TUNNELING_PHASE_SHIFT...", "#ffaa00");
                await this.shadowLink.finalizeLink(answer);
                this.isLinking = false;
                this.render();
            };
        }

        const output = this.container.querySelector('#terminal-output');
        if (output) output.scrollTop = output.scrollHeight;
    }
}