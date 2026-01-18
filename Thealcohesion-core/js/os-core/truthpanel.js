/**
 * RESOURCE TRUTH PANEL
 * Implementation of Spec Section 1.2
 */
export class ResourceTruth {
    constructor(kernel) {
        this.kernel = kernel;
    }

    render(appId) {
        const app = registry[appId];
        const manifest = app.manifest;
        
        // Calculate impact on the current 100MB VPU limit
        const memPercent = ((manifest.resources.ram / this.kernel.maxMemory) * 100).toFixed(1);

        return `
            <div class="truth-panel glass-effect">
                <header>
                    <span class="protocol">${app.protocol}</span>
                    <div class="trust-rings">
                        <span class="ring">${app.primaryRing} Verified</span>
                    </div>
                </header>

                <div class="truth-content">
                    <label>PURPOSE</label>
                    <p>"${manifest.purpose}"</p>

                    <label>RUNTIME CONTRACT (Resource Truth)</label>
                    <div class="metric-grid">
                        <div class="metric">
                            <span class="label">CPU</span>
                            <span class="value">${manifest.resources.cpu}</span>
                        </div>
                        <div class="metric">
                            <span class="label">RAM</span>
                            <span class="value">${manifest.resources.ram}MB <small>(${memPercent}%)</small></span>
                        </div>
                        <div class="metric">
                            <span class="label">NETWORK</span>
                            <span class="value">${manifest.permissions.includes('network') ? 'ON-DEMAND' : 'NONE'}</span>
                        </div>
                    </div>

                    <div class="permission-covenant">
                        <label>PERMISSION COVENANT</label>
                        <div class="badges">
                            ${manifest.permissions.map(p => `<span class="p-badge">✓ ${p.toUpperCase()}</span>`).join('')}
                        </div>
                    </div>
                </div>
                
                <footer style="font-size: 9px; opacity: 0.5; margin-top: 10px;">
                    SEC. 1.2: Measured & Enforced by VPU Kernel
                </footer>
            </div>
        `;
    }
}