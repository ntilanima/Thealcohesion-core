/**
 * THEALCOHESION VPU IDE (Synthesized)
 * Logic: os.js SDK + Sovereign VFS Editor
 * Governance: Article 13.1 & 13.2 Enforcement
 */

import { registry } from '../os-core/registry-v2.js';
import { DevBridge } from '../os-core/bridge.js';

export class VpuIDE {
    constructor(container, api) {
        this.container = container;
        this.api = api;
        this.bridge = new DevBridge(api);
        this.activeFile = 'main.js';
        this.project = {
            id: 'new-capability',
            code: `// THEALCOHESION OS MODULE\nexport class App {\n  constructor(container, api) {\n    this.container = container;\n    this.api = api;\n  }\n\n  init() {\n    this.container.innerHTML = "<h1>Capability Active</h1>";\n  }\n}`
        };
    }

    init() {
        this.renderShell();
        this.renderExplorer();
    }

    renderShell() {
        this.container.innerHTML = `
            <div class="ide-wrapper" style="display: flex; height: 100%; background: #1e1e1e; color: #d4d4d4; font-family: 'Segoe UI', sans-serif;">
                <aside class="ide-sidebar" style="width: 220px; background: #252526; border-right: 1px solid #333; display: flex; flex-direction: column;">
                    <div style="padding: 12px; font-size: 11px; opacity: 0.6; letter-spacing: 1px;">EXPLORER</div>
                    <div id="file-explorer" style="flex: 1; padding: 10px;"></div>
                    <div style="padding: 10px; border-top: 1px solid #333;">
                        <button id="submit-btn" style="width: 100%; background: #a445ff; color: white; border: none; padding: 8px; border-radius: 4px; cursor: pointer; font-size: 11px; font-weight: bold;">SUBMIT PROPOSAL</button>
                    </div>
                </aside>

                <main style="flex: 1; display: flex; flex-direction: column;">
                    <div class="tabs" style="background: #2d2d2d; display: flex; font-size: 11px;">
                        <div style="background: #1e1e1e; padding: 10px 20px; border-top: 1px solid #a445ff; color: #00ff41;">${this.activeFile}</div>
                    </div>
                    
                    <div class="editor-container" style="display: flex; flex: 1; overflow: hidden;">
                        <textarea id="code-editor" style="flex: 1; background: #1e1e1e; color: #d4d4d4; padding: 20px; border: none; font-family: 'Courier New', monospace; font-size: 14px; outline: none; resize: none; border-right: 1px solid #333;">${this.project.code}</textarea>
                        
                        <div id="ide-preview" style="width: 40%; background: #0a0a0c; padding: 20px;">
                            <div style="font-size: 10px; opacity: 0.4; margin-bottom: 10px;">LIVE ENCLAVE PREVIEW</div>
                            <div id="sandbox-render"></div>
                        </div>
                    </div>

                    <footer style="background: #007acc; height: 22px; display: flex; align-items: center; padding: 0 10px; font-size: 11px; color: white; justify-content: space-between;">
                        <div>Sovereign-LSP: <span id="lsp-status">Active</span></div>
                        <div>Line 1, Col 1</div>
                        <div>UTF-8</div>
                    </footer>
                </main>
            </div>`;

        this.setupEventListeners();
    }

    renderExplorer() {
        const explorer = this.container.querySelector('#file-explorer');
        // Combined View: System Records + Active Project
        explorer.innerHTML = `
            <div style="color: #519aba; margin-bottom: 8px;">📁 system/records</div>
            <div class="file-link" style="padding-left: 15px; opacity: 0.8; cursor: pointer;">📄 investors.txt</div>
            <div class="file-link" style="padding-left: 15px; opacity: 0.8; cursor: pointer;">📄 epos-core.log</div>
            <div style="color: #519aba; margin: 10px 0 8px 0;">📁 current/project</div>
            <div class="file-link" style="padding-left: 15px; color: #00ff41;">📄 main.js</div>
        `;
    }

    setupEventListeners() {
        const editor = this.container.querySelector('#code-editor');
        const submitBtn = this.container.querySelector('#submit-btn');

        // Logic Enforcement (Rule 13.3)
        editor.addEventListener('input', (e) => {
            const code = e.target.value;
            if (code.includes('fetch') || code.includes('XMLHttpRequest')) {
                this.api.log("SEC-VIOLATION: External network calls detected.", "error");
                this.container.querySelector('#lsp-status').style.color = '#ff4444';
            } else {
                this.container.querySelector('#lsp-status').style.color = 'white';
                this.updatePreview(code);
            }
        });

        // Submit to Ethics (Rule 13.2)
        submitBtn.onclick = async () => {
            const manifest = { id: this.project.id, category: 'Social', roles: ['NATIVE'] };
            const result = await this.bridge.validateProposal(manifest, editor.value);
            if (result.approved) {
                this.api.notify("Proposal logged to /system/proposals", "success");
            }
        };
    }

    updatePreview(code) {
        const sandbox = this.container.querySelector('#sandbox-render');
        this.api.sandbox.execute(code, sandbox); // Renders code in protected context
    }
}