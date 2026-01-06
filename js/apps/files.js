/**
 * apps/files.js - Sovereign File Explorer
 */
export class FilesApp {
    constructor(container, sessionKey) {
        this.container = container;
        this.key = sessionKey; 
        this.currentDir = "home";
    }

    async init() {
        console.log("FilesApp: Requesting Enclave Access...");
        
        // If no key is passed from Kernel, we show a locked state instead of hanging
        if (!this.key) {
            this.container.innerHTML = `
                <div style="padding:20px; color:#ff4444; font-family:monospace;">
                    [AUTH_ERR]: Enclave Locked. <br> 
                    Please re-login to derive master key.
                </div>`;
            return;
        }

        try {
            // Using the Global VFS loaded in your HTML
            const VFS = window.SovereignVFS;
            const test = await VFS.read("home/readme.txt", this.key);
            
            console.log("FilesApp: Enclave Verified.");
            await this.render();
        } catch (e) {
            console.error("FilesApp: VFS Read Failure", e);
            this.container.innerHTML = `<div style="padding:20px; color:#ff4444;">[ERR]: Decryption Failed.</div>`;
        }
    }

    async render() {
        const files = [
            { name: "readme.txt", path: "home/readme.txt", icon: "📄" },
            { name: "investors.txt", path: "home/documents/investors.txt", icon: "📊" }
        ];

        this.container.innerHTML = `
            <div class="file-grid" style="display:grid; grid-template-columns: repeat(auto-fill, 90px); gap:20px; padding:20px;">
                ${files.map(f => `
                    <div class="file-item" style="text-align:center; cursor:pointer;" onclick="alert('Opening: ${f.name}')">
                        <div style="font-size:40px;">${f.icon}</div>
                        <div style="font-size:11px; color:#00ff41; margin-top:5px; font-family:monospace;">${f.name}</div>
                    </div>
                `).join('')}
            </div>
        `;
    }
}