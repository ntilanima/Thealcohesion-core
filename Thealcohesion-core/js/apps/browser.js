/**
 * apps/browser.js - SOVEREIGN_VPU_GATEWAY (v3.0 Prime)
 * FEATURES: Live P2P Mapping, Terminal HUD, Genesis Ledger, & Self-Healing Core.
 */
export class BrowserApp {
    constructor(container, api) {
        this.container = container;
        this.api = api;
        this.currentUrl = "vpu://genesis.core";
        this.nodeId = `ARCHON_${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
        this.peers = new Map();
        this.discoveryChannel = new BroadcastChannel('vpu_discovery_net');
        
        this.view = 'web'; 
        this.history = [];
        this.downloads = [
            { name: "genesis_manifest_2025.vpu", date: "2025-12-26", size: "12KB", type: "BIRTHRIGHT" },
            { name: "investor_allotment_secure.enc", date: "2025-12-27", size: "44KB", type: "LEDGER" }
        ]
        this.visualArchive = []; // Stores { timestamp, data, node, type: 'SNAPSHOT' }
    }

    async init() {
        this.render();
        this.setupDiscovery();
        // Force immediate P2P presence
        this.discoveryChannel.postMessage({ type: 'PING', senderId: this.nodeId });
        setTimeout(() => this.loadPage(this.currentUrl), 150);
        
        // Background Integrity Monitor
        setInterval(() => this.integrityCheck(), 5000);
    }

    setupDiscovery() {
        this.discoveryChannel.onmessage = (e) => {
            const { type, senderId, message } = e.data;
            if (senderId === this.nodeId) return;

            if (type === 'PING' || type === 'PONG') {
                this.peers.set(senderId, { lastSeen: Date.now(), status: 'ACTIVE' });
                if (type === 'PING') this.discoveryChannel.postMessage({ type: 'PONG', senderId: this.nodeId });
            } else if (type === 'SIGNAL') {
                this.handleRemoteSignal(senderId, message);
            }

            if (type === 'SNAPSHOT_SYNC') {
                this.visualArchive.unshift(message); // Syncs photos taken on other tabs/nodes
                this.refreshNetworkUI();
            }
            this.refreshNetworkUI();
        };

        setInterval(() => {
            this.discoveryChannel.postMessage({ type: 'PING', senderId: this.nodeId });
            this.pruneNodes();
        }, 8000);
    }

    addSnapshot(dataUrl) {
        const entry = {
            time: new Date().toLocaleTimeString(),
            data: dataUrl,
            id: `SIG_${Math.random().toString(16).slice(2, 8).toUpperCase()}`,
            node: this.nodeId
        };
        this.visualArchive.unshift(entry);
        this.updateHUD("NEW_VISUAL_MANIFEST_STORED");
        
        // Broadcast to other tabs so the "Network History" stays synced
        this.discoveryChannel.postMessage({ 
            type: 'SNAPSHOT_SYNC', 
            senderId: this.nodeId, 
            message: entry 
        });
    }
    handleRemoteSignal(senderId, message) {
        if (message.startsWith('NAV:')) {
            this.loadPage(message.replace('NAV:', ''));
        } else if (this.api.notify) {
            this.api.notify(`NODE_${senderId}: ${message}`, "info");
        }
    }

    broadcast(msg) {
        this.discoveryChannel.postMessage({ type: 'SIGNAL', senderId: this.nodeId, message: msg });
    }

    pruneNodes() {
        const now = Date.now();
        for (const [id, data] of this.peers) {
            if (now - data.lastSeen > 15000) this.peers.delete(id);
        }
        this.refreshNetworkUI();
    }

    integrityCheck() {
        if (!this.container.querySelector('.vpu-browser')) this.render();
    }

    refreshNetworkUI() {
        const list = this.container.querySelector('#network-nodes');
        if (list) list.innerHTML = this.getNetworkNodesHTML();
        const count = this.container.querySelector('#peer-count');
        if (count) count.innerText = this.peers.size;
    }

    render() {
        this.container.innerHTML = `
        <style>
            .vpu-browser { display: flex; height: 100%; background: #020202; color: #d4af37; font-family: 'Courier New', monospace; overflow: hidden; border: 1px solid #1a1a1a; position: relative; }
            
            /* Nav Rail - Rich Design */
            .vpu-nav-rail { width: 60px; background: #000; border-right: 1px solid #222; display: flex; flex-direction: column; align-items: center; padding: 25px 0; gap: 35px; flex-shrink: 0; box-shadow: 5px 0 15px rgba(0,0,0,0.5); }
            .nav-icon { cursor: pointer; font-size: 20px; transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275); filter: grayscale(1); opacity: 0.4; position: relative; }
            .nav-icon:hover { opacity: 1; transform: scale(1.2) rotate(5deg); filter: grayscale(0); }
            .nav-icon.active { filter: grayscale(0); opacity: 1; text-shadow: 0 0 15px #d4af37; transform: scale(1.1); }
            .nav-icon.active::after { content: ''; position: absolute; left: -15px; top: 5px; width: 3px; height: 15px; background: #d4af37; box-shadow: 0 0 10px #d4af37; }

            /* Main Content Area */
            .main-stage { flex-grow: 1; display: flex; flex-direction: column; background: radial-gradient(circle at 50% 50%, #0a0a0a 0%, #000 100%); }
            .vpu-header { display: flex; justify-content: space-between; align-items: center; background: #000; padding: 8px 20px; border-bottom: 1px solid #1a1a1a; font-size: 10px; letter-spacing: 1px; }
            
            /* Address Bar - Kinetic Feedback */
            .vpu-address-bar-wrap { padding: 15px 25px; display: flex; gap: 15px; align-items: center; background: rgba(5,5,5,0.8); border-bottom: 1px solid #111; }
            .vpu-input { flex-grow: 1; background: transparent; border: 1px solid #222; color: #00ff41; padding: 10px 18px; font-family: inherit; font-size: 13px; outline: none; transition: border 0.3s; box-shadow: inset 0 0 10px rgba(0,0,0,1); }
            .vpu-input:focus { border-color: #d4af37; background: rgba(212, 175, 55, 0.05); }

            .vpu-viewport { flex-grow: 1; overflow-y: auto; position: relative; padding: 0; scrollbar-width: thin; scrollbar-color: #d4af37 transparent; }
            
            /* Cards & Glitch Effects */
            .vpu-card { border: 1px solid #1a1a1a; background: rgba(10,10,10,0.6); padding: 20px; margin-bottom: 15px; position: relative; transition: all 0.3s; overflow: hidden; }
            .vpu-card:hover { border-color: #d4af37; box-shadow: 0 0 20px rgba(212, 175, 55, 0.1); }
            .vpu-card::before { content: ""; position: absolute; top: 0; left: 0; width: 100%; height: 1px; background: linear-gradient(90deg, transparent, #d4af37, transparent); transform: translateX(-100%); transition: 0.5s; }
            .vpu-card:hover::before { transform: translateX(100%); }

            .node-tag { font-size: 9px; color: #00ff41; border: 1px solid #00ff41; padding: 2px 6px; text-transform: uppercase; margin-left: 10px; }
            .status-dot { display: inline-block; width: 6px; height: 6px; border-radius: 50%; margin-right: 10px; background: #00ff41; box-shadow: 0 0 8px #00ff41; }

            /* HUD Elements */
            #terminal-hud { position: absolute; bottom: 20px; right: 20px; width: 250px; background: rgba(0,0,0,0.9); border: 1px solid #222; font-size: 9px; padding: 10px; pointer-events: none; opacity: 0.7; z-index: 100; }
        </style>

        <div class="vpu-browser">
            <div class="vpu-nav-rail">
                <div title="GATEWAY" class="nav-icon active" data-view="web">🌍</div>
                <div title="NETWORK MAP" class="nav-icon" data-view="network">🛰️</div>
                <div title="ARCHIVE" class="nav-icon" data-view="history">📚</div>
                <div title="MANIFESTS" class="nav-icon" data-view="downloads">📦</div>
                <div style="margin-top:auto; color: #ff4136;" title="TERMINAL" class="nav-icon" data-view="terminal">☣️</div>
            </div>

            <div class="main-stage">
                <div class="vpu-header">
                    <div>CORE_ID: <span style="color:#fff;">${this.nodeId}</span></div>
                    <div style="display:flex; gap:20px;">
                        <div>PEERS_ONLINE: <span id="peer-count" style="color:#00ff41;">0</span></div>
                        <div>LATENCY: <span style="color:#00ff41;">1ms</span></div>
                    </div>
                </div>

                <div class="vpu-address-bar-wrap">
                    <input type="text" id="vpu-url" class="vpu-input" placeholder="Enter Sovereign Protocol (vpu://) or Search...">
                    <div title="BIOMETRIC_SCANNER" class="nav-icon" style="font-size:14px; margin-left:10px; opacity:1;" 
                        onclick="this.closest('.vpu-browser').vpu_instance.openScanner()">🔍</div>
                </div>

                <div id="vpu-viewport" class="vpu-viewport"></div>
            </div>

            <div id="terminal-hud">
                <div style="color:#d4af37; border-bottom:1px solid #222; margin-bottom:5px; padding-bottom:2px;">GATEWAY_MONITOR</div>
                <div id="hud-log">Initializing secure handshake...<br>Awaiting peer discovery...</div>
            </div>
        </div>
        `;

        const mainElement = this.container.querySelector('.vpu-browser');
        mainElement.vpu_instance = this; // Attach the actual class instance
        this.container.querySelectorAll('.nav-icon').forEach(icon => {
            icon.onclick = () => this.setView(icon.dataset.view);
        });

        this.setupNavigation();
    }

   setView(view) {
    if (!view) return; // Exit if undefined
    this.view = view;
    this.container.querySelectorAll('.nav-icon').forEach(i => i.classList.toggle('active', i.dataset.view === view));
    
    const urlMap = { 
        'web': this.currentUrl || 'vpu://genesis.core', // Guard against empty currentUrl
        'network': 'vpu://network', 
        'history': 'vpu://history', 
        'downloads': 'vpu://downloads', 
        'terminal': 'vpu://terminal' 
    };
    
    this.loadPage(urlMap[view] || 'vpu://genesis.core');
}

    openScanner() {
    this.api.vpu.launch('camera');
}

    setupNavigation() {
        const input = this.container.querySelector('#vpu-url');
        input.onkeydown = (e) => {
            if (e.key === 'Enter') {
                const val = input.value.trim();
                val.includes('://') || val.includes('.') ? this.loadPage(val) : this.performSearch(val);
            }
        };
    }

    async loadPage(url) {
    // --- SAFETY GUARD START ---
    // If url is missing, default to Genesis instead of crashing
    if (!url || typeof url !== 'string') url = 'vpu://genesis.core';
    // --- SAFETY GUARD END ---

    this.currentUrl = url;
    const viewport = this.container.querySelector('#vpu-viewport');
    const input = this.container.querySelector('#vpu-url');
    if (input) input.value = url;

    this.updateHUD(`NAV_TO: ${url}`);

    if (url.startsWith('vpu://')) {
        if (!this.history.find(h => h.url === url)) {
            this.history.unshift({ url, time: new Date().toLocaleTimeString() });
        }
        
        switch(url) {
            case 'vpu://network': this.renderNetwork(viewport); break;
            case 'vpu://history': this.renderHistory(viewport); break;
            case 'vpu://downloads': this.renderDownloads(viewport); break;
            case 'vpu://genesis.core': this.renderGenesis(viewport); break;
            case 'vpu://terminal': this.renderTerminal(viewport); break;
            default: viewport.innerHTML = this.getSearchLandingHTML();
        }
    } else {
        this.renderExternal(url, viewport);
    }
}
    updateHUD(msg) {
        const hud = this.container.querySelector('#hud-log');
        if (hud) {
            const time = new Date().toLocaleTimeString().split(' ')[0];
            hud.innerHTML = `[${time}] ${msg}<br>` + hud.innerHTML.split('<br>').slice(0, 3).join('<br>');
        }
    }

    // --- ENRICHED VIEWS ---

    renderGenesis(viewport) {
    // Check if the OS has authorized this session
    const isLocked = this.api.vpu?.isLocked ? this.api.vpu.isLocked() : false;

    if (isLocked) {
        viewport.innerHTML = `
            <div style="height:100%; display:flex; flex-direction:column; align-items:center; justify-content:center; text-align:center;">
                <div style="font-size:50px; margin-bottom:20px;">🔒</div>
                <h3 style="color:#ff4136;">ENCLAVE_LOCKED</h3>
                <p style="color:#555; font-size:12px; max-width:300px;">
                    Biometric handshake required to view Genesis Ledger and Investor Allotments.
                </p>
                <button onclick="this.closest('.vpu-browser').vpu_instance.openScanner()"
                        style="background:none; border:1px solid #d4af37; color:#d4af37; padding:10px 20px; margin-top:20px; cursor:pointer; font-family:inherit;">
                    START_BIOMETRIC_SCAN
                </button>
            </div>`;
        return;
    }
        viewport.innerHTML = `
            <div style="padding:50px; max-width:800px;">
                <h1 style="color:#fff; letter-spacing:4px; text-shadow: 0 0 20px #d4af37;">GENESIS_LEDGER</h1>
                <p style="color:#666; font-size:12px;">Authenticated session for Origin Prime Archon.</p>
                
                <div class="vpu-card" style="margin-top:30px; border-left:4px solid #d4af37;">
                    <div style="font-size:12px; color:#d4af37;">INITIAL_ALLOTMENT_POOL</div>
                    <div style="font-size:42px; color:#fff; font-weight:bold; margin:10px 0;">15,000,000.00 <span style="font-size:14px; color:#d4af37;">VPU_CREDITS</span></div>
                    <div style="display:flex; gap:20px; font-size:10px; margin-top:15px;">
                        <div>EPOS: <span style="color:#00ff41;">SECURED</span></div>
                        <div>INVESTORS: <span style="color:#00ff41;">ALLOCATED</span></div>
                    </div>
                </div>

                <div style="display:grid; grid-template-columns: 1fr 1fr; gap:20px; margin-top:20px;">
                    <div class="vpu-card">
                        <div style="font-size:11px;">SYSTEM_BIRTH</div>
                        <div style="color:#fff; margin-top:5px;">2025-12-26</div>
                    </div>
                    <div class="vpu-card">
                        <div style="font-size:11px;">TRUST_VERIFICATION</div>
                        <div style="color:#00ff41; margin-top:5px;">PASSED_BY_NODE_QUORUM</div>
                    </div>
                </div>
            </div>`;
    }

    renderNetwork(viewport) {
        viewport.innerHTML = `
            <div style="padding:40px;">
                <h3>ARCHON_NETWORK_MAP</h3>
                <div class="vpu-card" style="border-style:dashed; margin-top:20px;">
                    <div style="font-size:10px; margin-bottom:10px;">GLOBAL_SIGNAL_BROADCAST</div>
                    <input type="text" id="node-broadcast" class="vpu-input" placeholder="Type message to all peers..." 
                        onkeydown="if(event.key==='Enter'){ this.closest('.vpu-browser').vpu_instance.broadcast(this.value);this.value=''; }">
                </div>
                <div id="network-nodes" style="margin-top:20px;">${this.getNetworkNodesHTML()}</div>
            </div>`;
    }

    getNetworkNodesHTML() {
        let html = `<div class="vpu-card" style="border-color:#d4af37;"><span class="status-dot"></span> <strong>${this.nodeId} (LOCAL_HOST)</strong> <span class="node-tag">ORIGIN</span></div>`;
        this.peers.forEach((data, id) => {
            html += `<div class="vpu-card"><span class="status-dot"></span> NODE_${id} <span class="node-tag" style="color:#d4af37; border-color:#d4af37;">PEER_ARCHON</span></div>`;
        });
        if (this.peers.size === 0) html += `<div style="text-align:center; padding:40px; color:#444;">SEARCHING_FOR_PEERS...</div>`;
        return html;
    }

    renderHistory(viewport) {
    viewport.innerHTML = `
        <div style="padding:40px; color:#d4af37;">
            <h2 style="letter-spacing:2px; border-bottom:1px solid #222; padding-bottom:10px;">SESSION_ARCHIVE</h2>
            
            <div style="display: grid; grid-template-columns: 1fr 300px; gap:30px; margin-top:20px;">
                
                <div>
                    <h4 style="font-size:10px; color:#555; margin-bottom:15px;">NAVIGATION_STREAM</h4>
                    ${this.history.map(h => `
                        <div class="vpu-card" style="padding:10px; font-size:11px; cursor:pointer;" onclick="this.closest('.vpu-browser').vpu_instance.loadPage('${h.url}')">
                            <span style="color:#555;">[${h.time}]</span> 
                            <span style="color:#00ff41; margin-left:10px;">${h.url}</span>
                        </div>
                    `).join('') || '<div style="color:#222;">NO_LOGS_RECORDED</div>'}
                </div>

                <div style="border-left: 1px solid #111; padding-left:20px;">
                    <h4 style="font-size:10px; color:#555; margin-bottom:15px;">VISUAL_EVIDENCE (EYE_LOGS)</h4>
                    <div style="display:flex; flex-direction:column; gap:15px;">
                        ${this.visualArchive.map(img => `
                            <div class="vpu-card" style="padding:5px; border-color:#222;">
                                <div style="width:100%; height:120px; background-image:url(${img.data}); background-size:cover; background-position:center; filter:sepia(1) brightness(0.8) contrast(1.2);"></div>
                                <div style="font-size:8px; margin-top:5px; color:#d4af37; display:flex; justify-content:space-between;">
                                    <span>ID: ${img.id}</span>
                                    <span>${img.time}</span>
                                </div>
                                <div style="font-size:7px; color:#444;">SOURCE: ${img.node}</div>
                            </div>
                        `).join('') || '<div style="color:#222; font-size:10px;">AWAITING_CAPTURE...</div>'}
                    </div>
                </div>

            </div>
        </div>`;
}

    renderDownloads(viewport) {
        viewport.innerHTML = `<div style="padding:40px;"><h3>MANIFEST_VFS</h3><div style="margin-top:20px;">
            ${this.downloads.map(d => `<div class="vpu-card">
                <div style="color:#00ff41; font-weight:bold;">${d.name}</div>
                <div style="font-size:10px; color:#555; margin-top:5px;">SIZE: ${d.size} // SIGNED: ${d.date} // ${d.type}</div>
            </div>`).join('')}
        </div></div>`;
    }

    renderTerminal(viewport) {
        viewport.innerHTML = `
            <div style="height:100%; padding:30px; background:#000; display:flex; flex-direction:column; color:#00ff41;">
                <div style="font-size:12px; margin-bottom:20px;">SOVEREIGN_TERMINAL_v3.0 // ARCHON_ACCESS</div>
                <div id="term-output" style="flex-grow:1; font-size:11px; overflow-y:auto; line-height:1.6;">
                    SYSTEM_BOOT_COMPLETE...<br>BROADCAST_CHANNEL_OPEN...<br>AWAITING_COMMANDS...
                </div>
                <div style="display:flex; border-top:1px solid #111; padding-top:10px;">
                    <span style="margin-right:10px;">></span>
                    <input type="text" class="vpu-input" style="border:none; padding:0; width:100%;" autofocus 
                        onkeydown="if(event.key==='Enter'){ this.closest('.vpu-browser').vpu_instance.runCommand(this); }">
                </div>
            </div>`;
    }

    runCommand(input) {
        const cmd = input.value;
        const out = this.container.querySelector('#term-output');
        out.innerHTML += `<br><span style="color:#fff;">$ ${cmd}</span>`;
        if (cmd === 'clear') out.innerHTML = '';
        if (cmd === 'nav genesis') this.loadPage('vpu://genesis.core');
        if (cmd === 'peers') out.innerHTML += `<br>TOTAL_PEERS: ${this.peers.size}`;
        input.value = '';
    }

    renderExternal(url, viewport) {
        const secureUrl = url.startsWith('http') ? url : `https://${url}`;
        viewport.innerHTML = `<iframe src="${secureUrl}" style="width:100%; height:100%; border:none; background:#fff;" sandbox="allow-scripts allow-forms allow-popups allow-same-origin" referrerpolicy="no-referrer"></iframe>`;
    }

    getSearchLandingHTML() {
        return `<div style="height:100%; display:flex; flex-direction:column; align-items:center; justify-content:center;">
            <div style="font-size:40px; font-weight:bold; letter-spacing:10px; color:#111;">SOVEREIGN</div>
            <p style="color:#222; font-size:10px;">VPU_GATEWAY_v3.0_PRIME</p>
        </div>`;
    }

    performSearch(query) {
        const viewport = this.container.querySelector('#vpu-viewport');
        const isInternal = query.toLowerCase().match(/genesis|birth|credit|allot/);
        viewport.innerHTML = `
            <div style="padding:40px;">
                <h3 style="color:#555;">SCANNING_VFS: "${query.toUpperCase()}"</h3>
                ${isInternal ? `
                    <div class="vpu-card" style="margin-top:20px; cursor:pointer;" onclick="this.closest('.vpu-browser').vpu_instance.loadPage('vpu://genesis.core')">
                        <div style="color:#00ff41;">>> genesis_manifest_2025.vpu</div>
                        <div style="font-size:10px; color:#888;">MATCH_FOUND_IN_SECURE_ENCLAVE</div>
                    </div>
                ` : `
                    <div class="vpu-card" style="margin-top:20px;">
                        <div style="font-size:12px; margin-top:10px; color:#555; cursor:pointer;" 
                             onclick="this.closest('.vpu-browser').vpu_instance.loadPage('https://duckduckgo.com/?q=${query}')">
                            QUERY_LEGACY_WEB_FOR: "${query}"?
                        </div>
                    </div>
                `}
            </div>`;
    }

    openScanner() {
        if (this.api && this.api.launch) {
            this.api.launch('camera');
            this.api.notify("INITIALIZING_BIOMETRIC_SCAN", "info");
        }
    }
}