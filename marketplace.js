/**
 * Thealcohesion App Center (VPU Registry)
 * Phase 2 - Capability Expansion
 */
const vpuRegistry = {
    // The Master List of all authorized communal modules
    availableApps: [
        { id: 'governance', name: 'Governance', icon: 'governance', roles: ['MEMBER', 'STEWARD', 'ADMIN'] },
        { id: 'storage', name: 'Storage Utility', icon: 'storage', roles: ['MEMBER', 'STEWARD', 'ADMIN'] },
        { id: 'mediation', name: 'Mediation Forum', icon: 'mediation', roles: ['STEWARD', 'ADMIN'] },
        { id: 'audit', name: 'System Oversight', icon: 'audit', roles: ['STEWARD', 'GUARDIAN'] }, // Oversight roles only
        { id: 'council', name: 'Values Council', icon: 'council', roles: ['ADMIN'] },
        { id: 'mediation', name: 'Mediation Forum', icon: 'mediation', roles: ['MEMBER', 'STEWARD', 'MEDIATOR', 'GUARDIAN'] },
        { id: 'resource-pool', name: 'Resource Pool', icon: 'resources', roles: ['MEMBER', 'STEWARD', 'GUARDIAN'] },
        { id: 'values-council', name: 'Values Council', icon: 'council', roles: ['ADMIN', 'STEWARD'] },
        { id: 'resource', name: 'Resource Pool', icon: 'resource', roles: ['MEMBER', 'STEWARD'] }
    ],

    getAppsForMember(role) {
        // Enforce role-based visibility
        return this.availableApps.filter(app => app.roles.includes(role));
    },

    activateModule(appId) {
        // Logic to "pin" an app to the member's shell
        kernel.logAction(`App Activated: ${appId}`);
        console.log(`Module ${appId} is now active in the workspace.`);
    }
};