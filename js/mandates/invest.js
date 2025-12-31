/**
 * Thealcohesion Resource Pool
 * Economic Engine for Collective Sustainability
 */
const resourcePoolApp = {
    id: "resource-pool",
    name: "Resource Pool",

    // Initial state (Sample data for the VPU environment)
    state: {
        collectiveFund: 1540.50, // Total pooled resources
        activeInvestments: [
            { id: 1, name: "VPS Upgrade (Canary)", goal: 500, current: 500, status: "FUNDED" },
            { id: 2, name: "Values Council Workshop", goal: 200, current: 45, status: "ACTIVE" }
        ],
        sustainabilityMargin: 0.20 // 20% capped margin
    },

    render() {
        const member = kernel.member;
        return `
            <div class="resource-container">
                <header class="resource-header">
                    <h3>Collective Resource Pool</h3>
                    <div class="fund-total">Total Fund: ${this.state.collectiveFund} Units</div>
                </header>

                <section class="tier-management">
                    <h4>Sovereign Utility Tiers</h4>
                    <p>Current Tier: <strong>${member.tier || 'ROOT'}</strong></p>
                    <div class="tier-cards">
                        ${this.renderTierCard('SEED', 10)}
                        ${this.renderTierCard('GROVE', 50)}
                    </div>
                </section>

                <section class="investment-tracker">
                    <h4>Collective Investments</h4>
                    <div class="project-list">
                        ${this.state.activeInvestments.map(p => `
                            <div class="project-card">
                                <span>${p.name}</span>
                                <div class="progress-bar"><div style="width: ${(p.current/p.goal)*100}%"></div></div>
                                <small>${p.current} / ${p.goal} (${p.status})</small>
                            </div>
                        `).join('')}
                    </div>
                </section>
                
                ${member.role === 'STEWARD' ? `
                    <button class="steward-btn" onclick="resourcePoolApp.proposeProject()">Propose Investment</button>
                ` : ''}
            </div>
        `;
    },

    renderTierCard(name, cost) {
        const total = cost + (cost * this.state.sustainabilityMargin);
        return `
            <div class="tier-card">
                <h5>${name}</h5>
                <p>Cost: ${cost} <br> + Margin (20%): ${(cost * 0.2).toFixed(2)}</p>
                <button onclick="resourcePoolApp.contribute('${name}', ${total})">Contribute ${total}</button>
            </div>
        `;
    },

    contribute(tier, amount) {
        if (!kernel.isSystemReady()) return;
        // In a real VPU, this triggers a secure transaction
        kernel.logAction(`Contribution: ${amount} for ${tier} Tier`);
        this.state.collectiveFund += amount;
        alert(`Thank you. Your contribution helps sustain the VPU.`);
        vpuUI.refreshApp('resource-pool');
    }
};