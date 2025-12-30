/** * THEALCOHESION TEMPORAL LAW - PHASE 4.4
 * Strictly 28-Day Cycles + Holiday Pauses
 * Genesis Allotment: 26-12-2025 
 */
const thealTimeApp = {
    id: "time-manager",
    name: "Temporal Engine",
    currentViewDate: new Date(),

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
                    <div id="vpu-calendar-grid" class="calendar-grid-container" style="flex:2; display:grid; grid-template-columns:repeat(7, 1fr); gap:2px; padding:10px; background:#111; overflow-y:auto;">
                        </div>
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

    // Navigate to today's date
    goToToday() {
        this.currentViewDate = new Date();
        this.renderGrid(this.currentViewDate);
        
        // Reset the date picker visually to empty or current date
        const picker = document.getElementById('vpu-date-picker');
        if(picker) picker.value = "";
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

    renderGrid(date) {
        const grid = document.getElementById("vpu-calendar-grid");
        const label = document.getElementById("vpu-month-label");
        if (!grid) return;
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
            cell.className = `vpu-day-cell ${theal.type}`;
            cell.style.cssText = "background:#1a1a2e; border:1px solid #333; min-height:50px; padding:5px; font-size:10px; color:#fff;";
            
            if (d.toDateString() === new Date().toDateString()) cell.style.border = "1px solid #e95420";
            if (theal.color) cell.style.borderLeft = `4px solid ${theal.color}`;

            cell.innerHTML = `<div style="display:flex; justify-content:space-between;"><span>${day}</span></div><div style="font-size:8px; margin-top:5px; color:#aaa;">${theal.label}</div>`;
            grid.appendChild(cell);
        }
    },

    jumpToDate(val) {
        if(!val) return;
        this.currentViewDate = new Date(val);
        this.renderGrid(this.currentViewDate);
    },

    changeMonth(delta) {
        this.currentViewDate.setMonth(this.currentViewDate.getMonth() + delta);
        this.renderGrid(this.currentViewDate);
    },

    renderUpcomingEvents() {
        const list = document.getElementById('vpu-event-list');
        const progFill = document.getElementById('vpu-progress-fill');
        const progText = document.getElementById('vpu-progress-percent');
        if (!list) return;

        // 1. Update Progress Bar logic
        const now = new Date();
        const theal = this.getThealDate(now);
        if (theal.type === "cycle" || theal.type === "milestone") {
            // Extract the day number from label "Cycle X, Day Y"
            const dayNum = parseInt(theal.label.match(/Day (\d+)/)[1]);
            const percent = Math.round((dayNum / 28) * 100);
            if (progFill) progFill.style.width = `${percent}%`;
            if (progText) progText.textContent = `${percent}%`;
        } else {
            // If it's a holiday or transition, show full/empty
            if (progFill) progFill.style.width = "100%";
            if (progText) progText.textContent = "Break";
        }

        // 2. Update Event List
        const events = [
            { n: "Special Day", d: "29/02" },
            { n: "End Year", d: "20/11" },
            { n: "Genesis Allotment", d: "26/12" }
        ];
        list.innerHTML = events.map(e => `<div style="font-size:10px; margin-bottom:8px; padding-left:5px; border-left:2px solid #a445ff;"><b>${e.n}</b><br><span style="color:#888;">${e.d}</span></div>`).join('');
    },

    goToToday() {
        this.currentViewDate = new Date();
        this.renderGrid(this.currentViewDate);
        const picker = document.getElementById('vpu-date-picker');
        if(picker) picker.value = "";
    },

    startClock() {
        if (this.timer) clearInterval(this.timer);
        this.timer = setInterval(() => {
            const now = new Date();
            const timeEl = document.getElementById("vpu-theal-time");
            const dateEl = document.getElementById("vpu-theal-date");
            if (timeEl) {
                const h = now.getHours();
                const m = now.getMinutes().toString().padStart(2, "0");
                const s = now.getSeconds().toString().padStart(2, "0");
                timeEl.textContent = `${this.convertToThealHour(h).toString().padStart(2, "0")}:${m}:${s}`;
            }
            if (dateEl) dateEl.textContent = this.getThealDate(now).label;
        }, 1000);
    },

    convertToThealHour(hour) {
        const mapping = { 7:1, 8:2, 9:3, 10:4, 11:5, 12:6, 13:7, 14:8, 15:9, 16:10, 17:11, 18:12, 19:1, 20:2, 21:3, 22:4, 23:5, 0:6, 1:7, 2:8, 3:9, 4:10, 5:11, 6:12 };
        return mapping[hour] || hour;
    }
};