/**
 * VPU TERMINAL SYSTEM - SOVEREIGN UPGRADE
 * Module: TerminalApp (v1.2.9)
 * Security: Sovereign Enclave Protected
 */

import { registry } from '../os-core/registry-v2.js'; // Ensure path is correct

export class TerminalApp {
    constructor(container, api) {
        // 1. THE GUARD: Signature Verification
        if (!api || api.signature !== 'SOVEREIGN_CORE_V1') {
            container.innerHTML = `<div style="color:#ff4444; padding:20px;">[FATAL]: UNAUTHORIZED_ENVIRONMENT. Access Denied.</div>`;
            throw new Error("ENCLAVE_VIOLATION");
        }

        // 2. BIND ENCLAVE BRIDGE
        this.container = container;
        this.api = api; // Access to sessionKey, vfs, and close()
        
        this.output = null;
        this.input = null;
        this.isTyping = false;
        this.liveInterval = null;

        // Use the master registry as the source of truth
        this.appRegistry = registry;

        // Populate command list automatically from static commands + all app IDs
        this.commands = [
            'help', 'status', 'allotment', 'network', 
            'neofetch', 'matrix', 'time', 'search', 
            'open', 'clear', 'exit',
            ...registry.map(a => a.id)
        ];
        
        this.history = []; 
        this.historyIndex = -1;
        this.tempInput = ""; 
        this.matrixActive = false;

        this.vpuLogo = `
        _   _  ____  _   _ 
        | | | ||  _ \\| | | |
        | | | || |_) | | | |
        | |/ / |  __/| |_| |
        |___/  |_|    \\.../ 
        VIRTUAL PRAGMATIC UNIVERSE`;
    }

    init() {
        this.container.innerHTML = `
            <div id="vpu-terminal" style="background:#050505; color:#00ff41; font-family: 'Courier New', monospace; height:100%; display:flex; flex-direction:column; padding:15px; box-sizing:border-box; position: relative; overflow: hidden; text-shadow: 0 0 5px rgba(0, 255, 65, 0.4);">
                <canvas id="matrix-canvas" style="position:absolute; top:0; left:0; width:100%; height:100%; z-index:1; opacity:0; transition: opacity 2s ease; pointer-events:none;"></canvas>
                
                <div id="term-header" style="z-index: 5; margin-bottom: 20px; border-bottom: 1px solid rgba(0, 255, 65, 0.2); padding-bottom: 10px;">
                    <pre style="color:#a445ff; margin:0; font-size: 10px; line-height: 1.2;">${this.vpuLogo}</pre>
                    <div style="font-size: 12px; margin-top: 5px; opacity: 0.8;">
                        ENCLAVE: ${this.api.identity} | KEY: ${this.api.sessionKey ? 'VERIFIED' : 'NULL'}
                        CORE: Sovereign v1.2.8 | APPS: ${this.appRegistry.length} | KERNEL: 1.0.2-theal
                    </div>
                </div>

                <div id="term-output" style="flex:1; overflow-y:auto; margin-bottom:10px; font-size:13px; line-height:1.5; white-space: pre-wrap; z-index: 5; position:relative;"></div>
                
                <div class="input-line" style="display:flex; align-items:center; gap:10px; z-index: 5; position:relative;">
                    <span style="color:#a445ff; font-weight:bold; white-space: nowrap;">admin@vpu:~$</span>
                    <input type="text" id="term-input" autocomplete="off" spellcheck="false" 
                        style="background:transparent; border:none; color:#fff; outline:none; flex:1; font-family: inherit; font-size: 13px;">
                </div>
                
                <div class="terminal-overlay" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.15) 50%); background-size: 100% 4px; pointer-events: none; z-index: 10; opacity: 0.3;"></div>
            </div>`;
        this.input.focus();
        this.output = this.container.querySelector('#term-output');
        this.input = this.container.querySelector('#term-input');
        this.canvas = this.container.querySelector('#matrix-canvas');
        
        setTimeout(() => this.input.focus(), 50);
        this.input.onkeydown = (e) => this.handleKeyDown(e);
        this.container.onclick = () => this.input.focus();

        this.typeWrite("Hardware Telemetry Initialized...\n`Sovereign Terminal [v1.2.9] Handshake Successful.\nSecure VFS Mounted. Node: ${this.api.identity}`\nApp Engine Online. Type 'search' for apps.");
    }

    async handleCommand(cmd) {
        const userLine = document.createElement('div');
        userLine.innerHTML = `<span style="color:rgba(255,255,255,0.4);">admin@vpu:~$ ${cmd}</span>`;
        this.output.appendChild(userLine);

        const parts = cmd.toLowerCase().trim().split(' ');
        const cleanCmd = parts[0];
        const arg = parts[1];

        if (cleanCmd !== 'clear') await new Promise(res => setTimeout(res, 100));

        switch (cleanCmd) {
            case 'ls':
                await this.typeWrite("Directory: /home\n  - readme.txt\n  - documents/\n    - investors.txt");
                break;

            case 'cat':
                if (!arg) return this.typeWrite("Usage: cat [filename]");
                const path = arg.includes('/') ? `home/${arg}` : `home/${arg}`;
                try {
                    // Using the Bridge VFS and Key
                    const content = await this.api.vfs.read(path, this.api.sessionKey);
                    await this.typeWrite(content || "ERR: File empty or not found.");
                } catch(e) {
                    await this.typeWrite("ERR: VFS_DECRYPTION_FAILED");
                }
                break;

            case 'exit':
                this.api.close(); // Uses the bridge to tell Kernel to kill this app
                break;
            case 'search':
            let searchOutput = "ALCOHESION APP REGISTRY:\n";
            this.appRegistry.forEach(app => {
                // Use || to provide a fallback if desc is missing
                const description = app.desc || "Sovereign Module"; 
                searchOutput += `  ${app.icon} [${app.id.padEnd(12)}] : ${app.name}\n    - ${description}\n`;
            });
            await this.typeWrite(searchOutput);
            break;

            case 'open':
                if (!arg) {
                    await this.typeWrite("ERR: Specify Application ID. Usage: open [id]");
                } else {
                    const target = this.appRegistry.find(a => a.id === arg);
                    if (target) {
                        await this.typeWrite(`Executing ${target.name} sequence...`);
                        window.dispatchEvent(new CustomEvent('launchApp', { detail: { appId: arg } }));
                    } else {
                        await this.typeWrite(`ERR: App ID '${arg}' not found.`);
                    }
                }
                break;

            case 'neofetch':
                const ramUsed = (Math.random() * 4 + 2).toFixed(1);
                const cpuLoad = Math.floor(Math.random() * 15 + 5);
                const stats = `\n[SYSTEM TELEMETRY]\nOS:       Sovereign OS v1.2.8\nKERNEL:   1.0.2-theal-x86_64\nCPU:      Alcohesion Quantum-Thread [${cpuLoad}%]\nMEMORY:   ${ramUsed}GB / 32GB [|||---------]\nUPTIME:   14 days, 2 hours\n`;
                await this.typeWrite(stats);
                break;

            case 'help':
                await this.typeWrite("DIRECTIVES:\n  > search     (App Registry)\n  > open [id]  (Launch App)\n  > time       (Temporal Pulse)\n  > status     (System Integrity)\n  > network    (Node Scan)\n  > allotment  (Genesis Data)\n  > neofetch   (Hardware Info)\n  > matrix     (Toggle Reality)\n  > clear      (Flush Buffer)");
                break;

            case 'status':
            const checkFile = await this.api.vfs.read("home/readme.txt", this.api.sessionKey);
            if (checkFile) {
                await this.typeWrite("VFS STATUS: VERIFIED (Integrity 100%)\nENCLAVE: SECURE");
            } else {
                await this.typeWrite("VFS STATUS: CORRUPTED\nWARNING: ENCLAVE KEY MISMATCH", "#ff4444");
            }
            break;

            case 'network':
                await this.typeWrite("SCANNING VPU NODES...\n[NODE_01]: ONLINE\n[EPOS_RELAY]: SECURE");
                break;

            case 'allotment':
                await this.typeWrite("EPOS & Investors Allotment Confirmed.\nTarget Date: 2025-12-26\nStatus: LOCKED");
                break;

            case 'time':
                this.startLiveTime();
                break;

            case 'matrix':
                this.toggleMatrix();
                await this.typeWrite("Visual override toggled.");
                break;

            case 'clear':
                this.output.innerHTML = '';
                break;

            case 'ls':
                await this.listDirectory();
                break;

            default:
                // Check if user typed an app ID directly
                const target = this.appRegistry.find(a => a.id === cleanCmd);
                if (target) {
                    window.dispatchEvent(new CustomEvent('launchApp', { detail: { appId: cleanCmd } }));
                } else {
                    await this.typeWrite(`ERR: Command '${cleanCmd}' not found.`);
                }

        }
    }

    // --- HELPER METHODS ---

    getTemporalData() {
        const now = new Date();
        const start = new Date(now.getFullYear(), 0, 0);
        const diff = now - start;
        const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24));
        const cycle = Math.floor(dayOfYear / 91) + 1;
        const endOfYear = new Date(now.getFullYear(), 11, 31, 23, 59, 59);
        const timeLeft = endOfYear - now;
        const d = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
        const h = Math.floor((timeLeft / (1000 * 60 * 60)) % 24);
        const m = Math.floor((timeLeft / (1000 * 60)) % 60);
        const s = Math.floor((timeLeft / 1000) % 60);
        return {
            normal: now.toLocaleTimeString(), date: now.toLocaleDateString(),
            alco: `TLC-${now.getHours().toString().padStart(2,'0')}:${now.getMinutes().toString().padStart(2,'0')}:${now.getSeconds().toString().padStart(2,'0')}`,
            cycle: `Phase 0${cycle}`, countdown: `${d}d ${h}h ${m}m ${s}s`, unix: Math.floor(now.getTime() / 1000)
        };
    }

    startLiveTime() {
        if (this.liveInterval) return;
        const liveEl = document.createElement('div');
        liveEl.style.padding = "10px"; liveEl.style.border = "1px solid #00ff41";
        liveEl.style.margin = "10px 0"; liveEl.style.background = "rgba(0, 255, 65, 0.05)";
        this.output.appendChild(liveEl);
        this.isTyping = true;
        this.input.placeholder = "Press ENTER to stop pulse...";
        this.liveInterval = setInterval(() => {
            const t = this.getTemporalData();
            liveEl.innerHTML = `[LIVE TEMPORAL PULSE]\nStandard:    ${t.normal} | ${t.date}\nAlcohesion:  ${t.alco}\nYear Cycle:  ${t.cycle}\nRemaining:   ${t.countdown}\nUnix Epoch:  ${t.unix}\n------------------------------------\nSTATUS: SYNCHRONIZED`;
            this.output.scrollTop = this.output.scrollHeight;
        }, 1000);
    }

    handleKeyDown(e) {
        if (this.liveInterval && (e.key === 'Enter' || e.key === 'Escape')) {
            e.preventDefault();
            clearInterval(this.liveInterval);
            this.liveInterval = null; this.isTyping = false;
            this.input.placeholder = ""; this.output.innerHTML += `\nPulse severed.\n`;
            return;
        }
        if (this.isTyping && e.key === 'Enter') { e.preventDefault(); return; }
        if (e.key === 'Enter') {
            const val = this.input.value.trim();
            if (val) { this.history.unshift(val); this.historyIndex = -1; this.handleCommand(val); }
            this.input.value = '';
        } else if (e.key === 'Tab') {
            e.preventDefault();
            const val = this.input.value.toLowerCase().trim();
            const match = this.commands.find(c => c.startsWith(val));
            if (match) this.input.value = match;
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            if (this.historyIndex < this.history.length - 1) {
                if (this.historyIndex === -1) this.tempInput = this.input.value;
                this.historyIndex++; this.input.value = this.history[this.historyIndex];
            }
        } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            if (this.historyIndex > -1) {
                this.historyIndex--;
                this.input.value = (this.historyIndex === -1) ? this.tempInput : this.history[this.historyIndex];
            }
        }
    }

    async typeWrite(text) {
        this.isTyping = true;
        const line = document.createElement('div');
        this.output.appendChild(line);
        for (const char of text.split("")) {
            line.textContent += char;
            this.output.scrollTop = this.output.scrollHeight;
            await new Promise(res => setTimeout(res, 5));
        }
        this.isTyping = false;
    }

    async listDirectory() {
        if (!window.SovereignVFS) {
            this.print("Error: VFS Driver not loaded.", "#ff4444");
            return;
        }

        try {
            this.print("Index of /home", "#888");
            
            // Hardcoded virtual structure (matching the provisioned data)
            const structure = [
                { name: "readme.txt", type: "file" },
                { name: "documents/", type: "dir" },
                { name: "documents/investors.txt", type: "file" }
            ];

            structure.forEach(item => {
                const color = item.type === 'dir' ? '#3498db' : '#00ff41';
                this.print(`  ${item.name}`, color);
            });

        } catch (e) {
            this.print("VFS_READ_ERROR: Access Denied.", "#ff4444");
        }
    }

    toggleMatrix() {
        this.matrixActive = !this.matrixActive;
        this.canvas.style.opacity = this.matrixActive ? "0.25" : "0";
        if (this.matrixActive) this.runMatrix();
    }

    runMatrix() {
        const ctx = this.canvas.getContext('2d');
        const w = this.canvas.width = this.container.offsetWidth;
        const h = this.canvas.height = this.container.offsetHeight;
        const columns = Math.floor(w / 20) + 1;
        const ypos = Array(columns).fill(0);
        const matrix = () => {
            if (!this.matrixActive) return;
            ctx.fillStyle = 'rgba(0, 0, 0, 0.05)'; ctx.fillRect(0, 0, w, h);
            ctx.fillStyle = '#0f0'; ctx.font = '15pt monospace';
            ypos.forEach((y, i) => {
                ctx.fillText(String.fromCharCode(Math.random() * 128), i * 20, y);
                if (y > 100 + Math.random() * 10000) ypos[i] = 0; else ypos[i] = y + 20;
            });
        };
        const interval = setInterval(() => { if (!this.matrixActive) clearInterval(interval); matrix(); }, 50);
    }

    // Inside TerminalApp class
    destruct() {
    // 1. Stop the Matrix animation loop
    this.matrixActive = false; 
    
    // 2. Clear the Temporal Pulse (live time) interval
    if (this.liveInterval) {
        clearInterval(this.liveInterval);
        this.liveInterval = null;
    }

    // 3. Wipe the local references to decrypted data
    this.history = [];
    this.output.innerHTML = "";
    
    console.log("Terminal: Memory purged. Destruct sequence complete.");
}
}