const thealTimeApp = {
    id: "time-manager",
    name: "Thealcohesion Time",
    currentViewDate: new Date(),
    cycles: [
        { name: "1st Cycle", start: "21/11" },
        { name: "2nd Cycle", start: "19/12" },
        { name: "3rd Cycle", start: "16/01" },
        { name: "4th Cycle", start: "13/02" },
        { name: "Holiday: Harmony", start: "29/02", days: 1 },
        { name: "5th Cycle", start: "13/03" },
        { name: "6th Cycle", start: "10/04" },
        { name: "7th Cycle", start: "08/05" },
        { name: "8th Cycle", start: "05/06" },
        { name: "9th Cycle", start: "03/07" },
        { name: "10th Cycle", start: "31/07" },
        { name: "11th Cycle", start: "28/08" },
        { name: "12th Cycle", start: "25/09" },
        { name: "13th Cycle", start: "23/10" },
        { name: "Holiday: New Year", start: "20/11", days: 1 }
    ],

    render() {
        // Run initialization after a tiny delay to ensure DOM is ready
        setTimeout(() => {
            this.startClock();
            this.renderGrid(this.currentViewDate);
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
                        <div class="legend-vpu">
                            <span>🌑 New</span> <span>🌕 Full</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    renderGrid(date) {
        const grid = document.getElementById("vpu-calendar-grid");
        const label = document.getElementById("vpu-month-label");
        if (!grid) return;

        grid.innerHTML = "";
        label.textContent = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

        const year = date.getFullYear();
        const month = date.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);

        // Header Days
        ['Sat', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri'].forEach(day => {
            const div = document.createElement("div");
            div.className = "grid-header";
            div.textContent = day;
            grid.appendChild(div);
        });

        // Fillers
        const startIndex = (firstDay.getDay() + 1) % 7;
        for (let i = 0; i < startIndex; i++) {
            grid.appendChild(document.createElement("div"));
        }

        // Days
        for (let day = 1; day <= lastDay.getDate(); day++) {
            const d = new Date(year, month, day);
            const moon = ['🌑','🌓','🌕','🌗'][day % 4];
            const cell = document.createElement("div");
            cell.className = "vpu-day-cell";
            if (d.toDateString() === new Date().toDateString()) cell.classList.add("today-vpu");
            
            cell.innerHTML = `
                <span class="greg-num">${day}</span>
                <span class="moon-vpu">${moon}</span>
            `;
            grid.appendChild(cell);
        }
    },

    changeMonth(delta) {
        this.currentViewDate.setMonth(this.currentViewDate.getMonth() + delta);
        this.renderGrid(this.currentViewDate);
    },

    startClock() {
        setInterval(() => {
            const now = new Date();
            const h = now.getHours();
            const m = now.getMinutes().toString().padStart(2, "0");
            const s = now.getSeconds().toString().padStart(2, "0");
            
            const timeEl = document.getElementById("vpu-theal-time");
            if (timeEl) {
                timeEl.textContent = `${this.convertToThealHour(h).toString().padStart(2, "0")}:${m}:${s}`;
            }
        }, 1000);
    },

    convertToThealHour(hour) {
        const mapping = { 7:1, 8:2, 9:3, 10:4, 11:5, 12:6, 13:7, 14:8, 15:9, 16:10, 17:11, 18:12, 19:1, 20:2, 21:3, 22:4, 23:5, 0:6, 1:7, 2:8, 3:9, 4:10, 5:11, 6:12 };
        return mapping[hour] || hour;
    }
};