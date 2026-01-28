/**
 * oracle.js
 * CELL_RESONANCE_MONITOR // SIGNAL_BROADCASTER
 */

const CELL_DATA_FEED = [
    {
        id: "PULSE-001",
        origin: "AC_NAIROBI_01",
        unitType: "TLC_GROUP",
        resonance: "STABLE",
        intel: "TLC-Group 01 reports high activity in physical coordination tasks.",
        verification: "PENDING",
        timestamp: new Date().toISOString()
    }
];

export class SovereignOracle {
    constructor(container, apiBridge) {
        this.container = container;
        this.api = apiBridge; // Signature, Clearance, Notify, activeProcesses
        this.feed = [...CELL_DATA_FEED];
        this.transmissionLogs = [];
    }

    async init() {
        this.render();
    }

    /**
     * UPLINK: Archon Truth Verification
     */
    async validateCellPulse(id, isTruth) {
        if (this.api.getClearance() < 10) {
            this.api.notify("ACCESS_DENIED: Clearance 10 Required", "error");
            return;
        }

        const entry = this.feed.find(f => f.id === id);
        if (entry) {
            entry.verification = isTruth ? "THEALCOHESION_SYNC" : "SIGNAL_INTERRUPTED";
            this.api.notify(`PULSE_${id} ${isTruth ? 'AUTHENTICATED' : 'PURGED'}`, "success");
            this.render();
        }
    }

    /**
     * DOWNLINK: Broadcast to Action Center
     */
    async broadcastSignal(acId, message) {
        if (this.api.getClearance() < 10) return;

        const transmission = {
            id: `TX-${Math.random().toString(36).substr(2, 5).toUpperCase()}`,
            target: acId,
            content: message,
            timestamp: new Date().toLocaleTimeString(),
            status: "BROADCASTED"
        };

        this.transmissionLogs.unshift(transmission);
        
        // INTEGRATION: Trigger Biome Pulse
        if (window.os && window.os.activeProcesses['biome']) {
            window.os.activeProcesses['biome'].triggerVisualPulse(acId);
        }

        this.api.notify(`DOWNLINK_ACTIVE: Signal sent to ${acId}`, "success");
        this.render();
    }

    render() {
        const canSign = this.api.getClearance() >= 10;
        
        this.container.innerHTML = `
            <div class="oracle-container">
                <main>
                    <div class="oracle-header">
                        <h1>[ The Oracle ]</h1>
                        <p style="font-size:10px; color:#444;">UPLINK: TLC_CELL_RESONANCE</p>
                    </div>

                    <div class="oracle-stream" style="margin-top:30px; display:flex; flex-direction:column; gap:20px;">
                        ${this.feed.map(pulse => this.renderPulseCard(pulse, canSign)).join('')}
                    </div>
                </main>

                <aside class="broadcaster-aside">
                    <h2 style="color:var(--id-green); font-size:12px; letter-spacing:2px;">[ BROADCASTER ]</h2>
                    <p style="font-size:9px; color:#444; margin-bottom:20px;">DOWNLINK: ARCHON_TO_TLC</p>

                    <div style="background:rgba(255,255,255,0.01); border:1px solid #111; padding:15px;">
                        <select id="bc-target" class="broadcast-input" style="color:var(--id-green)">
                            <option value="AC_NAIROBI_01">AC_NAIROBI_01</option>
                            <option value="AC_MOMBASA_02">AC_MOMBASA_02</option>
                        </select>
                        <textarea id="bc-msg" class="broadcast-input" style="height:100px;" placeholder="Enter Archon Signal..."></textarea>
                        <button class="execute-btn" id="btn-broadcast">Execute Broadcast</button>
                    </div>

                    <div class="logs" style="margin-top:40px;">
                        <h3 style="font-size:9px; color:#333; border-bottom:1px solid #111; padding-bottom:5px;">DOWNLINK_LOGS</h3>
                        ${this.transmissionLogs.map(log => `
                            <div style="font-size:9px; margin-top:10px; color:#666;">
                                <span style="color:var(--id-green)">${log.timestamp}</span> | ${log.target} > ${log.content.substring(0,20)}...
                            </div>
                        `).join('')}
                    </div>
                </aside>
            </div>
        `;

        this.attachEvents();
    }

    attachEvents() {
        const btn = this.container.querySelector('#btn-broadcast');
        if (btn) {
            btn.onclick = () => {
                const target = this.container.querySelector('#bc-target').value;
                const msg = this.container.querySelector('#bc-msg').value;
                this.broadcastSignal(target, msg);
            };
        }
    }

    renderPulseCard(pulse, canSign) {
        const statusClass = pulse.verification === 'PENDING' ? 'status-pending' : 
                           pulse.verification === 'THEALCOHESION_SYNC' ? 'status-verified' : 'status-purged';

        return `
            <div class="signal-card">
                <div class="resonance-bar ${statusClass}"></div>
                <div style="display:flex; justify-content:space-between; font-size:9px; color:#555;">
                    <span>${pulse.origin} // ${pulse.unitType}</span>
                    <span>${pulse.resonance}</span>
                </div>
                <p style="color:#ddd; margin:15px 0;">${pulse.intel}</p>
                ${canSign && pulse.verification === 'PENDING' ? `
                    <div style="display:flex; gap:10px;">
                        <button onclick="os.activeProcesses['oracle'].validateCellPulse('${pulse.id}', true)" 
                                style="background:transparent; border:1px solid var(--id-green); color:var(--id-green); font-size:9px; padding:5px 10px; cursor:pointer;">
                            [ AUTHENTICATE ]
                        </button>
                    </div>
                ` : `<span style="font-size:9px; color:#333;">STATUS: ${pulse.verification}</span>`}
            </div>
        `;
    }
}