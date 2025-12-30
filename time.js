/** * THEALCOHESION TEMPORAL LAW - PHASE 4.3
 * Strictly 28-Day Cycles + Fixed Holidays 
 * Added: Date Navigation & Jump-to-Date logic
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
                <div class="calendar-header">
                    <div class="nav-controls">
                        <button class="vpu-btn" onclick="thealTimeApp.changeMonth(-1)">←</button>
                        <button class="vpu-btn" onclick="thealTimeApp.changeMonth(1)">→</button>
                    </div>
                    <h2 id="vpu-month-label" style="margin: 0; font-size: 1.2rem;">Month Year</h2>
                    <div class="date-jump-container">
                        <input type="date" id="vpu-date-picker" onchange="thealTimeApp.jumpToDate(this.value)">
                    </div>
                </div>
                <div class="calendar-layout-vpu">
                    <div class="calendar-grid-container" id="vpu-calendar-grid">
                        </div>
                    
                    <div class="calendar-info-sidebar">
                        <div class="clock-widget">
                            <div id="vpu-theal-time" class="theal-time-big">--:--:--</div>
                            <div id="vpu-theal-date" class="theal-date-sub">Loading...</div>
                        </div>

                        <div class="next-events-vpu">
                            <h4>Next Sovereignty Events</h4>
                            <div id="vpu-event-list"></div>
                        </div>
                        <div class="legend-vpu">
                            <p><span style="color:#e95420">■</span> Holiday</p>
                            <p><span style="color:#d586ff">■</span> Reflection</p>
                            <p><span style="color:#FFD700">★</span> Allotment Day</p>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    jumpToDate(dateString) {
        if (!dateString) return;
        const newDate = new Date(dateString);
        this.currentViewDate = newDate;
        this.renderGrid(newDate);
        
        // Highlight logic for the selected day
        setTimeout(() => {
            const day = newDate.getDate();
            const cells = document.querySelectorAll('.greg-num');
            cells.forEach(c => {
                if(parseInt(c.textContent) === day) {
                    const cell = c.parentElement.parentElement;
                    cell.style.boxShadow = "inset 0 0 10px #a445ff";
                    cell.style.borderColor = "#a445ff";
                }
            });
        }, 200);
    },

    getThealDate(date) {
        const d = date.getDate();
        const m = date.getMonth() + 1; 
        const year = date.getFullYear();
        const isLeap = (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);

        // 1. HOLIDAY: END YEAR (20th November)
        if (d === 20 && m === 11) return { label: "HOLIDAY: END YEAR", type: "holiday", color: "#e95420" };
        
        // 2. HOLIDAY: SPECIAL DAY (29th February)
        // This day is "Time Outside of Cycles"
        if (d === 29 && m === 2) return { label: "HOLIDAY: SPECIAL DAY", type: "holiday", color: "#d586ff" };

        if (d === 26 && m === 12) return { label: "Genesis Allotment", type: "milestone", color: "#FFD700" };

        // 3. CYCLE CALCULATION
        for (let i = 0; i < this.cycles.length; i++) {
            const cycle = this.cycles[i];
            const [startD, startM] = cycle.start.split('/').map(Number);
            const [endD, endM] = cycle.end.split('/').map(Number);

            let startDate = new Date(year, startM - 1, startD);
            let endDate = new Date(year, endM - 1, endD);

            if (startM >= 11 && m < 11) startDate.setFullYear(year - 1);
            if (endM >= 11 && m < 11) endDate.setFullYear(year - 1);
            if (endDate < startDate) endDate.setFullYear(endDate.getFullYear() + 1);

            if (date >= startDate && date <= endDate) {
                // Calculate raw difference
                let diff = Math.floor((date - startDate) / 86400000) + 1;
                
                // LEAP YEAR FIX: 
                // If we are in or after March of a leap year, and this cycle started before Feb 29 
                // but ends after it (or we are simply past it), we subtract the special day 
                // so the cycle doesn't stretch to 29 days.
                if (isLeap && date > new Date(year, 1, 29)) {
                    // Only subtract if the leap day actually fell within this specific cycle's range
                    const leapDay = new Date(year, 1, 29);
                    if (leapDay >= startDate && leapDay <= date) {
                        diff--;
                    }
                }

                return { label: `${cycle.name}, Day ${diff}`, type: "cycle" };
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
            grid.innerHTML += `<div class="grid-header">${d}</div>`;
        });

        const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
        const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0);
        const startIndex = (firstDay.getDay() + 1) % 7;
        for (let i = 0; i < startIndex; i++) grid.innerHTML += `<div></div>`;

        for (let day = 1; day <= lastDay.getDate(); day++) {
            const d = new Date(date.getFullYear(), date.getMonth(), day);
            const theal = this.getThealDate(d);
            const cell = document.createElement("div");
            cell.className = `vpu-day-cell ${theal.type}`;
            
            if (d.toDateString() === new Date().toDateString()) cell.classList.add("today-vpu");
            if (theal.color) cell.style.borderLeft = `4px solid ${theal.color}`;

            cell.innerHTML = `
                <div class="cell-top">
                    <span class="greg-num">${day}</span>
                </div>
                <div class="theal-label">${theal.label}</div>
            `;
            grid.appendChild(cell);
        }
    },

    renderUpcomingEvents() {
        const eventList = document.getElementById('vpu-event-list');
        if (!eventList) return;

        // Ensure the remark reflects that these days don't count towards cycle duration
        const charterHolidays = [
            { name: "Special Day", date: "29/02", remark: "Non-Cycle Day" },
            { name: "End Year Day", date: "20/11", remark: "Year Closure" },
            { name: "Allotment Day", date: "26/12", remark: "Genesis" }
        ];

        eventList.innerHTML = charterHolidays.map(h => `
            <div class="event-item-vpu" style="border-left: 2px solid #e95420; margin-bottom: 8px; padding-left: 5px;">
                <div style="font-size: 11px; font-weight: bold; color: #fff;">${h.name}</div>
                <div style="font-size: 10px; color: #e95420;">${h.date} — ${h.remark}</div>
            </div>
        `).join('') + '<hr style="border:0; border-top:1px solid #444; margin: 10px 0;">';
    }

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

    changeMonth(delta) {
        this.currentViewDate.setMonth(this.currentViewDate.getMonth() + delta);
        this.renderGrid(this.currentViewDate);
    },

    convertToThealHour(hour) {
        const mapping = { 7:1, 8:2, 9:3, 10:4, 11:5, 12:6, 13:7, 14:8, 15:9, 16:10, 17:11, 18:12, 19:1, 20:2, 21:3, 22:4, 23:5, 0:6, 1:7, 2:8, 3:9, 4:10, 5:11, 6:12 };
        return mapping[hour] || hour;
    }
};