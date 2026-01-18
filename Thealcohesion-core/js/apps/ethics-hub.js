/**
 * THEALCOHESION ETHICS HUB
 * Role: MEGA_PERSONNEL ONLY
 * Purpose: Adjudication of Logic Proposals & Compliance Alerts
 */

export class EthicsHub {
    constructor(container, api) {
        this.container = container;
        this.api = api;
        this.alerts = [];
        this.proposals = [];
    }

    async init() {
        // Load pending items from the Sovereign VFS
        this.alerts = await this.api.vfs.readDir('system/alerts');
        this.proposals = await this.api.vfs.readDir('system/proposals');
        this.render();
    }

    render() {
        this.container.innerHTML = `
            <div class="ethics-wrapper" style="display: flex; height: 100%; background: #050505; color: #eee; font-family: 'Ubuntu', sans-serif;">
                <aside style="width: 300px; background: #0d0d0d; border-right: 1px solid #222; padding: 20px;">
                    <h2 style="color: #a445ff; font-size: 18px; margin-top: 0;">ETHICS TRIBUNAL</h2>
                    <div style="font-size: 10px; opacity: 0.5; margin-bottom: 20px;">AUTHORITY: MEGA_LEVEL</div>
                    
                    <div class="section-label" style="font-size: 11px; color: #ff4444; margin-bottom: 10px;">INTEGRITY ALERTS (${this.alerts.length})</div>
                    <div id="alert-list"></div>

                    <div class="section-label" style="font-size: 11px; color: #00ff41; margin: 20px 0 10px 0;">APP PROPOSALS (${this.proposals.length})</div>
                    <div id="proposal-list"></div>
                </aside>

                <main id="adjudication-panel" style="flex: 1; padding: 40px; display: flex; flex-direction: column; justify-content: center; align-items: center;">
                    <div style="text-align: center; opacity: 0.3;">
                        <span style="font-size: 60px;">⚖️</span>
                        <p>Select an item to begin Sovereign Review</p>
                    </div>
                </main>
            </div>
        `;
        this.populateLists();
    }

    populateLists() {
        const aList = this.container.querySelector('#alert-list');
        const pList = this.container.querySelector('#proposal-list');

        aList.innerHTML = this.alerts.map(a => `
            <div class="review-item alert" onclick="this.parentElement.dispatchEvent(new CustomEvent('inspect', {detail: '${a}'}))" 
                 style="background: rgba(255,0,0,0.1); padding: 10px; border-radius: 4px; margin-bottom: 5px; cursor: pointer; border-left: 3px solid #ff4444;">
                <small>${a.name}</small>
            </div>
        `).join('');

        pList.innerHTML = this.proposals.map(p => `
            <div class="review-item proposal" onclick="this.parentElement.dispatchEvent(new CustomEvent('inspect', {detail: '${p}'}))"
                 style="background: rgba(0,255,65,0.05); padding: 10px; border-radius: 4px; margin-bottom: 5px; cursor: pointer; border-left: 3px solid #00ff41;">
                <small>${p.name}</small>
            </div>
        `).join('');
    }

    async inspect(targetId) {
        const panel = this.container.querySelector('#adjudication-panel');
        panel.innerHTML = `
            <div style="width: 100%; height: 100%; display: flex; flex-direction: column;">
                <header style="display: flex; justify-content: space-between; margin-bottom: 20px;">
                    <h3>Reviewing: ${targetId}</h3>
                    <div>
                        <button onclick="app.approve('${targetId}')" style="background:#00ff41; color:#000; border:none; padding: 10px 20px; font-weight:bold; cursor:pointer;">APPROVE/RESTORE</button>
                        <button onclick="app.reject('${targetId}')" style="background:#ff4444; color:#fff; border:none; padding: 10px 20px; font-weight:bold; cursor:pointer; margin-left: 10px;">PURGE</button>
                    </div>
                </header>
                <div style="flex: 1; background: #111; border: 1px solid #333; padding: 20px; font-family: monospace; white-space: pre-wrap; overflow-y: auto;">
                    // FETCHING LOGIC BINDERY...
                    // SCANNED BY COMPLIANCE ENGINE (KCE)
                    // RESULT: Logic integrity violation found on line 42.
                </div>
            </div>
        `;
    }
}