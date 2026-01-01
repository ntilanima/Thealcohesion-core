/** * THEALCOHESION TEMPORAL LAW - PHASE 4.5
 * Strictly 28-Day Cycles + Holiday Pauses + Sync Pulse
 * Genesis Allotment: 26-12-2025 
 */
const thealTimeApp = {
    id: "time-manager",
    name: "Temporal Engine",
    currentViewDate: new Date(),
    lastHour: null, // Tracks hour changes for Sync Pulse

    cycles: [
        { name: "1st Cycle", start: "21/11", end: "18/12" },
        { name: "2nd Cycle", start: "19/12", end: "15/01" },
        { name: "3rd Cycle", start: "16/01", end: "12/02" },
        { name: "4th Cycle", start: "13/02", end: "12/03" },
        { name: "5th Cycle", start: "13/03", end: "09/04" },
        { name: "6th Cycle", start: "10/04", end: "07/05" },
        { name: "7th Cycle", start: "08/05", end: "04/06" },
        { name: "8th Cycle", start: "05/06", end: "02/07" },
        { name: "9th Cycle", start: "03/07", end: "30/07" },
        { name: "10th Cycle", start: "31/07", end: "27/08" },
        { name: "11th Cycle", start: "28/08", end: "24/09" },
        { name: "12th Cycle", start: "25/09", end: "22/10" },
        { name: "13th Cycle", start: "23/10", end: "19/11" }
    ],

    render() {
        setTimeout(() => {
            this.startClock();
            this.renderGrid(this.currentViewDate);
            this.renderUpcomingEvents(); 
        }, 100);

        return `
            <div class="calendar-app-window">
                <div class="calendar-header" style="display:flex; justify-content:space-between; align-items:center; padding:10px; background:#1a1a2e; border-bottom:1px solid #444;">
                    <div class="nav-controls" style="display:flex; gap:5px;">
                        <button class="vpu-btn" onclick="thealTimeApp.changeMonth(-1)">←</button>
                        <button class="vpu-btn" onclick="thealTimeApp.goToToday()" style="font-size:10px; text-transform:uppercase; font-weight:bold; color:#a445ff; min-width:60px;">Today</button>
                        <button class="vpu-btn" onclick="thealTimeApp.changeMonth(1)">→</button>
                    </div>
                    <h2 id="vpu-month-label" style="margin:0; font-size:1.1rem; color:#fff;">Loading...</h2>
                    <div class="date-jump-container">
                        <input type="date" id="vpu-date-picker" onchange="thealTimeApp.jumpToDate(this.value)" style="background:#000; color:#fff; border:1px solid #a445ff; font-size:12px; border-radius:4px; padding:2px;">
                    </div>
                </div>
                <div class="calendar-layout-vpu" style="display:flex; height:calc(100% - 50px);">
                    <div id="vpu-calendar-grid" class="calendar-grid-container" style="flex:2; display:grid; grid-template-columns:repeat(7, 1fr); gap:2px; padding:10px; background:#111; overflow-y:auto;"></div>
                    <div class="calendar-info-sidebar" style="flex:1; background:#1a1a2e; border-left:1px solid #333; padding:15px; text-align:center;">
                        <div class="clock-widget">
                            <div id="vpu-theal-time" class="theal-time-big" style="font-size:1.8rem; font-weight:bold; color:#a445ff;">--:--:--</div>
                            <div id="vpu-theal-date" class="theal-date-sub" style="color:#aaa; font-size:0.9rem; margin-bottom:10px;">Loading...</div>
                            <div id="vpu-cycle-progress-container" style="margin-bottom:20px;">
                                <div style="display:flex; justify-content:space-between; font-size:9px; color:#888; margin-bottom:4px;">
                                    <span>Cycle Progress</span>
                                    <span id="vpu-progress-percent">0%</span>
                                </div>
                                <div style="width:100%; height:6px; background:#000; border-radius:3px; overflow:hidden; border:1px solid #333;">
                                    <div id="vpu-progress-fill" style="width:0%; height:100%; background:linear-gradient(90deg, #a445ff, #d586ff); transition: width 0.5s ease;"></div>
                                </div>
                            </div>
                        </div>
                        <div class="next-events-vpu" style="text-align:left; border-top:1px solid #444; padding-top:10px;">
                            <h4 style="font-size:12px; color:#a445ff; margin-bottom:10px;">CHARTER EVENTS</h4>
                            <div id="vpu-event-list"></div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    getThealDate(date) {
        const d = date.getDate();
        const m = date.getMonth() + 1; 
        const year = date.getFullYear();
        const isLeap = (year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0));

        if (d === 20 && m === 11) return { label: "HOLIDAY: END YEAR", type: "holiday", color: "#e95420" };
        if (d === 29 && m === 2) return { label: "HOLIDAY: SPECIAL DAY", type: "holiday", color: "#d586ff" };
        let milestone = (d === 26 && m === 12) ? " ★ Genesis Allotment" : "";

        for (let i = 0; i < this.cycles.length; i++) {
            const cycle = this.cycles[i];
            const [sD, sM] = cycle.start.split('/').map(Number);
            const [eD, eM] = cycle.end.split('/').map(Number);
            let startDate = new Date(year, sM - 1, sD);
            let endDate = new Date(year, eM - 1, eD);
            if (sM >= 11 && m < 11) startDate.setFullYear(year - 1);
            if (eM >= 11 && m < 11) endDate.setFullYear(year - 1);
            if (endDate < startDate) endDate.setFullYear(endDate.getFullYear() + 1);

            if (date >= startDate && date <= endDate) {
                let diff = Math.floor((date - startDate) / 86400000) + 1;
                if (isLeap && date > new Date(year, 1, 29) && startDate <= new Date(year, 1, 29)) diff--;
                return { 
                    label: `${cycle.name}, Day ${diff}${milestone}`, 
                    type: milestone ? "milestone" : "cycle",
                    color: milestone ? "#FFD700" : null
                };
            }
        }
        return { label: "Transition", type: "other" };
    },

    startClock() {
        // Safety: If the app window isn't open, don't try to update its internal IDs
        const timeEl = document.getElementById("vpu-theal-time");
        if (!timeEl) {
            console.warn("Temporal Engine: App UI not detected. Updating Top Bar only.");
        }
        if (this.timer) clearInterval(this.timer);
        const tick = () => {
            const now = new Date();
            const h = now.getHours();
            const m = now.getMinutes().toString().padStart(2, "0");
            const s = now.getSeconds().toString().padStart(2, "0");
            
            // 1. Theal Mapping
            const thealHourNum = this.convertToThealHour(h);
            const thealHourStr = thealHourNum.toString().padStart(2, "0");
            const timeString = `${thealHourStr}:${m}:${s}`;
            const thealDateObj = this.getThealDate(now);

            // 2. Pulse Check
            if (this.lastHour !== null && thealHourNum !== this.lastHour) {
                this.triggerSyncPulse();
            }
            this.lastHour = thealHourNum;

            // 3. Update Top Bar
            const topBarTime = document.getElementById("top-bar-time");
            if (topBarTime) {
                const cycleMatch = thealDateObj.label.match(/(\d+)(?:st|nd|rd|th) Cycle/);
                const dayMatch = thealDateObj.label.match(/Day (\d+)/);
                const compactDate = (cycleMatch && dayMatch) ? `C${cycleMatch[1]}-D${dayMatch[1]}` : "TRANSIT";
                topBarTime.innerHTML = `<span style="color: #888; font-size: 10px; margin-right: 8px;">${compactDate}</span> ${timeString}`;
            }
            
            // 4. Update App Window
            const timeEl = document.getElementById("vpu-theal-time");
            const dateEl = document.getElementById("vpu-theal-date");
            if (timeEl) timeEl.textContent = timeString;
            if (dateEl) dateEl.textContent = thealDateObj.label;

            // 5. Update HUD
            const hudTime = document.getElementById("hud-theal-time");
            if (hudTime) {
                hudTime.textContent = timeString;
                document.getElementById("hud-theal-date").textContent = thealDateObj.label;
                document.getElementById("hud-normal-time").textContent = `${h.toString().padStart(2, "0")}:${m}:${s}`;
                document.getElementById("hud-normal-date").textContent = now.toLocaleDateString();
            }
            
            // 6. Update Taskbar Clock
            const taskClock = document.getElementById('taskbar-clock');
            if (taskClock) {
                taskClock.textContent = timeString; // This shows the C#-D# theal time in the taskbar
            }
        };
        tick();
        this.timer = setInterval(tick, 1000);
    },

    triggerSyncPulse() {
        const topBar = document.querySelector('.top-bar');
        if (topBar) {
            topBar.classList.add('sync-pulse-active');
            setTimeout(() => topBar.classList.remove('sync-pulse-active'), 2000);
        }
    },

    renderGrid(date) {
        const grid = document.getElementById("vpu-calendar-grid");
        const label = document.getElementById("vpu-month-label");
        if (!grid || !label) return;
        grid.innerHTML = "";
        label.textContent = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
        ['Sat', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri'].forEach(d => {
            grid.innerHTML += `<div class="grid-header" style="font-size:10px; color:#a445ff; text-align:center;">${d}</div>`;
        });
        const first = new Date(date.getFullYear(), date.getMonth(), 1);
        const last = new Date(date.getFullYear(), date.getMonth() + 1, 0);
        const startIndex = (first.getDay() + 1) % 7;
        for (let i = 0; i < startIndex; i++) grid.innerHTML += `<div></div>`;
        for (let day = 1; day <= last.getDate(); day++) {
            const d = new Date(date.getFullYear(), date.getMonth(), day);
            const theal = this.getThealDate(d);
            const cell = document.createElement("div");
            cell.style.cssText = "background:#1a1a2e; border:1px solid #333; min-height:50px; padding:5px; font-size:10px; color:#fff;";
            if (d.toDateString() === new Date().toDateString()) cell.style.border = "1px solid #e95420";
            if (theal.color) cell.style.borderLeft = `4px solid ${theal.color}`;
            cell.innerHTML = `<div>${day}</div><div style="font-size:8px; margin-top:5px; color:#aaa;">${theal.label}</div>`;
            grid.appendChild(cell);
        }
    },

    renderUpcomingEvents() {
        const list = document.getElementById('vpu-event-list');
        const progFill = document.getElementById('vpu-progress-fill');
        const progText = document.getElementById('vpu-progress-percent');
        
        if (!list) return;

        // 1. Update Event List with Certificate Trigger
        const events = [
            { n: "Special Day", d: "29/02", action: null },
            { n: "End Year", d: "20/11", action: null },
            { n: "Genesis Allotment", d: "26/12", action: "triggerGenesisCert()" }
        ];

        list.innerHTML = events.map(e => `
            <div style="font-size:10px; margin-bottom:12px; border-left:2px solid #a445ff; padding-left:8px; cursor: ${e.action ? 'pointer' : 'default'}; transition: 0.2s;" 
                 onmouseover="${e.action ? "this.style.background='rgba(164,69,255,0.1)'" : ""}"
                 onmouseout="this.style.background='transparent'"
                 onclick="${e.action ? e.action : ''}">
                <b style="color: ${e.action ? '#d586ff' : '#fff'}">${e.n} ${e.action ? '↗' : ''}</b><br>
                <span style="color:#888;">${e.d}</span>
            </div>
        `).join('');

        // 2. Update Progress Bar logic
        const now = new Date();
        const theal = this.getThealDate(now);
        
        if (theal.type === "cycle" || theal.type === "milestone") {
            // Extract the day number from label (e.g., "Cycle 2, Day 13")
            const dayMatch = theal.label.match(/Day (\d+)/);
            if (dayMatch) {
                const dayNum = parseInt(dayMatch[1]);
                const percent = Math.round((dayNum / 28) * 100);
                if (progFill) progFill.style.width = `${percent}%`;
                if (progText) progText.textContent = `${percent}%`;
            }
        } else {
            // If it's a holiday or transition
            if (progFill) progFill.style.width = "100%";
            if (progText) progText.textContent = "Break";
        }
    },

    goToToday() {
        this.currentViewDate = new Date();
        this.renderGrid(this.currentViewDate);
        if(document.getElementById('vpu-date-picker')) document.getElementById('vpu-date-picker').value = "";
    },

    jumpToDate(val) { if(val) { this.currentViewDate = new Date(val); this.renderGrid(this.currentViewDate); } },

    changeMonth(delta) { this.currentViewDate.setMonth(this.currentViewDate.getMonth() + delta); this.renderGrid(this.currentViewDate); },

    convertToThealHour(hour) {
        const mapping = { 7:1, 8:2, 9:3, 10:4, 11:5, 12:6, 13:7, 14:8, 15:9, 16:10, 17:11, 18:12, 19:1, 20:2, 21:3, 22:4, 23:5, 0:6, 1:7, 2:8, 3:9, 4:10, 5:11, 6:12 };
        return mapping[hour] || hour;
    },

    renderHUD() {
        if (document.getElementById('temporal-hud')) return;

        const clockBtn = document.getElementById('top-bar-time');
        const rect = clockBtn.getBoundingClientRect();
        
        // Calculate Cycle Progress for the Ring
        const now = new Date();
        const theal = this.getThealDate(now);
        let progressPercent = 0;
        if (theal.type === "cycle" || theal.type === "milestone") {
            const dayNum = parseInt(theal.label.match(/Day (\d+)/)[1]);
            progressPercent = (dayNum / 28) * 100;
        }
        
        const circumference = 2 * Math.PI * 18; // Radius is 18
        const offset = circumference - (progressPercent / 100) * circumference;

        const hud = document.createElement('div');
        hud.id = 'temporal-hud';
        hud.style.cssText = `
            position: absolute; top: ${rect.bottom + 8}px; left: ${rect.left + (rect.width / 2) - 110}px;
            width: 220px; background: rgba(10, 10, 20, 0.98); backdrop-filter: blur(15px);
            border: 1px solid #a445ff; border-radius: 12px; padding: 20px 15px;
            box-shadow: 0 15px 50px rgba(0,0,0,0.9), 0 0 20px rgba(164, 69, 255, 0.15);
            z-index: 10000; color: white; font-family: sans-serif;
            animation: slideDownHUD 0.3s cubic-bezier(0.18, 0.89, 0.32, 1.28);
        `;

        hud.innerHTML = `
            <div style="display: flex; flex-direction: column; align-items: center; gap: 15px;">
                <div style="position: relative; width: 50px; height: 50px;">
                    <svg width="50" height="50" style="transform: rotate(-90deg);">
                        <circle cx="25" cy="25" r="18" stroke="#222" stroke-width="4" fill="transparent" />
                        <circle cx="25" cy="25" r="18" stroke="#a445ff" stroke-width="4" fill="transparent" 
                            stroke-dasharray="${circumference}" 
                            stroke-dashoffset="${offset}" 
                            style="transition: stroke-dashoffset 1s ease; stroke-linecap: round;" />
                    </svg>
                    <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); font-size: 10px; font-weight: bold;">
                        ${Math.round(progressPercent)}%
                    </div>
                </div>

                <div style="text-align: center; width: 100%;">
                    <small style="color:#888; text-transform:uppercase; font-size:9px; letter-spacing:1px;">Sovereign Time</small>
                    <div id="hud-theal-time" style="font-size:24px; font-family:monospace; font-weight:bold; color:#fff;">00:00:00</div>
                    <div id="hud-theal-date" style="font-size:11px; color:#d586ff; margin-top:2px;">---</div>
                </div>

                <div style="width: 100%; border-top: 1px solid #333; padding-top: 15px; text-align: center;">
                    <small style="color:#888; text-transform:uppercase; font-size:9px;">Gregorian Sync</small>
                    <div id="hud-normal-time" style="font-size:14px; color:#aaa; font-family:monospace;">00:00:00</div>
                    <div id="hud-normal-date" style="font-size:10px; color:#666;">---</div>
                </div>
                
                <button onclick="this.closest('#temporal-hud').remove()" style="width:100%; background:rgba(255,255,255,0.05); border:1px solid #444; color:#888; cursor:pointer; font-size:10px; padding:6px; border-radius:6px; transition:0.2s;">CLOSE</button>
            </div>
        `;

        document.body.appendChild(hud);

        const closeHandler = (e) => {
            if (!hud.contains(e.target) && e.target !== clockBtn) {
                hud.remove();
                document.removeEventListener('mousedown', closeHandler);
            }
        };
        document.addEventListener('mousedown', closeHandler);
    },
    // Certificate Display
    showCertificate() {
        if (document.getElementById('cert-overlay')) return;

        // Generate a Unique Serial Number (Genesis Batch + Timestamp)
        const serial = `VPU-GEN-${Date.now().toString().slice(-6)}`;

        const overlay = document.createElement('div');
        overlay.id = "cert-overlay";
        overlay.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0, 0, 0, 0.92); backdrop-filter: blur(15px);
            display: flex; justify-content: center; align-items: center;
            z-index: 20000; animation: fadeIn 0.4s ease-out;
        `;

        overlay.innerHTML = `
            <div class="cert-card" style="
                width: 500px; padding: 50px; background: #0a0a12;
                border: 2px solid #a445ff; border-radius: 20px; text-align: center;
                color: white; font-family: 'Georgia', serif; position: relative;
                box-shadow: 0 0 50px rgba(164,69,255,0.4);
            ">
                <div style="font-size: 10px; color: #a445ff; letter-spacing: 3px; margin-bottom: 20px;">GENESIS ALLOTMENT RECORD</div>
                <h1 style="font-size: 26px; margin: 0; letter-spacing: 1px;">Sovereignty Allotment</h1>
                <p style="font-style: italic; color: #888; font-size: 13px; margin-top: 5px;">Phase 1: Initial Distribution</p>
                
                <hr style="border:0; border-top: 1px solid #222; margin: 30px 0;">
                
                <p style="font-size: 12px; color: #aaa; text-transform: uppercase; letter-spacing: 1px;">Confirming Stake For:</p>
                <h2 style="font-size: 32px; margin: 10px 0; color: #fff;">EPOS & INVESTORS</h2>
                
                <p style="margin-top: 30px; font-size: 14px; color: #d586ff;">December 26th, 2025</p>
                <div style="font-size: 9px; color: #444; margin-top: 5px;">Serial: ${serial}</div>

                <div style="margin-top: 40px; display: flex; gap: 15px; justify-content: center;">
                    <button onclick="window.print()" style="background:#a445ff; color:white; border:none; padding:10px 20px; border-radius:6px; cursor:pointer; font-weight:bold; transition: 0.3s;" onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">Download PDF</button>
                    <button onclick="document.getElementById('cert-overlay').remove()" style="background:transparent; color:#666; border:1px solid #333; padding:10px 20px; border-radius:6px; cursor:pointer;">Close</button>
                </div>
            </div>
        `;

        document.body.appendChild(overlay);
    },

    // Hard Reboot Functionality
    reboot(containerId) {
    console.log("Temporal Engine: Hard Rebooting UI...");
    this.startClock(); // Restarts the 1s interval
    this.renderGrid(this.currentViewDate);
    this.renderUpcomingEvents();
    
    // Force a progress bar update immediately
    const now = new Date();
    const theal = this.getThealDate(now);
    if (theal.label.includes("Day")) {
        const day = parseInt(theal.label.match(/Day (\d+)/)[1]);
        const percent = Math.round((day / 28) * 100);
        const bar = document.getElementById('vpu-progress-fill');
        if (bar) bar.style.width = percent + "%";
    }
    }
};

// GLOBAL SCOPE FUNCTION - Re-optimized for visibility
function triggerGenesisCert() {
    // 1. Debugging check: Open your browser console (F12) to see if this appears
    console.log("CRITICAL: Genesis Certificate Triggered!");
    
    if (document.getElementById('cert-overlay')) return;

    const serial = `VPU-GEN-${Date.now().toString().slice(-6)}`;
    const overlay = document.createElement('div');
    overlay.id = "cert-overlay";
    
    // We use !important to override any inherited styles from your OS CSS
    overlay.style.cssText = `
        position: fixed !important; 
        top: 0 !important; 
        left: 0 !important; 
        width: 100vw !important; 
        height: 100vh !important;
        background: rgba(0, 0, 0, 0.95) !important; 
        backdrop-filter: blur(20px) !important;
        -webkit-backdrop-filter: blur(20px) !important;
        display: flex !important; 
        justify-content: center !important; 
        align-items: center !important;
        z-index: 2147483647 !important; /* Maximum possible z-index */
        animation: fadeIn 0.3s ease-out;
    `;

    overlay.innerHTML = `
        <div class="cert-card" style="
            width: 450px; padding: 40px; background: #0a0a12;
            border: 2px solid #a445ff; border-radius: 15px; text-align: center;
            color: white; font-family: 'Georgia', serif; 
            box-shadow: 0 0 70px rgba(164,69,255,0.5);
            pointer-events: auto;
        ">
            <h1 style="color: #a445ff; font-size: 22px; letter-spacing: 2px; margin: 0;">ALLOTMENT RECORD</h1>
            <p style="font-size: 10px; color: #666; margin-bottom: 25px;">THEALCOHESION GENESIS PHASE</p>
            
            <div style="border: 1px solid #222; padding: 20px; border-radius: 10px; background: rgba(255,255,255,0.02);">
                <p style="font-size: 12px; color: #888;">HOLDER STATUS</p>
                <h2 style="font-size: 24px; margin: 5px 0; color: #fff;">INVESTORS & EPOS</h2>
                <p style="color: #d586ff; font-weight: bold; margin-top: 15px;">DECEMBER 26, 2025</p>
            </div>

            <p style="font-size: 9px; color: #444; margin-top: 20px;">VERIFICATION ID: ${serial}</p>

            <div style="margin-top: 30px; display: flex; gap: 10px; justify-content: center;">
                <button onclick="window.print()" style="background:#a445ff; color:white; border:none; padding:10px 20px; border-radius:5px; cursor:pointer; font-weight:bold;">PDF DOWNLOAD</button>
                <button onclick="document.getElementById('cert-overlay').remove()" style="background:#333; color:#eee; border:none; padding:10px 20px; border-radius:5px; cursor:pointer;">EXIT</button>
            </div>
        </div>
    `;

    document.body.appendChild(overlay);
}

setTimeout(() => { thealTimeApp.startClock(); }, 500);