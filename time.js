/**
 * Thealcohesion Temporal Engine
 * Synchronizing the VPU with the 13-Cycle Ubuntu Rhythm
 */
const thealTimeApp = {
    id: "time-manager",
    name: "Thealcohesion Time",

    cycles: [
        { name: "1st Cycle", start: "21/11" },
        { name: "2nd Cycle", start: "19/12" },
        { name: "3rd Cycle", start: "16/01" },
        { name: "4th Cycle", start: "13/02" },
        { name: "Holiday: Special Day", start: "29/02", days: 1 },
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
        // We trigger the clock start AFTER the HTML is placed in the DOM
        setTimeout(() => this.startClock(), 100); 

        return `
            <div class="calendar-app-container" style="padding: 20px; background: #1a1a2e; height: 100%;">
                <div class="theal-clock-widget">
                    <h3 style="color: #a445ff;">⏳ Thealcohesion Time</h3>
                    <div style="font-size: 0.9rem; color: #aaa;">Normal Time:</div>
                    <div id="vpu-normal-time" style="font-size: 1.8rem; font-weight: bold; margin-bottom: 10px;">--:--:--</div>
                    <div style="font-size: 0.9rem; color: #aaa;">Thealcohesion Time:</div>
                    <div id="vpu-theal-time" style="font-size: 1.8rem; font-weight: bold; color: #a445ff;">--:--:--</div>
                    <div id="vpu-theal-date" style="margin-top: 15px; border-top: 1px solid #444; pt: 10px;">Loading cycle...</div>
                </div>
            </div>
        `;
    },

    startClock() {
        const update = () => {
            const now = new Date();
            const h = now.getHours();
            const m = now.getMinutes().toString().padStart(2, "0");
            const s = now.getSeconds().toString().padStart(2, "0");

            const normalTimeEl = document.getElementById("vpu-normal-time");
            const thealTimeEl = document.getElementById("vpu-theal-time");
            const thealDateEl = document.getElementById("vpu-theal-date");

            if (normalTimeEl) normalTimeEl.textContent = `${h.toString().padStart(2, "0")}:${m}:${s}`;
            if (thealTimeEl) thealTimeEl.textContent = `${this.convertToThealHour(h).toString().padStart(2, "0")}:${m}:${s}`;
            if (thealDateEl) {
                // This function was in your HTML, make sure it's accessible or defined here
                thealDateEl.textContent = this.getCycleForToday(now);
            }
        };
        
        // Run immediately and then every second
        update();
        this.clockInterval = setInterval(update, 1000);
    },

    convertToThealHour(hour) {
        const mapping = {
            7: 1, 8: 2, 9: 3, 10: 4, 11: 5, 12: 6,
            13: 7, 14: 8, 15: 9, 16: 10, 17: 11, 18: 12,
            19: 1, 20: 2, 21: 3, 22: 4, 23: 5, 0: 6,
            1: 7, 2: 8, 3: 9, 4: 10, 5: 11, 6: 12
        };
        return mapping[hour];
    },

    getCycleForToday(today) {
        // Implementation of your cycle finding logic
        return "Cycle Awareness Active"; 
    }
};