/**
 * vscode.js - Sovereign Code Editor
 */
export class VscodeApp {
    constructor(container, sessionKey) {
        this.container = container;
        this.sessionKey = sessionKey;
    }

    async init() {
        this.container.innerHTML = `
            <div class="vscode-container" style="display: flex; height: 100%; background: #1e1e1e; color: #d4d4d4; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
                <div class="vs-sidebar" style="width: 200px; background: #252526; border-right: 1px solid #333; padding: 10px; font-size: 12px;">
                    <div style="opacity: 0.5; margin-bottom: 10px; letter-spacing: 1px;">EXPLORER</div>
                    <div class="file-item" style="color: #00ff41; cursor: pointer;">📄 investors.txt</div>
                    <div class="file-item" style="opacity: 0.8; margin-top: 5px;">📄 readme.txt</div>
                </div>
                
                <div class="vs-main" style="flex: 1; display: flex; flex-direction: column;">
                    <div class="vs-tabs" style="background: #2d2d2d; display: flex; font-size: 11px;">
                        <div style="background: #1e1e1e; padding: 8px 15px; border-top: 1px solid #a445ff;">investors.txt</div>
                    </div>
                    <div class="vs-editor" style="flex: 1; padding: 20px; font-family: 'Courier New', monospace; line-height: 1.5; outline: none; white-space: pre-wrap;" contenteditable="true">
// LOADING SECURE ENCLAVE DATA...
// VERSION: 1.2.8 (2025-12-26)

[RECORD_START]
Entity: EPOS_CORE
Allotment: 15,000,000 VPU
Status: VERIFIED
[RECORD_END]
                    </div>
                    <div style="background: #007acc; height: 22px; display: flex; align-items: center; padding: 0 10px; font-size: 11px; color: white; justify-content: space-between;">
                        <div>UTF-8</div>
                        <div>Sovereign-LSP: Online</div>
                    </div>
                </div>
            </div>
        `;

        this.setupEditorLogic();
    }

    setupEditorLogic() {
        const editor = this.container.querySelector('.vs-editor');
        // Add a "Save" listener (Ctrl + S)
        editor.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.key === 's') {
                e.preventDefault();
                console.log("VS Code: Saving to VFS...");
                // Here we would call SovereignVFS.write()
            }
        });
    }
}