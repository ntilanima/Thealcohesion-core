// Mandate: Resource Pool & Initial Allotment
export const allotmentData = {
    term: "Initial Genesis Allotment",
    status: "Verified",
    allocations: [
        { entity: "EPOS", type: "Core Infrastructure", priority: "High" },
        { entity: "Investors", type: "Venture Capital/Sovereign Support", priority: "Standard" }
    ],
    lastUpdate: "2025-12-26"
};

export function renderResourcePool() {
    const content = document.getElementById('content-resource-pool');
    if (!content) return;

    content.innerHTML = `
        <div class="resource-container">
            <div class="fund-total">GENESIS RESOURCE POOL</div>
            <table class="audit-table">
                <thead>
                    <tr><th>Entity</th><th>Allotment Type</th></tr>
                </thead>
                <tbody>
                    ${allotmentData.allocations.map(a => `
                        <tr>
                            <td>${a.entity}</td>
                            <td><span class="action-tag">${a.type}</span></td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
}