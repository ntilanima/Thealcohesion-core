/**
 * identityRegistry.js
 * SOVEREIGN_MEMBER_DIRECTORY // OS_V1.2.9
 * MANAGED_BY: MEMBERSHIP_DEVOPS // SECURE_UPLINK_ENABLED
 */

const MEMBER_LIST = [
    {
        userName: "ARCHAN_SUPREME",
        officialName: "Michael Audi", 
        sovereignName: "Archantilani Ntilanima Archantima", 
        titles: ["Sage AMA Humble"],
        specialRecognition: ["BLD", "TRT", "PTP"], 
        demographics: { dob: "1990-01-01", gender: "MALE" },
        documentId: "ID-774900X",
        contact: { email: "archon@sovereign.os", phone: "+254700000000" },
        location: { country: "KENYA", sector: "SECTOR_7_CENTRAL" },
        media: { 
            profile: "https://api.dicebear.com/7.x/bottts/svg?seed=Archon&backgroundColor=050505", 
            cover: "https://images.unsplash.com/photo-1639322537228-f710d846310a?q=80&w=1200",
            idFront: "https://images.unsplash.com/photo-1590424753858-394a12a5ecba?q=80&w=400",
            idBack: "https://images.unsplash.com/photo-1590424753858-394a12a5ecba?q=80&w=400"
        },
        security: {
            uid: "NAT-7749-X2",
            ipBinding: "192.168.0.104",
            deviceFingerprint: "CORE_WORKSTATION",
            status: "ACTIVE",
            since: "2025-12-26",
            rank: "Chief In General Senior",
            abbr: "CG.SNR.",
            clearance: 10
        },
        awards: ["EARLY_INVESTOR", "100MB_PIONEER"]
    },
    {
        userName: "GENESIS_NODE",
        officialName: "Jane Smith",
        sovereignName: "POH_SÕLM", 
        demographics: { dob: "1988-05-12", gender: "FEMALE" },
        documentId: "PASS-E9921K",
        contact: { email: "node1@sovereign.os", phone: "+3725000000" },
        location: { country: "ESTONIA", sector: "SECTOR_1_GLOBAL" },
        media: { 
            profile: "https://api.dicebear.com/7.x/bottts/svg?seed=Node&backgroundColor=050505", 
            cover: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=1200",
            idFront: "https://images.unsplash.com/photo-1554126807-6b10f6f6692a?q=80&w=400",
            idBack: "https://images.unsplash.com/photo-1554126807-6b10f6f6692a?q=80&w=400"
        },
        security: {
            uid: "INV-8821-K9",
            ipBinding: "10.0.0.5",
            deviceFingerprint: "FIELD_UPLINK_PRO",
            status: "ENCRYPTED",
            since: "2025-12-26",
            clearance: 4,
            rank: "INITIAL_INVESTOR"
        },
        awards: ["CORE_INVESTOR", "CORE_CONTRIBUTOR"]
    }
];

    const RANKS = {
        "CG.SNR.": "Chief In General Senior",
        "CAO": "Chief Authenticating Officer",
        "AO": "Authenticating Officer",
        "SAAO": "Senior Assistant Authenticating Officer",
        "JAAO": "Junior Assistant Authenticating Officer",
        "SM": "Senior Mentor",
        "JM": "Junior Mentor",
        "M": "Mentee",
        "S": "Seed"
    };


    const RANK_SCHEMA = [
    { abbr: "CG.SNR.", name: "Chief In General Senior", clearance: 10 },
    { abbr: "CAO", name: "Chief Authenticating Officer", clearance: 8 },
    { abbr: "AO", name: "Authenticating Officer", clearance: 7 },
    { abbr: "SAAO", name: "Senior Assistant Authenticating Officer", clearance: 6 },
    { abbr: "JAAO", name: "Junior Assistant Authenticating Officer", clearance: 5 },
    { abbr: "SM", name: "Senior Mentor", clearance: 4 },
    { abbr: "JM", name: "Junior Mentor", clearance: 3 },
    { abbr: "M", name: "Mentee", clearance: 2 },
    { abbr: "S", name: "Seed", clearance: 1 }
];

export class IdentityManager {
    constructor(container, apiBridge) {
        this.container = container;
        this.bridge = apiBridge;
        this.selectedMember = null;
        this.isRegistering = false;
        this.vaultUnlocked = false;
        this.pendingApprovals = [];
        this.viewMode = 'DIRECTORY'; // Modes: DIRECTORY, DOSSIER, GATEWAY, VAULT
        this.tokenVault = [
        { code: "DEVOPS-K8J2-X91L", status: "UNUSED", issuedAt: "2026-01-27", recipient: null },
        { code: "DEVOPS-M4N1-P0ZQ", status: "UNUSED", issuedAt: "2026-01-27", recipient: "Sector 7 Lead" }
    ];
        // System Activity Ledger
        this.systemLogs = [
            { time: "16:20:05", msg: "CORE_SYSTEM_INITIALIZED", type: "system" },
            { time: "16:20:10", msg: "MEMBERSHIP_DEVOPS_UPLINK_ESTABLISHED", type: "security" }
        ];

        this.isEditing = false; // Controls visibility of admin tools
        this.searchQuery = ""; // Tracks the filter string
        this.filters = {
            rank: "ALL",
            recognition: "ALL",
            gender: "ALL",
            status: "ALL" // Required for the Pending filter
            };
        this.isExporting = false; // Tracks the visual export state
        this.loginHistory = {}; // Stores logs keyed by member UID


    }

    async init() {
        this.render();
    }

    formatSovereignName(member) {
        const name = member.sovereignName;
        const honors = member.specialRecognition && member.specialRecognition.length > 0 
            ? ` ${member.specialRecognition.map(r => `(${r})`).join('')}` 
            : '';
        return `${name}${honors}`;
    }

    bestowRecognition(memberUid, recognitionCode) {
        const member = MEMBER_LIST.find(m => m.security.uid === memberUid);
        if (member) {
            if (!member.specialRecognition.includes(recognitionCode)) {
                member.specialRecognition.push(recognitionCode);
                this.render();
                console.log(`[DEVOPS_NOTICE]: ${recognitionCode} bestowed upon ${member.sovereignName}`);
            }
        }
    }

    updateMember(uid, updates) {
    const idx = MEMBER_LIST.findIndex(m => m.security.uid === uid);
    if (idx !== -1) {
        // 1. Update the Master List
        MEMBER_LIST[idx] = { ...MEMBER_LIST[idx], ...updates };
        
        // 2. IMMEDIATE SYNC: Update the currently viewed member reference
        // This ensures the next button click sees the NEW data immediately
        if (this.selectedMember && this.selectedMember.security.uid === uid) {
            this.selectedMember = MEMBER_LIST[idx];
        }

        const statusMsg = updates.isFrozen ? 'SIGNAL_FROZEN' : 'SIGNAL_RESTORED';
        this.addLog(`${statusMsg}: ${uid}`, 'admin');
        
        // 3. RE-RENDER: Do NOT set isEditing to false here
        this.render(); 
    }
}

    addLog(msg, type = 'info') {
    const now = new Date();
    const time = now.toTimeString().split(' ')[0];
    this.systemLogs.unshift({ time, msg, type });
    
        // Keep only the last 15 logs for performance
        if (this.systemLogs.length > 15) this.systemLogs.pop();
    }

    renderSystemLog() {
    return `
        <div class="reg-label" style="margin-top:40px; color:#444; border-color:#222;">Live_System_Activity_Ledger</div>
        <div style="background:#050505; border:1px solid #111; padding:15px; font-family:monospace; font-size:10px; height:120px; overflow-y:hidden; display:flex; flex-direction:column; gap:5px;">
            ${this.systemLogs.map(log => `
                <div style="display:flex; gap:15px;">
                    <span style="color:#333;">[${log.time}]</span>
                    <span style="color:${log.type === 'security' ? 'var(--id-green)' : log.type === 'admin' ? 'var(--id-gold)' : '#666'};">
                        ${log.msg}
                    </span>
                </div>
            `).join('')}
        </div>
    `;
}

    renderDossier() {
    const m = this.selectedMember;
    const recognitions = m.specialRecognition || [];
    const recognitionSuffix = recognitions.length > 0 
        ? ' ' + recognitions.map(r => `(${r})`).join('') 
        : '';
        
    const fullSovereignName = `${m.sovereignName}${recognitionSuffix}`;
    const isStaged = m.location.country === "PENDING_UPLINK";
    const history = this.loginHistory[m.security.uid] || [];
    const isFrozen = this.selectedMember.isFrozen || false;

    const ranks = [
        { a: "CG.SNR.", n: "Chief In General Senior" },
        { a: "CAO", n: "Chief Authenticating Officer" },
        { a: "AO", n: "Authenticating Officer" },
        { a: "SAAO", n: "Senior Assistant Authenticating Officer" },
        { a: "JAAO", n: "Junior Assistant Authenticating Officer" },
        { a: "SM", n: "Senior Mentor" },
        { a: "JM", n: "Junior Mentor" },
        { a: "M", n: "Mentee" },
        { a: "S", n: "Seed" }
    ];

    return `
        <div class="registry-view">
            <div class="registry-wrapper" style="animation: slideUp 0.4s ease-out;">
                <div class="registry-header">
                    <div style="flex: 1;">
                        <div class="rank-tag" style="background: var(--id-gold); color: #000; margin-bottom: 10px;">
                            ${m.security.abbr} // ${m.security.rank}
                        </div>
                        <h2 style="font-size: 2.2rem; margin: 0; letter-spacing: 1px; color: var(--id-gold);">
                            ${fullSovereignName}
                        </h2>
                        <div style="color: var(--id-green); font-size: 11px; letter-spacing: 1px;">SYSTEM_UID: ${m.security.uid}</div>
                    </div>
                    <div style="text-align: right;">
                        <button id="toggle-edit-mode" style="background:${this.isEditing ? 'var(--id-red)' : 'transparent'}; border:1px solid ${this.isEditing ? 'var(--id-red)' : 'var(--id-gold)'}; color:${this.isEditing ? '#fff' : 'var(--id-gold)'}; padding:8px 15px; font-size:9px; cursor:pointer; letter-spacing:1px; margin-bottom:15px; font-family:inherit;">
                            ${this.isEditing ? '[ CANCEL_CHANGES ]' : '[ UPDATE_MEMBER ]'}
                        </button>
                        <div class="clearance-stamp">LEVEL 0${m.security.clearance}</div>
                        <div style="color: #444; font-size: 10px; margin-top:10px;">AUTHORIZED_SINCE: ${m.security.since}</div>
                    </div>
                </div>

                <div class="registry-grid">
                    <div class="biometric-col">
                        <div class="reg-label">Biometric_Profile</div>
                        <div style="width:100%; height:280px; border:1px solid var(--id-gold); background:url(${m.media.profile}) center/cover; position:relative;">
                            <div style="position:absolute; inset:0; background:linear-gradient(transparent, #000); opacity:0.7;"></div>
                        </div>
                        
                        <div class="reg-label">Verification_Vault</div>
                        <div class="device-entry ${this.vaultUnlocked ? 'active' : ''}" id="toggle-vault" style="cursor:pointer;">
                            <div style="display:flex; align-items:center;">
                                <div class="d-status-dot"></div>
                                <span style="font-size:10px; letter-spacing:1px;">${this.vaultUnlocked ? 'CONCEAL_SCAN_DATA' : 'REQUEST_ID_ACCESS'}</span>
                            </div>
                        </div>

                        ${this.vaultUnlocked ? `
                            <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-top:10px; animation: fadeIn 0.3s ease;">
                                <img src="${m.media.idFront}" style="width:100%; border:1px solid var(--id-gold); opacity:0.8;">
                                <img src="${m.media.idBack}" style="width:100%; border:1px solid var(--id-gold); opacity:0.8;">
                            </div>
                        ` : ''}
                    </div>

                    <div class="data-col">
                        ${this.isEditing ? `
                        <div style="background:rgba(212,175,55,0.05); border:1px solid var(--id-gold); padding:20px; margin-bottom:20px; animation: fadeIn 0.3s ease-out;">
                            <div class="reg-label" style="color:var(--id-gold); border-color:var(--id-gold);">Identity_Modification_Console</div>
                            
                            <label style="font-size:9px; color:#888; display:block; margin: 10px 0 5px;">PROTOCOL_RANK_ASSIGNMENT</label>
                            <select id="rank-changer" class="sovereign-input" style="height:35px; border-color:#444; width:100%;">
                                ${ranks.map(r => `<option value="${r.a}|${r.n}" ${m.security.abbr === r.a ? 'selected' : ''}>${r.a} // ${r.n}</option>`).join('')}
                            </select>

                            <label style="font-size:9px; color:#888; display:block; margin: 20px 0 5px;">SPECIAL_RECOGNITION_MANAGEMENT</label>
                            <div style="display:flex; gap:8px;">
                                ${['BLD', 'TRT', 'PTP'].map(type => {
                                    const active = recognitions.includes(type);
                                    return `
                                        <button class="award-pill recognition-toggle" data-type="${type}" 
                                                style="cursor:pointer; flex:1; border:1px solid ${active ? 'var(--id-gold)' : '#333'}; 
                                                background:${active ? 'rgba(212,175,55,0.1)' : 'transparent'}; 
                                                color:${active ? 'var(--id-gold)' : '#555'}; padding:10px 0;">
                                            ${active ? 'REMOVE' : 'ADD'} ${type}
                                        </button>
                                    `;
                                }).join('')}
                            </div>
                        </div>
                        ` : ''}

                        <div class="reg-label">Citizen_Core_Identity</div>
                        <div class="reg-row"><span>FULL_LEGAL_NAME</span><span style="color:#fff">${m.officialName}</span></div>
                        <div class="reg-row"><span>DEMOGRAPHICS</span><span style="color:#fff">${m.demographics.dob} / ${m.demographics.gender}</span></div>
                        <div class="reg-row"><span>PRIMARY_UPLINK</span><span style="color:#fff">${m.contact.email}</span></div>
                        <div class="reg-row">
                            <span>SECTOR_ORIGIN</span>
                            <span style="color: ${isStaged ? 'var(--id-red)' : 'var(--id-green)'}; font-weight: bold;">
                                ${isStaged ? '[!] AWAITING_FIRST_LOGIN' : `${m.location.country} // ${m.location.sector}`}
                            </span>
                        </div>

                        <div class="reg-label">Sovereign_Lineage</div>
                        <div class="reg-row">
                            <span>AUTHORIZATION_KEY</span>
                            <span style="color:var(--id-gold); font-weight:bold;">${m.security.authorizationKey || 'LEGACY_ALLOTMENT'}</span>
                        </div>
                        ${m.security.vouchedBy ? `
                            <div class="reg-row">
                                <span>VOUCHED_BY</span>
                                <span style="color:var(--id-green); font-size:10px;">${m.security.vouchedBy}</span>
                            </div>
                        ` : ''}

                        <div class="reg-label">Hardware_Binding</div>
                        <div class="device-entry active">
                            <div>
                                <div style="color:#fff; font-size:11px;">${m.security.deviceFingerprint}</div>
                                <div style="color:var(--id-gold); font-size:9px;">IP: ${m.security.ipBinding}</div>
                            </div>
                            <div class="d-status-dot"></div>
                        </div>

                        <div class="reg-label">Active_System_Awards</div>
                        <div style="margin-top:10px;">
                            ${m.awards.map(a => `<span class="award-pill">${a}</span>`).join('')}
                        </div>

                        <div style="
                            padding: 10px; 
                            margin-bottom: 15px; 
                            margin-top: 20px;
                            background: ${isFrozen ? 'rgba(255, 69, 69, 0.1)' : 'rgba(0, 255, 65, 0.05)'}; 
                            border: 1px solid ${isFrozen ? 'var(--id-red)' : 'var(--id-green)'};
                            color: ${isFrozen ? 'var(--id-red)' : 'var(--id-green)'};
                            font-size: 10px;
                            text-align: center;
                        ">
                            ${isFrozen ? 'SIGNAL_STATUS: ACCESS_RESTRICTED // LOGIN_DISABLED' : 'SIGNAL_STATUS: UPLINK_ACTIVE // LOGIN_ENABLED'}
                        </div>
                        <div>
                            <div>
                            <button id="toggle-freeze" style="
                            padding: 10px; 
                            margin-bottom: 20px; 
                            background: transparent; border: 1px solid ${isFrozen ? 'var(--id-green)' : 'var(--id-red)'}; 
                            border: 1px solid ${isFrozen ? 'var(--id-red)' : 'var(--id-green)'};
                            color: color: ${isFrozen ? 'var(--id-green)' : 'var(--id-red)'}; padding: 5px 15px; cursor: pointer; font-size: 10px; letter-spacing: 2px;
                            font-size: 10px;
                            text-align: center;">
                            ${isFrozen ? '[ UNFREEZE_IDENTITY ]' : '[ FREEZE_IDENTITY ]'}
                        </button>
                        </div>
                        </div>
                    </div>
                </div>
                <div class="reg-label">Access_&_Uplink_History</div>
                    <div style="background:rgba(0,0,0,0.3); border:1px solid #222; padding:10px; max-height:150px; overflow-y:auto; font-family:monospace;">
                        ${history.length > 0 ? history.map(log => `
                            <div style="display:flex; justify-content:space-between; border-bottom:1px solid #111; padding:5px 0; font-size:9px;">
                                <span style="color:var(--id-green); text-transform:uppercase;">[${log.event}]</span>
                                <span style="color:#666;">${log.location} // ${log.ip}</span>
                                <span style="color:#444;">${log.timestamp}</span>
                            </div>
                        `).join('') : `
                            <div style="color:#444; font-size:10px; text-align:center; padding:10px;">NO_ACCESS_HISTORY_RECORDED</div>
                        `}
                    </div>
                <button id="close-dossier" style="margin-top:50px; width:100%; background:transparent; border:1px solid #222; color:#555; padding:12px; cursor:pointer; font-family:inherit; text-transform:uppercase; font-size:10px; letter-spacing:2px;">[ Return_To_Index ]</button>
            </div>
        </div>
    `;
}
    renderGateway() {
        // Filter only UNUSED keys for the dropdown
        const availableKeys = this.tokenVault.filter(t => t.status === 'UNUSED');
        return `
            <div class="registry-view">
                <div class="registry-wrapper" style="animation: slideUp 0.4s ease-out;">
                    <div class="registry-header">
                        <div>
                            <h1 style="color:var(--id-gold); margin:0; letter-spacing:4px;">CITIZEN_ONBOARDING</h1>
                            <div style="font-size:10px; color:var(--id-green);">SECURE_UPLINK_ENCRYPTED</div>
                        </div>
                        <button id="cancel-reg" style="background:transparent; border:1px solid var(--id-red); color:var(--id-red); font-size:10px; padding:5px 10px; cursor:pointer;">[ ABORT ]</button>
                    </div>

                    <form id="registration-form" class="gateway-form">
                        <div class="input-group" style="grid-column: span 2;">
                            <label>Authorized Access Token (Select from Vault)</label>
                        <select name="referralCode" class="sovereign-input" required style="background:rgba(212,175,55,0.05); border-color:var(--id-gold); color:var(--id-gold);">
                            <option value="">-- SELECT_ACTIVE_TOKEN --</option>
                            ${availableKeys.length > 0 
                                ? availableKeys.map(t => `<option value="${t.code}">${t.code} (${t.recipient || 'Public'})</option>`).join('')
                                : `<option disabled>NO_UNUSED_KEYS_IN_VAULT</option>`
                            }
                                </select>
                                <div style="font-size:8px; color:#444; margin-top:5px;">*If no keys appear, generate them in the Token Vault first.</div>
                            </div>

                        <div class="input-group">
                            <label>Assigned Rank</label>
                            <select name="rankAbbr" class="sovereign-input">
                                <option value="S">Seed (S)</option>
                                <option value="M">Mentee (M)</option>
                                <option value="JM">Junior Mentor (JM)</option>
                                <option value="SM">Senior Mentor (SM)</option>
                                <option value="JAAO">Junior Assistant Authenticating Officer (JAAO)</option>
                                <option value="SAAO">Senior Assistant Authenticating Officer (SAAO)</option>
                                <option value="AO">Authenticating Officer (AO)</option>
                                <option value="CAO">Chief Authenticating Officer (CAO)</option>
                            </select>
                        </div>
                        <div class="input-group">
                            <label>Sovereign Name (Non-English Preferred)</label>
                            <input type="text" name="sovereignName" class="sovereign-input" placeholder="e.g. MTU_WA_MIFUMO" required>
                        </div>
                        <div class="input-group">
                            <label>Official Legal Name</label>
                            <input type="text" name="officialName" class="sovereign-input" placeholder="John Doe" required>
                        </div>
                        <div class="input-group">
                            <label>Legal Gender</label>
                            <select name="gender" class="sovereign-input">
                                <option value="MALE">MALE</option>
                                <option value="FEMALE">FEMALE</option>
                                <option value="OTHER">OTHER</option>
                            </select>
                        </div>
                        <div class="input-group">
                            <label>Username (System Alias)</label>
                            <input type="text" name="userName" class="sovereign-input" placeholder="ARCHON_01" required>
                        </div>
                        <div class="input-group">
                            <label>Contact Email</label>
                            <input type="email" name="email" class="sovereign-input" placeholder="uplink@sovereign.os" required>
                        </div>
                        <div class="input-group">
                            <label>Date of Birth</label>
                            <input type="date" name="dob" class="sovereign-input" required>
                        </div>
                        <div class="input-group">
                            <label>Government ID Reference</label>
                            <input type="text" name="documentId" class="sovereign-input" placeholder="ID-XXXXXX" required>
                        </div>
                        
                        <div class="input-group" style="grid-column: span 2;">
                            <label>Identity Verification (Front & Back Scans)</label>
                            <div style="display:flex; gap:10px; margin-top:10px;">
                                <div class="file-uplink" style="flex:1;">
                                    <span style="font-size:10px; color:#555;">UPLOAD_ID_FRONT</span>
                                </div>
                                <div class="file-uplink" style="flex:1;">
                                    <span style="font-size:10px; color:#555;">UPLOAD_ID_BACK</span>
                                </div>
                            </div>
                        </div>

                        <button type="submit" class="btn-primary">Initialize Sovereign Protocol</button>
                    </form>
                </div>
            </div>
        `;
    }

   render() {
    // Determine which view to generate
    const mainContent = this.getCurrentView();
    const overlay = this.isExporting ? this.renderProcessingOverlay() : '';

    this.container.innerHTML = `
        <div class="os-layout" style="display: flex; height: 100vh; overflow: hidden; background: #000;">
            ${overlay}
            
            <aside class="admin-sidebar" style="width: 320px; border-right: 1px solid #222; display: flex; flex-direction: column; background: #050505; z-index: 100;">
                <div style="padding: 20px; border-bottom: 1px solid #222;">
                    <div style="font-size: 10px; color: var(--id-gold); letter-spacing: 2px;">DEVOPS_STATION_ALPHA</div>
                    <div style="color: #fff; font-weight: bold; margin-top: 5px; font-size:12px;">ROOT_ADMIN // SECURE</div>
                </div>

                <div style="padding: 20px; flex: 0 0 auto; display: flex; flex-direction: column; gap: 10px;">
                    <button id="sb-index" class="sidebar-btn ${(!this.isRegistering && this.viewMode === 'DIRECTORY') ? 'active' : ''}">[ DIRECTORY_INDEX ]</button>
                    <button id="sb-reg" class="sidebar-btn ${this.isRegistering ? 'active' : ''}">[ + ] REGISTER_NEW</button>
                    <button id="sb-vault" class="sidebar-btn ${this.viewMode === 'VAULT' ? 'active' : ''}">[ TOKEN_VAULT ]</button>
                    <button id="sb-export" class="sidebar-btn green">[ EXPORT_MANIFEST ]</button>
                    
                    <button id="clear-filters" style="background:transparent; border:1px solid #333; color:#444; font-size:9px; padding:8px; cursor:pointer; margin-top:10px;">
                        RESET_ALL_FILTERS
                    </button>
                </div>

                <div style="flex: 1; display: flex; flex-direction: column; min-height: 0; border-top: 1px solid #111;">
                    <div class="reg-label" style="margin: 15px 20px 5px; border: none; font-size: 9px; color: #444;">LIVE_SYSTEM_LOGS</div>
                    <div id="terminal-stream">
                        ${this.systemLogs.map(log => `
                            <div style="margin-bottom: 8px; display: flex; gap: 10px;">
                                <span style="color: #333;">${log.time}</span>
                                <span style="color: ${log.type === 'security' ? 'var(--id-green)' : 'var(--id-gold)'};">${log.msg}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </aside>

            <main id="main-viewport" style="flex: 1; overflow-y: auto; position: relative; background:#000;">
                ${mainContent}
            </main>
        </div>
    `;

    this.attachEvents();
}

getCurrentView() {
    if (this.isRegistering) return this.renderGateway();
    if (this.viewMode === 'VAULT') return this.renderTokenVault();
    if (this.selectedMember) return this.renderDossier();
    return this.renderDirectory();
}

resetFilters() {
    this.searchQuery = "";
    this.filters = { rank: "ALL", recognition: "ALL", gender: "ALL", status: "ALL" };
    this.addLog("SYSTEM_FILTERS_RESET", "system");
    this.render();
}

renderDirectory() {
    const filteredMembers = MEMBER_LIST.filter(m => {
        const query = this.searchQuery.toLowerCase();
        const matchSearch = m.sovereignName.toLowerCase().includes(query) || m.security.uid.toLowerCase().includes(query);
        const matchRank = this.filters.rank === "ALL" || m.security.abbr === this.filters.rank;
        const matchGender = this.filters.gender === "ALL" || m.demographics.gender === this.filters.gender;
        
        // FIXED: Recognition Filter (Checking if the array contains the selected code)
        const matchRec = this.filters.recognition === "ALL" || 
                        (m.specialRecognition && m.specialRecognition.includes(this.filters.recognition));
        
        const matchStatus = this.filters.status === "ALL" || 
                           (this.filters.status === "FROZEN" && m.isFrozen === true) || // New check
                           (this.filters.status === "PENDING" && m.location.country === "PENDING_UPLINK") ||
                           (this.filters.status === "ACTIVE" && m.location.country !== "PENDING_UPLINK");

        return matchSearch && matchRank && matchGender && matchRec && matchStatus;
    });

    return `
        <div class="registry-view" style="padding: 40px;">
            <div class="registry-header" style="border-left: 4px solid var(--id-gold); padding-left: 20px; margin-bottom: 40px;">
                <h1 style="color:var(--id-gold); margin:0; letter-spacing:8px; font-size: 1.2rem;">REGISTRY_INDEX</h1>
                <div style="font-size: 9px; color: #444; letter-spacing: 2px; margin-top: 5px;">
                    ACTIVE_UPLINKS: ${filteredMembers.length} // TOTAL_DATABASE: ${MEMBER_LIST.length}
                </div>
            </div>
            <div style="display:grid; grid-template-columns: 2fr 1fr 1fr 1fr 1fr; gap:10px; margin-bottom:30px;">
                <input type="text" id="directory-search" placeholder="SEARCH..." value="${this.searchQuery}" class="sovereign-input">
                
                <select class="filter-select" data-filter="status">
                    <option value="ALL">STATUS: ALL</option>
                    <option value="ACTIVE" ${this.filters.status === 'ACTIVE' ? 'selected' : ''}>ACTIVE_ONLY</option>
                    <option value="PENDING" ${this.filters.status === 'PENDING' ? 'selected' : ''}>QUARANTINED</option>
                    <option value="FROZEN" ${this.filters.status === 'FROZEN' ? 'selected' : ''}>FROZEN_LOCK</option>
                </select>

                <select class="filter-select" data-filter="rank">
                    <option value="ALL">RANK: ALL</option>
                    ${RANK_SCHEMA.map(r => `<option value="${r.abbr}" ${this.filters.rank === r.abbr ? 'selected' : ''}>${r.abbr}</option>`).join('')}
                </select>

                <select class="filter-select" data-filter="recognition">
                    <option value="ALL">RECOG: ALL</option>
                    <option value="BLD" ${this.filters.recognition === 'BLD' ? 'selected' : ''}>BLD</option>
                    <option value="TRT" ${this.filters.recognition === 'TRT' ? 'selected' : ''}>TRT</option>
                    <option value="PTP" ${this.filters.recognition === 'PTP' ? 'selected' : ''}>PTP</option>
                </select>

                <select class="filter-select" data-filter="gender">
                    <option value="ALL">GENDER: ALL</option>
                    <option value="MALE" ${this.filters.gender === 'MALE' ? 'selected' : ''}>MALE</option>
                    <option value="FEMALE" ${this.filters.gender === 'FEMALE' ? 'selected' : ''}>FEMALE</option>
                </select>
            </div>

            <div style="margin-top:20px;">
                ${filteredMembers.map(m => {
                const isFrozen = m.isFrozen || false;
                return `
                    <div class="device-entry member-row" data-idx="${MEMBER_LIST.indexOf(m)}" 
                        style="cursor:pointer; display: flex; justify-content: space-between; align-items: center; 
                        opacity: ${isFrozen ? '0.3' : '1'}; 
                        filter: ${isFrozen ? 'grayscale(1)' : 'none'};
                        background: rgba(255,255,255,0.01); border-left: 2px solid ${isFrozen ? '#444' : 'rgba(212, 175, 55, 0.2)'}; 
                        padding: 15px 25px;">
                        
                        <div style="display:flex; align-items:center; gap: 20px;">
                            <div class="d-status-dot" style="background:${isFrozen ? '#555' : (m.location.country === 'PENDING_UPLINK' ? 'var(--id-red)' : 'var(--id-green)')};"></div>
                            <div>
                                <div style="color:#fff; font-size:13px; font-weight:bold;">${m.sovereignName} ${isFrozen ? '[LOCKED]' : ''}</div>
                                <div style="color:#444; font-size:9px;">${m.security.uid} // ${isFrozen ? 'SIGNAL_ENCRYPTED' : m.location.country}</div>
                            </div>
                        </div>
                        <div class="rank-tag">${m.security.rank}</div>
                    </div>
                `;
            }).join('')}
            </div>
            ${this.renderApprovalQueue()}
        </div>
    `;
}
    /**
     * ADMINISTRATIVE_IDENTITY_MODIFICATION
     * Updates member attributes and syncs with the Sovereign Registry.
     */
    updateMemberAttribute(type, value) {
        if (!this.selectedMember) return;

        if (type === 'RANK') {
            const [abbr, fullName] = value.split('|');
            this.selectedMember.security.abbr = abbr;
            this.selectedMember.security.rank = fullName;

            // Protocol: Auto-assign clearance based on hierarchy
            const clearanceMap = { 
                'CG.SNR.': 10, 'CAO': 8, 'AO': 7, 'SAAO': 6, 
                'JAAO': 5, 'SM': 4, 'JM': 3, 'M': 2, 'S': 1 
            };
            this.selectedMember.security.clearance = clearanceMap[abbr] || 1;
            
            console.log(`[OS_HIERARCHY]: ${this.selectedMember.sovereignName} rank set to ${abbr}`);
        }

        if (type === 'RECOGNITION') {
            if (!this.selectedMember.specialRecognition) {
                this.selectedMember.specialRecognition = [];
            }

            const index = this.selectedMember.specialRecognition.indexOf(value);
            if (index > -1) {
                // REMOVE Protocol
                this.selectedMember.specialRecognition.splice(index, 1);
            } else {
                // ADD Protocol
                this.selectedMember.specialRecognition.push(value);
            }
        }

        this.render(); // Refresh the Dossier to show changes instantly
    }


    handleRegistration(e) {
        e.preventDefault();
        const formData = new FormData(e.target);
        const entryKey = formData.get('referralCode');
        const uid = formData.get('uid');

        // SECURITY CHECK: Block if the identity is flagged as FROZEN
        const existingMember = MEMBER_LIST.find(m => m.security.uid === uid);
        if (existingMember && existingMember.isFrozen) {
            this.addLog(`ACCESS_DENIED: Identity ${uid} is currently FROZEN.`, 'error');
            alert("CRITICAL_ERROR: Your sovereign signal has been locked by DEVOPS. Access denied.");
            return; // Terminate the process
        }

        // PROTOCOL: Validate Key against the Vault
        const vaultToken = this.tokenVault.find(t => t.code === entryKey);

        if (!vaultToken) {
            this.addLog(`SECURITY_ALERT: Invalid Key Attempt [${entryKey}]`, 'admin');
            alert("[ACCESS_DENIED]: The provided Authorization Key does not exist in the Vault.");
            return;
        }

        if (vaultToken.status === "USED") {
            this.addLog(`SECURITY_ALERT: Burned Key Re-use Attempt [${entryKey}]`, 'admin');
            alert("[ACCESS_DENIED]: This key has already been used and is no longer valid.");
            return;
        }

        const rankAbbr = formData.get('rankAbbr');
        const selectedRank = RANK_SCHEMA.find(r => r.abbr === rankAbbr) || RANK_SCHEMA[RANK_SCHEMA.length - 1]; // Default to lowest rank if error

        // If validation passes, create the citizen object
        const newCitizen = {
            userName: formData.get('userName'),
            officialName: formData.get('officialName'),
            sovereignName: formData.get('sovereignName'),
            demographics: { 
                dob: formData.get('dob'), 
                gender: formData.get('gender') || "PENDING" 
            },
            documentId: formData.get('documentId'),
            contact: { email: formData.get('email'), phone: "AWAITING_VERIFICATION" },
            location: { country: "PENDING_UPLINK", sector: "UNASSIGNED" },
            media: { 
                profile: `https://api.dicebear.com/7.x/bottts/svg?seed=${formData.get('userName')}`,
                cover: "https://images.unsplash.com/photo-1639322537228-f710d846310a?q=80&w=1200",
                idFront: "BLOB_UPLOADED",
                idBack: "BLOB_UPLOADED"
            },
            security: {
                uid: `NAT-${Math.floor(1000 + Math.random() * 9000)}-X`,
                ipBinding: "AUTO_CAPTURING...",
                deviceFingerprint: "FETCHING...",
                status: "AWAITING_VOUCH",
                since: new Date().toISOString().split('T')[0],
                rank: selectedRank.name,
                abbr: rankAbbr,
                clearance: selectedRank.clearance,
                authorizationKey: entryKey 
            },
            specialRecognition: [],
            awards: ["GENESIS_WAITLIST"]
        };

        // Add to quarantine queue
        this.pendingApprovals.push(newCitizen); 
        
        // Note: We don't mark the key as USED yet. 
        // We do that in vouchForCitizen() when the admin signs off.
        
        this.isRegistering = false;
        this.addLog(`NEW_SIGNAL_QUARANTINED: ${newCitizen.sovereignName}`, 'security');
        this.render();
        
        alert(`[OS_NOTICE]: Key Accepted. Identity bound to ${entryKey}. Awaiting final signature from DevOps.`);
    }

    renderApprovalQueue() {
        if (this.pendingApprovals.length === 0) return '';

        return `
            <div class="reg-label" style="margin-top:40px; color:var(--id-red); border-color:var(--id-red);">Pending_Approvals_Queue // Quarantined</div>
            ${this.pendingApprovals.map(p => `
                <div class="device-entry" style="border: 1px double var(--id-red); background: rgba(255, 69, 69, 0.05);">
                    <div style="flex:1;">
                        <div style="color:#fff; font-size:12px; font-weight:bold;">${p.sovereignName}</div>
                        <div style="font-size:9px; color:var(--id-red); letter-spacing:1px;">TEMP_UID: ${p.security.uid} | REF: ${p.security.authorizationKey}</div>
                    </div>
                    <div style="display:flex; gap:10px;">
                        <button class="vouch-btn" data-uid="${p.security.uid}" 
                                style="background:var(--id-green); border:none; color:#000; padding:5px 12px; cursor:pointer; font-size:9px; font-weight:bold;">
                            [ SIGN_OFF ]
                        </button>
                        <button class="purge-btn" data-uid="${p.security.uid}" 
                                style="background:transparent; border:1px solid var(--id-red); color:var(--id-red); padding:5px 12px; cursor:pointer; font-size:9px;">
                            [ PURGE ]
                        </button>
                    </div>
                </div>
            `).join('')}
        `;
    }

    /**
     * PURGE_SIGNAL_PROTOCOL
     * Irreversibly deletes a pending registration from the quarantine queue.
     */
    purgeSignal(tempUid) {
        const index = this.pendingApprovals.findIndex(p => p.security.uid === tempUid);
        if (index > -1) {
            // Log the purge for security audits
            console.warn(`[SECURITY_ALERT]: Signal ${tempUid} purged from gateway.`);
            
            // Remove from queue
            this.pendingApprovals.splice(index, 1);
            
            this.render();
            alert("[OS_WARNING]: Connection terminated. Signal purged from registry.");
        }
    }

    /**
     * DEVOPS_ISSUE_TOKEN
     * Generates a unique entry key for a new citizen.
     */
    generateDevOpsToken() {
        const timestamp = Date.now().toString(36).toUpperCase();
        const entropy = Math.random().toString(36).substring(2, 6).toUpperCase();
        const code = `DEVOPS-${timestamp}-${entropy}`;
        
        console.log(`[MEMBERSHIP_DEVOPS]: New Entry Key Issued: ${code}`);
        return code;
    }


    renderInviteModule() {
        const m = this.selectedMember;
        return `
            <div class="reg-label" style="margin-top:30px;">Invite_Protocol</div>
            <div class="device-entry" style="border-style: dashed; border-color: var(--id-gold);">
                <div id="invite-display" style="color:var(--id-gold); font-size:12px; font-weight:bold; letter-spacing:2px;">
                    GENERATE_TOKEN_...
                </div>
                <button id="gen-invite-btn" style="background:var(--id-gold); color:#000; border:none; padding:5px 10px; font-size:9px; cursor:pointer; font-weight:bold;">
                    GEN_UPLINK
                </button>
            </div>
            <div style="font-size:8px; color:#444; margin-top:5px;">*Share this token for self-onboarding. Usage is logged to your UID.</div>
        `;
    }


    issueNewKey() {
    const timestamp = Date.now().toString(36).toUpperCase();
    const entropy = Math.random().toString(36).substring(2, 6).toUpperCase();
    const newKey = {
        code: `DEVOPS-${timestamp}-${entropy}`,
        status: "UNUSED",
        issuedAt: new Date().toISOString().split('T')[0],
        recipient: null
    };
    this.tokenVault.unshift(newKey);
    this.render();
    }

    shareKey(idx) {
        const key = this.tokenVault[idx];
        const recipient = prompt("[SYSTEM_INPUT]: Assign this key to (Name/Sector)?");
        if (recipient) {
            key.recipient = recipient;
            // Logic to copy to clipboard
            navigator.clipboard.writeText(key.code);
            alert(`[OS_SUCCESS]: Key ${key.code} assigned to ${recipient} and copied to clipboard.`);
            this.render();
        }
    }

    // MUST BE CALLED INSIDE vouchForCitizen()
    markKeyAsUsed(code) {
        const key = this.tokenVault.find(t => t.code === code);
        if (key) {
            key.status = "USED";
            key.recipient = "IDENTITY_BOUND";
        }
    }

    renderTokenVault() {
    return `
        <div class="registry-view">
            <div class="registry-wrapper" style="animation: slideUp 0.4s ease-out;">
                <div class="registry-header">
                    <div>
                        <h1 style="color:var(--id-gold); margin:0; letter-spacing:4px;">TOKEN_MANAGEMENT_VAULT</h1>
                        <div style="font-size:10px; color:var(--id-green);">DEVOPS_AUTHORIZED_ONLY</div>
                    </div>
                    <button id="close-vault" style="background:transparent; border:1px solid #444; color:#444; padding:5px 10px; cursor:pointer;">[ EXIT_VAULT ]</button>
                </div>

                <div style="background:rgba(212,175,55,0.05); border:1px solid var(--id-gold); padding:20px; margin-bottom:30px; display:flex; justify-content:space-between; align-items:center;">
                    <div>
                        <div style="color:var(--id-gold); font-size:11px; font-weight:bold;">GENERATE_NEW_ENTRY_KEY</div>
                        <div style="color:#666; font-size:9px;">Allocates a unique cryptographic token for self-registration.</div>
                    </div>
                    <button id="generate-key-btn" class="btn-primary" style="margin:0; width:auto; padding:10px 25px;">ISSUE_TOKEN</button>
                </div>

                <div class="reg-label">Active_Inventory</div>
                <div style="max-height:400px; overflow-y:auto;">
                    ${this.tokenVault.map((t, idx) => `
                        <div class="device-entry ${t.status === 'UNUSED' ? 'active' : ''}" style="opacity: ${t.status === 'USED' ? '0.5' : '1'}">
                            <div style="flex:1;">
                                <div style="color:${t.status === 'UNUSED' ? 'var(--id-gold)' : '#555'}; font-weight:bold; letter-spacing:1px;">${t.code}</div>
                                <div style="font-size:9px; color:#444;">ISSUED: ${t.issuedAt} | RECIPIENT: ${t.recipient || 'UNASSIGNED'}</div>
                            </div>
                            <div style="display:flex; gap:10px; align-items:center;">
                                <span style="font-size:9px; color:${t.status === 'UNUSED' ? 'var(--id-green)' : 'var(--id-red)'}">${t.status}</span>
                                ${t.status === 'UNUSED' ? `
                                    <button class="share-key-btn" data-idx="${idx}" style="background:transparent; border:1px solid var(--id-green); color:var(--id-green); padding:4px 8px; font-size:9px; cursor:pointer;">SHARE</button>
                                ` : `<span style="font-size:9px; color:#444;">[ BURNED ]</span>`}
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>
    `;
}

    /**
     * VOUCH_CITIZEN_PROTOCOL
     * Authorizes a pending registration via cryptographic signature.
     */
    vouchForCitizen(tempUid, voucherUid) {
    const member = MEMBER_LIST.find(m => m.security.uid === uid);
    
    if (member && member.isFrozen) {
        this.addLog(`VOUCH_FAILED: Cannot approve FROZEN_SIGNAL ${uid}`, 'error');
        return;
    }
    const index = this.pendingApprovals.findIndex(p => p.security.uid === tempUid);
    if (index > -1) {
        const citizen = this.pendingApprovals[index];

        // 1. Burn the key in the vault
        this.markKeyAsUsed(citizen.security.authorizationKey);
        
        // 2. Finalize status
        citizen.security.status = "ACTIVE";
        citizen.security.vouchedBy = voucherUid;
        
        // 3. PUSH TO MAIN LIST (This is where the "Saving" happens)
        MEMBER_LIST.push(citizen);
        
        // 4. Remove from quarantine
        this.pendingApprovals.splice(index, 1);
        
        this.addLog(`MEMBER_ACTIVATED: ${citizen.sovereignName}`, 'admin');
        this.render();
    }
}

    renderProcessingOverlay() {
    return `
        <div style="position:fixed; inset:0; background:rgba(0,0,0,0.9); z-index:9999; display:flex; flex-direction:column; align-items:center; justify-content:center; backdrop-filter:blur(5px);">
            <div style="border:1px solid var(--id-green); padding:40px; text-align:center; min-width:300px;">
                <div class="d-status-dot" style="background:var(--id-green); margin:0 auto 20px; width:15px; height:15px;"></div>
                <div style="color:var(--id-green); font-family:monospace; letter-spacing:3px; font-size:14px;">COMPILING_MANIFEST...</div>
                <div style="color:#444; font-size:10px; margin-top:10px;">ENCRYPTING_IDENTITY_RECORDS</div>
            </div>
        </div>
    `;
}

async exportRegistryManifest() {
    this.isExporting = true;
    this.render(); // Show "Start" visual
    this.addLog("MANIFEST_COMPILE_START", "admin");

    // Artificial delay for system "feel"
    await new Promise(resolve => setTimeout(resolve, 1500));

    try {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const dataStr = JSON.stringify(MEMBER_LIST, null, 4);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `SOVEREIGN_REGISTRY_${timestamp}.json`;
        link.click();
        URL.revokeObjectURL(url);
        
        this.addLog("MANIFEST_COMPILE_COMPLETE", "security");
    } catch (err) {
        this.addLog("MANIFEST_EXPORT_FAILED", "error");
    } finally {
        this.isExporting = false;
        this.render(); // End visual
    }
}

//To complete registration
finalizeCitizenUplink(memberUid, country, ip) {
    const member = MEMBER_LIST.find(m => m.security.uid === memberUid);
    
    if (member) {
        // Update the member record
        member.location.country = country;
        member.security.ipBinding = ip;
        member.security.deviceFingerprint = `HW_ID_${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
        
        // Record the login event
        if (!this.loginHistory[memberUid]) this.loginHistory[memberUid] = [];
        this.loginHistory[memberUid].unshift({
            timestamp: new Date().toLocaleString(),
            event: "INITIAL_HARDWARE_UPLINK",
            location: country,
            ip: ip
        });

        this.addLog(`HARDWARE_BINDING_COMPLETE: ${member.sovereignName}`, 'security');
        this.render();
        return true;
    }
    return false;
}

    attachEvents() {
    // 1. Define the Navigation Helper (Unified for Sidebar and Buttons)
    const setView = (mode, isReg = false) => {
        this.viewMode = mode;
        this.isRegistering = isReg;
        this.selectedMember = null; // Close any open dossier when navigating
        this.render();
    };

    // 2. Sidebar & Global Bindings
    const bind = (id, action) => {
        const el = this.container.querySelector(id);
        if (el) el.onclick = action;
    };

    bind('#sb-index', () => setView('DIRECTORY'));
    bind('#sb-reg', () => setView('DIRECTORY', true)); // Gateway view
    bind('#sb-vault', () => setView('VAULT'));
    bind('#sb-export', () => this.exportRegistryManifest());
    bind('#clear-filters', () => this.resetFilters());
    
    // Legacy Button Support
    bind('#start-registration', () => setView('DIRECTORY', true));
    bind('#cancel-reg', () => setView('DIRECTORY'));
    bind('#open-vault', () => setView('VAULT'));
    bind('#close-vault', () => setView('DIRECTORY'));

    // 3. Dossier & Modification Console (Restored)
    bind('#toggle-edit-mode', () => {
        this.isEditing = !this.isEditing;
        this.render();
    });

    const rankChanger = this.container.querySelector('#rank-changer');
    if (rankChanger) {
        rankChanger.onchange = (e) => {
            const [abbr, name] = e.target.value.split('|');
            this.updateMember(this.selectedMember.security.uid, {
                security: { ...this.selectedMember.security, abbr, rank: name }
            });
        };
    }

    this.container.querySelectorAll('.recognition-toggle').forEach(btn => {
        btn.onclick = () => {
            const type = btn.dataset.type;
            const currentRecs = [...(this.selectedMember.specialRecognition || [])];
            const newRecs = currentRecs.includes(type)
                ? currentRecs.filter(r => r !== type)
                : [...currentRecs, type];
            this.updateMember(this.selectedMember.security.uid, { specialRecognition: newRecs });
        };
    });

    // 4. Directory Row Selection
    this.container.querySelectorAll('.member-row').forEach(row => {
        row.onclick = () => {
            const idx = row.dataset.idx;
            this.selectedMember = MEMBER_LIST[idx];
            this.vaultUnlocked = false; 
            this.render();
        };
    });

    bind('#close-dossier', () => {
        this.selectedMember = null;
        this.isEditing = false;
        this.render();
    });

    // 5. Registration Form Logic
    const regForm = this.container.querySelector('#registration-form');
    if (regForm) {
        regForm.onsubmit = (e) => this.handleRegistration(e);
    }

    // 6. Search & Filters (Preserved with Focus Fix)
    const searchInput = this.container.querySelector('#directory-search');
    if (searchInput) {
        searchInput.oninput = (e) => {
            this.searchQuery = e.target.value;
            this.render();
            const input = this.container.querySelector('#directory-search');
            if (input) {
                input.focus();
                input.setSelectionRange(input.value.length, input.value.length);
            }
        };
    }

    this.container.querySelectorAll('.filter-select').forEach(select => {
        select.onchange = (e) => {
            this.filters[e.target.dataset.filter] = e.target.value;
            this.render();
        };
    });

    // 7. Token Vault Tools
    bind('#generate-key-btn', () => this.issueNewKey());
    bind('#toggle-vault', () => { this.vaultUnlocked = !this.vaultUnlocked; this.render(); });
    
    this.container.querySelectorAll('.share-key-btn').forEach(btn => {
        btn.onclick = () => this.shareKey(btn.dataset.idx);
    });

    // 8. Pending Quarantine Logic
    this.container.querySelectorAll('.vouch-btn').forEach(btn => {
        btn.onclick = () => this.vouchForCitizen(btn.dataset.uid, "DEVOPS_ROOT");
    });
    this.container.querySelectorAll('.purge-btn').forEach(btn => {
        btn.onclick = () => this.purgeSignal(btn.dataset.uid);
    });

    // --- FREEZE/UNFREEZE LOGIC ---
    const freezeBtn = this.container.querySelector('#toggle-freeze');
    if (freezeBtn) {
        freezeBtn.onclick = () => {
            const currentStatus = this.selectedMember.isFrozen || false;
            this.updateMember(this.selectedMember.security.uid, {
                isFrozen: !currentStatus
            });
        };
    }
}
}