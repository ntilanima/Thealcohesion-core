/**
 * VPU HIVE (App Center) - SOVEREIGN EDITION
 * Restore: Right Bar Inspector & Provisioning Logic
 */
import { registry } from '../os-core/registry-v2.js';

export class HiveCenter {
    constructor(container, api) {
        if (!api || api.signature !== 'SOVEREIGN_CORE_V1') {
            container.innerHTML = `<div class="fatal-error">[FATAL]: UNAUTHORIZED_HIVE_ACCESS.</div>`;
            throw new Error("ENCLAVE_VIOLATION");
        }
        this.container = container;
        this.api = api;
        this.registry = registry;
        this.currentCategory = 'All';
        this.searchQuery = '';
    }

    init() {
        this.renderShell();
        this.renderMesh();
        this.setupListeners();
        window.hive = this;
    }

  

    renderShell() {
        this.container.innerHTML = `
            <div id="sovereign-hive" class="hive-wrapper">
                <div id="bubble-field" class="bubble-field"></div><aside class="hive-sidebar">
                    <div class="brand-section">
                        <div class="brand-meta">VPU_OS // CAPABILITY_HIVE</div>
                        <h2 class="brand-title">CORE <span class="accent">MESH</span></h2>
                    </div>

                    <div class="system-monitor">
                        <div class="monitor-item">
                            <label>SIGNAL_STATUS</label>
                            <div class="status-value"><span class="status-dot pulse"></span> ENCRYPTED</div>
                        </div>
                        <div class="monitor-item">
                            <label>VPU_MEM_LOAD</label>
                            <div class="status-value" id="vpu-mem-display">${this.api.getMemory()}%</div>
                            <div class="mini-progress"><div class="bar" style="width: ${this.api.getMemory()}%"></div></div>
                        </div>
                    </div>

                    <nav class="protocol-nav">
                        <div class="nav-label">SELECTION_PROTOCOLS</div>
                        <ul class="category-list">
                            <li class="cat-item active" data-cat="All">
                                <span class="nav-indicator"></span> [ ALL_NODES ]
                            </li>
                            <li class="cat-item" data-cat="System">
                                <span class="nav-indicator"></span> [ CORE_SYS ]
                            </li>
                            <li class="cat-item" data-cat="Finance">
                                <span class="nav-indicator"></span> [ ECON_FIN ]
                            </li>
                            <li class="cat-item" data-cat="Infrastructure">
                                <span class="nav-indicator"></span> [ INFRA_STR ]
                            </li>
                        </ul>
                    </nav>

                    <div class="sidebar-footer">
                        <div class="build-ver">BUILD_GENESIS_2025.12.26</div>
                        <div class="security-tag">🛡️ SOVEREIGN_ENCLAVE</div>
                    </div>
                </aside>

                <main class="hive-main">
                    <div class="command-header">
                        <div class="search-wrapper">
                            <span class="search-icon">⌕</span>
                            <input type="text" id="hive-search" placeholder="INITIALIZE NODE SEARCH..." autocomplete="off">
                        </div>
                    </div>
                    <div id="mesh-container" class="hive-grid"></div>
                </main>

                <aside id="inspector-panel" class="inspector-overlay hidden"></aside>
            </div>`;
        this.setupListeners();
        this.initBubbles();
    }
    
    initBubbles() {
        const field = this.container.querySelector('#bubble-field');
        field.innerHTML = ''; // Clear existing
        
        // CREATE A BUBBLE FOR EVERY REGISTERED APP
        this.registry.forEach((app, i) => {
            const bubble = document.createElement('div');
            bubble.className = `proto-bubble ${app.category.toLowerCase()}`;
            bubble.id = `bubble-${app.id}`;
            bubble.innerHTML = `<span>${app.name.toUpperCase()}</span>`;
            
            // Randomized tactical positioning across the background
            bubble.style.left = `${Math.random() * 80 + 5}%`;
            bubble.style.top = `${Math.random() * 80 + 5}%`;
            bubble.style.animationDelay = `${i * 0.5}s`;
            
            // Initial size weighted by manifest resources
            const initialSize = 80 + (app.manifest.resources.cpu * 10);
            bubble.style.setProperty('--size', `${initialSize}px`);
            
            field.appendChild(bubble);
        });
    }

    provisionNode(appId) {
        const app = this.registry.find(a => a.id === appId);
        const node = this.container.querySelector(`#node-${appId}`);
        const bubble = this.container.querySelector(`#bubble-${appId}`); 
        
        if (bubble && node) {
            this.createParticleStream(node, bubble);
            bubble.classList.add('expanding');
            
            // Persistent growth: The app "claims" more permanent space in the VPU
            const currentSize = parseFloat(bubble.style.getPropertyValue('--size'));
            bubble.style.setProperty('--size', `${currentSize + 60}px`);
        }

        if (node) node.classList.add('launching');
        setTimeout(() => {
            window.kernel.launchApp(appId);
            this.closeInspector();
        }, 800);
    }

    renderMesh() {
        const mesh = this.container.querySelector('#mesh-container');
        const filteredApps = this.registry.filter(app => {
            const catMatch = this.currentCategory === 'All' || app.category === this.currentCategory;
            const searchMatch = app.name.toLowerCase().includes(this.searchQuery.toLowerCase());
            return catMatch && searchMatch;
        });

        mesh.innerHTML = filteredApps.map(app => {
            const isGenesis = app.id === 'resource-pool';
            return `
                <div class="hex-node ${isGenesis ? 'genesis' : ''}" 
                     id="node-${app.id}"
                     style="--node-color: ${this.getCategoryColor(app.category)}"
                     onclick="window.hive.inspectNode('${app.id}')">
                    <div class="hex-inner">
                        <span class="hex-icon">${app.icon}</span>
                        <span class="hex-label">${app.name.toUpperCase()}</span>
                        <div class="resource-pulse"></div>
                    </div>
                </div>`;
        }).join('');
    }

inspectNode(appId) {
    const app = this.registry.find(a => a.id === appId);
    const inspector = this.container.querySelector('#inspector-panel');
    if (!app) return;

    if (this.telemetryInterval) clearInterval(this.telemetryInterval);

    inspector.classList.remove('hidden');
    inspector.innerHTML = `
        <div class="inspector-scroll-area">
            <header style="display:flex; justify-content:space-between; align-items:center;">
                <span class="id-tag">${app.protocol || 'VPU://SECURE_NODE'}</span>
                <button class="close-btn" onclick="window.hive.closeInspector()" style="background:none; border:none; color:#fff; cursor:pointer; font-size:20px;">×</button>
            </header>

            <div class="hero-section" style="text-align:center; margin:25px 0;">
                <div class="hero-icon" style="font-size:50px; text-shadow:0 0 15px ${this.getCategoryColor(app.category)}">${app.icon}</div>
                <h2 style="margin:10px 0; letter-spacing:1px;">${app.name}</h2>
                <span style="color:${this.getCategoryColor(app.category)}; font-size:10px; font-weight:bold;">${app.category.toUpperCase()} PROTOCOL</span>
            </div>

            <div class="telemetry-box">
                <label style="font-size:9px; color:#888;">LIVE RESOURCE LOAD</label>
                <div class="load-value" id="live-load" style="color:#00ff41; font-size:20px;">0%</div>
                <div class="chart-container" id="telemetry-chart">
                    ${Array(20).fill('<div class="chart-bar"></div>').join('')}
                </div>
            </div>

            <div class="meta-grid">
                <div class="meta-item">
                    <label>Manifest Purpose</label>
                    <span style="font-size:11px; line-height:1.4; opacity:0.8; display:block;">"${app.manifest.purpose}"</span>
                </div>
                <div class="meta-item">
                    <label>Lifecycle Status</label>
                    <span>${app.lifecycle || 'PRODUCTION_STABLE'}</span>
                </div>
                <div class="meta-item">
                    <label>System Author</label>
                    <span>${app.author || 'SOVEREIGN_CORE'}</span>
                </div>
                <div class="meta-item">
                    <label>Development Date</label>
                    <span>${app.dateCreated || '2025-12-26'}</span>
                </div>
                <div class="meta-item">
                    <label>Resource Truth</label>
                    <span style="font-size:11px; color:#00ccff;">CPU: ${app.manifest.resources.cpu} | RAM: ${app.manifest.resources.ram}MB</span>
                </div>
            </div>
        </div>

        <div class="provision-footer">
            <button class="provision-btn" onclick="window.hive.provisionNode('${app.id}')" 
                style="width:100%; padding:15px; background:#a445ff; color:#fff; border:none; border-radius:4px; font-weight:bold; cursor:pointer; box-shadow:0 4px 15px rgba(164,69,255,0.3);">
                PROVISION CAPABILITY
            </button>
        </div>
    `;

    this.startTelemetry();
}

    startTelemetry() {
    const chart = this.container.querySelector('#telemetry-chart');
    const loadLabel = this.container.querySelector('#live-load');
    const bars = chart.querySelectorAll('.chart-bar');
    
    this.telemetryInterval = setInterval(() => {
        const currentLoad = Math.floor(Math.random() * 40) + 10; // Simulated load
        loadLabel.innerText = `${currentLoad}%`;

        // Shift bars
        for (let i = 0; i < bars.length - 1; i++) {
            bars[i].style.height = bars[i+1].style.height;
            bars[i].className = bars[i+1].className;
        }

        // Add new bar
        const latest = bars[bars.length - 1];
        latest.style.height = `${currentLoad}%`;
        latest.className = currentLoad > 35 ? 'chart-bar active' : 'chart-bar';
    }, 200);
}
    createParticleStream(node, bubble) {
        const stream = document.createElement('div');
        stream.className = 'neural-stream';
        
        // Calculate coordinates
        const nRect = node.getBoundingClientRect();
        const bRect = bubble.getBoundingClientRect();
        
        const x1 = nRect.left + nRect.width / 2;
        const y1 = nRect.top + nRect.height / 2;
        const x2 = bRect.left + bRect.width / 2;
        const y2 = bRect.top + bRect.height / 2;

        const distance = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
        const angle = Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI;

        stream.style.width = `${distance}px`;
        stream.style.left = `${x1}px`;
        stream.style.top = `${y1}px`;
        stream.style.transform = `rotate(${angle}deg)`;

        this.container.appendChild(stream);
        setTimeout(() => stream.remove(), 800); // Cleanup after launch
    }

    closeInspector() {
        this.container.querySelector('#inspector-panel').classList.add('hidden');
    }

    getCategoryColor(cat) {
        const colors = { System: '#a445ff', Finance: '#00ff41', Social: '#00ccff', Infrastructure: '#ff3366' };
        return colors[cat] || '#ffffff';
    }

    setupListeners() {
        const searchInput = this.container.querySelector('#hive-search');
        if (searchInput) {
            searchInput.oninput = (e) => {
                this.searchQuery = e.target.value;
                this.renderMesh();
            };
        }

        this.container.querySelectorAll('.cat-item').forEach(item => {
            item.onclick = () => {
                this.container.querySelectorAll('.cat-item').forEach(i => i.classList.remove('active'));
                item.classList.add('active');
                this.currentCategory = item.dataset.cat;
                this.renderMesh();
            };
        });
    }
}