/**
 * Thealcohesion Mediation Forum
 * Restoring harmony through the Ubuntu protocol.
 */
const mediationApp = {
    id: "mediation",
    name: "Mediation Forum",

    // Sample data: In a live VPU, these are fetched from the encrypted VFS
    cases: [
        { id: 101, title: "Resource Allocation Dispute", status: "OPEN", requester: "Member04" },
        { id: 102, title: "Charter Interpretation", status: "RESOLVED", requester: "Member09" }
    ],

    render() {
        const role = kernel.member.role;
        return `
            <div class="mediation-container">
                <header class="module-header">
                    <h3>Mediation Forum</h3>
                    <p>Restoring Collective Harmony</p>
                </header>

                <div class="action-bar">
                    <button onclick="mediationApp.newRequest()">+ New Resolution Request</button>
                </div>

                <div class="case-list">
                    ${this.cases.map(c => `
                        <div class="case-card ${c.status.toLowerCase()}">
                            <div class="case-info">
                                <strong>Case #${c.id}: ${c.title}</strong>
                                <span>Requested by: ${c.requester}</span>
                            </div>
                            <div class="case-status">
                                <span class="badge">${c.status}</span>
                                ${ (role === 'MEDIATOR' || role === 'STEWARD') && c.status === 'OPEN' 
                                    ? `<button onclick="mediationApp.resolveCase(${c.id})">Mediate</button>` 
                                    : '' }
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    },

    newRequest() {
        if (!kernel.isSystemReady()) return;
        const title = prompt("Enter the subject for mediation:");
        if (title) {
            this.cases.push({ id: Date.now(), title, status: "OPEN", requester: kernel.member.username });
            kernel.logAction(`Mediation Requested: ${title}`);
            vpuUI.refreshApp('mediation');
        }
    },

    resolveCase(caseId) {
        const c = this.cases.find(x => x.id === caseId);
        if (c) {
            c.status = "RESOLVED";
            kernel.logAction(`Case Resolved: #${caseId} by ${kernel.member.username}`);
            vpuUI.refreshApp('mediation');
        }
    }
};