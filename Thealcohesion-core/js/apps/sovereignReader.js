/**
 * SOVEREIGN READER v1.0 (Zero-CDN)
 * Optimized for Thaelcohesion Internal Documents
 */
export const SovereignReader = {
    id: 'docs',
    render: (win, kernel) => {
        const docs = {
            'constitution': { title: 'Constitution', type: 'text', content: '<h1>Thealcohesion Constitution</h1><p>Rules of the Enclave...</p>' },
            'mtaagrid': { title: 'MtaaGrid Protocol', type: 'text', content: '<h1>MtaaGrid V1</h1><p>Decentralized Infrastructure...</p>' },
            'allotment': { title: 'EPOS Allotment', type: 'text', content: '<h1>Allotment 2025-12-26</h1><p>Verification data...</p>' }
        };

        win.innerHTML = `
            <div class="reader-root" style="display: flex; height: 100%; background: #050505; color: #00ff41; font-family: monospace;">
                <div class="reader-sidebar" style="width: 220px; border-right: 1px solid gold; padding: 15px; background: #0a0a0a;">
                    <div style="color: gold; font-size: 10px; margin-bottom: 20px;">ARCHIVE_INDEX</div>
                    ${Object.keys(docs).map(key => `
                        <div class="doc-item" data-id="${key}" style="padding: 10px; cursor: pointer; border: 1px solid #1a1a1a; margin-bottom: 8px; font-size: 12px;">
                            > ${docs[key].title}
                        </div>
                    `).join('')}
                </div>
                <div class="reader-viewport" style="flex: 1; display: flex; flex-direction: column;">
                    <div class="reader-tools" style="padding: 10px; border-bottom: 1px solid #1a1a1a; display: flex; gap: 10px;">
                        <input type="text" id="reader-search" placeholder="FILTER_KEYWORDS..." style="background: #000; border: 1px solid gold; color: gold; padding: 5px; flex: 1; font-family: monospace;">
                    </div>
                    <div id="reader-content" style="flex: 1; overflow-y: auto; padding: 40px; line-height: 1.6; color: #ccc;">
                        <div style="text-align: center; margin-top: 100px; color: #333;">SELECT_A_DOCUMENT_TO_DECRYPT</div>
                    </div>
                </div>
            </div>
        `;

        // Logic
        win.querySelectorAll('.doc-item').forEach(btn => {
            btn.onclick = () => {
                const doc = docs[btn.dataset.id];
                const display = win.querySelector('#reader-content');
                display.innerHTML = `<div class="fade-in">${doc.content}</div>`;
                // Add "Liquid Gold" highlight to headings
                display.querySelectorAll('h1').forEach(h => h.style.color = 'gold');
                kernel.logEvent('INFO', `SovereignReader: Accessing ${doc.title}`);
            };
        });

        // Native Search Logic
        const search = win.querySelector('#reader-search');
        search.oninput = (e) => {
            const term = e.target.value.toLowerCase();
            const content = win.querySelector('#reader-content');
            if (term.length > 2) {
                const regex = new RegExp(`(${term})`, 'gi');
                content.innerHTML = content.innerHTML.replace(/<mark style="background: gold; color: black;">|<\/mark>/g, "");
                content.innerHTML = content.innerHTML.replace(regex, '<mark style="background: gold; color: black;">$1</mark>');
            }
        };
    }
};