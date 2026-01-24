import { MFS } from '../apps/mfs.js';

export class FilesApp {
    constructor(container, kernel) {
        this.container = container;
        this.kernel = kernel;
        this.activeCategory = 'Personal';
        window.app = this; // CRITICAL: Makes app.download() etc work from HTML strings
    }

    async init() {
        this.renderBase();
        this.navigateTo('Personal');
        this.updateTelemetry();
    }

   async navigateTo(cat, sub = null) {
    this.activeCategory = cat;
    const list = document.getElementById('file-mesh-list');
    const breadcrumb = document.getElementById('breadcrumb');
    
    //QUOTA TA
    // 1. Calculate Usage for Personal Sector
    const usageMB = (MFS.manifest.personalUsage / (1024 * 1024)).toFixed(2);
    const quotaPct = Math.min((usageMB / 100) * 100, 100);
    
    // 2. Build Tactical Breadcrumb
    const pathHtml = `<span class="path-root">DEVICE_STORAGE</span> / ${cat.toUpperCase()} ${sub ? ` / ${sub}` : ''}`;
    
    // 3. Build Integrated Quota Monitor
    const quotaHtml = cat === 'Personal' ? `
        <div class="quota-monitor">
            <span class="quota-label">STORAGE_MESH:</span>
            <div class="silo-bar">
                <div class="silo-fill" style="width: ${quotaPct}%"></div>
            </div>
            <span class="quota-val">${usageMB} / 100.00 MB</span>
        </div>
    ` : '';

    // Set the full header
    breadcrumb.innerHTML = `<div style="display: flex; width: 100%; align-items: center;">
        ${pathHtml} ${quotaHtml}
    </div>`;

    let html = '';
    if (!sub) {
        // --- VIEW: PROTOCOL FOLDER CARDS ---
        list.className = 'explorer-grid'; 
        const subs = await MFS.getSubFolders(cat);
        
        const cardPromises = subs.map(async (s, i) => {
            const path = MFS.getProtocolPath(cat, s);
            const remark = MFS.getProtocolRemark(cat, s);
            const folderFiles = MFS.manifest.files.filter(f => f.category === cat && f.path.startsWith(path));
            const totalSize = folderFiles.reduce((acc, f) => acc + f.size, 0);
            
            return `
                <div class="protocol-card" data-cat="${cat}" data-sub="${s}" 
                     style="animation: slideIn 0.3s forwards ${i * 0.08}s; opacity: 0;">
                    <div class="card-header">
                        <span class="card-icon">⬢</span>
                        <span class="card-title">${s}</span>
                    </div>
                    <div class="card-body">
                        <div class="stat-row"><span>PROTOCOL:</span><span class="val">${path}</span></div>
                        <div class="stat-row remark-box">
                        <span>REMARKS:</span>
                        <div class="remark-text">${remark}</div>
                    </div>
                        <div class="stat-row"><span>TOTAL_FILES:</span><span class="val">${folderFiles.length}</span></div>
                        <div class="stat-row"><span>TOTAL_SIZE:</span><span class="val">${(totalSize / 1024).toFixed(1)} KB</span></div>
                    </div>
                    <div class="card-footer">MOUNT_VOLUME</div>
                </div>
            `;
        });
        html = (await Promise.all(cardPromises)).join('');
    } else {
        // --- VIEW: SOVEREIGN TACTICAL FILE CARDS ---
        list.className = 'explorer-grid'; 
        
        const targetPath = MFS.getProtocolPath(cat, sub);
        // Important: Sort by date so Folio numbers are consistent
        const files = MFS.manifest.files
            .filter(f => f.category === cat && f.path.startsWith(targetPath))
            .sort((a, b) => new Date(a.created) - new Date(b.created));

        const getIcon = (type) => {
            const icons = { 'json': '⛁', 'pdf': '🗒', 'key': '🔐', 'txt': '⬡' };
            return icons[type] || '⬡';
        };

        const getClearance = (cat) => {
            if (cat === 'Finance' || cat === 'Personnel') return 'CONFIDENTIAL';
            if (cat === 'Records') return 'RESTRICTED';
            return 'UNRESTRICTED';
        };

        html = files.length > 0 ? files.map((f, i) => {
            // FIX: Define folio and fullRef before using them
            const folio = i + 1;
            const fullRef = `${targetPath}${folio}`;
            const isRecent = (new Date() - new Date(f.modified)) < 86400000;
            const fakeHash = `MD5:${Math.random().toString(16).slice(2, 10).toUpperCase()}`;
            
            return `
            <div class="file-card ${f.urgency}" style="animation: slideIn 0.3s forwards ${i * 0.05}s; opacity: 0;">
                <div class="file-card-header">
                    <span class="file-ext">${getIcon(f.type)} ${f.type.toUpperCase()}</span>
                    <span class="clearance-tag">${getClearance(f.category)}</span>
                    <span class="folio-tag">FOLIO_${folio}</span>
                </div>
                <div class="file-card-body">
                    <div class="file-title">
                        ${isRecent ? '<span class="pulse-dot"></span>' : ''}
                        <span class="scramble-text">${f.name}</span>
                    </div>
                    <div class="file-telemetry">
                        <div class="t-row ref-row"><span>REF:</span> <span class="val">${fullRef}</span></div>
                        <div class="t-row"><span>AUTH:</span> <span class="val">${f.author}</span></div>
                        <div class="t-row"><span>INTEGRITY:</span> <span class="val" style="font-size:7px">${fakeHash}</span></div>
                        <div class="t-row"><span>CREATED:</span> <span class="val">${f.created}</span></div>
                        <div class="t-row"><span>MODIFIED:</span> <span class="val">${f.modified}</span></div>
                        <div class="t-row"><span>VIEWS:</span> <span class="val">${f.views || 0}</span></div>
                    </div>
                </div>
                <div class="file-card-footer">
                    <div class="default-footer">STATUS_ENCRYPTED</div>
                    <div class="card-actions">
                        <span onclick="app.download('${f.name}')" title="PULL_DATA">⤓</span>
                        <span onclick="app.copyPath('${fullRef}')" title="COPY_PATH">🔗</span>
                        <span onclick="app.wipe('${f.name}')" title="TERMINATE" class="wipe-btn">⊗</span>
                    </div>
                </div>
            </div>`;
        }).join('') : `
            <div class="empty-state-warning">
                <div class="pulse-icon">!</div>
                <span>NO_RECORDS_FOUND_IN_SECTOR</span>
            </div>`;
    }
    
    list.innerHTML = html || '<div class="mesh-row">NO_DATA_PULSE</div>';
    
    // Trigger effects after innerHTML is set
    this.applyScrambleEffect();
    this.setupTableEvents();
}
    applyScrambleEffect() {
        const elements = this.container.querySelectorAll('.scramble-text');
        elements.forEach(el => {
            const original = el.innerText;
            const chars = "!<>-_\\/[]{}—=+*^?#________";
            let iterations = 0;
            
            const interval = setInterval(() => {
                el.innerText = original.split("")
                    .map((char, index) => {
                        if(index < iterations) return original[index];
                        return chars[Math.floor(Math.random() * chars.length)];
                    }).join("");
                
                if(iterations >= original.length) {
                    clearInterval(interval);
                    el.innerText = original; // Ensure final text is perfect
                }
                iterations += 1/3;
            }, 30);
        });
    }

    renderBase() {
    this.container.innerHTML = `
        <div class="explorer-wrapper">
            <aside class="explorer-sidebar">
                <div class="explorer-brand">FILE ENCLAVE_PRO // V1.0</div>
                <div class="telemetry-box" id="sys-telemetry">MESH_LOAD: ACTIVE</div>
                <nav class="explorer-nav">
                    ${['Personal', 'Comms', 'Records', 'Finance', 'Personnel', 'Projects', 'Logistics'].map(cat => `
                        <div class="nav-node ${cat === this.activeCategory ? 'active' : ''}" data-cat="${cat}">${cat.toUpperCase()}</div>
                    `).join('')}
                    <div class="nav-separator"></div>
                    <div class="nav-node analytics-trigger" id="view-stats">📊 DATA_ANALYTICS</div>
                </nav>
            </aside>
            <main class="explorer-content">
                <header class="explorer-path">
                    <div class="path-line">
                        <span id="breadcrumb">ROOT</span>
                    </div>
                    <div class="search-scanner">
                            <div class="scanner-line"></div>
                            <span class="cmd-prefix">></span>
                            <input type="text" id="mesh-search" placeholder="SCAN_DATABASE..." spellcheck="false" autocomplete="off" />
                        </div>
                </header>
                <div id="file-mesh-list" class="explorer-table"></div>
            </main>
        </div>
    `;
    this.setupSidebar();
    this.setupSearch(); // Initialize the search listener
}


setupSearch() {
    const searchInput = this.container.querySelector('#mesh-search');
    const list = this.container.querySelector('#file-mesh-list');

    searchInput.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase().trim();
        if (query === "") {
            this.navigateTo(this.activeCategory); // Reset view if search is empty
            return;
        }

        let resultsHtml = '';
        
        // --- 1. SEARCH PROTOCOLS (FOLDERS) ---
        Object.keys(MFS.protocols).forEach(cat => {
            Object.entries(MFS.protocols[cat]).forEach(([name, data]) => {
                if (name.toLowerCase().includes(query) || data.remark.toLowerCase().includes(query) || data.path.toLowerCase().includes(query)) {
                    resultsHtml += `
                        <div class="protocol-card search-hit" onclick="app.navigateTo('${cat}', '${name}')">
                            <div class="card-header"><span class="card-icon">📁</span> ${name}</div>
                            <div class="card-body">
                                <div class="stat-row"><span>REF:</span> <span class="val">${data.path}</span></div>
                                <div class="remark-text">${data.remark}</div>
                            </div>
                        </div>`;
                }
            });
        });

        // --- 2. SEARCH MANIFEST (FILES) ---
        const fileHits = MFS.manifest.files.filter(f => 
            f.name.toLowerCase().includes(query) || 
            f.author.toLowerCase().includes(query) ||
            f.path.toLowerCase().includes(query)
        );

        resultsHtml += fileHits.map(f => {
            const fakeHash = `MD5:${Math.random().toString(16).slice(2, 8).toUpperCase()}`;
            return `
                <div class="file-card search-hit ${f.urgency}" onclick="app.navigateTo('${f.category}', '${f.path.split('/')[1]}')">
                    <div class="file-card-header">
                        <span class="file-ext">📄 ${f.type.toUpperCase()}</span>
                        <span class="folio-tag">SEARCH_RESULT</span>
                    </div>
                    <div class="file-card-body">
                        <div class="file-title">${f.name}</div>
                        <div class="file-telemetry">
                            <div class="t-row"><span>PATH:</span> <span class="val">${f.path}</span></div>
                            <div class="t-row"><span>HASH:</span> <span class="val">${fakeHash}</span></div>
                        </div>
                    </div>
                </div>`;
        }).join('');

        // --- 3. RENDER RESULTS ---
        list.className = 'explorer-grid search-mode';
        list.innerHTML = resultsHtml || `
            <div class="empty-state-warning">
                <div class="pulse-icon">?</div>
                <span>NO_MATCHES_FOUND_IN_MESH</span>
            </div>`;
            
        this.applyScrambleEffect();
    });
}


renderAnalytics() {
    const list = document.getElementById('file-mesh-list');
    list.className = 'explorer-grid'; // Use the grid for cards
    
    const categories = ['Comms', 'Records', 'Finance', 'Personnel', 'Projects', 'Logistics'];
    const totalFiles = MFS.manifest.files.length;

    list.innerHTML = categories.map((cat, i) => {
        const sectorFiles = MFS.manifest.files.filter(f => f.category === cat);
        const count = sectorFiles.length;
        const percentage = totalFiles > 0 ? Math.round((count / totalFiles) * 100) : 0;
        
        // Dynamic status based on volume density
        let status = "OPTIMAL";
        if (count > 5) status = "HIGH_DENSITY";
        if (count === 0) status = "VACANT";

        return `
            <div class="analytics-card" style="animation: slideIn 0.3s forwards ${i * 0.08}s; opacity: 0;">
                <div class="card-header">
                    <span class="card-icon">📊</span>
                    <span class="card-title">${cat.toUpperCase()}</span>
                </div>
                <div class="card-body">
                    <div class="stat-main">
                        <span class="big-num">${percentage}</span><span class="percent-sign">%</span>
                    </div>
                    <div class="stat-details">
                        <div class="t-row"><span>FOLIO_COUNT:</span> <span class="val">${count}</span></div>
                        <div class="t-row"><span>SECTOR_STATUS:</span> <span class="val">${status}</span></div>
                        <div class="t-row"><span>INTEGRITY:</span> <span class="val">ENCLAVED</span></div>
                    </div>
                    <div class="mini-bar">
                        <div class="mini-fill" style="width: ${percentage}%"></div>
                    </div>
                </div>
                <div class="card-footer">SECTOR_DENSITY_ANALYSIS</div>
            </div>
        `;
    }).join('');
}
    updateTelemetry() {
        setInterval(() => {
            const el = document.getElementById('sys-telemetry');
            if (el) el.innerHTML = `SYNC_ID: ${Math.random().toString(16).slice(2, 8).toUpperCase()}<br>ENTROPY: 0.99${Math.floor(Math.random()*9)}`;
        }, 3000);
    }

    // --- TACTICAL ACTIONS ---

    async download(fileName) {
        // Find file in manifest
        const file = MFS.manifest.files.find(f => f.name === fileName);
        if (!file) return;

        console.log(`PULLING_DATA: ${fileName}...`);
        
        // Create a virtual blob to simulate a real download
        const blob = new Blob([JSON.stringify(file, null, 2)], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        a.click();
        
        this.notify(`DATA_PULL_COMPLETE: ${fileName}`);
    }

    copyPath(path) {
        navigator.clipboard.writeText(path).then(() => {
            this.notify(`PATH_REPLICATED: ${path}`);
        });
    }

    wipe(fileName) {
        if (confirm(`CRITICAL: INITIATE TERMINATION OF ${fileName.toUpperCase()}?`)) {
            // Find the element and add a "glitch out" animation
            const cards = this.container.querySelectorAll('.file-card');
            cards.forEach(card => {
                if (card.innerText.includes(fileName)) {
                    card.style.animation = "glitchOut 0.4s forwards";
                    setTimeout(() => card.remove(), 400);
                }
            });
            this.notify(`OBJECT_TERMINATED: ${fileName}`, "high");
        }
    }

    notify(msg, priority = "normal") {
        const color = priority === "high" ? "#ff4545" : "#00ff41";
        console.log(`%c[SYS_MSG]: ${msg}`, `color: ${color}; font-weight: bold;`);
        // If you have a toast system, trigger it here
    }


    setupTableEvents() {
    // Listen for Card clicks
    this.container.querySelectorAll('.protocol-card').forEach(card => {
        card.onclick = () => this.navigateTo(card.dataset.cat, card.dataset.sub);
    });
}

    setupSidebar() {
        this.container.querySelectorAll('.nav-node').forEach(node => {
            node.onclick = () => {
                this.container.querySelectorAll('.nav-node').forEach(n => n.classList.remove('active'));
                node.classList.add('active');
                this.navigateTo(node.dataset.cat);
                this.container.querySelector('#view-stats').onclick = () => this.renderAnalytics();
            };
        });
    }
}