/** * THEALCOHESION TEMPORAL LAW - PHASE 4.5
 * Genesis Allotment: 26-12-2025 
 */

export class TimeApp {
    constructor(container) {
        this.container = container;
        this.app = thealTimeApp;
    }

    init() {
        if (this.container) {
            this.container.innerHTML = this.app.render();
            this.app.startClock();
            this.app.renderGrid(this.app.currentViewDate);
            this.app.renderUpcomingEvents();
        }
    }

    destruct() {
        if (this.app.timer) clearInterval(this.app.timer);
    }
}

const thealTimeApp = {
    id: "time-manager",
    name: "Temporal Engine",
    currentViewDate: new Date(),
    timer: null,

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
    return `
        <div class="calendar-app-window" style="height:100%; display:flex; flex-direction:column; background:#000; overflow-y: auto; overflow-x: hidden;
            --text-main: clamp(14px, 1.1vw, 18px); 
            --text-sub: clamp(10px, 0.8vw, 13px);
            --text-title: clamp(22px, 2.2vw, 32px);">
            
            <div class="calendar-header" style="display:flex; flex-wrap: wrap; justify-content:space-between; align-items:center; padding:15px; background:#1a1a2e; border-bottom:1px solid #444; gap: 10px;">
                <div class="nav-controls" style="display:flex; gap:8px;">
                    <button class="vpu-btn" onclick="thealTimeApp.changeMonth(-1)">←</button>
                    <button class="vpu-btn" onclick="thealTimeApp.goToToday()" style="font-size: var(--text-sub); min-width:80px;">Today</button>
                    <button class="vpu-btn" onclick="thealTimeApp.changeMonth(1)">→</button>
                </div>
                <h2 id="vpu-month-label" style="margin:0; font-size: var(--text-main); color:#fff; flex: 1; text-align: center;">Loading...</h2>
                <input type="date" id="vpu-date-picker" onchange="thealTimeApp.jumpToDate(this.value)" style="background:#000; color:#fff; border:1px solid #a445ff; font-size: var(--text-sub); padding:5px;">
            </div>

            <div class="calendar-body-container" style="display:flex; flex-wrap: wrap; flex: 1;">
                
                <div id="vpu-calendar-grid" style="flex: 1 1 600px; display:grid; grid-template-columns:repeat(7, 1fr); gap:2px; padding:10px; background:#111; min-height: 400px;">
                </div>
                
                <div class="calendar-info-sidebar" style="flex: 1 0 280px; background:#0a0a1a; border-left:1px solid #333; padding:25px; display: flex; flex-direction: column; gap: 25px; box-sizing: border-box;">
                    <div class="clock-widget">
                        <div id="vpu-theal-time" style="font-size: var(--text-title); font-weight:bold; color:#a445ff; margin-bottom: 8px;">--:--:--</div>
                        <div id="vpu-theal-date" style="color:#aaa; font-size: var(--text-main); margin-bottom:15px;">Loading...</div>
                        
                        <div style="text-align: left;">
                            <div style="display:flex; justify-content:space-between; font-size: var(--text-sub); color:#888; margin-bottom:8px;">
                                <span>Cycle Progress</span>
                                <span id="vpu-progress-percent">0%</span>
                            </div>
                            <div style="width:100%; height:10px; background:#222; border-radius:5px; overflow:hidden;">
                                <div id="vpu-progress-fill" style="width:0%; height:100%; background:linear-gradient(90deg, #a445ff, #d586ff); transition: width 0.5s ease;"></div>
                            </div>
                        </div>
                    </div>

                    <div class="next-events-vpu" style="text-align:left; border-top:1px solid #333; padding-top:20px;">
                        <h4 style="font-size: var(--text-sub); color:#a445ff; margin-bottom:15px; letter-spacing: 1px; text-transform: uppercase;">Charter Events</h4>
                        <div id="vpu-event-list" style="display: flex; flex-direction: column; gap: 15px;"></div>
                    </div>
                </div>
            </div>
        </div>
    `;
},
    // Render the HUD
    renderHUD() {
    if (document.getElementById('temporal-hud')) return;
    
    const now = new Date();
    const metrics = this.getTemporalMetrics(now);
    const theal = this.getThealDate(now);
    
    // Circular Progress Calculation
    const dayNum = parseInt(theal.label.match(/Day (\d+)/)?.[1] || 1);
    const progress = (dayNum / 28) * 100;
    const circumference = 2 * Math.PI * 45;
    const offset = circumference - (progress / 100) * circumference;

    const hud = document.createElement('div');
    hud.id = 'temporal-hud';
    // INTEGRATED CLAMP HERE (Width)
    hud.style.cssText = `
        position: fixed; top: 60px; left: 50%; transform: translateX(-50%);
        width: clamp(320px, 30vw, 500px); 
        background: rgba(5, 5, 10, 0.98); backdrop-filter: blur(25px);
        border: 1px solid #a445ff; border-radius: 24px; padding: clamp(15px, 2vw, 30px);
        z-index: 10000; color: white; box-shadow: 0 0 40px rgba(164, 69, 255, 0.2);
        display: flex; flex-direction: column; align-items: center;
    `;

    hud.innerHTML = `
        <div style="position: relative; width: 100px; height: 100px; margin-bottom: 15px;">
            <svg width="100" height="100" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="45" fill="transparent" stroke="rgba(255,255,255,0.05)" stroke-width="4"/>
                <circle cx="50" cy="50" r="45" fill="transparent" stroke="#a445ff" stroke-width="4" 
                    stroke-dasharray="${circumference}" stroke-dashoffset="${offset}" 
                    stroke-linecap="round" style="transform: rotate(-90deg); transform-origin: 50% 50%; transition: 1s;"/>
            </svg>
            <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); font-size: 16px; font-weight: bold;">${Math.round(progress)}%</div>
        </div>

        <div id="hud-theal-time" style="font-size: 32px; font-weight: bold; margin-bottom: 5px;">00:00:00</div>
        
        <div style="width: 100%; display: grid; grid-template-columns: 1fr; gap: 8px; margin-bottom: 20px; font-family: monospace;">
            <div style="background: rgba(164, 69, 255, 0.1); padding: 8px; border-radius: 8px; border-left: 3px solid #a445ff;">
                <span style="font-size: 9px; color: #888; display: block;">NEXT CIRCLE TRANSITION</span>
                <span style="font-size: 12px; color: #fff;">${metrics.nextCirclePercent}% Remaining</span>
            </div>
            <div style="background: rgba(255, 255, 255, 0.03); padding: 8px; border-radius: 8px;">
                <span style="font-size: 9px; color: #888; display: block;">YEAR COMPLETION</span>
                <span style="font-size: 12px; color: #fff;">${metrics.daysToYearEnd} Days to Full Cycle</span>
            </div>
            <div style="background: rgba(255, 215, 0, 0.05); padding: 8px; border-radius: 8px; border-left: 3px solid #ffd700;">
                <span style="font-size: 9px; color: #ffd700; display: block;">UPCOMING HOLIDAY</span>
                <span style="font-size: 12px; color: #fff;">${metrics.daysToHoliday} Days to ${metrics.holidayName}</span>
            </div>
        </div>

        <div style="display: flex; justify-content: space-between; width: 100%; border-top: 1px solid #222; padding-top: 15px;">
            <div style="text-align: left;">
                <small style="color: #444; font-size: 8px;">GREGORIAN</small>
                <div id="hud-normal-time" style="font-size: 12px; color: #666;">${now.toLocaleTimeString()}</div>
            </div>
            <div style="text-align: right;">
                <small style="color: #444; font-size: 8px;">SOVEREIGN</small>
                <div style="font-size: 12px; color: #a445ff;">${theal.label.split(',')[0]}</div>
            </div>
        </div>
        
        <button onclick="this.parentElement.remove()" style="margin-top: 20px; background: none; border: none; color: #333; cursor: pointer; font-size: 10px;">[ CLOSE ]</button>
    `;
    document.body.appendChild(hud);
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
    if (this.timer) clearInterval(this.timer);
    
    const tick = () => {
        const now = new Date();
        const h = now.getHours();
        const m = now.getMinutes().toString().padStart(2, "0");
        const s = now.getSeconds().toString().padStart(2, "0");
        
        const thealHourNum = this.convertToThealHour(h);
        const timeString = `${thealHourNum.toString().padStart(2, "0")}:${m}:${s}`;
        const normalTime = now.toLocaleTimeString();

        // 1. Get Sovereign Data
        const thealDateObj = this.getThealDate(now);
        this.checkCycleTransition(thealDateObj.label);

        // 2. Extract Cycle/Day numbers
        const cycleMatch = thealDateObj.label.match(/(\d+)(?:st|nd|rd|th)\sCycle/);
        const cycleNo = cycleMatch ? cycleMatch[1] : "0";
        const dayMatch = thealDateObj.label.match(/Day\s(\d+)/);
        const dayNo = dayMatch ? dayMatch[1] : "0";

        // 3. Update Top Bar (Cycle-Day | Clock)
        const topBarTime = document.getElementById("top-bar-time");
        if (topBarTime) {
            const sovereignShort = thealDateObj.type === "holiday" ? "HOLY" : `${cycleNo}C-${dayNo}D`;
            
            // Strictly text content, no hover attributes
            topBarTime.textContent = `${sovereignShort} | ${timeString}`;

            // Pulse check for Holidays/Milestones
            if (thealDateObj.type === "holiday" || thealDateObj.type === "milestone") {
                topBarTime.classList.add("top-bar-holiday-active");
            } else {
                topBarTime.classList.remove("top-bar-holiday-active");
            }
        }

        // 4. Update HUD & App Window if open
        const timeEl = document.getElementById("vpu-theal-time");
        const hudTime = document.getElementById("hud-theal-time");
        const hudNormalEl = document.getElementById("hud-normal-time");

        if (timeEl) timeEl.textContent = timeString;
        if (hudTime) hudTime.textContent = timeString;
        if (hudNormalEl) hudNormalEl.textContent = normalTime;
    };

    tick();
    this.timer = setInterval(tick, 1000);
},

    renderGrid(date) {
    const grid = document.getElementById("vpu-calendar-grid");
    const label = document.getElementById("vpu-month-label");
    if (!grid || !label) return;
    
    grid.innerHTML = "";
    label.textContent = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    
    // Header Days (Sat, Sun, etc.) - Scaling font
    ['Sat', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri'].forEach(d => {
        grid.innerHTML += `
            <div style="font-size: var(--text-sub); color:#a445ff; text-align:center; padding: 10px; font-weight:bold; text-transform: uppercase;">
                ${d}
            </div>`;
    });

    const first = new Date(date.getFullYear(), date.getMonth(), 1);
    const last = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    const startIndex = (first.getDay() + 1) % 7;

    for (let i = 0; i < startIndex; i++) grid.innerHTML += `<div style="background:transparent;"></div>`;

    for (let day = 1; day <= last.getDate(); day++) {
        const d = new Date(date.getFullYear(), date.getMonth(), day);
        const theal = this.getThealDate(d);
        const cell = document.createElement("div");
        
        // Ensure min-height grows to accommodate larger font
        cell.style.cssText = `
            background:#161625; border:1px solid #222; 
            min-height: clamp(80px, 10vh, 140px);
            padding: 8px; color:#fff;
            display: flex; flex-direction: column; 
            min-width: 0; /* Forces the cell to shrink */
            overflow: hidden; /* Prevents text from pushing width */
            box-sizing: border-box;
        `;

        // Highlight Today
        if (d.toDateString() === new Date().toDateString()) {
            cell.style.borderColor = "#a445ff";
            cell.style.background = "rgba(164, 69, 255, 0.1)";
        }

        if (theal.color) cell.style.borderLeft = `4px solid ${theal.color}`;

        // THE FIX: Explicitly applying variables to the internal text
        cell.innerHTML = `
            <div style="font-size: var(--text-main); font-weight: bold; opacity: 1;">
                ${day}
            </div>
            <div style="font-size: var(--text-sub); line-height: 1.4; color: #aaa; font-family: monospace;">
                ${theal.label.replace(', Day', '<br>Day')}
            </div>
        `;
        grid.appendChild(cell);
    }
},
    renderUpcomingEvents() {
        const list = document.getElementById('vpu-event-list');
        const progFill = document.getElementById('vpu-progress-fill');
        const progText = document.getElementById('vpu-progress-percent');
        if (!list) return;

        const events = [{ n: "Genesis Allotment", d: "26/12", action: "window.triggerGenesisCert()" }];
        list.innerHTML = events.map(e => `
            <div style="font-size:10px; margin-bottom:12px; border-left:2px solid #a445ff; padding-left:8px; cursor: pointer;" onclick="${e.action}">
                <b style="color: #d586ff">${e.n} ↗</b><br>
                <span style="color:#888;">${e.d}</span>
            </div>
        `).join('');

        const now = new Date();
        const theal = this.getThealDate(now);
        if (theal.label.includes("Day")) {
            const dayNum = parseInt(theal.label.match(/Day (\d+)/)[1]);
            const percent = Math.round((dayNum / 28) * 100);
            if (progFill) progFill.style.width = `${percent}%`;
            if (progText) progText.textContent = `${percent}%`;
        }
    },

    goToToday() { this.currentViewDate = new Date(); this.renderGrid(this.currentViewDate); },
    changeMonth(delta) { this.currentViewDate.setMonth(this.currentViewDate.getMonth() + delta); this.renderGrid(this.currentViewDate); },
    jumpToDate(val) { if(val) { this.currentViewDate = new Date(val); this.renderGrid(this.currentViewDate); } },
    convertToThealHour(hour) {
        const mapping = { 7:1, 8:2, 9:3, 10:4, 11:5, 12:6, 13:7, 14:8, 15:9, 16:10, 17:11, 18:12, 19:1, 20:2, 21:3, 22:4, 23:5, 0:6, 1:7, 2:8, 3:9, 4:10, 5:11, 6:12 };
        return mapping[hour] || hour;
    },

    checkCycleTransition(thealDateLabel) {
    // Only trigger if we are on the final day
    if (thealDateLabel.includes("Day 28") && !this.transitionAlerted) {
        this.triggerSystemNotification("CYCLE TRANSITION IMMINENT", "Current cycle concludes at 12:00. Prepare for Phase Allotment.");
        this.transitionAlerted = true; // Prevent spamming
    } 
    // Reset flag when we move to Day 1
    if (thealDateLabel.includes("Day 1")) {
        this.transitionAlerted = false;
    }
},

triggerSystemNotification(title, msg) {
    const notify = document.createElement('div');
    notify.className = 'system-notification';
    notify.style.cssText = `
        position: fixed; bottom: 20px; right: 20px; width: 300px;
        background: rgba(164, 69, 255, 0.15); border: 1px solid #a445ff;
        backdrop-filter: blur(10px); color: white; padding: 15px;
        border-radius: 8px; z-index: 99999; animation: notifySlide 0.5s ease-out;
    `;
    notify.innerHTML = `
        <strong style="color:#a445ff; display:block; font-size:12px;">${title}</strong>
        <p style="font-size:11px; margin:5px 0 0; color:#ccc;">${msg}</p>
    `;
    document.body.appendChild(notify);
    setTimeout(() => notify.remove(), 8000);
},

// Temporal Metrics
getTemporalMetrics(now) {
    const theal = this.getThealDate(now);
    const dayNum = parseInt(theal.label.match(/Day (\d+)/)?.[1] || 1);
    
    // 1. % to next circle (28-day logic)
    const nextCirclePercent = Math.round(((28 - dayNum) / 28) * 100);

    // 2. Days to complete year circles
    // The 13th cycle ends on Nov 19th.
    const yearEnd = new Date(now.getFullYear(), 10, 19); // Nov 19
    if (now > yearEnd) yearEnd.setFullYear(yearEnd.getFullYear() + 1);
    const daysToYearEnd = Math.ceil((yearEnd - now) / 86400000);

    // 3. Days to next holiday
    // Checking Nov 20 (End Year) and Dec 26 (Genesis)
    const holidays = [
        { name: "End Year", date: new Date(now.getFullYear(), 10, 20) },
        { name: "Genesis Allotment", date: new Date(now.getFullYear(), 11, 26) }
    ];
    
    let nextHoliday = holidays[0];
    let minDiff = Infinity;

    holidays.forEach(h => {
        if (now > h.date) h.date.setFullYear(h.date.getFullYear() + 1);
        const diff = Math.ceil((h.date - now) / 86400000);
        if (diff < minDiff) {
            minDiff = diff;
            nextHoliday = h;
        }
    });

    return {
        nextCirclePercent,
        daysToYearEnd,
        holidayName: nextHoliday.name,
        daysToHoliday: minDiff
    };
},
};

window.triggerGenesisCert = function() {
    if (document.getElementById('cert-overlay')) return;
    const serial = `VPU-GEN-${Date.now().toString().slice(-6)}`;
    const overlay = document.createElement('div');
    overlay.id = "cert-overlay";
    overlay.style.cssText = `position:fixed; top:0; left:0; width:100vw; height:100vh; background:rgba(0,0,0,0.95); backdrop-filter:blur(20px); display:flex; justify-content:center; align-items:center; z-index:20000;`;
    overlay.innerHTML = `
        <div style="width:400px; padding:40px; background:#0a0a12; border:2px solid #a445ff; border-radius:15px; text-align:center; color:white; box-shadow:0 0 50px #a445ff55;">
            <h1 style="color:#a445ff; font-size:20px;">ALLOTMENT RECORD</h1>
            <p style="font-size:12px; color:#888; margin-bottom:20px;">GENESIS PHASE 2025</p>
            <div style="border:1px solid #222; padding:20px; border-radius:10px;">
                <p style="font-size:10px; color:#555;">BENEFICIARIES</p>
                <h2 style="font-size:1.5rem;">EPOS & INVESTORS</h2>
                <p style="color:#d586ff; margin-top:10px;">DECEMBER 26, 2025</p>
            </div>
            <p style="font-size:9px; color:#333; margin-top:20px;">ID: ${serial}</p>
            <button onclick="document.getElementById('cert-overlay').remove()" style="margin-top:20px; background:#a445ff; color:white; border:none; padding:10px 20px; cursor:pointer; border-radius:5px;">CLOSE</button>
        </div>`;
    document.body.appendChild(overlay);
};

window.thealTimeApp = thealTimeApp;