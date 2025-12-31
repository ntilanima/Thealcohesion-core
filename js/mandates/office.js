/**
 * Thealcohesion Governance Notices App
 * Core Module for Phase 1
 */
const governanceApp = {
    id: "governance",
    name: "Governance & Notices",

    // This data would eventually come from the Values Council via the Kernel
    getNotices() {
        return [
            { id: 1, title: "Sovereign Core Active", content: "Thealcohesion Core is now in Phase 1. All systems are identity-gated." },
            { id: 2, title: "Ubuntu Protocol", content: "Remember: 'I am because we are'. Use storage resources responsibly." },
            { id: 3, title: "Privacy Shield", content: "Administrator access to member files is programmatically barred." }
        ];
    },

    render() {
        const notices = this.getNotices();
        return `
            <div class="governance-container">
                <h3>Collective Mandates</h3>
                <div class="notice-list">
                    ${notices.map(n => `
                        <div class="notice-card">
                            <h4>${n.title}</h4>
                            <p>${n.content}</p>
                        </div>
                    `).join('')}
                </div>
                <hr>
                <p class="footer-note">Binding under Thealcohesion Core Charter.</p>
            </div>
        `;
    }
};