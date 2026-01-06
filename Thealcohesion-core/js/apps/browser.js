/**
 * apps/browser.js - The Sovereign VPU Gateway
 * Features: Search, History, Downloads, and Enclave Integration
 */
export class BrowserApp {
    constructor(container, sessionKey) {
        this.container = container;
        this.key = sessionKey;
        
        // App State
        this.view = 'web'; 
        this.history = [];
        this.downloads = [
            { name: "investors_backup.json", date: "2025-12-26", size: "12KB" }
        ];
        this.currentUrl = "vpu://genesis.core";
    }

    async init() {
        this.render();
        this.loadPage(this.currentUrl);
    }

    render() {
        this.container.innerHTML = `
            <div class="browser-main" style="display: flex; height: 100%; background: #1a1a1b; color: #fff; font-family: 'Segoe UI', sans-serif; overflow: hidden;">
                
                <div class="browser-sidebar" style="width: 65px; background: #202124; border-right: 1px solid #3c4043; display: flex; flex-direction: column; align-items: center; padding-top: 20px; gap: 25px;">
                    <div title="Web Home" class="nav-icon" data-view="web" style="cursor:pointer; font-size:22px; opacity: 0.7;">🌐</div>
                    <div title="History" class="nav-icon" data-view="history" style="cursor:pointer; font-size:22px; opacity: 0.7;">⏳</div>
                    <div title="Downloads" class="nav-icon" data-view="downloads" style="cursor:pointer; font-size:22px; opacity: 0.7;">📥</div>
                    <div style="margin-top:auto; margin-bottom:25px; font-size:22px; cursor:pointer;" title="Secure Enclave" onclick="this.closest('.browser-main').dataset.instance.loadPage('vpu://enclave/investors.txt')">🔐</div>
                </div>

                <div style="flex-grow: 1; display: flex; flex-direction: column; position: relative;">
                    
                    <div id="browser-toolbar" style="padding: 10px 15px; background: #2c2c2e; display: flex; gap: 12px; align-items: center; border-bottom: 1px solid #3c4043;">
                        <div style="display: flex; gap: 10px; color: #888;">
                            <span style="cursor:pointer;" onclick="history.back()">⬅️</span>
                            <span style="cursor:pointer;" onclick="location.reload()">🔄</span>
                        </div>
                        <div class="address-bar" style="flex-grow: 1; background: #1c1c1e; border-radius: 20px; padding: 6px 15px; border: 1px solid #3a3a3c; display: flex; align-items: center;">
                            <span style="color: #00ff41; margin-right: 10px; font-size: 10px; font-weight: bold;">VPU</span>
                            <input type="text" id="browser-url" 
                                   style="background: none; border: none; color: #fff; width: 100%; outline: none; font-size: 13px;"
                                   placeholder="Search or enter VPU node...">
                        </div>
                    </div>

                    <div id="browser-viewport" style="flex-grow: 1; background: #fff; color: #000; overflow-y: auto;">
                        </div>
                </div>
            </div>
        `;

        // Attach instance for event delegation
        const main = this.container.querySelector('.browser-main');
        main.dataset.instance = this;

        // Setup UI Listeners
        this.container.querySelectorAll('.nav-icon').forEach(icon => {
            icon.onclick = () => this.setView(icon.dataset.view);
        });

        this.setupNavigation();
    }

    setView(view) {
        this.view = view;
        const viewport = this.container.querySelector('#browser-viewport');
        const toolbar = this.container.querySelector('#browser-toolbar');
        
        // Highlight active icon
        this.container.querySelectorAll('.nav-icon').forEach(i => i.style.opacity = i.dataset.view === view ? '1' : '0.4');

        if (view === 'web') {
            toolbar.style.display = 'flex';
            this.loadPage(this.currentUrl);
        } else {
            toolbar.style.display = 'none';
            if (view === 'history') this.renderHistory(viewport);
            if (view === 'downloads') this.renderDownloads(viewport);
        }
    }

    setupNavigation() {
        const input = this.container.querySelector('#browser-url');
        input.onkeydown = (e) => {
            if (e.key === 'Enter') {
                const query = input.value.trim();
                query.includes('://') ? this.loadPage(query) : this.performSearch(query);
            }
        };
    }

    loadPage(url) {
        this.currentUrl = url;
        const viewport = this.container.querySelector('#browser-viewport');
        const input = this.container.querySelector('#browser-url');
        if (input) input.value = url;

        // Log to history
        this.history.unshift({ url, time: new Date().toLocaleTimeString() });

        // Handle Enclave Access
        if (url.startsWith('vpu://enclave/')) {
            window.kernel.openSecureFile(url.replace('vpu://enclave/', 'home/documents/'));
            viewport.innerHTML = `<div style="padding:40px; text-align:center;">
                <h3>🔒 Secure Handshake</h3>
                <p>Opening local resource: <b>${url}</b></p>
            </div>`;
            return;
        }

        // Render Page Content
        if (url.includes('investor')) {
            viewport.innerHTML = this.getInvestorPortalHTML();
        } else {
            viewport.innerHTML = this.getSearchLandingHTML();
        }
    }

    performSearch(query) {
        const viewport = this.container.querySelector('#browser-viewport');
        let resultsHTML = `<div style="padding:40px; font-family:sans-serif;">
            <h3 style="color:#5f6368;">Search results for: ${query}</h3>`;

        // Logic: Check for Enclave Match
        if (query.toLowerCase().match(/invest|allot|2025/)) {
            resultsHTML += `
                <div style="margin: 20px 0; padding: 15px; border: 1px solid #00ff41; background: #f0fff4;">
                    <div style="color:#1a0dab; font-size:18px; cursor:pointer;" onclick="this.closest('.browser-main').dataset.instance.loadPage('vpu://enclave/investors.txt')">
                        📄 Encrypted Asset: 2025-12-26_INVESTORS.txt
                    </div>
                    <div style="color:#006621; font-size:13px;">vpu://enclave/investors.txt 🔒</div>
                    <p style="font-size:14px; color:#444;">Access protected by Sovereign Core. Contains genesis allotment data.</p>
                </div>`;
        }

        resultsHTML += `
            <div style="margin-top:20px;">
                <p style="color:#1a0dab;">VPU Genesis Node</p>
                <p style="font-size:14px;">The backbone of the Sovereign network layer.</p>
            </div>
        </div>`;
        
        viewport.innerHTML = resultsHTML;
    }

    renderHistory(viewport) {
        viewport.innerHTML = `
            <div style="padding: 40px;">
                <h2 style="border-bottom: 2px solid #eee; padding-bottom: 10px;">Session History</h2>
                <div style="margin-top:20px;">
                    ${this.history.map(h => `
                        <div style="display:flex; justify-content:space-between; padding:12px 0; border-bottom:1px solid #f5f5f5;">
                            <span style="color:#1a0dab; cursor:pointer;" onclick="this.closest('.browser-main').dataset.instance.loadPage('${h.url}')">${h.url}</span>
                            <span style="color:#999; font-size:12px;">${h.time}</span>
                        </div>
                    `).join('')}
                </div>
            </div>`;
    }

    renderDownloads(viewport) {
        viewport.innerHTML = `
            <div style="padding: 40px;">
                <h2 style="border-bottom: 2px solid #eee; padding-bottom: 10px;">Enclave Exports</h2>
                <table style="width:100%; margin-top:20px; border-collapse:collapse; text-align:left;">
                    <tr style="color:#777; font-size:12px; border-bottom:1px solid #ddd;">
                        <th style="padding:10px;">FILE</th><th>DATE</th><th>SIZE</th>
                    </tr>
                    ${this.downloads.map(d => `
                        <tr style="border-bottom:1px solid #eee; font-size:14px;">
                            <td style="padding:15px; color:#1a73e8; font-weight:bold;">${d.name}</td>
                            <td>${d.date}</td>
                            <td>${d.size}</td>
                        </tr>
                    `).join('')}
                </table>
            </div>`;
    }

    getSearchLandingHTML() {
        return `
            <div style="padding: 80px 20px; text-align: center;">
                <h1 style="font-size: 48px; margin-bottom: 10px; font-weight: 800; letter-spacing: -1.5px;">Sovereign<span style="color:#00ff41">VPU</span></h1>
                <p style="color:#666; margin-bottom:30px;">Member: MEMBER_001 | Node: Core_01</p>
                <div style="max-width:550px; margin: 0 auto;">
                    <input type="text" placeholder="Explore the Pragmatic Universe..." 
                           style="width:100%; padding:14px 25px; border-radius:30px; border:1px solid #dfe1e5; font-size:16px; box-shadow: 0 1px 6px rgba(32,33,36,0.1); outline:none;">
                </div>
            </div>`;
    }

    getInvestorPortalHTML() {
        return `
            <div style="background: #000; color: #00ff41; padding: 40px; min-height: 100%; font-family: 'Courier New', monospace; line-height: 1.6;">
                <h2 style="border-left: 4px solid #00ff41; padding-left: 15px;">PORTAL // INVESTOR_RELATIONS</h2>
                <p style="margin-top:30px;">[IDENTIFYING MEMBER...] <br> [SUCCESS: MEMBER_001]</p>
                <div style="border: 1px solid #333; padding: 20px; margin-top:20px;">
                    <h3 style="color:#fff;">EPOS GENESIS RECORD</h3>
                    <p>Allotment Date: 2025-12-26</p>
                    <p>VPU Holdings: <span style="font-size:24px;">15,000,000</span></p>
                    <p>Status: UNLOCKED via SESSION_KEY</p>
                </div>
            </div>`;
    }
}