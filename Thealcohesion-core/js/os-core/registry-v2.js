/**
 * THEALCOHESION MASTER REGISTRY (V2.2 - SOVEREIGN SPEC)
 * Logic: Manifest-First Capability Nodes
 */

export const registry = [
    // --- 1. THEALCOHESION VPU COMMAND & CONTROL ---
    { 
        id: 'app-store', 
        name: 'VPU App Center', 
        icon: '🛍️', 
        file: 'app-center.js',
        protocol: 'CORE://hive',
        category: 'System',
        roles: ['ANY'],
        manifest: { purpose: 'Official distribution hub for vetted capabilities (Rule 13.2).', resources: { cpu: 'Low', ram: 4 } },
        ethics: { tracking: false, manipulation: false, consent: true },
        lifecycle: 'VETTED'
    },
    { 
        id: 'vscode', 
        name: 'VPU Dev Center', 
        icon: '💻', 
        file: 'dev-center.js',
        protocol: 'DEV://forge',
        category: 'System',
        roles: ['NATIVE', 'DEV'],
        manifest: { purpose: 'Internal IDE for manifest-first app synthesis (Rule 13.1).', resources: { cpu: 'High', ram: 25 } },
        ethics: { tracking: false, manipulation: false, consent: true },
        lifecycle: 'VETTED'
    },

    { 
        id: 'vpu-sovereign-ai-core', 
        name: 'Sovereign-AI-Core', 
        icon: '🧠', 
        file: 'sovereign-ai-core.js', // The cognitive bridge logic
        protocol: 'CORE://intelligence',
        category: 'Infrastructure',
        roles: ['NATIVE', 'SYSTEM_SERVICE', 'COG'],
        manifest: { 
            purpose: 'OS-level cognitive coordination and workflow automation (Article 13.2).', 
            resources: { cpu: 'High', ram: 64 }, // High RAM for local model context
            permissions: { fs: true, ai: true, kernel_bridge: true }
        },
        ethics: { 
            tracking: false, 
            manipulation: false, 
            consent: true,
            localInference: true 
        },
        lifecycle: 'SYSTEM_SERVICE'
    },

    { 
        id: 'terminal', 
        name: 'VPU Terminal', 
        icon: '📟', 
        file: 'terminal.js',
        protocol: 'CORE://cli',
        category: 'System',
        roles: ['ADMIN', 'DEV', 'OFFICER'],
        manifest: { purpose: 'Direct CLI interface for kernel-level command execution.', resources: { cpu: 'Low', ram: 2 } },
        ethics: { tracking: false, manipulation: false, consent: true },
        lifecycle: 'VETTED'
    },

    // --- 2. IDENTITY & ALLOTMENT ---
    { 
        id: 'identity', 
        name: 'Citizen Registry', 
        icon: '🪪', 
        file: 'identityRegistry.js',
        protocol: 'CORE://identity',
        category: 'Governance',
        roles: ['ANY'],
        manifest: { purpose: 'Sovereign identity management and device-binding logs.', resources: { cpu: 'Low', ram: 2 } },
        ethics: { tracking: false, manipulation: false, consent: true },
        lifecycle: 'VETTED'
    },
    { 
        id: 'resource-pool', 
        name: 'Investors/EPOS', 
        icon: '🤝', 
        file: 'resource-pool.js', 
        protocol: 'ECON://epos',
        category: 'Finance',
        roles: ['INVESTOR', 'OFFICER', 'NATIVE'],
        manifest: { purpose: 'Governance of initial allotments (2025-12-26) and resource distribution.', resources: { cpu: 'Low', ram: 8 } },
        ethics: { tracking: false, manipulation: false, consent: true },
        lifecycle: 'VETTED'
    },

    // --- 3. CORE SYSTEM UTILITIES ---
    { 
        id: 'files', 
        name: 'File Explorer', 
        icon: '📁', 
        file: 'files.js',
        protocol: 'CORE://vfs',
        category: 'System',
        roles: ['ANY'],
        manifest: { purpose: 'Encrypted VFS and decentralized data sovereignty storage.', resources: { cpu: 'Med', ram: 10 } },
        ethics: { tracking: false, manipulation: false, consent: true },
        lifecycle: 'VETTED'
    },
    { 
        id: 'comms', 
        name: 'Comms Hub', 
        icon: '📡', 
        file: 'comms.js',
        protocol: 'SEC.TAC://comms',
        category: 'Communication',
        roles: ['ADMIN', 'OFFICER', 'LOGISTICS'],
        manifest: { 
            purpose: 'Secure packet broadcast and routing across manual sectors 1-8.', 
            resources: { cpu: 'Medium', ram: 4 } 
        },
        ethics: { tracking: false, manipulation: false, consent: true },
        lifecycle: 'VETTED'
    },  
    { 
        id: 'settings', 
        name: 'OS Settings', 
        icon: '⚙️', 
        file: 'settings.js',
        protocol: 'CORE://config',
        category: 'System',
        roles: ['ANY'],
        manifest: { purpose: 'Configuration of identity and security protocols.', resources: { cpu: 'Low', ram: 2 } },
        ethics: { tracking: false, manipulation: false, consent: true },
        lifecycle: 'VETTED'
    },
    { 
        id: 'browser', 
        name: 'Sovereign Web', 
        icon: '🌐', 
        file: 'browser.js',
        protocol: 'NET://gate',
        category: 'System',
        roles: ['ANY'],
        manifest: { purpose: 'Sandboxed gateway for restricted external information retrieval.', resources: { cpu: 'High', ram: 20 } },
        ethics: { tracking: false, manipulation: false, consent: true },
        lifecycle: 'VETTED'
    },
    { 
        id: 'messages', 
        name: 'TLC Messages', 
        icon: '💬', 
        file: 'messages.js',
        protocol: 'COMM://secure',
        category: 'System',
        roles: ['ANY'],
        manifest: { purpose: 'Secure inter-formation communication and diplomatic channels.', resources: { cpu: 'Low', ram: 6 } },
        ethics: { tracking: false, manipulation: false, consent: true },
        lifecycle: 'VETTED'
    },
    { 
        id: 'camera', 
        name: 'VPU Camera', 
        icon: '📸', 
        file: 'camera.js',
        protocol: 'CORE://vision',
        category: 'System',
        roles: ['ANY'],
        manifest: { purpose: 'Visual recording and biometric identity verification.', resources: { cpu: 'Med', ram: 8 } },
        ethics: { tracking: false, manipulation: false, consent: true },
        lifecycle: 'VETTED'
    },
    { 
        id: 'monitor', 
        name: 'System Monitor', 
        icon: '📊', 
        file: 'monitor.js',
        protocol: 'CORE://telemetry',
        category: 'System',
        roles: ['ADMIN', 'MEGA'],
        manifest: { purpose: 'Real-time telemetry of kernel cycles and memory allocation.', resources: { cpu: 'Low', ram: 4 } },
        ethics: { tracking: false, manipulation: false, consent: true },
        lifecycle: 'VETTED'
    },
    { 
        id: 'taskman', 
        name: 'Task Manager', 
        icon: '📝', 
        file: 'taskman.js',
        protocol: 'CORE://proc',
        category: 'System',
        roles: ['ADMIN'],
        manifest: { purpose: 'Process control and task prioritization for the VPU.', resources: { cpu: 'Low', ram: 2 } },
        ethics: { tracking: false, manipulation: false, consent: true },
        lifecycle: 'VETTED'
    },
    { 
        id: 'syslog', 
        name: 'Event Viewer', 
        icon: '📜', 
        file: 'syslog.js',
        protocol: 'CORE://audit',
        category: 'System',
        roles: ['MEGA', 'ADMIN'],
        manifest: { purpose: 'Immutable audit trails for system transparency.', resources: { cpu: 'Low', ram: 3 } },
        ethics: { tracking: false, manipulation: false, consent: true },
        lifecycle: 'VETTED'
    },

    // --- 4. SOVEREIGN ECOSYSTEM ---
    { 
        id: 'time', 
        name: 'Temporal Engine', 
        icon: '🕒', 
        file: 'time.js', 
        protocol: 'CORE://clock',
        category: 'Infrastructure',
        roles: ['ANY'],
        manifest: { purpose: 'Regulation of proprietary TLC Clock and Year Cycles.', resources: { cpu: 'Low', ram: 2 } },
        ethics: { tracking: false, manipulation: false, consent: true },
        lifecycle: 'VETTED'
    },
    { 
        id: 'tnfi', 
        name: 'TNFI Banking', 
        icon: '💹', 
        file: 'tnfi.js', 
        protocol: 'ECON://tnfi',
        category: 'Finance',
        roles: ['MEMBER', 'TREASURY', 'OFFICER', 'MEGA'],
        manifest: { purpose: 'Real-time sovereign economic monitoring and currency stability analysis.', resources: { cpu: 'Low', ram: 12 } },
        ethics: { tracking: false, manipulation: false, consent: true },
        lifecycle: 'VETTED'
    },
    { 
        id: 'governance', 
        name: 'Official Records', 
        icon: '📜', 
        file: 'governance.js', 
        protocol: 'GOV://records',
        category: 'Governance',
        roles: ['OFFICER', 'COMCENT'],
        manifest: { purpose: 'Administrative workspace for circulars and policy updates.', resources: { cpu: 'Low', ram: 4 } },
        ethics: { tracking: false, manipulation: false, consent: true },
        lifecycle: 'VETTED'
    },
    { 
        id: 'market', 
        name: 'TLC Mart', 
        icon: '🛒', 
        file: 'marketplace.js', 
        protocol: 'ECON://market',
        category: 'Economic',
        roles: ['ANY'],
        manifest: { purpose: 'Secure marketplace for intra-community trade and vendor verification.', resources: { cpu: 'Med', ram: 10 } },
        ethics: { tracking: false, manipulation: false, consent: true },
        lifecycle: 'VETTED'
    },
    { 
        id: 'council', 
        name: 'Values Council', 
        icon: '🏛️', 
        file: 'values-council.js', 
        protocol: 'GOV://ethics',
        category: 'Governance',
        roles: ['MEGA', 'NATIVE'],
        manifest: { purpose: 'Strategic hub for ethical oversight and value alignment.', resources: { cpu: 'Low', ram: 4 } },
        ethics: { tracking: false, manipulation: false, consent: true },
        lifecycle: 'VETTED'
    },
    { 
        id: 'audit', 
        name: 'Audit Log', 
        icon: '🔍', 
        file: 'audit.js', 
        protocol: 'ECON://audit',
        category: 'Finance',
        roles: ['MEGA_FINANCE', 'AUDITOR'],
        manifest: { purpose: 'Financial integrity monitoring and AML checks.', resources: { cpu: 'Low', ram: 6 } },
        ethics: { tracking: false, manipulation: false, consent: true },
        lifecycle: 'VETTED'
    },
    { 
        id: 'ethics', 
        name: 'Ethics Hub', 
        icon: '⚖️', 
        file: 'ethics.js', 
        protocol: 'GOV://compliance',
        category: 'Governance',
        roles: ['MEGA_PERSONNEL'],
        manifest: { purpose: 'Enforcement of moral governance (Article 13).', resources: { cpu: 'Low', ram: 4 } },
        ethics: { tracking: false, manipulation: false, consent: true },
        lifecycle: 'VETTED'
    },
    { 
        id: 'education', 
        name: 'Philomsci', 
        icon: '🎓', 
        file: 'education.js', 
        protocol: 'SOC://learning',
        category: 'Social',
        roles: ['STUDENT', 'NATIVE'],
        manifest: { purpose: 'Access to academic learning and intellectual empowerment.', resources: { cpu: 'Med', ram: 12 } },
        ethics: { tracking: false, manipulation: false, consent: true },
        lifecycle: 'VETTED'
    },
    { 
        id: 'security', 
        name: 'Archanti Security', 
        icon: '🛡️', 
        file: 'archanti.js', 
        protocol: 'SEC://archanti',
        category: 'Security',
        roles: ['SECURITY', 'COMPLIANCE'],
        manifest: { purpose: 'Advanced threat detection and identity protection.', resources: { cpu: 'High', ram: 15 } },
        ethics: { tracking: false, manipulation: false, consent: true },
        lifecycle: 'VETTED'
    },
    { 
        id: 'thrive', 
        name: 'Thrive Health', 
        icon: '🌱', 
        file: 'thrive.js', 
        protocol: 'SOC://health',
        category: 'Social',
        roles: ['ANY'],
        manifest: { purpose: 'Proactive health tip distribution and professional linking.', resources: { cpu: 'Low', ram: 4 } },
        ethics: { tracking: false, manipulation: false, consent: true },
        lifecycle: 'VETTED'
    },
    { 
        id: 'elevate', 
        name: 'TLC Elevate', 
        icon: '💡', 
        file: 'elevate.js', 
        protocol: 'ECON://innovation',
        category: 'Economic',
        roles: ['INNOVATOR'],
        manifest: { purpose: 'Support for community-driven inventions and pitches.', resources: { cpu: 'Low', ram: 6 } },
        ethics: { tracking: false, manipulation: false, consent: true },
        lifecycle: 'VETTED'
    },
    { 
        id: 'boost', 
        name: 'TLC Boost', 
        icon: '⚡', 
        file: 'boost.js', 
        protocol: 'ECON://credit',
        category: 'Finance',
        roles: ['MEMBER'],
        manifest: { purpose: 'Digital loan management and credit scoring.', resources: { cpu: 'Med', ram: 8 } },
        ethics: { tracking: false, manipulation: false, consent: true },
        lifecycle: 'VETTED'
    },
    { 
        id: 'impact', 
        name: 'Impact Social', 
        icon: '🌟', 
        file: 'impact.js', 
        protocol: 'SOC://impact',
        category: 'Social',
        roles: ['ANY'],
        manifest: { purpose: 'Philanthropic support for collective social responsibility.', resources: { cpu: 'Low', ram: 4 } },
        ethics: { tracking: false, manipulation: false, consent: true },
        lifecycle: 'VETTED'
    },
    { 
        id: 'transport', 
        name: 'Logistics Desk', 
        icon: '🚛', 
        file: 'transport.js', 
        protocol: 'INF://logistics',
        category: 'Infrastructure',
        roles: ['LOGISTICS_OFFICER', 'MEMBER'],
        manifest: { purpose: 'Transportation scheduling and mobility logistics.', resources: { cpu: 'Med', ram: 7 } },
        ethics: { tracking: false, manipulation: false, consent: true },
        lifecycle: 'VETTED'
    },
    { 
        id: 'roam', 
        name: 'Travel Roam', 
        icon: '🧭', 
        file: 'roam.js', 
        protocol: 'INF://roam',
        category: 'Infrastructure',
        roles: ['ANY'],
        manifest: { purpose: 'Cultural discovery and tour coordination.', resources: { cpu: 'Low', ram: 5 } },
        ethics: { tracking: false, manipulation: false, consent: true },
        lifecycle: 'VETTED'
    },
    { 
        id: 'ascent', 
        name: 'Ascent Business', 
        icon: '📈', 
        file: 'ascent.js', 
        protocol: 'ECON://ascent',
        category: 'Economic',
        roles: ['ENTREPRENEUR', 'NATIVE'],
        manifest: { purpose: 'Incubation hub for startups and ventures.', resources: { cpu: 'Med', ram: 10 } },
        ethics: { tracking: false, manipulation: false, consent: true },
        lifecycle: 'VETTED'
    },
    { 
        id: 'deployment', 
        name: 'Swift Deployment', 
        icon: '🚀', 
        file: 'deployment.js', 
        protocol: 'SEC://swift',
        category: 'Security',
        roles: ['DEVOPS', 'COMCENT'],
        manifest: { purpose: 'Emergency mobilization and project execution.', resources: { cpu: 'High', ram: 18 } },
        ethics: { tracking: false, manipulation: false, consent: true },
        lifecycle: 'VETTED'
    },

    // --- 4. HIGH-SECURITY ENCLAVE ---
    { 
        id: 'vault', 
        name: 'Sovereign Vault', 
        icon: '🔐', 
        file: 'vault.js',
        protocol: 'SEC://enclave',
        category: 'Security',
        roles: ['OFFICER', 'MEGA', 'TREASURY'], // Restricted access
        manifest: { 
            purpose: 'High-security enclave for volatile viewing of EPOS allotments and investor records.', 
            resources: { cpu: 'Low', ram: 12 },
            security: {
                volatileBuffer: true,
                deadManSwitch: '60s',
                encryption: 'AES-GCM-256'
            }
        },
        ethics: { 
            tracking: false, 
            manipulation: false, 
            consent: true,
            autoPurge: true // Article 13 compliance
        },
        lifecycle: 'VETTED'
    },
];