/**
 * sovereignBiome.js
 * FIXED_SEARCH_LOGIC // ALLOTMENT_PRIORITY_SYNC
 */

export class SovereignBiome {
    constructor(container, apiBridge) {
        this.container = container;
        this.api = apiBridge;
        this.viewMode = 'MAP';
        this.showHeatmap = true;
        this.map = null;
        
        this.acPoints = [
            { id: "AC_NAIROBI_01", name: "Nairobi Central", lat: -1.286389, lng: 36.817223, res: 98, tlc: 450 },
            { id: "AC_MOMBASA_02", name: "Mombasa Coastal", lat: -4.043477, lng: 39.668206, res: 72, tlc: 210 },
            { id: "AC_KISUMU_03", name: "Kisumu Lake", lat: -0.091702, lng: 34.767956, res: 91, tlc: 180 }
        ];

        // Ensure global hooks are active
        window.drillAction = (id) => this.drillToTLC(id);
        window.selectSuggestion = (type, id) => this.handleSelection(type, id);
    }

    render() {
        if (this.viewMode === 'MAP') {
            this.container.innerHTML = `
                <div class="biome-grid-container">
                    <div class="map-search-container">
                        <div class="search-input-wrapper">
                            <input type="text" id="map-search" class="map-search-input" placeholder="SCANNING_FOR_SIGNATURES..." autocomplete="off">
                            <button id="btn-teleport" class="map-search-btn">GO</button>
                        </div>
                        <div id="search-results" class="search-suggestions"></div>
                    </div>

                    <div id="biome-map"></div>
                    
                    <div class="map-controls">
                        <button id="toggle-heat" class="map-toggle-btn">HEAT: ${this.showHeatmap ? 'ON' : 'OFF'}</button>
                    </div>
                </div>
            `;
            // Re-init map and search
            setTimeout(() => {
                this.initMap();
                this.initSearchLogic();
            }, 100);
        } else {
            this.container.innerHTML = this.renderTLCList(this.selectedAC);
        }
    }

    initSearchLogic() {
    const input = document.getElementById('map-search');
    const results = document.getElementById('search-results');
    if (!input || !results) return;

    input.addEventListener('input', (e) => {
        const val = e.target.value.toUpperCase();
        
        if (val.length < 1) {
            results.style.display = 'none';
            return;
        }

        // --- THE TRIPLE-PASS SCAN ---

        // 1. Scan Action Centers (By ID or Name)
        let acMatches = this.acPoints.filter(ac => 
            ac.name.toUpperCase().includes(val) || ac.id.includes(val)
        ).map(ac => ({ label: ac.name, type: 'ACTION_CENTER', id: ac.id }));

        // 2. Scan Natives & TLC IDs (Pulling from window.os.memberList)
        // Note: We check userName for "Natives" and the .id field for "TLC IDs"
        const members = window.os?.memberList || [
            // Fallback for testing if list is empty
            { userName: "Investor_Alpha", id: "TLC-999", actionCenter: "AC_NAIROBI_01", isInvestor: true },
            { userName: "EPOS_Master", id: "TLC-001", actionCenter: "AC_NAIROBI_01", isEPOS: true }
        ];

        let memberMatches = members.filter(m => 
            m.userName.toUpperCase().includes(val) || // Search by Name
            m.id.toUpperCase().includes(val)          // Search by TLC ID (e.g., "TLC-001")
        ).map(m => {
            // Determine the Sub-Type for the Label
            let category = 'TLC_NATIVE';
            if (m.isInvestor) category = 'INVESTOR';
            if (m.isEPOS) category = 'EPOS';

            return { 
                label: m.userName, 
                subLabel: m.id, // Show the TLC ID as well
                type: category, 
                id: m.actionCenter 
            };
        });

        const allResults = [...acMatches, ...memberMatches].slice(0, 8);

        if (allResults.length > 0) {
            results.style.display = 'block';
            results.innerHTML = allResults.map(res => `
                <div class="suggestion-item" onclick="selectSuggestion('${res.type}', '${res.id}')">
                    <div style="display:flex; flex-direction:column;">
                        <span class="suggestion-label">${res.label}</span>
                        <span style="font-size:8px; color:#444;">${res.subLabel || res.id}</span>
                    </div>
                    <div style="display:flex; align-items:center; gap:5px;">
                        ${(res.type === 'INVESTOR' || res.type === 'EPOS') ? `<span class="priority-tag">ALLOTMENT</span>` : ''}
                        <span class="suggestion-type">${res.type}</span>
                    </div>
                </div>
            `).join('');
        } else {
            results.style.display = 'none';
        }
    });
}

    handleSelection(type, id) {
        const results = document.getElementById('search-results');
        const input = document.getElementById('map-search');
        if (results) results.style.display = 'none';
        if (input) input.value = "";

        const target = this.acPoints.find(ac => ac.id === id);
        if (target) {
            this.map.flyTo([target.lat, target.lng], 13, { duration: 1.5 });
            this.api.notify(`TARGET_LOCKED: ${target.name} (${type})`, "success");
        }
    }

    initMap() {
        if (this.map) this.map.remove();
        this.map = L.map('biome-map', { zoomControl: false, attributionControl: false }).setView([-1.28, 36.81], 7);
        L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png').addTo(this.map);

        if (this.showHeatmap) {
            const heatData = this.acPoints.map(ac => [ac.lat, ac.lng, ac.tlc / 100]);
            L.heatLayer(heatData, { radius: 35, blur: 20, gradient: { 0.4: 'green', 1: 'white' } }).addTo(this.map);
        }

        this.acPoints.forEach(ac => {
            const icon = L.divIcon({ className: 'ac-marker-icon', html: `<div class="marker-node" id="node-${ac.id}"></div>` });
            L.marker([ac.lat, ac.lng], { icon }).addTo(this.map).bindPopup(`
                <div style="color:var(--id-green); font-family:monospace;">
                    <b>${ac.name}</b><br>
                    <button onclick="drillAction('${ac.id}')" style="background:var(--id-green); color:#000; border:none; padding:5px; width:100%; margin-top:8px; cursor:pointer; font-weight:bold;">
                        [ DRILL_INTO_TLC ]
                    </button>
                </div>
            `);
        });

        const heatBtn = document.getElementById('toggle-heat');
        if(heatBtn) heatBtn.onclick = () => { this.showHeatmap = !this.showHeatmap; this.render(); };
    }

    drillToTLC(acId) {
        this.viewMode = 'CELL_LIST';
        this.selectedAC = acId;
        this.render();
    }

    exitToMap() {
        this.viewMode = 'MAP';
        this.render();
    }

    renderTLCList(acId) {
        const sourceData = window.os?.memberList || [];
        const natives = sourceData.filter(m => m.actionCenter === acId);
        return `
            <div class="biome-grid-container" style="padding:40px; background:#000;">
                <header style="display:flex; justify-content:space-between; align-items:center; margin-bottom:30px;">
                    <h1 style="color:var(--id-green); margin:0;">[ ${acId} ]</h1>
                    <button onclick="os.activeProcesses['biome'].exitToMap()" style="background:transparent; border:1px solid #333; color:#666; cursor:pointer; padding:8px 20px;">
                        [ BACK_TO_MAP ]
                    </button>
                </header>
                <div class="tlc-list-container">${natives.length ? natives.map(n => `<div class="tlc-row"><span>${n.userName.toUpperCase()}</span><span>100MB</span></div>`).join('') : 'EMPTY'}</div>
            </div>
        `;
    }
}