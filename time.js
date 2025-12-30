/**
 * Thealcohesion Temporal Engine
 * Fully Integrated 13-Cycle Ubuntu Rhythm
 */
const thealTimeApp = {
    id: "time-manager",
    name: "Thealcohesion Time",
    currentViewDate: new Date(),
    
    cycles: [
        { name: "1st Cycle", start: "21/11", color: "#a445ff" },
        { name: "2nd Cycle", start: "19/12", color: "#a445ff" },
        { name: "3rd Cycle", start: "16/01", color: "#a445ff" },
        { name: "4th Cycle", start: "13/02", color: "#a445ff" },
        { name: "5th Cycle", start: "13/03", color: "#a445ff" },
        { name: "6th Cycle", start: "10/04", color: "#a445ff" },
        { name: "7th Cycle", start: "08/05", color: "#a445ff" },
        { name: "8th Cycle", start: "05/06", color: "#a445ff" },
        { name: "9th Cycle", start: "03/07", color: "#a445ff" },
        { name: "10th Cycle", start: "31/07", color: "#a445ff" },
        { name: "11th Cycle", start: "28/08", color: "#a445ff" },
        { name: "12th Cycle", start: "25/09", color: "#a445ff" },
        { name: "13th Cycle", start: "23/10", color: "#a445ff" }
    ],

    render() {
        // Run initialization after the HTML is placed in the DOM
        setTimeout(() => {
            this.startClock();
            this.renderGrid(this.currentViewDate);
            this.renderUpcomingEvents(); 
        }, 100);

        return `
            <div class="calendar-app-window">
                <div class="calendar-header">
                    <button onclick="thealTimeApp.changeMonth(-1)">←</button>
                    <h2 id="vpu-month-label">Month Year</h2>
                    <button onclick="thealTimeApp.changeMonth(1)">→</button>
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
                            <p><span style="color:#d586ff">■</span> Holiday</p>
                            <p><span style="color:#44dddd">■</span> Reflection</p>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    renderUpcomingEvents() {
        const eventList = document.getElementById('vpu-event-list');
        if (!eventList) return;
        const currentMonth = new Date().getMonth();
        const upcoming = this.cycles.filter(c => {
            const [d, m] = c.start.split("/").map(Number);
            return (m - 1) >= currentMonth;
        }).slice(0, 3);

        eventList.innerHTML = upcoming.map(e => `
            <div class="event-item-vpu" style="margin-bottom: 10px; padding: 5px; border-left: 2px solid #a445ff; background: rgba(255,255,255,0.05); text-align: left;">
                <div style="font-size: 11px; font-weight: bold; color: #fff;">${e.name}</div>
                <div style="font-size: 10px; color: #aaa;">Starts: ${e.start}</div>
            </div>
        `).join('');
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
            const moon = ['🌑','🌓','🌕','🌗'][day % 4];
            const cell = document.createElement("div");
            cell.className = `vpu-day-cell ${theal.type}`;
            if (d.toDateString() === new Date().toDateString()) cell.classList.add("today-vpu");
            if (theal.color) cell.style.backgroundColor = theal.color;

            cell.innerHTML = `
                <div class="cell-top">
                    <span class="greg-num">${day}</span>
                    <span class="moon-vpu">${moon}</span>
                </div>
                <div class="theal-label">${theal.label}</div>
            `;
            grid.appendChild(cell);
        }
    },

    getThealDate(date) {
        const year = date.getFullYear();
        const isLeap = (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
        if (isLeap && date.getMonth() === 1 && date.getDate() === 29) 
            return { label: "Special Day", type: "holiday", color: "#3c2c6c" };
        if (date.getMonth() === 0 && date.getDate() <= 15) 
            return { label: `Reflection ${date.getDate()}`, type: "reflection", color: "#164343" };
        
        for (let i = 0; i < this.cycles.length; i++) {
            const [d, m] = this.cycles[i].start.split("/").map(Number);
            const start = new Date(year, m - 1, d);
            const end = new Date(start);
            end.setDate(start.getDate() + 28);
            if (date >= start && date < end) {
                const diff = Math.floor((date - start) / 86400000) + 1;
                return { label: `${this.cycles[i].name}, D${diff}`, type: "cycle" };
            }
        }
        return { label: "Transition", type: "other" };
    },

    changeMonth(delta) {
        this.currentViewDate.setMonth(this.currentViewDate.getMonth() + delta);
        this.renderGrid(this.currentViewDate);
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