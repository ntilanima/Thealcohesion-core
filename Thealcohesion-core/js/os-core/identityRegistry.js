/**
 * identityRegistry.js
 * SOVEREIGN_MEMBER_DIRECTORY // OS_V1.2.9
 * UPDATED: 2026-01-26 // SECURE_UPLINK_ENABLED
 */

import { registry } from '../os-core/registry-v2.js'; 

const MEMBER_LIST = [
    {
        uid: "NAT-7749-X2",
        userName: "ARCHON_USER",
        userRank: "VETERAN_NATIVE",
        role: "SYSTEM_ARCHITECT",
        actionCenter: "SECTOR_7_CENTRAL",
        legalCountry: "KENYA",
        clearance: 5,
        awards: ["EARLY_INVESTOR", "100MB_PIONEER"],
        ip: "192.168.0.104",
        device: "CORE_WORKSTATION",
        status: "ACTIVE",
        since: "2025-12-26",
        photo: "https://api.dicebear.com/7.x/bottts/svg?seed=Archon&backgroundColor=050505"
    },
    {
        uid: "INV-8821-K9",
        userName: "GENESIS_NODE",
        userRank: "CORE_INVESTOR",
        role: "DATA_VALIDATOR",
        actionCenter: "SECTOR_1_GLOBAL",
        legalCountry: "ESTONIA",
        clearance: 4,
        awards: ["CORE_CONTRIBUTOR"],
        ip: "10.0.0.5",
        device: "FIELD_UPLINK",
        status: "ENCRYPTED",
        since: "2025-12-26",
        photo: "https://api.dicebear.com/7.x/bottts/svg?seed=Node&backgroundColor=050505"
    }
];

export class IdentityManager {
    constructor(container, apiBridge) {
        if (!apiBridge || apiBridge.signature !== 'SOVEREIGN_CORE_V1') {
            container.innerHTML = `<div class="fatal">ENCLAVE_VIOLATION</div>`;
            throw new Error("SEC_BREACH");
        }
        this.container = container;
        this.bridge = apiBridge;
        this.selectedMember = null;
    }

    async init() {
        this.render();
    }

    renderDossier() {
        const m = this.selectedMember;
        return `
            <div class="biometric-dossier" style="flex:1; display:flex; gap:40px; background:rgba(212,175,55,0.02); border:1px solid #1a1a1a; padding:30px; position:relative; animation: fadeIn 0.3s ease-out;">
                <button id="close-dossier" style="position:absolute; top:20px; right:20px; background:transparent; border:1px solid #444; color:#d4af37; cursor:pointer; font-family:inherit; font-size:10px; padding:5px 10px;">[ TERMINATE_UPLINK ]</button>
                
                <div style="width:220px;">
                    <div style="width:220px; height:220px; border:2px solid #d4af37; position:relative; overflow:hidden; background:#000;">
                        <img src="${m.photo}" style="width:100%; height:100%; filter: sepia(1) hue-rotate(90deg) brightness(0.7);">
                        <div style="position:absolute; top:0; left:0; width:100%; height:2px; background:#00ff41; box-shadow:0 0 10px #00ff41; animation: scanLine 4s infinite linear;"></div>
                        <div style="position:absolute; bottom:0; width:100%; background:rgba(212,175,55,0.2); font-size:10px; text-align:center; padding:5px; backdrop-filter:blur(4px); color:#d4af37;">BIOMETRIC_IDENTITY_CONFIRMED</div>
                    </div>
                    
                    <div style="margin-top:20px; border:1px solid #00ff41; padding:15px; background:rgba(0,255,65,0.02);">
                        <div style="color:#00ff41; font-size:9px; margin-bottom:10px; letter-spacing:1px;">DIRECT_IP_UPLINK</div>
                        <input id="terminal-msg" type="text" placeholder="ENCRYPT_MESSAGE..." style="width:100%; background:#000; border:1px solid #222; color:#00ff41; font-family:inherit; font-size:10px; padding:8px; box-sizing:border-box; outline:none; margin-bottom:10px;">
                        <button id="send-terminal" style="width:100%; background:#00ff41; color:#000; border:none; padding:8px; font-weight:bold; font-size:10px; cursor:pointer; text-transform:uppercase;">Transmit_Secure</button>
                    </div>
                </div>

                <div style="flex:1;">
                    <div style="border-bottom:1px solid #d4af37; padding-bottom:15px; margin-bottom:25px;">
                        <span style="color:#d4af37; font-size:11px; letter-spacing:2px;">${m.userRank}</span>
                        <h2 style="font-size:2.8rem; margin:10px 0; letter-spacing:3px; text-transform:uppercase;">${m.userName}</h2>
                        <div style="color:#666; font-size:11px;">UID: ${m.uid} // ALLOTMENT_ORIGIN: ${m.since}</div>
                    </div>

                    <div style="display:grid; grid-template-columns: 1fr 1fr; gap:25px; font-size:12px;">
                        <div><label style="color:#444; font-size:9px; display:block; margin-bottom:5px;">CORE_ROLE</label><span style="color:#00ff41;">${m.role}</span></div>
                        <div><label style="color:#444; font-size:9px; display:block; margin-bottom:5px;">ACTION_CENTER</label><span>${m.actionCenter}</span></div>
                        <div><label style="color:#444; font-size:9px; display:block; margin-bottom:5px;">NETWORK_IP</label><span style="color:#d4af37;">${m.ip}</span></div>
                        <div><label style="color:#444; font-size:9px; display:block; margin-bottom:5px;">HARDWARE_ID</label><span>${m.device}</span></div>
                    </div>

                    <div style="margin-top:40px;">
                        <label style="color:#444; font-size:9px; display:block; margin-bottom:15px;">AWARDS_&_RECOGNITION</label>
                        <div style="display:flex; gap:10px;">
                            ${m.awards.map(a => `<span style="border:1px solid #00ff41; color:#00ff41; font-size:9px; padding:5px 15px; background:rgba(0,255,65,0.05); text-transform:uppercase;">${a}</span>`).join('')}
                        </div>
                    </div>
                </div>
            </div>
            <style>
                @keyframes scanLine { 0% { top: 0; } 100% { top: 220px; } }
                @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
            </style>
        `;
    }

    render() {
        this.container.innerHTML = `
            <div class="sovereign-directory" style="background:#020202; color:#fff; font-family:'JetBrains Mono', monospace; height:100%; display:flex; flex-direction:column; padding:20px; border:1px solid #111; box-sizing:border-box;">
                
                <div class="dir-header" style="display:flex; justify-content:space-between; align-items:flex-end; border-bottom:1px solid #d4af37; padding-bottom:15px; margin-bottom:20px;">
                    <div>
                        <div style="color:#d4af37; font-size:10px; letter-spacing:3px;">SYSTEM_OVERSEER_CONSOLE</div>
                        <h1 style="margin:5px 0 0 0; font-size:1.8rem; text-transform:uppercase;">Citizen_Registry_Index</h1>
                    </div>
                    <div style="text-align:right;">
                        <input type="text" placeholder="FILTER_BY_UID..." style="background:#000; border:1px solid #333; color:#00ff41; padding:8px; font-family:inherit; outline:none; font-size:11px;">
                    </div>
                </div>

                <div class="grid-container" style="flex:1; overflow-y:auto; border:1px solid #111;">
                    ${this.selectedMember ? this.renderDossier() : `
                    <table style="width:100%; border-collapse:collapse; font-size:11px; text-align:left;">
                        <thead style="background:#111; color:#d4af37; position:sticky; top:0;">
                            <tr>
                                <th style="padding:15px; border-bottom:1px solid #222;">UID / SINCE</th>
                                <th style="padding:15px; border-bottom:1px solid #222;">MEMBER_IDENTIFIER</th>
                                <th style="padding:15px; border-bottom:1px solid #222;">ACTION_CENTER</th>
                                <th style="padding:15px; border-bottom:1px solid #222;">NETWORK_BINDING (IP)</th>
                                <th style="padding:15px; border-bottom:1px solid #222;">AWARDS</th>
                                <th style="padding:15px; border-bottom:1px solid #222;">STATUS</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${MEMBER_LIST.map((member, idx) => `
                                <tr class="member-row" data-idx="${idx}" style="border-bottom:1px solid #111; transition:background 0.3s; cursor:pointer;" onmouseover="this.style.background='rgba(212,175,55,0.05)'" onmouseout="this.style.background='transparent'">
                                    <td style="padding:15px;">
                                        <div style="color:#fff; font-weight:bold;">${member.uid}</div>
                                        <div style="color:#444; font-size:9px;">ORIGIN: ${member.since}</div>
                                    </td>
                                    <td style="padding:15px;">
                                        <div style="color:#00ff41;">${member.userName}</div>
                                        <div style="color:#666; font-size:10px;">${member.role} [CL_${member.clearance}]</div>
                                    </td>
                                    <td style="padding:15px;">
                                        <div style="color:#aaa;">${member.actionCenter}</div>
                                        <div style="color:#444; font-size:9px;">REG_COUNTRY: ${member.legalCountry}</div>
                                    </td>
                                    <td style="padding:15px;">
                                        <div style="color:#fff;">${member.device}</div>
                                        <div style="color:#d4af37; font-size:10px;">IP: ${member.ip}</div>
                                    </td>
                                    <td style="padding:15px;">
                                        <div style="display:flex; gap:5px; flex-wrap:wrap;">
                                            ${member.awards.map(a => `<span style="border:1px solid #00ff41; padding:2px 5px; font-size:8px; color:#00ff41;">${a}</span>`).join('')}
                                        </div>
                                    </td>
                                    <td style="padding:15px;">
                                        <div style="display:flex; align-items:center; gap:8px;">
                                            <span style="width:6px; height:6px; background:${member.status === 'ACTIVE' ? '#00ff41' : '#d4af37'}; border-radius:50%; box-shadow:0 0 5px ${member.status === 'ACTIVE' ? '#00ff41' : '#d4af37'};"></span>
                                            <span style="color:${member.status === 'ACTIVE' ? '#00ff41' : '#d4af37'};">${member.status}</span>
                                        </div>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>`}
                </div>

                <div style="margin-top:15px; display:flex; justify-content:space-between; color:#333; font-size:9px;">
                    <span>ACTIVE_CONNECTIONS: ${MEMBER_LIST.length}</span>
                    <span>KERNEL_SESSION_SIG: ${this.bridge.signature}</span>
                    <span>SYSTEM_TIME: 2026-01-26 23:55 EAT</span>
                </div>
            </div>
        `;
        this.attachEvents();
    }

    attachEvents() {
        this.container.querySelectorAll('.member-row').forEach(row => {
            row.onclick = () => {
                const idx = row.getAttribute('data-idx');
                this.selectedMember = MEMBER_LIST[idx];
                this.render();
            };
        });

        const closeBtn = this.container.querySelector('#close-dossier');
        if (closeBtn) {
            closeBtn.onclick = () => {
                this.selectedMember = null;
                this.render();
            };
        }

        const sendBtn = this.container.querySelector('#send-terminal');
        if (sendBtn) {
            sendBtn.onclick = () => {
                const msg = this.container.querySelector('#terminal-msg').value;
                if (msg) {
                    alert(`[OS_UPLINK]: Encrypted transmission sent to ${this.selectedMember.ip}`);
                    this.container.querySelector('#terminal-msg').value = '';
                }
            };
        }
    }
}
