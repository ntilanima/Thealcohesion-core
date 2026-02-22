/**
 * shadow-chat.js
 * SOVEREIGN_COMMUNICATIONS // SECURE_CONDUIT_V2_STABLE
 */
import { ShadowLink } from '../modules/shadow-link.js';
import { CryptoVault } from '../modules/crypto-vault.js';

export class ShadowChat {
    constructor(container, api) {
        this.container = container;
        this.api = api; 
        this.messages = [];
        this.link = null;
        this.connectionStatus = "DISCONNECTED";
        this.currentSignal = "";
    }

    init() {
        this.render();
    }

    /* --- UI & STATUS LOGIC --- */

    updateStatus(msg, color) {
        const el = this.container.querySelector('#conduit-status');
        if (el) { 
            el.innerText = msg.toUpperCase(); 
            el.style.color = color; 
        }
    }

    handleStatusChange(status) {
        this.connectionStatus = status;
        const color = status === "LINK_ESTABLISHED" ? "#00ff41" : "#ff0000";
        this.updateStatus(status, color);
        if (this.api.notify) {
            this.api.notify(`CONDUIT_STABILITY: ${status}`, status === "LINK_ESTABLISHED" ? "success" : "warn");
        }
    }

    /* --- P2P SIGNALING LOGIC (Tactical Overlay) --- */

    async startHost() {
        this.updateStatus("GENERATING_ARCHON_SIGNAL...", "#ffaa00");
        this.link = new ShadowLink(
            (data) => this.receiveMessage(data),
            (status) => this.handleStatusChange(status)
        );
        const offer = await this.link.createOffer();
        this.openSignalOverlay("OFFER_OUT", offer);
    }

    async joinPeer() {
        this.openSignalOverlay("OFFER_IN");
    }

    async handleIncomingOffer(offerCode) {
        this.updateStatus("SYNCHRONIZING_SIGNAL...", "#ffaa00");
        this.link = new ShadowLink(
            (data) => this.receiveMessage(data),
            (status) => this.handleStatusChange(status)
        );
        const answer = await this.link.acceptOffer(offerCode);
        this.openSignalOverlay("ANSWER_OUT", answer);
    }

    /* --- THE MISSING LOGIC (Restored) --- */

    async sendMessage() {
        const input = this.container.querySelector('#chat-input');
        const text = input.value.trim();
        if (!text || !this.link) return;

        try {
            // Use the api.session provided by the router bridge
            const payload = await CryptoVault.encrypt(text, this.api.session);
            
            this.link.send(JSON.stringify({
                type: "TEXT",
                data: payload,
                sender: this.api.identity || "ARCHON"
            }));

            this.addMessage("LOCAL", text);
            input.value = '';
        } catch (e) {
            if (this.api.notify) this.api.notify("ENCRYPTION_ERROR", "error");
        }
    }

    async receiveMessage(raw) {
        try {
            const packet = JSON.parse(raw);
            const decoded = await CryptoVault.decrypt(packet.data, this.api.session);
            this.addMessage("REMOTE", decoded, packet.sender);
        } catch (e) {
            console.error("DECODE_FAIL", e);
        }
    }

    addMessage(origin, text, sender = "YOU") {
        this.messages.push({ 
            origin, 
            text, 
            sender, 
            time: new Date().toLocaleTimeString().split(' ')[0] 
        });
        this.renderMessages();
    }

    renderMessages() {
        const feed = this.container.querySelector('#message-feed');
        if (!feed) return;
        feed.innerHTML = this.messages.map(m => `
            <div style="margin-bottom: 12px; border-left: 2px solid ${m.origin === 'LOCAL' ? '#d4af37' : '#00ff41'}; padding-left: 10px;">
                <div style="font-size: 9px; color: #555; letter-spacing:1px;">[${m.time}] ${m.sender}</div>
                <div style="color: ${m.origin === 'LOCAL' ? '#ccc' : '#00ff41'}; font-size: 13px; margin-top:3px;">${m.text}</div>
            </div>
        `).join('');
        feed.scrollTop = feed.scrollHeight;
    }

    /* --- UI RENDERING & EVENTS --- */

    openSignalOverlay(type, code = "") {
        const overlay = this.container.querySelector('#signal-overlay');
        const display = this.container.querySelector('#signal-display');
        const input = this.container.querySelector('#signal-input-area');
        
        overlay.style.display = 'flex';
        
        if (type === "OFFER_OUT" || type === "ANSWER_OUT") {
            display.style.display = 'block';
            input.style.display = 'none';
            display.querySelector('textarea').value = code;
            display.querySelector('.overlay-label').innerText = 
                type === "OFFER_OUT" ? "ARCHON_HANDSHAKE_SIGNAL" : "INVESTOR_RESPONSE_SIGNAL";
        } else {
            display.style.display = 'none';
            input.style.display = 'block';
            input.querySelector('textarea').value = "";
            input.querySelector('.overlay-label').innerText = "PASTE_ARCHON_SIGNAL_HERE";
        }
    }

    render() {
        this.container.innerHTML = `
            <style>
                .shadow-chat { background: #020202; color: #d4af37; height: 600px; display: flex; flex-direction: column; font-family: 'Courier New', monospace; position: relative; border: 1px solid #111; box-shadow: inset 0 0 50px #000; }
                #message-feed { flex: 1; overflow-y: auto; padding: 20px; border-top: 1px solid #111; background: linear-gradient(to bottom, #050505, #000); }
                .conduit-ui { padding: 10px; background: #000; border-top: 1px solid #111; display: flex; gap: 10px; }
                #signal-overlay { position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.95); z-index: 500; display: none; flex-direction: column; align-items: center; justify-content: center; padding: 30px; border: 1px solid #d4af37; }
                .overlay-box { width: 100%; max-width: 400px; background: #0a0a0a; border: 1px solid #332200; padding: 20px; box-shadow: 0 0 30px rgba(212, 175, 55, 0.1); }
                textarea.sov-textarea { width: 100%; height: 100px; background: #000; border: 1px solid #222; color: #00ff41; font-family: inherit; font-size: 10px; padding: 10px; resize: none; margin: 10px 0; outline: none; }
                .sov-btn { background: #1a1a1a; color: #d4af37; border: 1px solid #332200; padding: 10px; cursor: pointer; font-family: inherit; text-transform: uppercase; font-size: 11px; }
                .sov-btn:hover { background: #d4af37; color: #000; }
            </style>
            <div class="shadow-chat">
                <div id="signal-overlay">
                    <div class="overlay-box" id="signal-display" style="display:none;">
                        <div class="overlay-label" style="font-size:10px; color:#d4af37;"></div>
                        <textarea class="sov-textarea" readonly></textarea>
                        <button class="sov-btn" style="width:100%" id="copy-signal">COPY_SIGNAL_TO_CLIPBOARD</button>
                        <button class="sov-btn" style="width:100%; margin-top:5px; border-color:#440000; color:#888;" onclick="this.closest('#signal-overlay').style.display='none'">CLOSE</button>
                    </div>
                    <div class="overlay-box" id="signal-input-area" style="display:none;">
                        <div class="overlay-label" style="font-size:10px; color:#d4af37;">PASTE_SIGNAL</div>
                        <textarea class="sov-textarea"></textarea>
                        <button class="sov-btn" style="width:100%" id="sync-signal">SYNC_HANDSHAKE</button>
                        <button class="sov-btn" style="width:100%; margin-top:5px; border-color:#440000; color:#888;" onclick="this.closest('#signal-overlay').style.display='none'">ABORT</button>
                    </div>
                </div>
                <div style="padding:15px; display:flex; justify-content:space-between; font-size:10px;">
                    <div>CONDUIT_ID: <span id="conduit-status" style="color:#ff0000;">DISCONNECTED</span></div>
                    <div style="color:#555;">PROTOCOL: SIGNAL.CONDUIT://P2P</div>
                </div>
                <div id="message-feed"></div>
                <div class="conduit-ui">
                    <button class="sov-btn" id="btn-host">INIT_HOST</button>
                    <button class="sov-btn" id="btn-join">JOIN_PEER</button>
                </div>
                <div class="conduit-ui" style="border-top:none; padding-top:0;">
                    <input type="text" id="chat-input" placeholder="READY_FOR_BEAM..." style="flex:1; background:#000; border:1px solid #222; color:#00ff41; padding:10px; font-family:inherit; outline:none;">
                    <button class="sov-btn" id="btn-send" style="background:#d4af37; color:#000; font-weight:bold;">BEAM</button>
                </div>
            </div>
        `;
        this.attachEvents();
    }

    attachEvents() {
        this.container.querySelector('#btn-host').onclick = () => this.startHost();
        this.container.querySelector('#btn-join').onclick = () => this.joinPeer();
        this.container.querySelector('#btn-send').onclick = () => this.sendMessage();
        
        // Handle 'Enter' key in input
        this.container.querySelector('#chat-input').onkeydown = (e) => {
            if (e.key === 'Enter') this.sendMessage();
        };

        this.container.querySelector('#copy-signal').onclick = () => {
            const code = this.container.querySelector('#signal-display textarea').value;
            navigator.clipboard.writeText(code);
            if(this.api.notify) this.api.notify("SIGNAL_SAVED_TO_BUFFER", "success");
        };

        this.container.querySelector('#sync-signal').onclick = async () => {
            const val = this.container.querySelector('#signal-input-area textarea').value;
            if (val) {
                if (!this.link) {
                    await this.handleIncomingOffer(val);
                } else {
                    await this.link.finalizeLink(val);
                    this.container.querySelector('#signal-overlay').style.display = 'none';
                }
            }
        };
    }
}