/**
 * VPU LOGIC FORGE (Dev Center)
 * Concept: Semantic Sovereignty
 * Compliance: Article 13.2
 * * VPU LOGIC FORGE (Integrated Spec v1.0)
 * Features: Manifest-First, Sovereign Sandbox, Local Signing
 */

import { registry } from './registry-v2.js';

export class LogicForge {
    constructor(container, api) {
        if (!api || api.signature !== 'SOVEREIGN_CORE_V1') {
            container.innerHTML = `<div class="fatal-error">[FATAL]: UNAUTHORIZED_HIVE_ACCESS.</div>`;
            throw new Error("ENCLAVE_VIOLATION");
        }
        this.container = container;
        this.registry = registry;
        this.api = api;
        this.activeManifest = { id: null, name: "", purpose: "", resources: { cpu: 10, ram: 16 } };
    }

    init() {
        this.render();
        this.refreshRepoList();
        this.setupListeners();
    }

  render() {
        this.container.innerHTML = `
        <div class="forge-container">
        <aside class="forge-repo">
        <div class="repo-header">
            <span>SOVEREIGN_REPO</span>
            <span class="v-tag">v.1.2</span>
        </div>
        
        <div class="repo-search-wrapper">
            <input type="text" id="repo-search" placeholder="FILTER_NODES..." spellcheck="false">
            <div class="search-icon">🔍</div>
        </div>

        <button id="new-node-btn" class="new-btn">+ NEW_CAPABILITY</button>
        <div id="local-app-list" class="repo-list"></div>

        <div class="repo-actions">
            <button id="export-btn" title="Export All Apps">💾 EXPORT</button>
            <button id="import-btn" title="Import Manifest">📥 IMPORT</button>
        </div>
        </aside>

            <main class="forge-main">
                <div class="editor-header">
                    <span id="active-node-name">BUFFER_EMPTY</span>
                    <div class="header-actions">
                         <span id="forge-status" class="forge-status">IDLE</span>
                         <button id="delete-btn" class="btn-sec" style="color: #ff3366; border-color: #ff3366; display: none;">DELETE_CAPABILITY</button>
                         <button id="commit-btn" class="publish-btn">COMMIT_CHANGES</button>
                    </div>
                </div>
                
                <div class="workspace-split">
                    <div class="ide-wrapper">
                        <div class="line-numbers" id="line-numbers">1</div>
                        <div class="editor-container">
                            <pre id="highlighting-layer" aria-hidden="true"></pre>
                            <textarea id="logic-editor" spellcheck="false" placeholder="Select an app or initialize core..."></textarea>
                        </div>
                    </div>
                    <div class="forge-terminal" id="forge-log">
                        <div class="log-entry">> SYSTEM_IDLE...</div>
                    </div>
                </div>
            </main>

            <div id="forge-overlay" class="forge-overlay hidden">
                <div class="config-modal">
                    <h3 class="section-title">01_IDENTITY_PROPOSAL</h3>
                    <div class="input-row">
                        <div class="field"><label>NAME</label><input type="text" id="dev-name"></div>
                        <div class="field"><label>ICON</label><input type="text" id="dev-icon" placeholder="📦"></div>
                    </div>
                    <div class="field">
                        <label>CATEGORY</label>
                        <select id="dev-category">
                            <option value="Social">Social</option>
                            <option value="Finance">Finance</option>
                            <option value="Infrastructure">Infrastructure</option>
                        </select>
                    </div>
                    <div class="field">
                        <label>PURPOSE (Article 13.2)</label>
                        <textarea id="intent-input" placeholder="Declare Sovereign Purpose..."></textarea>
                    </div>
                    <div class="field">
                    <label>RESOURCE_ACCESS & ETHICS</label> <div class="ethics-grid">
                        <label><input type="checkbox" id="eth-tracking" checked> Zero Tracking</label>
                        <label><input type="checkbox" id="eth-consent" checked> Consent Required</label>
                        <label><input type="checkbox" id="perm-fs" checked> VFS_STORAGE</label>
                        <label><input type="checkbox" id="perm-net"> NETWORK_ENCLAVE</label>
                    </div>
                    </div>
                    <div class="modal-actions">
                        <button id="cancel-config" class="btn-sec">CANCEL</button>
                        <button id="confirm-config" class="btn-pri">INITIALIZE_CORE</button>
                    </div>
                </div>
            </div>
        </div>`;
    }

    setupListeners() {
        const editor = this.container.querySelector('#logic-editor');
        const overlay = this.container.querySelector('#forge-overlay');

        this.container.querySelector('#new-node-btn').onclick = () => {
            // Reset manifest for new node
            this.activeManifest = { id: `vpu-node-${Date.now()}`, name: "", permissions: { fs: false, network: false } };
            // Clear inputs
            this.container.querySelector('#dev-name').value = "";
            this.container.querySelector('#intent-input').value = "";
            overlay.classList.remove('hidden');
        };

        this.container.querySelector('#cancel-config').onclick = () => overlay.classList.add('hidden');

        this.container.querySelector('#confirm-config').onclick = () => {
            const nameInput = this.container.querySelector('#dev-name');
            if (!nameInput.value) return this.log("ERROR: Identity binding requires a NAME.", "critical");
            
            // Map inputs to activeManifest
            this.activeManifest.name = nameInput.value;
            this.activeManifest.icon = this.container.querySelector('#dev-icon').value || "📦";
            this.activeManifest.category = this.container.querySelector('#dev-category').value;
            this.activeManifest.purpose = this.container.querySelector('#intent-input').value;
            this.activeManifest.permissions = {
                fs: this.container.querySelector('#perm-fs').checked,
                network: this.container.querySelector('#perm-net').checked
            };

            this.container.querySelector('#active-node-name').innerText = this.activeManifest.name.toUpperCase();
            
            if (!editor.value || editor.value.trim() === "") {
                editor.value = this.getTemplate(this.activeManifest.name);
            }
            
            this.updateEditor();
            overlay.classList.add('hidden');
            this.log(`IDENTITY_BOUND: ${this.activeManifest.name}`, "success");
        };

        editor.oninput = () => this.updateEditor();
        editor.onscroll = () => {
            this.container.querySelector('#highlighting-layer').scrollTop = editor.scrollTop;
            this.container.querySelector('#line-numbers').scrollTop = editor.scrollTop;
        };

        this.container.querySelector('#commit-btn').onclick = () => this.handleCommit();

        const searchInput = this.container.querySelector('#repo-search');

        searchInput.oninput = (e) => {
            const term = e.target.value.toLowerCase();
            const items = this.container.querySelectorAll('.repo-item');
            
            items.forEach(item => {
                const name = item.querySelector('.repo-name').innerText.toLowerCase();
                if (name.includes(term)) {
                    item.style.display = 'flex';
                } else {
                    item.style.display = 'none';
                }
            });
        };
        // EXPORT ALL APPS
    this.container.querySelector('#export-btn').onclick = () => {
        const apps = localStorage.getItem('vpu_local_registry') || '[]';
        const blob = new Blob([apps], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `vpu_backup_${new Date().toISOString().slice(0,10)}.json`;
        a.click();
        this.log("BACKUP_CREATED: Local registry exported.", "success");
    };

    // IMPORT APPS
    this.container.querySelector('#import-btn').onclick = () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.onchange = (e) => {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const imported = JSON.parse(event.target.result);
                    localStorage.setItem('vpu_local_registry', JSON.stringify(imported));
                    this.refreshRepoList();
                    this.log("REGISTRY_RESTORED: Sync complete.", "success");
                } catch (err) {
                    this.log("IMPORT_FAILED: Invalid JSON signature.", "critical");
                }
            };
            reader.readAsText(file);
        };
        input.click();
    };

    //DELETE NODE
        this.container.querySelector('#delete-btn').onclick = async () => {
        if (!this.activeManifest.id) return;

        const choice = await this.sovereignPrompt(
            "DECOMMISSION_PROTOCOL", 
            `Are you sure you want to permanently purge ${this.activeManifest.name}? This action is non-recoverable per Sovereign Governance.`, 
            [
                { id: 'confirm_delete', label: 'SECURE_PURGE', desc: 'Permanent non-recoverable deletion' },
                { id: 'cancel', label: 'ABORT', desc: 'Keep the capability' }
            ]
        );

        if (choice === 'confirm_delete') {
            this.handleDelete(this.activeManifest.id);
        }
    };
    }

    async handleDelete(id) {
    this.log(`INIT_PURGE_SEQUENCE: ${id}`, "warn");

    try {
        // 1. Registry Revocation (Local Storage)
        const localRegistry = JSON.parse(localStorage.getItem('vpu_local_registry') || '[]');
        const filtered = localRegistry.filter(app => app.id !== id);
        localStorage.setItem('vpu_local_registry', JSON.stringify(filtered));

        // 2. Scope Wiping (Virtual File System Clean-up)
        // This clears all 'fs_' keys associated with this app ID
        Object.keys(localStorage).forEach(key => {
            if (key.startsWith(`fs_${id}`)) {
                localStorage.removeItem(key);
            }
        });

        // 3. UI Reset
        this.activeManifest = { id: null, name: "", purpose: "", resources: { cpu: 10, ram: 16 } };
        this.container.querySelector('#active-node-name').innerText = "BUFFER_EMPTY";
        this.container.querySelector('#logic-editor').value = "";
        this.container.querySelector('#delete-btn').style.display = 'none';
        this.container.querySelector('#forge-status').innerText = "IDLE";
        this.container.querySelector('#forge-status').style.color = "";

        this.refreshRepoList();
        this.log("PURGE_COMPLETE: Node and VFS scope destroyed.", "success");
    } catch (err) {
        this.log("PURGE_FAILED: System integrity error.", "critical");
    }
}

    getTemplate(name) {
    return `import { registry } from './registry-v2.js';

    export class ${name.replace(/\s+/g, '')} {
        constructor(container, api) {
            if (!api || api.signature !== 'SOVEREIGN_CORE_V1') {
                throw new Error("ENCLAVE_VIOLATION");
            }
            this.container = container;
            this.api = api;
            this.fs = api.fs; // Access the Virtual File System
        }

        async init() {
            this.log("MOUNTING_FS...");
            const data = await this.fs.read('config.json') || { greeting: "Hello VPU" };
            this.render(data);
        }

        render(data) {
            this.container.innerHTML = \`
                <div class="vpu-module">
                    <h3>\${data.greeting}</h3>
                    <button id="save-btn">SAVE_STATE</button>
                </div>\`;
                
            this.container.querySelector('#save-btn').onclick = async () => {
                await this.fs.write('config.json', { greeting: "Updated via FS" });
                alert("State Saved to Enclave Storage");
            };
        }

        log(msg) { console.log(\`[\${this.constructor.name}] > \${msg}\`); }
    }`;
    }

    updateEditor() {
        const textarea = this.container.querySelector('#logic-editor');
        const highlight = this.container.querySelector('#highlighting-layer');
        const gutter = this.container.querySelector('#line-numbers');
        
        let content = textarea.value;
        gutter.innerHTML = Array.from({length: content.split('\n').length}, (_, i) => i + 1).join('<br>');

        content = content
            .replace(/&/g, "&amp;").replace(/</g, "&lt;")
            .replace(/\/\/.*/g, '<span class="comment">$&</span>')
            .replace(/\b(import|export|class|constructor|this|new|throw|await|async|return|if|else)\b/g, '<span class="js-kw">$&</span>')
            .replace(/'.*?'|".*?"/g, '<span class="string">$&</span>');

        highlight.innerHTML = content + "\n";
    }

    async handleCommit() {
    // 1. Capture the current buffer
    const code = this.container.querySelector('#logic-editor').value;
    
    // Invoke SOVEREIGN for a Philosophy Audit
    this.log("SOVEREIGN: Auditing code for Article 13.2 compliance...", "info");
    
    const audit = await window.SOVEREIGN.auditCode(code);
    if (audit.violations.length > 0) {
        this.log(`SOVEREIGN_VETO: ${audit.violations.join(', ')}`, "critical");
        const proceed = await this.sovereignPrompt("COMPLIANCE_WARNING", 
            "This code violates Sovereign limits. Proceed anyway?", 
            [{id: 'fix', label: 'FIX_CODE'}, {id: 'ignore', label: 'FORCE_COMMIT'}]
        );
        if (proceed === 'fix') return;
    }
    
    // --- NEW: SYSTEM HEALTH CHECK ---
    this.log("PERFORMING_CORE_INTEGRITY_CHECK...", "info");
    
    const issues = [];
    if (code.includes('window.') || code.includes('document.')) {
        issues.push("GLOBAL_SCOPE_POLLUTION: Use this.container instead.");
    }
    if (code.includes('setInterval') && !code.includes('clearInterval')) {
        issues.push("MEMORY_LEAK_RISK: Missing interval cleanup.");
    }

    if (issues.length > 0) {
        this.log(`COMMIT_BLOCKED: ${issues.join(' | ')}`, "critical");
        return; // Halt the commit
        }

    // 2. Trigger the tactical selection modal
    const choice = await this.sovereignPrompt("COMMIT_SEQUENCE", "Select deployment path:", [
        { id: 'live', label: 'LIVE_VIEW', desc: 'Temporary sandboxed test' },
        { id: 'save', label: 'SAVE_DRAFT', desc: 'Keep in local repository' },
        { id: 'publish', label: 'PUBLISH', desc: 'Submit for leadership review' }
    ]);

    // 3. Execution Logic
    if (choice === 'live') {
        this.log("INIT_LIVE_SESSION: Routing to sandbox...", "info");
        
        // Launch internal preview window
        this.launchLivePreview(code, this.activeManifest);
        
        // Optional: Notify global kernel if present
        if (window.kernel && window.kernel.executeTemporary) {
            window.kernel.executeTemporary(code, this.activeManifest);
        }
    } else if (choice === 'save') {
        this.publishToHive(code, "DRAFT_ONLY");
    } else if (choice === 'publish') {
        this.log("PREPARING_HIVE_SYNC...", "info");
        this.synthesize(code);
    }
}



    async synthesize(appCode) {
        this.log("INIT_SYNTHESIS_PROTOCOL...", "info");
        try {
            const signature = await this.api.crypto.sign(appCode, this.activeManifest);
            this.publishToHive(appCode, signature);
        } catch (err) {
            this.log("SYNTHESIS_FAILED: Sig invalid.", "critical");
        }
    }

    publishToHive(appCode, signature) {
    const systemId = this.activeManifest.id;
    if (!systemId || systemId === "undefined") {
        this.log("COMMIT_ABORTED: Invalid Node ID. Re-initialize Identity.", "critical");
        return;
    }
    
    const proposalNode = {
        ...this.activeManifest,
        code: appCode,
        signature: signature,
        // Mark as SANDBOXED to prevent the App Center from auto-mounting a 
        // potentially conflicting UI thread.
        lifecycle: (signature === "DRAFT_ONLY") ? "DRAFT" : "SANDBOXED", 
        timestamp: Date.now()
    };

    try {
        const localRegistry = JSON.parse(localStorage.getItem('vpu_local_registry') || '[]');
        
        // 1. Immutable Update: Remove old version and add the new one
        const filtered = localRegistry.filter(a => a.id !== systemId);
        filtered.push(proposalNode);
        
        // 2. Commit to VFS (Local Storage)
        localStorage.setItem('vpu_local_registry', JSON.stringify(filtered));
        
        // 3. FORCE CONTEXT RESET: This is what releases the Inspector Bar.
        // We clear any active preview before the App Center tries to refresh.
        const stage = document.getElementById('vpu-live-stage');
        if (stage) {
            stage.innerHTML = ""; 
            stage.classList.add('hidden');
        }

        this.log(`SOVEREIGN_COMMIT_SUCCESS: ${systemId}`, "success");
        this.refreshRepoList();

        // 4. SHELL NOTIFICATION: Tell the Core OS to refresh the Inspector 
        // Bar asynchronously so it doesn't lock the UI thread.
        window.dispatchEvent(new CustomEvent('vpu:core_refresh', { 
            detail: { target: systemId, action: 'COMMIT' } 
        }));

    } catch (err) {
        this.log("HIVE_SYNC_FAILED: Registry Storage Full", "critical");
    }
}

    log(msg, type = "info") {
        const log = this.container.querySelector('#forge-log');
        const time = new Date().toLocaleTimeString([], { hour12: false, minute: "2-digit", second: "2-digit" });
        const entry = document.createElement('div');
        entry.className = `log-entry ${type}`;
        entry.innerHTML = `<span class="log-time">[${time}]</span> > ${msg}`;
        log.prepend(entry);
    }

    sovereignPrompt(title, text, options) {
    return new Promise((resolve) => {
        const promptDiv = document.createElement('div');
        promptDiv.className = 'forge-overlay';
        promptDiv.innerHTML = `
            <div class="config-modal commit-modal">
                <div class="modal-header">
                    <h3 class="section-title">${title}</h3>
                    <span class="protocol-tag">VPU_PROTOCOL_v1.0</span>
                </div>
                <p class="modal-desc">${text}</p>
                
                <div class="prompt-grid">
                    ${options.map(o => `
                        <button class="prompt-card" data-id="${o.id}">
                            <div class="card-glow"></div>
                            <div class="card-content">
                                <span class="card-label">${o.label}</span>
                                <span class="card-desc">${o.desc}</span>
                            </div>
                            <div class="card-status status-${o.id}">READY</div>
                        </button>
                    `).join('')}
                </div>
                
                <div class="modal-footer">
                    <button id="abort-prompt" class="btn-sec">ABORT_SEQUENCE</button>
                </div>
            </div>`;
            
        this.container.appendChild(promptDiv);

        // Selection Logic
        promptDiv.querySelectorAll('.prompt-card').forEach(btn => {
            btn.onclick = () => { promptDiv.remove(); resolve(btn.dataset.id); };
        });

        promptDiv.querySelector('#abort-prompt').onclick = () => {
            promptDiv.remove();
            this.log("SEQUENCE_ABORTED_BY_USER", "warn");
        };
    });
}

    refreshRepoList() {
        const list = this.container.querySelector('#local-app-list');
        const apps = JSON.parse(localStorage.getItem('vpu_local_registry') || '[]');
        list.innerHTML = apps.map(app => `
            <div class="repo-item" data-id="${app.id}">
                <span>${app.icon}</span>
                <div class="repo-info">
                    <div class="repo-name">${app.name}</div>
                    <div class="repo-meta">${app.lifecycle}</div>
                </div>
            </div>`).join('');
        list.querySelectorAll('.repo-item').forEach(item => {
            item.onclick = () => this.loadAppToForge(item.dataset.id);
        });
    }


    loadAppToForge(id) {
    // UI Cleanup
    this.container.querySelectorAll('.repo-item').forEach(el => el.classList.remove('active'));
    const activeItem = this.container.querySelector(`.repo-item[data-id="${id}"]`);
    if (activeItem) activeItem.classList.add('active');

    const apps = JSON.parse(localStorage.getItem('vpu_local_registry') || '[]');
    const app = apps.find(a => a.id === id);
    if (!app) return;

    // Load Data
    this.activeManifest = { ...app };
    this.container.querySelector('#active-node-name').innerText = app.name.toUpperCase();
    this.container.querySelector('#forge-status').innerText = `EDITING: ${app.id}`;
    this.container.querySelector('#forge-status').style.color = '#a445ff';
    
    const editor = this.container.querySelector('#logic-editor');
    editor.value = app.code;
    
    this.updateEditor();
    this.log(`FILE_OPENED: ${app.name} (${app.lifecycle})`, "info");
    this.container.querySelector('#delete-btn').style.display = 'inline-block';
    (app.id && app.id !== 'undefined') ? 'inline-block' : 'none';
}

async launchLivePreview(code, manifest) {
    this.log("INIT_SANDBOX: Isolating execution thread...", "info");

    // 1. Get or Create the Stage
    let stage = document.getElementById('vpu-live-stage');
    if (!stage) {
        stage = document.createElement('div');
        stage.id = 'vpu-live-stage';
        this.container.appendChild(stage);
    }
    
    // 2. Explicitly set classes and display
    stage.className = 'forge-overlay'; 
    stage.style.display = 'flex'; // Force visibility

    stage.innerHTML = `
        <div class="preview-window">
            <div class="preview-header">
                <span>LIVE_PREVIEW: ${manifest.name}</span>
                <button id="close-preview-btn" class="exit-btn">EXIT_SANDBOX</button>
            </div>
            <div id="preview-viewport"></div>
        </div>`;
    
    // 3. Setup the EXIT listener immediately
    stage.querySelector('#close-preview-btn').onclick = () => {
        stage.style.display = 'none';
        stage.classList.add('hidden');
        this.log("SANDBOX_TERMINATED.", "info");
    };

    // 4. Execution Bridge
    try {
        const blob = new Blob([code], { type: 'application/javascript' });
        const moduleUrl = URL.createObjectURL(blob);
        
        // Clean dynamic import
        const module = await import(moduleUrl);
        const AppClass = Object.values(module)[0]; 
        
        const viewport = stage.querySelector('#preview-viewport');
        const apiBridge = {
            signature: 'SOVEREIGN_CORE_V1',
            // Ensure crypto exists so synthesize() doesn't fail
            crypto: {
                sign: async (data) => `SIG_MOCK_${btoa(data).slice(0, 8)}` 
            },
            fs: manifest.permissions?.fs ? this.mountVirtualFS(manifest.id) : null,
            registry: this.registry
        };

        const instance = new AppClass(viewport, apiBridge);
        if (instance.init) await instance.init();
        
        this.log("SANDBOX_READY: Execution successful.", "success");
    } catch (err) {
    // Log the detailed error to the terminal for debugging
    this.log(`RUNTIME_PANIC: ${err.message}`, "critical");
    console.error(err); // View the stack trace in browser console

    stage.querySelector('#preview-viewport').innerHTML = `
        <div style="color:#ff3366; padding:20px; font-family:monospace; background:#000; border:1px solid #ff3366;">
            <div style="margin-bottom:10px; font-weight:bold;">[RUNTIME_PANIC]</div>
            <div style="font-size:12px; opacity:0.8;">${err.message}</div>
            <div style="font-size:10px; margin-top:10px; color:#666;">Check terminal for stack trace.</div>
        </div>`;
    }
}

mountVirtualFS(appId) {
    return {
        read: async (key) => JSON.parse(localStorage.getItem(`fs_${appId}_${key}`)),
        write: async (key, val) => localStorage.setItem(`fs_${appId}_${key}`, JSON.stringify(val))
    };
}
}