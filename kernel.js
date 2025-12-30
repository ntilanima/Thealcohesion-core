/**
 * Thealcohesion Sovereign Kernel
 * Updated for Phase 3: Emergency Controls
 */
const kernel = {
    member: null,
    systemState: "ACTIVE", // States: ACTIVE, LOCKED
    logs: [],

    // 1. The Kill-Switch: Can only be triggered by Guardians
    triggerEmergencyLockdown() {
        if (this.member && (this.member.role === "GUARDIAN" || this.member.role === "STEWARD")) {
            this.systemState = "LOCKED";
            this.logAction("EMERGENCY LOCKDOWN ACTIVATED");
            ui.renderLockdownScreen();
            console.error("CRITICAL: Sovereign Environment is now LOCKED.");
        } else {
            this.logAction("UNAUTHORIZED LOCKDOWN ATTEMPT");
            throw new Error("Unauthorized: Only Guardians may trigger lockdown.");
        }
    },

    // 2. Security Middleware: Prevents actions if system is locked
    isSystemReady() {
        if (this.systemState === "LOCKED") {
            alert("System is LOCKED. All operations suspended by Governance.");
            return false;
        }
        return true;
    },

    logAction(action) {
        const entry = {
            timestamp: new Date().toISOString(),
            member: this.member ? this.member.username : "System",
            action: action,
            state: this.systemState
        };
        this.logs.push(entry);
    },

    async authenticate() {
        const user = document.getElementById('username').value;
        // Logic for "Identity-Gated Access" [cite: 89, 97]
        console.log("Authenticating Member: " + user);
        
        // MVP: Strictly restricted to registered and verified members [cite: 9]
        if (user === "Member01") { // Placeholder for real DB check
            this.member = {
                role: "STEWARD", // Service Roles: Builder, Steward, etc.
                status: "active",
                allotment: 5 * 1024 * 1024 * 1024 // 5 GB Baseline [cite: 67]
            };
            this.bootShell();
        } else {
            alert("Identity not verified. Access Denied.");
        }
    },

    bootShell() {
        document.getElementById('login-gate').style.display = 'none';
        document.getElementById('session-status').innerText = "Member: Verified (" + this.member.role + ")";
        console.log("Entering Private Operational Environment...");
    },

    // 3. Audit Log: Immutable record of critical actions
    logs: [],

    logAction(action) {
    const entry = {
        timestamp: new Date().toISOString(),
        member: this.member ? this.member.username : "System",
        action: action
    };
    this.logs.push(entry);
    // In Phase 3, these will be sent to a dedicated Audit Vault
    console.log("Audit Log Recorded:", entry);
    },

    // 4. Identity Verification Flow
    async login() {
        const userField = document.getElementById('username').value;
        const passField = document.getElementById('password').value;

        try {
            const verifiedMember = await identityGate.verify(userField, passField);
            
            // Link identity to session
            this.member = {
                username: userField,
                role: verifiedMember.role,
                tier: verifiedMember.tier,
                allotment: 5 * 1024 * 1024 * 1024 // 5GB Baseline
            };

            this.logAction("IDENTITY VERIFIED");
            this.bootShell();
        } catch (error) {
            alert(error.message);
            this.logAction(`FAILED ACCESS ATTEMPT: ${userField}`);
        }
    },

    bootShell() {
        // Hide Login Gate, Show VPU Shell
        document.getElementById('login-gate').classList.add('hidden');
        document.getElementById('sovereign-shell').classList.remove('hidden');
        
        // Initialize UI with Role-based permissions
        vpuUI.init();
        console.log(`VPU Session Started for ${this.member.username} as ${this.member.role}`);
    }
};