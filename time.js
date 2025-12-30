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
        // We will adapt your UI structure to fit inside an OS Window
        return `
            <div class="calendar-app-container">
                <div class="calendar-layout">
                    <div class="calendar-main">
                        <div id="vpu-countdown" class="vpu-timer-strip"></div>
                        <div class="calendar-grid" id="vpu-calendar-grid">
                            </div>
                    </div>
                    <div class="calendar-side">
                        <div class="theal-clock-widget">
                            <h3>⏳ Thealcohesion Time</h3>
                            <div id="vpu-normal-time">--:--:--</div>
                            <div id="vpu-theal-time" class="accent-time">--:--:--</div>
                            <div id="vpu-theal-date">Loading...</div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    // Include your conversion logic here
    convertToThealHour(hour) {
        const mapping = {
            7: 1, 8: 2, 9: 3, 10: 4, 11: 5, 12: 6,
            13: 7, 14: 8, 15: 9, 16: 10, 17: 11, 18: 12,
            19: 1, 20: 2, 21: 3, 22: 4, 23: 5, 0: 6,
            1: 7, 2: 8, 3: 9, 4: 10, 5: 11, 6: 12
        };
        return mapping[hour] || hour;
    }
};