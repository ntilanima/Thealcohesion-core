/**
 * AURORA v1.1 - THEALCOHESION OS CORE
 * Role: Adaptive Unified Reasoning OS Assistant (AURORA)
 * Logic: Intent-First, Permission-Checked, Local-First
 */

import { registry } from './registry-v2.js';

export class SovereignAI {
    constructor(container, api) {
        this.container = container;
        this.api = api;
        this.registry = registry;
        this.fs = api.fs;
        this.memory = []; 
        this.activeSource = null;
        // USE THE FULL PATH VERIFIED BY YOUR LS COMMAND
        this.DOC_DIR = './Docs/';
    }

    async init() {
        this.injectStyles();
        this.renderShell(); 
        
        this.logSystem("AURORA_CORE v2.3.2: Initiating VFS Handshake...");

        try {
            // Attempt to list the absolute path
            const files = await this.fs.list(this.DOC_DIR);
            this.logSystem(`VFS_MOUNTED: ${files.length} documents indexed.`);
            console.log('[AURORA VFS Success]', files);
        } catch (err) {
            this.logSystem("VFS_ERROR: Absolute path not reachable. Trying relative fallback...");
            this.DOC_DIR = 'Docs/'; // Fallback to relative if absolute fails
            try {
                await this.fs.list(this.DOC_DIR);
            } catch (e) {
                this.logSystem("VFS_CRITICAL: All pathing failed.");
            }
        }

        await this.updateVFSExplorer();
        this.showOnboarding();
    }

   async updateVFSExplorer() {
    const vfsContainer = this.container.querySelector('#vfs-list');
    if (!vfsContainer) return;

    try {
        // 1. NATIVE MANIFEST: Define your files manually since JS can't 'scan'
        // This ensures your EPOS and Allotment docs are always found
        const mdFiles = [
            'allotment.md', 
            'mtaagrid.md', 
            'constitution.md'
        ];

        // 2. RENDER: Create the UI elements
        vfsContainer.innerHTML = mdFiles
            .map(f => `
                <div class="file-item" data-filename="${f}" style="cursor:pointer; transition: 0.2s;">
                    <span class="file-icon">▤</span> ${f}
                </div>
            `).join('');

        // 3. NATIVE FETCH LISTENERS:
        vfsContainer.querySelectorAll('.file-item').forEach(item => {
            item.onclick = async () => {
                const filename = item.getAttribute('data-filename');
                this.logSystem(`READING: ${filename}...`);
                
                try {
                    // Using Native Fetch to get the content directly from the folder
                    const response = await fetch(`./Docs/${filename}`);
                    if (!response.ok) throw new Error('File not found');
                    
                    const content = await response.text();
                    
                    // Display the content in the chat
                    this.appendMessage('aurora', `### Analysis: ${filename}\n\n${content}`);
                    this.updateSidebar(filename);
                } catch (err) {
                    this.appendMessage('aurora', `[FETCH_ERROR]: Could not read ${filename}. Ensure it exists in /Docs/`);
                }
            };
        });

    } catch (e) {
        console.error("Native Explorer Error:", e);
        vfsContainer.innerHTML = '<div class="err">VFS_OFFLINE</div>';
    }
}

   async handleQuery(input) {
    if (!input?.trim()) return;
    const query = input.trim();
    this.appendMessage('user', query);
    
    // 1. Define Manifest (Add all project files here)
    const manifest = ['mtaagrid.md', 'investors.md', 'constitution.md'];
    this.simulateVPU(true);

    try {
        // 2. MULTIPLE OUTPUT: Fetch all files in parallel
        const results = await Promise.all(manifest.map(async (fileName) => {
            try {
                const response = await fetch(`./Docs/${fileName}`);
                if (!response.ok) return null;
                const text = await response.text();

                // 3. PRECISION: Targeted Paragraph Search
                const paragraphs = text.split(/\n\s*\n/);
                const searchRegex = new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
                
                const matchedSegments = paragraphs.filter(p => searchRegex.test(p));
                
                return matchedSegments.length > 0 
                    ? { fileName, segments: matchedSegments } 
                    : null;
            } catch (e) { return null; }
        }));

        // 4. AGGREGATION: Filter out nulls and combine results
        const finalMatches = results.filter(r => r !== null);

        if (finalMatches.length > 0) {
            let combinedResponse = `### SCAN_RESULTS: ${finalMatches.length} NODES FOUND\n\n`;
            
            finalMatches.forEach(match => {
                combinedResponse += `#### SOURCE: ${match.fileName}\n`;
                match.segments.forEach(seg => {
                    combinedResponse += `> ${seg.trim()}\n\n`;
                });
                combinedResponse += `---\n`;
            });

            this.appendMessage('aurora', combinedResponse);
            this.activeSource = finalMatches[0]; // Set primary source for sidebar
            this.updateSidebar();
        } else {
            // Fallback to AI if no precise local match exists
            const aiFallBack = await this.api.ai.generate({
                prompt: query,
                system: "You are AURORA. No local files matched precisely. Provide a reasoned response."
            });
            this.appendMessage('aurora', aiFallBack);
        }
    } catch (err) {
        this.appendMessage('aurora', "[SYS_FAULT]: Multi-output stream interrupted.");
    } finally {
        this.simulateVPU(false);
    }
}
    showOnboarding() {
        const welcomeMsg = `
        ### Welcome to AURORA v2.3
        **Sovereign OS Intelligence & Document Librarian**
        
        **What to Expect:**
        1. **Direct Extraction**: I scan your \`/Docs/\` folder for specific paragraphs matching your keywords.
        2. **System Awareness**: I can report on VPU RAM, OS Uptime, and Architecture.
        3. **Cognitive Fallback**: If no local files match, I use my core reasoning to assist.

        **How to get better interactions:**
        * **Use Keywords**: Instead of "Tell me about the rules," try "Constitution rules" or "Data privacy."
        * **Check the Sidebar**: The 'SCANNER_STATUS' tells you exactly which file I'm reading from.
        * **System Diagnostics**: Ask "System status" for a real-time health check.
        * **Multi-line Commands**: Use [Shift+Enter] for complex queries.
        `;
        this.appendMessage('aurora', welcomeMsg);
    }

    async ensureDirectoryExists() {
        // Attempt to list; if it fails, it needs initialization
        return await this.fs.list(this.DOC_DIR);
    }

    injectStyles() {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = '../apps/sovereign-ai-core.css';
        document.head.appendChild(link);
    }


    simulateVPU() {
        const bar = this.container.querySelector('#vpu-bar');
        if (bar) {
            const load = Math.floor(Math.random() * (45 - 5 + 1) + 5);
            bar.style.width = `${load}%`;
        }
    }


    setupListeners() {
        const input = this.container.querySelector('#sov-input');
        const btn = this.container.querySelector('#sov-send');
        const feed = this.container.querySelector('#chat-feed');
        
        const run = () => { this.handleQuery(input.value); input.value = ''; };

        btn.onclick = run;
        input.onkeypress = (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); run(); } };

        // Detection for independent scroll behavior
        feed.onscroll = () => {
            const isAtBottom = feed.scrollHeight - feed.scrollTop <= feed.clientHeight + 100;
            const scrollBtn = this.container.querySelector('#jump-to-bottom');
            if (scrollBtn) {
                scrollBtn.style.display = isAtBottom ? 'none' : 'block';
            }
        };

        this.container.querySelector('#sync-vfs').onclick = () => {
        this.logSystem("RE-SCANNING_VFS...");
        this.updateVFSExplorer();
        };
    }

    renderShell() {
    this.container.style.position = 'relative';
    this.container.style.height = '100%';
    this.container.style.width = '100%';
    this.container.style.overflow = 'hidden';

    this.container.innerHTML = `
    <div class="sovereign-shell">
        <aside class="sov-sidebar">
            <div class="sov-module identity">
                <div class="mod-header">NODE_IDENTITY<span id="sync-vfs" style="float:right; cursor:pointer; color:#555;">⟳</span>
                    </div>
                <div class="mod-body">
                    <div class="stat-row"><span>ID:</span> <span class="val">AURORA_01</span></div>
                    <div class="stat-row"><span>STATUS:</span> <span class="val pulse">ACTIVE</span></div>
                </div>
            </div>

            <div class="sov-module">
                <div class="mod-header">VFS_EXPLORER</div>
                <div id="vfs-list" class="vfs-tree">
                    <div class="file-item">docs/constitution.md</div>
                </div>
            </div>

            <div class="sov-module log-module">
                <div class="mod-header">QUERY_LOGS</div>
                <div id="history-scroll" class="side-scroll">
                    </div>
            </div>

            <div class="sov-module">
                <div class="mod-header">RESOURCE_LOAD</div>
                <div class="stat-row"><span>VPU:</span> <div class="bar-bg"><div id="vpu-bar" class="bar-fill" style="width:12%"></div></div></div>
                <div id="source-path" class="path-tag">STANDBY</div>
            </div>
        </aside>

        <main class="sov-main">
            <div id="chat-feed" class="chat-scroll"></div>
            <button id="jump-to-bottom" class="jump-btn" style="display:none">↓ NEW_DATA</button>
            <div class="sov-input-area">
                <div class="input-wrapper">
                    <textarea id="sov-input" placeholder="Execute search or system command..."></textarea>
                    <button id="sov-send">➔</button>
                </div>
            </div>
        </main>
    </div>`;
    this.setupListeners();
        
        // click event for jump button
        this.container.querySelector('#jump-to-bottom').onclick = () => {
            const feed = this.container.querySelector('#chat-feed');
            feed.scrollTo({ top: feed.scrollHeight, behavior: 'smooth' });
        };
    }
    appendMessage(role, text) {
    const feed = this.container.querySelector('#chat-feed');
    if (!feed) return; // Safety check

    const entry = document.createElement('div');
    entry.className = `message-row ${role}`;
    
    // Simple formatting for Onboarding visibility
    let formattedText = text
        .replace(/\*\*(.*?)\*\*/g, '<b>$1</b>') // Bold
        .replace(/### (.*?)\n/g, '<h3>$1</h3>') // Headers
        .replace(/\* (.*?)\n/g, '• $1<br>');    // Bullets

    entry.innerHTML = `
        <div class="bubble">
            <div class="meta">${role.toUpperCase()}</div>
            <div class="text">${formattedText}</div>
        </div>`;
        
    feed.appendChild(entry);
    
    // Ensure the scroll happens after the DOM update
    requestAnimationFrame(() => {
        feed.scrollTop = feed.scrollHeight;
    });

    if (role === 'user') {
        const hist = this.container.querySelector('#history-scroll');
        if (hist) {
            const hItem = document.createElement('div');
            hItem.className = 'h-entry';
            hItem.innerText = `SCAN: ${text.substring(0, 15)}...`;
            hist.prepend(hItem);
        }
    }
}
    updateSidebar() {
        const tag = this.container.querySelector('#source-path');
        if (this.activeSource) tag.innerText = `FOUND: ${this.activeSource.file}`;
    }

    logSystem(msg) {
        this.appendMessage('aurora', `[BOOT_LOG]: ${msg}`);
    }

}