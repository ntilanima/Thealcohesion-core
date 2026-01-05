/**
 * apps/tray.js - System Status Dropdown
 */
export class SystemTray {
    constructor(kernel) {
        this.kernel = kernel;
        this.isOpen = false;
        this.el = this.createMenu();
        document.body.appendChild(this.el);
        this.setupListeners();
        this.initBattery(); // Initialize hardware link
    }

    // Initialize Battery Status Monitoring
    async initBattery() {
        if ('getBattery' in navigator) {
            try {
                const battery = await navigator.getBattery();
                
                // Update UI immediately
                this.updateBatteryUI(battery);

                // Listen for physical changes (plugging in, discharging)
                battery.addEventListener('levelchange', () => this.updateBatteryUI(battery));
                battery.addEventListener('chargingchange', () => this.updateBatteryUI(battery));
            } catch (err) {
                console.warn("Battery API blocked or unavailable.");
            }
        }
    }

    updateBatteryUI(battery) {
    const level = battery.level;
    const percent = Math.round(level * 100);
    const isCharging = battery.charging;
    
    // Choose icon based on percentage
    let iconName = 'battery_full';
    if (level <= 0.2) iconName = 'battery_20';
    else if (level <= 0.3) iconName = 'battery_30';
    else if (level <= 0.5) iconName = 'battery_50';
    else if (level <= 0.6) iconName = 'battery_60';
    else if (level <= 0.8) iconName = 'battery_80';
    else if (level <= 0.9) iconName = 'battery_90';
    
    if (isCharging) iconName = 'battery_charging_full';
    if (level <= 0.05 && !isCharging) iconName = 'battery_alert';

    const color = (percent <= 15 && !isCharging) ? '#ff4444' : (isCharging ? '#4ade80' : 'white');

    const topContainer = document.getElementById('top-battery-container');
    if (topContainer) {
        topContainer.innerHTML = `
            <span class="material-symbols-outlined" style="color: ${color}; font-size: 20px;">
                ${iconName}
            </span>
        `;
    }

    const trayLabel = document.getElementById('tray-battery-stat');
    if (trayLabel) trayLabel.innerText = `${percent}% Remaining`;
}

    createMenu() {
        const menu = document.createElement('div');
        menu.id = 'system-tray-menu';
        menu.style.cssText = `
            position: fixed; top: 45px; right: 10px; width: 280px;
            background: rgba(30, 30, 30, 0.95); backdrop-filter: blur(15px);
            border: 1px solid #444; border-radius: 12px; color: #eee;
            display: none; flex-direction: column; padding: 15px;
            z-index: 9999; font-family: 'Inter', sans-serif; box-shadow: 0 10px 30px rgba(0,0,0,0.5);
        `;

        menu.innerHTML = `
            <div style="margin-bottom: 20px;">
                <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 12px;">
                    <span>🎧</span><input type="range" style="flex:1; accent-color: #38bdf8;">
                </div>
                <div style="display: flex; align-items: center; gap: 10px;">
                    <span>☀️</span><input type="range" style="flex:1; accent-color: #38bdf8;">
                </div>
            </div>

            <div style="height: 1px; background: #444; margin-bottom: 15px;"></div>

            <div class="tray-item"><span>📶 Wired Connection</span><span>▶</span></div>
            <div class="tray-item"><span>Bluetooth Off</span><span>▶</span></div>
            <div class="tray-item"><span id="tray-battery-stat"> <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200" /> Detecting...</span><span>▶</span></div>

            <div style="height: 1px; background: #444; margin: 15px 0;"></div>

            <div class="tray-item" id="tray-settings"><span>⚙️ Settings</span></div>
            <div class="tray-item" id="tray-lock"><span>🔒 Lock</span></div>
            <div class="tray-item" id="tray-power" style="color: #ff4444; font-weight: bold;"><span>⏻ Shutdown Sovereign</span></div>
        `;
        return menu;
    }

    setupListeners() {
        // Toggle Logic
        document.getElementById('status-area').onclick = (e) => {
            e.stopPropagation();
            this.isOpen = !this.isOpen;
            this.el.style.display = this.isOpen ? 'flex' : 'none';
        };

        window.addEventListener('click', () => {
            this.isOpen = false;
            this.el.style.display = 'none';
        });

        // Target the Power Off button
        const powerBtn = this.el.querySelector('#tray-power');
        if (powerBtn) {
            powerBtn.onclick = (e) => {
                e.stopPropagation();
                this.kernel.shutdownSovereign(); // Call the kernel method
            };
        }

        // Functional Logic
        this.el.querySelector('#tray-lock').onclick = () => this.kernel.lockSystem();
        this.el.querySelector('#tray-settings').onclick = () => this.kernel.launchApp('settings');
    }
}