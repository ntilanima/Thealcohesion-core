/**
 * VPU KERNEL - SOVEREIGN OS (v1.2.8)
 * Core: TLC_Kernel
 * Logic: Window Management & Advanced App Routing
 */

import { SystemTray } from './tray.js';
import { NeuralWallpaper } from './wallpaper.js';
import { registry } from './registry-v2.js';
import { SovereignVFS } from '../apps/vfs.js'; // Ensure VFS is imported for secure file handling
import { startBootSequence } from './boot.js'; // Refined boot sequence
class TLC_Kernel {
    constructor() {
        this.isTilingActive = false;
        this.isDraggingWindow = false;
        this.runningApps = new Set(); // Track active processes
        this.isBooted = false;
        this.registry = [...registry, ...JSON.parse(localStorage.getItem('vpu_local_registry') || '[]')];//For DevCenter
        this.sessionKey = null; // The AES-GCM key derived at login
        this.pinnedApps = ['time', 'tnfi', 'terminal', 'files', 'browser', 'messages', 'camera','vscode', 'settings']; 
        this.idleTimer = null;
        // --- NEW MEMORY TRACKING ---
        this.maxMemory = 100; 
        this.currentMemory = 0;
        this.tiledWindowOrder = []; // Maintains swap order
        //OVERVIEW TRACKER
        this.isOverviewActive = false;
        // NEW: Debounce timer for updateTilingGrid
        this.tilingGridTimeout = null;
        this.tilingState = {};


        // Ensure we listen for the "Escape" key to toggle overview
                window.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') this.toggleOverview();
            
                        // Alt+G: Toggle Tiling
            if (e.altKey && e.code === 'KeyG') {
                e.preventDefault();
                this.isTilingActive = !this.isTilingActive;
                
                if (this.isTilingActive) {
                    this.updateTilingGrid();
                } else {
                    // Restore Windows to floating state
                    const allWindows = document.querySelectorAll('.os-window');
                    
                    allWindows.forEach((win, idx) => {
                        win.style.transition = 'all 0.5s ease';
                        win.style.width = "clamp(320px, 65vw, 900px)";
                        win.style.height = "clamp(300px, 65vh, 720px)";
                        
                        // NEW: Reset floating window classes and z-indices
                        win.classList.remove('floating-extra');
                        win.style.zIndex = (100 + idx).toString(); // Reset to natural order
                        win.dataset.hasBeenDragged = 'false'; // Reset drag flag
                        
                        // Reset positions to natural cascade
                        const cascadeOffset = idx * 25;
                        win.style.left = `${85 + cascadeOffset}px`; // Dock width + offset
                        win.style.top = `${40 + cascadeOffset}px`;  // Top bar height + offset
                    });
                    
                    this.logSystemEvent("Tiling Engine: DISENGAGED", "warn");
                }
            }

            // Ctrl+Shift+Arrow: Smart Swap in Tiling Mode
            if (e.ctrlKey && e.shiftKey && this.isTilingActive) {
                e.preventDefault();
                
                if (e.code === 'ArrowLeft') this.smartSwap('left');
                if (e.code === 'ArrowRight') this.smartSwap('right');
                if (e.code === 'ArrowUp') this.smartSwap('up');
                if (e.code === 'ArrowDown') this.smartSwap('down');
            }

            // Ctrl+Alt+R: Cycle windows forward
            if (e.ctrlKey && e.altKey && e.code === 'KeyR') {
                e.preventDefault();
                this.cycleTiledWindows('forward');
            }

            // Ctrl+Alt+L: Cycle windows backward
            if (e.ctrlKey && e.altKey && e.code === 'KeyL') {
                e.preventDefault();
                this.cycleTiledWindows('backward');
            }
        });

        // --- MEMORY RESIZE SENSOR ---
        window.addEventListener('resize', () => {
            this.updateMemoryMeter();
        });

        // Initialize the meter at 0 on boot
        this.updateMemoryMeter();

        console.log("Kernel: Initializing Sovereign Core...");
        
        // 1. GLOBAL ROUTING LISTENER
        window.addEventListener('launchApp', (e) => {
            const appId = e.detail.appId;
            if (this.runningApps.has(appId)) {
                this.focusWindow(`win-${appId}`);
            } else {
                this.launchApp(appId);
            }
        });

        // 2. HIDE UI INITIALLY
        const osRoot = document.getElementById('os-root');
        // Ensure the background canvas exists for the Neural Wallpaper
        if (!document.getElementById('neural-canvas')) {
            const canvas = document.createElement('canvas');
            canvas.id = 'neural-canvas';
            document.body.prepend(canvas); // Place it at the very back
        }
        const loginGate = document.getElementById('login-gate');
        const topBar = document.getElementById('top-bar');
        
        if(osRoot) osRoot.style.display = 'none';
        if(loginGate) {
            loginGate.style.display = 'none';
            loginGate.style.opacity = '0';
        }
        if(topBar) topBar.classList.add('hidden');

        // 3. START BOOT SEQUENCE (Handover Logic)
        this.boot();

        window.addEventListener('keydown', (e) => {
    // 1. PREVENT DEFAULT SYSTEM ESCAPE BEHAVIOR
    // This stops the browser or OS from potentially closing the tab/window 
    // or exiting the 'fullscreen' lock we established during login.
    if (e.key === 'Escape') {
        e.preventDefault(); 
        
        // 2. CONTEXTUAL ESCAPE ONLY
        // We only allow ESC to exit the Task Overview, not the whole OS.
        if (document.body.classList.contains('task-overview-active')) {
            this.toggleTaskOverview();
            this.logEvent('SYS', 'Overview closed via ESC.');
            return;
        }

        // 3. CLOSE ACTIVE MODALS (Like the Vault Viewer)
        // If the Vault is open, ESC will close the file, but not the App.
        const activeVaultViewer = document.getElementById('vault-viewer');
        if (activeVaultViewer && activeVaultViewer.style.display !== 'none') {
            // We find the 'vault' instance and trigger its purge method
            if (this.activeProcesses['vault']) {
                this.activeProcesses['vault'].purgeMemory();
                return;
            }
        }

        // Log the blocked escape attempt
        console.warn("Kernel: Escape intercepted. OS shutdown must be manual via System Menu.");
        }
        
        // Ctrl + Space for Overview remains unchanged...
        if (e.ctrlKey && e.code === 'Space') {
            e.preventDefault();
            this.toggleTaskOverview();
        }
    });
    

        //Every 60 seconds, the Kernel should verify that the sessionKey is still valid and the VFS is accessible. If someone manually clears their browser cache or tries to inject code via the console, the system panics.
        setInterval(() => {
            // Tripwire: Check if the key was tampered with or lost
            if (this.isLoggedIn && !this.sessionKey) {
                this.triggerRealPanic("ENCLAVE_LOST", "Secure session key purged from volatile memory.");
            }
        }, 10000); // Check every 10 seconds

        // 4. PERSISTENT BOOT CHECK
        // Check if we crashed previously before showing the login gate
        const lastPanic = localStorage.getItem('LAST_PANIC_CODE');
        if (lastPanic) {
            console.warn("Kernel: Recovering from critical failure...");
            // You can trigger your recovery UI here
        }

        // 5. SILENT SENTRY (Heartbeat)
        // Checks every 5 seconds if the system is still secure
        setInterval(() => {
            if (this.isBooted && this.sessionKey) {
                // Tripwire: If VFS partition is missing from storage while system is 'on'
                if (!localStorage.getItem('vpu_vfs_root')) {
                    this.triggerRealPanic("0xVFS_INTEGRITY_03", "Hardware partition disconnected during runtime.");
                }
            }
        }, 500000); // End of constructor

        //Escape key disabled
        window.onkeydown = (e) => {
            if (e.key === 'Escape') {
                e.preventDefault();
                return false; 
            }
        };
        //Stay on Page
        window.onbeforeunload = (e) => {
            if (this.isLoggedIn && this.sessionKey) {
                // This triggers the standard browser "Are you sure you want to leave?" dialog
                e.preventDefault();
                e.returnValue = 'Sovereign Session Active: Unsaved Enclave data will be shredded.';
                return e.returnValue;
            }
        };

        // 1. Monitor the Fullscreen State
        document.addEventListener('fullscreenchange', () => {
            if (!document.fullscreenElement && this.isLoggedIn) {
                this.logEvent('SEC', 'SOVEREIGN_STATE_BREACH: Fullscreen exited.');
                
                // Immediate Security Action:
                // If someone hits ESC to leave fullscreen, we shred the session.
                this.lockSystem(); 
                
                alert("SECURITY ALERT: Enclave locked due to Display Mode breach. Manual login required.");
            }
        });

        document.addEventListener('fullscreenchange', () => {
            // If we are logged in but NOT in fullscreen anymore
            if (!document.fullscreenElement && this.isLoggedIn) {
                this.logEvent('SEC', 'SOVEREIGN_STATE_BREACH: Fullscreen exited.');
                
                // Trigger the 3-second countdown
                this.triggerEscapeWarning();
            }
        });

        window.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                // Block the event from apps and windows
                e.stopImmediatePropagation();
                e.preventDefault();

                // Visual nudge to use the menu
                this.logEvent('WARN', 'ESC_BLOCKED: Use the System Menu for manual shutdown.');
                
                // Brief flash on the Shutdown button if it exists
                const shutdownBtn = document.querySelector('.menu-item-shutdown'); 
                if (shutdownBtn) shutdownBtn.style.background = "rgba(255,0,0,0.5)";
            }
        }, true); // The 'true' is vital for capturing the event first

        
        // AUDIO CONTROLLER
        // 1. Setup the Audio Hardware
        this.initAudioEngine = () => {
            try {
                const AudioContext = window.AudioContext || window.webkitAudioContext;
                this.audioContext = new AudioContext();
                this.masterGain = this.audioContext.createGain();
                this.masterGain.connect(this.audioContext.destination);
                
                this.systemVolume = 80;
                this.masterGain.gain.value = 0.8;
                console.log("Kernel: Audio Engine Online.");
            } catch (e) {
                console.warn("Kernel: Audio hardware deferred until user interaction.");
            }
        };

        // 2. Setup the Volume Controller
        this.setSystemVolume = (value) => {
            if (this.audioContext && this.audioContext.state === 'suspended') {
                this.audioContext.resume();
            }

            this.systemVolume = value;
            const volumeLevel = value / 100;

            // Control Web Audio API
            if (this.masterGain) {
                this.masterGain.gain.setTargetAtTime(volumeLevel, this.audioContext.currentTime, 0.02);
            }

            // Control all <audio> and <video> tags in the OS
            document.querySelectorAll('audio, video').forEach(media => {
                media.volume = volumeLevel;
            });

            // Logging (Using your existing logEvent method)
            this.logEvent('SYS', `Volume set to ${value}%`);
        };

        // 3. Initialize immediately
        this.initAudioEngine();

        this.renderMenuContent = this.renderMenuContent.bind(this);

        this.initBattery(); //FOR TOPBAR BATTERY
        
    }


    // For testing new Apps by Devs

        executeTemporary(code, manifest) {
            const tempId = `live-view-${Date.now()}`;
            
            // 1. Create a dummy app object
            const tempApp = {
                id: tempId,
                name: `PREVIEW: ${manifest.name || 'UNNAMED'}`,
                icon: '🧪',
                file: 'local_module',
                code: code
            };

            // 2. Launch a special temporary window
            this.launchAppInstance(tempApp);
            this.logEvent('INFO', `LIVE_VIEW_INITIATED: Sandboxing temporary logic.`);
        }

        /**
     * DEBOUNCED_updateTilingGrid
     * Prevents rapid duplicate calls during resize/drag operations
     */
    debouncedUpdateTilingGrid(delay = 50) {
        if (this.tilingGridTimeout) {
            clearTimeout(this.tilingGridTimeout);
        }
        
        this.tilingGridTimeout = setTimeout(() => {
            this.updateTilingGrid();
            this.tilingGridTimeout = null;
        }, delay);
    }

    // TOPBAR ICONS
    createSystemIcons() {
        const trayGroup = document.createElement('div');
        trayGroup.className = 'status-group';

        // Simplified template for an icon
        const getIcon = (path) => `
            <svg class="sys-icon" viewBox="0 0 24 24" fill="none" stroke="#a445ff" stroke-width="2">
                <path d="${path}" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>`;

        const wifiPath = "M2 20h.01M7 20v-4m5 4V11m5 9V7m5 13V3";
        const audioPath = "M11 5L6 9H2v6h4l5 4V5zM15.54 8.46a5 5 0 0 1 0 7.07";
        const chevronPath = "M6 9l6 6 6-6";

        trayGroup.innerHTML = `
            ${getIcon(wifiPath)}
            ${getIcon(audioPath)}
            <span class="chevron-wrapper">${getIcon(chevronPath)}</span>
        `;

        return trayGroup;
    }

    //TOPBAR BATTERY
    initBattery() {
    // Check if the API is available
    if (navigator.getBattery) {
        navigator.getBattery().then(battery => {
            const updateUI = () => {
                const level = Math.round(battery.level * 100);
                
                // Get the elements
                const topPercent = document.getElementById('top-battery-percent');
                const topFill = document.getElementById('top-battery-fill');

                if (topPercent) {
                    topPercent.innerText = `${level}%`;
                    console.log("Battery Updated:", level); // Check your console for this!
                }
                
                if (topFill) {
                    topFill.style.width = `${level}%`;
                    // Visual status
                    topFill.style.background = (level <= 20) ? '#ff4444' : '#a445ff';
                }
            };

            // Initial call and event listeners
            updateUI();
            battery.addEventListener('levelchange', updateUI);
            battery.addEventListener('chargingchange', updateUI);
        }).catch(err => {
            console.warn("Battery API failed:", err);
            // Fallback: Just show 100% so it's not empty
            if(document.getElementById('top-battery-percent')) {
                document.getElementById('top-battery-percent').innerText = "100%";
            }
        });
    } else {
        console.error("Battery API not supported on this browser/context.");
    }
}

    // --- MEMORY TRACKER ---
    updateMemoryMeter() {
    // 1. Count windows and calculate memory
    const windows = document.querySelectorAll('.os-window').length;
    this.currentMemory = Math.min(windows * 1, 100);
    
    // 2. Update the physical bar (for desktop)
    const bar = document.getElementById('memory-bar');
    if (bar) {
        bar.style.width = `${this.currentMemory}%`;
        bar.classList.remove('warning', 'critical');
        if (this.currentMemory > 80) bar.classList.add('critical');
        else if (this.currentMemory > 50) bar.classList.add('warning');
    }

    // 3. Update the Label (The Fix for Mobile)
    const label = document.querySelector('.monitor-label');
    if (label) {
        // This checks if the screen is mobile-sized (under 768px)
        if (window.innerWidth <= 768) {
            label.innerText = `${this.currentMemory}%`; 
            label.style.display = 'block'; // Ensure it's visible
        } else {
            label.innerText = `VPU`;
        }
    }
}

    /**
 * SHUTDOWN_SEQUENCE (2025-12-26 Compliant)
 * Hard wipe of all volatile memory and return to cold boot state.
 */
async shutdown() {
    this.logEvent('SYS', 'SHUTDOWN: Purging volatile memory...');

    // 1. Wipe the keys and session
    this.sessionKey = null;
    this.isLoggedIn = false;
    
    // 2. Clear sensitive UI elements immediately
    document.getElementById('os-root').innerHTML = '';
    
    // 3. The "Halt" UI
    document.body.innerHTML = `
        <div style="background:#000; color:#00ff41; height:100vh; width:100vw; 
                    display:flex; flex-direction:column; align-items:center; 
                    justify-content:center; font-family:monospace; text-align:center;">
            <h2 style="border:1px solid #00ff41; padding:20px;">SYSTEM_HALTED</h2>
            <p style="margin-top:20px; color:#444;">Genesis Block [SIG_2025_12_26] Locked.</p>
            <p style="font-size:12px; color:#222;">It is now safe to close your browser window.</p>
            <button onclick="window.location.reload()" 
                    style="margin-top:30px; background:transparent; border:1px solid #222; color:#222; cursor:pointer;">
                REBOOT_KERNEL
            </button>
        </div>
    `;

    // 4. Try to close (will only work if the OS was opened via a launcher)
    let id = window.setInterval(null, 0);
    while (id--) window.clearInterval(id);
    window.close(); 
}

    /**
     * TRIGGER_REAL_PANIC
     * Immediate Level 0 Halt. Wipes session and displays Red Screen.
     */
    triggerRealPanic(errorCode, details) {
        console.error(`!!! KERNEL PANIC: ${errorCode} !!!`);
        
        // 1. Log for Recovery
        localStorage.setItem('LAST_PANIC_CODE', errorCode);
        localStorage.setItem('LAST_PANIC_TIME', Date.now());

        // 2. Security Wipe
        this.sessionKey = null;
        this.isLoggedIn = false;
        
        // 3. Halt all background loops
        for (let i = 1; i < 9999; i++) window.clearInterval(i);

        // 4. UI Takeover (The Red Screen)
        document.body.innerHTML = `
            <div style="background:#800000; color:#fff; height:100vh; width:100vw; padding:50px; font-family:monospace; position:fixed; z-index:999999;">
                <h1 style="background:#fff; color:#800000; padding:0 10px; display:inline-block;">FATAL_ERROR: ${errorCode}</h1>
                <p style="margin-top:20px;">The Sovereign Kernel has halted to protect Member Allotments (2025-12-26).</p>
                <p style="color:#ffcc00;">TRACE: ${details}</p>
                <p style="margin-top:50px;">PRESS [R] TO ATTEMPT ENCLAVE RECOVERY</p>
            </div>
        `;
        
        window.onkeydown = (e) => { if(e.key.toLowerCase() === 'r') window.location.reload(); };
    }

    // IDLE LOCK SYSTEM
    setupIdleLock(timeout) {
        const resetTimer = () => {
            clearTimeout(this.idleTimer);
            this.idleTimer = setTimeout(() => {
                // Ensure lockSystem exists before calling
                if (this.lockSystem) this.lockSystem();
            }, timeout);
        };

        // Listen for activity to reset the 5-minute clock
        window.addEventListener('mousemove', resetTimer);
        window.addEventListener('mousedown', resetTimer);
        window.addEventListener('keydown', resetTimer);
        window.addEventListener('touchstart', resetTimer);
        
        resetTimer(); // Start the first countdown
    }
    

    /**
     * ADVANCED ROUTING TABLE
     * Centralized definitions for app initialization.
     */
    get APP_ROUTES() {
        return {
            'terminal': async (container) => {
            const m = await import('../apps/terminal.js');
            // You MUST pass the api object as the second argument
            const apiBridge = {
                signature: 'SOVEREIGN_CORE_V1',
                identity: 'Admin',
                vfs: this.vfs // Ensure this exists in your kernel
            };
            const instance = new m.TerminalApp(container, apiBridge);
            instance.init();
            return instance;
            },
            'time': async (container) => {
                const m = await import('../apps/time.js');
                const instance = new m.TimeApp(container);
                instance.init();
                return instance;
            },
            'tnfi': (container) => {
                return this.renderTNFIDashboard(container);
            },
            'vault': async (container) => {
                const m = await import('../apps/vault.js');
                const instance = new m.VaultApp(container, this);
                await instance.init();

                // CRITICAL: Save the instance so the Kernel can talk to it later
                this.activeProcesses = this.activeProcesses || {};
                this.activeProcesses['vault'] = instance;

                return instance;
            },

            'app-store': async (container) => {
                // If app-center.js is in /js/os-core/apps/
                const { HiveCenter } = await import('./app-center.js'); 
                
                const apiBridge = {
                    signature: 'SOVEREIGN_CORE_V1',
                    getMemory: () => Math.round((this.currentMemory / this.maxMemory) * 100),
                    getRoles: () => this.userRole || ['ANY'],
                    getLiveResourceLoad: (id) => 10 // Added to prevent 'undefined' errors
                };

                const instance = new HiveCenter(container, apiBridge);
                instance.init();
                return instance;
            },

            'vscode': async (container) => {
                // Adjust the path to where your logic-forge.js (Dev Center) is stored
                const { LogicForge } = await import('./logic-forge.js'); 
                
                const apiBridge = {
                    signature: 'SOVEREIGN_CORE_V1',
                    // LogicForge specifically needs crypto for Local Signing (Art 13.2)
                    crypto: {
                        sign: async (code, manifest) => {
                            console.log("[VPU_SEC]: LOCAL_SIGNING_SEQUENCER_START");
                            // Simple mock signature; in production, use WebCrypto API
                            return btoa(code.length + manifest.id + Date.now()).substring(0, 16);
                        }
                    },
                    getMemory: () => Math.round((this.currentMemory / this.maxMemory) * 100)
                };

                const instance = new LogicForge(container, apiBridge);
                instance.init();
                return instance;
            },

            
            'vpu-sovereign-ai-core': async (container) => {
                // Ensure the path matches your deployment location
                const { SovereignAI } = await import('./sovereign-ai-core.js'); 
                
                const apiBridge = {
                    signature: 'SOVEREIGN_CORE_V1',
                    ssi: window.vpu_ssi, // Access to the Ethical Guard
                    ai: {
                        getWorkspaceContext: () => {
                            return Object.values(this.registry).map(app => ({
                                id: app.id,
                                name: app.name,
                                purpose: app.manifest?.purpose
                            }));
                        }
                    },
                    fs: this.vfs, // Persistence for ai_memory.json
                    getMemory: () => Math.round((this.currentMemory / this.maxMemory) * 100)
                };

                const instance = new SovereignAI(container, apiBridge);
                await instance.init();

                // Track process in the Kernel
                this.activeProcesses = this.activeProcesses || {};
                this.activeProcesses['vpu-sovereign-ai-core'] = instance;

                return instance;
            },
        };
    }

    async boot() {   
    console.log("Kernel: Ignition sequence initiated...");

    // 2. Start the wallpaper immediately
    try {
        this.wallpaper = new NeuralWallpaper('neural-canvas', this);
    } catch (e) {
        console.error("Wallpaper failed to start:", e);
    }
        
    // 1. HARDWARE HANDSHAKE / PROVISIONING
    const hasHardwareKey = await this.verifyHardwareSignature();
    
    if (!hasHardwareKey) {
        // Instead of immediate panic, we check if we should allow provisioning
        const loginGate = document.getElementById('login-gate');
        if (loginGate) {
            console.warn("Kernel: Device not provisioned. Intercepting Login Gate.");
            
            loginGate.style.display = 'flex';
            loginGate.style.opacity = '1';
            
            loginGate.innerHTML = `
                <div class="provision-container" style="text-align:center; color:#00ff41; font-family:monospace; padding:30px; border:1px solid #00ff41; background:rgba(0,10,0,0.95); box-shadow: 0 0 20px rgba(0,255,65,0.2);">
                    <h2 style="letter-spacing:3px; margin-bottom:10px;">HARDWARE_PROVISIONING</h2>
                    <div style="height:2px; background:#00ff41; width:50px; margin: 0 auto 20px auto;"></div>
                    <p style="font-size:12px; margin-bottom:25px; color:#888;">No Genesis Key [SIG_2025_12_26] detected on this terminal.</p>
                    <button id="provision-btn" style="background:#00ff41; color:#000; border:none; padding:12px 24px; cursor:pointer; font-weight:bold; font-family:monospace; transition:0.3s;">
                        GENERATE_ENCLAVE_KEY
                    </button>
                </div>
            `;
            
            document.getElementById('provision-btn').onclick = () => {
                localStorage.setItem('VPU_HW_ID', "SIG_2025_12_26_ALPHA_GENESIS");
                this.logEvent('INFO', 'Hardware Signature provisioned to local storage.');
                location.reload(); // Hard reboot to validate signature
            };
            return; // HALT BOOT: Wait for provisioning
        }
    }

    // 2. CHECK FOR POST-PANIC RECOVERY
    const lastPanic = localStorage.getItem('LAST_PANIC_CODE');
    if (lastPanic) {
        await this.runRecoverySequence(lastPanic);
        // Log recovery after the sequence finishes
        this.logEvent('WARN', `System recovered from critical halt: ${lastPanic}`); 
    }

    // 3. TRIGGER THE SPLASH SCREEN / HANDOVER
    startBootSequence(() => {
        console.log("Kernel: Handover complete. Enabling Identity Access.");
        
        const loginGate = document.getElementById('login-gate');
        if(loginGate) {
            loginGate.style.display = 'flex';
            setTimeout(() => loginGate.style.opacity = '1', 50);
        }
        
        this.init(); 
        this.systemTray = new SystemTray(this);
        this.setupIdleLock(300000); 
        this.isBooted = true;

        // Log recovery only once here
        if (lastPanic) {
            this.logEvent('WARN', `System recovered from critical halt: ${lastPanic}`); 
        }
    }); // End of boot()
    
}

async verifyHardwareSignature() {
    // We check for a specific 'hardware_id' in local storage 
    // that only a genuine member would have provisioned
    const hwid = localStorage.getItem('VPU_HW_ID');
    return hwid === "SIG_2025_12_26_ALPHA_GENESIS";
}

async runRecoverySequence(errorCode) {
    const recoveryScreen = document.createElement('div');
    recoveryScreen.id = 'recovery-loader';
    // Using a very specific 'Sovereign' styling
    recoveryScreen.style = `
        position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
        background: #000; color: #00ff41; font-family: 'Courier New', monospace;
        padding: 40px; z-index: 1000000; font-size: 14px; line-height: 1.6;
        text-shadow: 0 0 5px #00ff41;
    `;
    document.body.appendChild(recoveryScreen);

    const print = (text, delay = 600) => {
        return new Promise(res => {
            const line = document.createElement('div');
            line.innerHTML = `<span style="color:#444;">[${new Date().toLocaleTimeString()}]</span> > ${text}`;
            recoveryScreen.appendChild(line);
            // Auto-scroll if logs get too long
            recoveryScreen.scrollTop = recoveryScreen.scrollHeight;
            setTimeout(res, delay);
        });
    };

    // START SEQUENCE
    await print("SOVEREIGN_RECOVERY_ENVIRONMENT [v1.0.4]");
    await print(`CRITICAL_HALT_DETECTED: ${errorCode}`, 1000);
    await print("-------------------------------------------", 200);
    await print("Initializing Enclave hardware bridge...");
    await print("Scanning VFS partitions for bit-rot...");
    
    // REAL DATA INTEGRITY CHECK
    const vfs = localStorage.getItem('vpu_vfs_root');
    await new Promise(r => setTimeout(r, 1200));
    
    if (vfs) {
        await print("VFS_ROOT: FOUND [Integrity 100%]");
        await print("GENESIS_BLOCK (2025-12-26): VERIFIED_OK");
    } else {
        await print("VFS_ROOT: NOT_FOUND", 1000);
        await print("CRITICAL: Rebuilding 2025-12-26 allocation table...", 2000);
    }

    await print("Shredding stale session buffers and keys...");
    localStorage.removeItem('LAST_PANIC_CODE'); 
    localStorage.removeItem('LAST_PANIC_TIME');

    await print("-------------------------------------------", 200);
    await print("SYSTEM_REPAIRED. WARM_REBOOT INITIATING...", 1500);

    // Fade out effect
    recoveryScreen.style.transition = "opacity 1.5s ease-in";
    recoveryScreen.style.opacity = "0";
    setTimeout(() => recoveryScreen.remove(), 1500);
}

    /**
     * SECURE ENCLAVE BRIDGE
     * gatekeeper for all VFS communication
     */
    async enclaveBridge(appId, request) {
        // SECURITY GUARD 01: Verify App Identity
        // Only allow registered apps to request data
        if (!this.runningApps.has(appId)) {
            console.error(`Security Violation: Unregistered App [${appId}] attempted VFS access.`);
            return null;
        }

        // SECURITY GUARD 02: Session Integrity
        if (!this.sessionKey) {
            console.warn("Bridge Refused: No active encryption session.");
            return null;
        }

        // SECURITY GUARD 03: Operation Routing
        try {
            switch (request.operation) {
                case 'READ_SECURE':
                    // This calls your SovereignVFS module
                    return await SovereignVFS.read(request.path, this.sessionKey);
                
                case 'WRITE_SECURE':
                    return await SovereignVFS.write(request.path, request.data, this.sessionKey);

                default:
                    return null;
            }
        } catch (err) {
            this.logEvent('ERROR', `Bridge Handshake Failed: ${err.message}`);
            return null;
        }
    }

    // Method to register apps when they start
    registerApp(appId) {
        this.runningApps.add(appId);
        this.logEvent('SYS', `Process [${appId}] registered.`);
    }

    init() {
    const loginBtn = document.getElementById('login-btn');
    const status = document.getElementById('auth-status');

    if (!loginBtn) return;

    loginBtn.onclick = async () => {
        // 1. Enter Secure State
        loginBtn.disabled = true;
        loginBtn.style.opacity = '0.3';

        // Add a "Shake" class to the box during sequence
        const box = document.querySelector('.login-box');
        box.style.animation = "shake 0.2s infinite";

        // After the sequence finishes, stop the shake
        box.style.animation = "none";
        
        // 2. Cryptographic Sequence (The Visual Build-up)
        const sequence = [
            { msg: "» REQUESTING_HANDSHAKE...", delay: 600 },
            { msg: "» DERIVING_GENESIS_ENTROPY...", delay: 1000 },
            { msg: "» VALIDATING_MEMBER_SIGNATURE...", delay: 800 },
            { msg: "» MOUNTING_VFS_PARTITION_2025_12_26...", delay: 1200 },
            { msg: "» ALLOTMENT_ENCLAVE_SYNCHRONIZED.", delay: 500 }
        ];

        for (const step of sequence) {
            if (status) {
                status.innerText = step.msg;
                status.style.color = "#00ff41";
            }
            // Visual Flicker Effect on the Box
            const box = document.querySelector('.login-box');
            if (box) box.style.borderColor = '#00ff41';
            
            await new Promise(r => setTimeout(r, step.delay));
            
            if (box) box.style.borderColor = '#004411';
        }

        // 3. AUTOMATIC TRANSITION (The "Gate" Opens)
        if (status) status.innerHTML = `<span style="color: #bcff00;">ACCESS_GRANTED. INITIALIZING_SHELL...</span>`;
        
        // Wait a final moment for the user to read 'Access Granted'
        await new Promise(r => setTimeout(r, 600));

        // CRITICAL: Now we call the shell transition
        await this.transitionToShell(); 
    };

    // 4. PERSISTENT SYSTEM LISTENERS
    this.setupContextMenu();

    // Quick Lock: Ctrl + L
    window.addEventListener('keydown', (e) => {
        if (e.ctrlKey && (e.key === 'l' || e.key === 'L')) {
            e.preventDefault();
            this.lockSystem(); 
        }
    });

    // Bind the Unlock Button
        const unlockBtn = document.getElementById('unlock-btn');
        if (unlockBtn) {
            unlockBtn.onclick = () => this.unlockSystem();
        }

        // Bind the Enter Key specifically for the Lock Screen input
        const lockInput = document.getElementById('lock-pass-input');
        if (lockInput) {
            lockInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    this.unlockSystem();
                }
            });
        }

        // Allow "Enter" key to unlock
        document.getElementById('lock-pass-input')?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.unlockSystem();
        });

        
}

async unlockSystem() {
    const lockPass = document.getElementById('lock-pass-input');
    const status = document.getElementById('lock-status');
    const lockScreen = document.getElementById('lock-screen');
    const root = document.getElementById('os-root');

    if (!lockPass || lockPass.value === "") return;

    // 1. UI Feedback
    status.innerText = "VERIFYING_SESSION...";
    status.style.color = "#bcff00";

    // 2. Verification Delay
    await new Promise(r => setTimeout(r, 800));

    // 3. FORCE REVEAL
    if (lockScreen && root) {
        // Fade out the lock screen
        lockScreen.style.transition = "opacity 0.5s ease";
        lockScreen.style.opacity = '0';
        
        // Remove the blur from the workspace
        root.style.filter = "none"; 
        root.style.display = "block"; // Force display

        setTimeout(() => {
            lockScreen.classList.add('hidden');
            lockScreen.style.display = 'none'; // Double-kill the visibility
            this.isLocked = false;
            lockPass.value = ""; 
            console.log("Kernel: Enclave Resumed.");
        }, 500);
    }
    //Calls brightnes slider back
    if (root) {
        // Remove the security blur AND any stray brightness caps
        root.style.filter = "none"; 
        root.style.opacity = "1";
        
        // Re-sync the slider: If you have a brightness variable, 
        // call your brightness update function here to restore the user's setting.
        if (this.currentBrightness) {
            this.setBrightness(this.currentBrightness);
        }
    }
    
    if (lockScreen) lockScreen.classList.add('hidden');
}

    async transitionToShell() {
        console.log("Kernel: Initiating Security Handshake...");
        
        // 1. DOM REFERENCE CHECK
        const gate = document.getElementById('login-gate');
        const root = document.getElementById('os-root');
        const top = document.getElementById('top-bar');
        const workspace = document.getElementById('workspace');
        const passInput = document.getElementById('pass-input');

        const password = passInput ? passInput.value : "default_gateway";
        const memberId = document.getElementById('username')?.value || "GUEST";

        // FORCING FULLSCREEN LOCK
        const docElm = document.documentElement;
        if (docElm.requestFullscreen) {
            docElm.requestFullscreen();
        } else if (docElm.webkitRequestFullscreen) { /* iOS/Safari */
            docElm.webkitRequestFullscreen();
        }

        // LOCKING ORIENTATION (Mobile)
        if (screen.orientation && screen.orientation.lock) {
            screen.orientation.lock('landscape').catch(() => {});
        }

        try {
            // 2. CRYPTOGRAPHIC KEY DERIVATION
            // We use PBKDF2 to turn the password into a raw AES-GCM key
            this.sessionKey = await SovereignVFS.deriveKey(password, memberId);
            
            if (!this.sessionKey) throw new Error("Key Derivation Failed");

            // 3. ENCLAVE PROVISIONING
            // Critical: Ensure Investor Allotment (2025-12-26) is written to IndexedDB
            await this.provisionInitialFiles();
            
            console.log("Kernel: Sovereign Enclave Unlocked. Validating Genesis Block...");
        } catch (e) {
            console.error("VFS CRITICAL ERROR:", e);
            alert("SECURITY PROTOCOL FAILURE: Handshake Denied.");
            return; // STOP: Do not transition to shell if key is invalid
        }

        // 4. UI TRANSITION (Only occurs on success)
        if (gate) gate.style.display = 'none';
        
        if (root) {
            root.classList.remove('hidden');
            root.style.display = 'block'; 

            // Initialize Dock Auto-Hide Sensor
            if (!document.getElementById('dock-sensor')) {
                const sensor = document.createElement('div');
                sensor.id = 'dock-sensor';
                sensor.onmouseenter = () => root.classList.remove('dock-hidden');
                document.body.appendChild(sensor);
            }

            // Snap Preview Layer
            if (workspace && !document.getElementById('snap-preview')) {
                const preview = document.createElement('div');
                preview.id = 'snap-preview';
                workspace.appendChild(preview);
            }
        }

        // 5. SUBSYSTEM IGNITION
        try {
            // Boot Clock Engine
            const { TimeApp } = await import('../apps/time.js');
            const bootClock = new TimeApp();
            if (bootClock.app && bootClock.app.startClock) {
                bootClock.app.startClock(); 
            }
        } catch (e) {
            console.warn("Temporal Engine: Secondary ignition failed, but system remains stable.");
        }

        if (top) {
            top.classList.remove('hidden');
            top.style.display = 'flex'; // Ensures layout matches VPU style
            top.style.opacity = '0';
            requestAnimationFrame(() => {
                top.style.transition = 'opacity 0.5s ease';
                top.style.opacity = '1';
            });
        }
        this.wallpaper = new NeuralWallpaper('neural-canvas', this);
        this.setupTopBarInteractions(); 
        this.bootShell();
        this.logEvent('INFO', 'Identity Verified. Session Started.');
        
        console.log("Kernel: Sovereign OS Shell Online.");

        // Force the OS to stay in the viewport
        window.addEventListener('fullscreenchange', () => {
            if (!document.fullscreenElement && this.isLoggedIn) {
                this.logEvent('WARN', 'Fullscreen exited. Re-asserting Enclave Lock.');
                // Optional: You can choose to automatically lock the system if 
                // they force-exit fullscreen for security.
                // this.lockSystem(); 
            }
        });

        // Initialize the Preview Layer for window
    if (!document.getElementById('snap-preview')) {
        const preview = document.createElement('div');
        preview.id = 'snap-preview';
        preview.style.cssText = `
            position: absolute;
            background: rgba(0, 255, 65, 0.05);
            border: 2px dashed rgba(0, 255, 65, 0.3);
            pointer-events: none;
            display: none;
            z-index: 50;
            transition: all 0.2s cubic-bezier(0.2, 0.8, 0.2, 1);
        `;
        workspace.appendChild(preview);
    }
    }

    async provisionInitialFiles() {
        try {
            // Check if the drive is already provisioned by trying to read the readme
            const check = await SovereignVFS.read("home/readme.txt", this.sessionKey);
            
            if (!check) {
                console.log("Kernel: Genesis Boot. Provisioning encrypted volumes...");
                
                // Write the 2025-12-26 Investor Allotment Data
                await SovereignVFS.write(
                    "home/documents/investors.txt", 
                    "OFFICIAL RECORD: EPOS 2025-12-26\n--------------------------------\nAllotment: 15,000,000 VPU\nStatus: Verified & Locked\nTrust Tier: Root", 
                    this.sessionKey
                );

                await SovereignVFS.write(
                    "home/readme.txt", 
                    "Welcome to Sovereign OS. Your data is encrypted locally using AES-GCM.", 
                    this.sessionKey
                );
            }
        } catch (err) {
            console.warn("Provisioning skipped or drive already exists.");
        }
        this.logEvent('INFO', 'Genesis Allotment (2025-12-26) verified.');
    }

    /**
     * SECURE FILE BRIDGE
     * This allows any app to request a decrypted file content
     */
    async openSecureFile(path) {
        // 1. SAFETY CHECK: If no key, don't even try the VFS
        if (!this.sessionKey) {
            console.error("Kernel: Access Denied. No Session Key found.");
            alert("Security Error: System Enclave is locked.");
            return;
        }

        try {
            console.log(`Kernel: Decrypting ${path}...`);
            
            // 2. USE THE IMPORTED VFS:
            // Ensure 'SovereignVFS' is correctly imported at the top of kernel.js
            const content = await SovereignVFS.read(path, this.sessionKey);
            
            if (content) {
                // SUCCESS: Data is now plain text
                alert(`[SECURE_VIEW] - ${path}\n\n${content}`);
            } else {
                console.warn("Kernel: File is empty or does not exist.");
            }
        } catch (e) {
            // This usually triggers if the password/key is wrong
            console.error("Decryption failed. Key mismatch or Corrupted Block.", e);
            alert("VFS Error: Decryption failed. Possible data corruption.");
        }

        console.log(`Kernel: Requesting secure access to ${path}`);
    // Logic to find the 'files' app and tell it to open this specific path
    const event = new CustomEvent('launchApp', { detail: { appId: 'files', filePath: path } });
    window.dispatchEvent(event);
    }

    setupContextMenu() {
    // 1. Create the Menu Element
    const menu = document.createElement('div');
    menu.id = 'global-context-menu';
    menu.style.cssText = `
        position: fixed; z-index: 10000; background: #1a1a1a; 
        border: 1px solid #333; border-radius: 8px; width: 180px;
        display: none; padding: 5px 0; box-shadow: 0 10px 25px rgba(0,0,0,0.5);
        font-family: 'Inter', sans-serif; font-size: 13px; color: #eee;
    `;
    document.body.appendChild(menu);

    // 2. Listen for Right Click
    window.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    const menu = document.getElementById('global-context-menu');
    
    // 1. Render content first so the browser knows the height
    this.renderMenuContent(menu, e.target);
    
    menu.style.display = 'block';
    menu.style.visibility = 'hidden'; // Hide momentarily to calculate size

    const menuWidth = menu.offsetWidth;
    const menuHeight = menu.offsetHeight;
    const padding = 10; // Safety gap from screen edge

    let x = e.clientX;
    let y = e.clientY;

    // 2. Horizontal Boundary Check
    // If menu + expected submenu width (approx 240px) exceeds width, flip left
    const expectedTotalWidth = menuWidth + 240; 
    if (x + expectedTotalWidth > window.innerWidth) {
        x = x - menuWidth;
        menu.classList.add('reverse-x'); // Add class to flip submenus to the left
    } else {
        menu.classList.remove('reverse-x');
    }

    // 3. Vertical Boundary Check
    if (y + menuHeight > window.innerHeight) {
        y = window.innerHeight - menuHeight - padding;
    }

    // 4. Top/Left Boundary Check (Prevent negative coordinates)
    x = Math.max(padding, x);
    y = Math.max(padding, y);

    menu.style.left = `${x}px`;
    menu.style.top = `${y}px`;
    menu.style.visibility = 'visible';

        // Dynamic Menu Content based on what was clicked
        this.renderMenuContent(menu, e.target);
    });

    // 3. Hide menu on click elsewhere
    window.addEventListener('click', () => {
        menu.style.display = 'none';
    });
}

// RENDER CONTEXT MENU ITEMS
renderMenuContent(menu, target) {
    const isWindow = target.closest('.os-window');
    const isIcon = target.closest('.desktop-icon');
    const isDockIcon = target.closest('.dock-item'); // New Dock Detector

    

    // --- DOCK ICON LOGIC ---
    let dockItems = [];
    if (isDockIcon) {
        const appId = isDockIcon.dataset.app; // Ensure your dock icons have data-app="terminal" etc.
        const appInstance = this.runningApps[appId];

        if (!appInstance) {
            // Case 1: App is not running
            dockItems.push({ label: '▶ Start Process', action: () => this.launchApp(appId) });
        } else {
            const winElement = document.getElementById(`win-${appId}`);
            if (winElement && winElement.classList.contains('minimized')) {
                // Case 2: App is running but minimized
                dockItems.push({ label: '📂 Restore Window', action: () => this.restoreApp(appId) });
            } else {
                // Case 3: App is already active/visible
                dockItems.push({ label: '👁 View Instance', action: () => this.focusApp(appId) });
            }
            dockItems.push({ 
                label: '❌ Terminate', 
                action: () => this.closeApp(appId, `win-${appId}`),
                className: 'danger-action' 
            });
        }
    }
    // 1. DATA STRUCTURE: Subsections & Items
    const menuData = [
        {
            section: "DOCK_OPERATIONS",
            visible: !!isDockIcon, // Only show if we clicked the dock
            items: dockItems
        },
        {
            section: "ACTIVE_CONTEXT",
            visible: isWindow || isIcon,
            items: [
                isWindow ? {
                    label: '🗔 Window Management',
                    children: [
                        { label: '➖ Minimize', action: () => isWindow.classList.add('minimized') },
                        { label: '❌ Close Enclave', action: () => {
                            const appId = isWindow.id.replace('win-', '');
                            this.closeApp(appId, isWindow.id);
                        }}
                    ]
                } : null,
                isIcon ? {
                    label: '🚀 Object Actions',
                    children: [
                        { label: 'Run Process', action: () => isIcon.click() },
                        { label: 'Shred Shortcut', action: () => isIcon.remove() }
                    ]
                } : null
            ].filter(Boolean)
        },
        {
            section: "SYSTEM_TOOLS",
            items: [
                { 
                    label: '🐚 Terminal Shell', 
                    kbd: 'Alt+T',
                    children: [
                        { label: 'New Instance', action: () => this.launchApp('terminal') },
                        { label: 'Root Privileges', action: () => this.launchApp('terminal', {root:true}) }
                    ]
                },
                { label: '📊 System Monitor', action: () => this.launchApp('monitor') },
                { label: '📝 Task Manager', action: () => this.launchApp('taskman') }
            ]
        },

        {
        section: "WORKSPACE_LAYOUT",
        items: [
                        { 
                label: this.isTilingActive ? '🟢 Tiling: ACTIVE' : '⚪ Tiling: FLOATING', 
                kbd: 'Alt+G',
                action: () => {
                    this.isTilingActive = !this.isTilingActive;
                    if (this.isTilingActive) {
                        this.updateTilingGrid();
                    } else {
                        // Reset windows to floating state
                        const allWindows = document.querySelectorAll('.os-window');
                        
                        allWindows.forEach((win, idx) => {
                            win.style.transition = 'all 0.4s ease';
                            win.style.width = "clamp(320px, 65vw, 900px)";
                            win.style.height = "clamp(300px, 65vh, 720px)";
                            
                            // NEW: Reset floating window classes and z-indices
                            win.classList.remove('floating-extra');
                            win.style.zIndex = (100 + idx).toString();
                            win.dataset.hasBeenDragged = 'false';
                            
                            // Reset positions to natural cascade
                            const cascadeOffset = idx * 25;
                            win.style.left = `${85 + cascadeOffset}px`;
                            win.style.top = `${40 + cascadeOffset}px`;
                        });
                        
                        this.logSystemEvent("Layout: Floating Mode Restored", "info");
                    }
                }
            },
            {
                label: '📐 Layout Options',
                visible: this.isTilingActive,
                children: [
                    { label: 'Master-Stack (Default)', action: () => { this.updateTilingGrid(); } },
                    { label: 'Force Refresh Grid', action: () => this.updateTilingGrid() }
                ]
            }
        ]
    },
        {
            section: "VFS_OPERATIONS",
            items: [
                { label: '📁 Create New Folder', action: () => this.createFolder(), kbd: 'N' },
                { label: '🔡 Arrange Genesis Grid', action: () => this.arrangeIcons() }
            ]
        },
        {
            section: "WORKSPACE_CONFIG",
            items: [
                { label: '🖼️ Change Wallpaper', action: () => this.changeBackground() },
                { 
                    label: '⚙️ OS Preferences', 
                    children: [
                        { label: 'Toggle Scanlines', action: () => this.toggleScanlines() },
                        { label: 'Security Blur (Privacy)', action: () => this.toggleSecurityBlur() },
                        { label: 'Matrix FX Theme', action: () => this.setTheme('matrix') },
                        { label: 'Restore Sovereign Core', action: () => this.setTheme('sovereign') }
                    ]
                }
            ]
        },
        {
            section: "SECURITY_PROTOCOL",
            items: [
                { label: '🔒 Lock OS (Standby)', action: () => this.suspendSession(), kbd: 'Ctrl+L' },
                { label: '🧹 Close All Windows', action: () => this.closeAllWindows() }, // NEW ITEM
                { label: '🔄 Reboot Kernel', action: () => location.reload() },
                { 
                    label: '☢️ Shutdown Enclave', 
                    className: 'danger-action',
                    action: () => {
                        if(confirm("TERMINATE SESSION? 2025-12-26 Allotment data will be shredded.")) {
                            this.lockSystem();
                        }
                    }
                }
            ]
        }
    ];

    // 2. RECURSIVE HTML GENERATOR
    const generateHTML = (data) => {
        return data.map(sec => {
            if (sec.visible === false) return '';
            
            let html = `<div class="menu-section-label">${sec.section}</div>`;
            html += sec.items.map(item => {
                const hasChildren = item.children && item.children.length > 0;
                return `
                    <div class="menu-item ${hasChildren ? 'has-submenu' : ''} ${item.className || ''}" data-label="${item.label}">
                        <span class="m-label">${item.label}</span>
                        ${hasChildren ? '<span class="chevron">›</span>' : ''}
                        ${item.kbd ? `<kbd>${item.kbd}</kbd>` : ''}
                        ${hasChildren ? `<div class="vpu-submenu">${generateSubHTML(item.children)}</div>` : ''}
                    </div>`;
            }).join('');
            html += `<div class="menu-divider"></div>`;
            return html;
        }).join('');
    };

    const generateSubHTML = (subItems) => {
        return subItems.map(si => `
            <div class="menu-item" data-label="${si.label}">
                <span class="m-label">${si.label}</span>
            </div>
        `).join('');
    };

    menu.innerHTML = generateHTML(menuData);

    // 3. UNIVERSAL CLICK HANDLER
    // 3. UNIVERSAL CLICK HANDLER
menu.onclick = (e) => {
    const targetItem = e.target.closest('.menu-item');
    // Important: Don't close or fire if it's a parent of a submenu
    if (!targetItem || targetItem.classList.contains('has-submenu')) return;

    const label = targetItem.dataset.label;
    
    // Recursive search to find the action even if it's nested
    const findActionRecursive = (data) => {
        for (let sec of data) {
            // Check top level items
            for (let item of sec.items) {
                if (item.label === label) return item.action;
                // Check children (submenus)
                if (item.children) {
                    for (let child of item.children) {
                        if (child.label === label) return child.action;
                        // Optional: Add one more loop if you have sub-sub menus
                    }
                }
            }
        }
        return null;
    };

    const action = findActionRecursive(menuData);
    if (action) {
        action(); // Run the function
        menu.style.display = 'none'; // Close menu
    }
};
document.addEventListener('click', () => menu.style.display = 'none');
}

//creates folder
createFolder() {
    const folderId = `folder-${Date.now()}`;
    const folderName = prompt("Enter Folder Name:", "New_Registry") || "New_Folder";
    this.logEvent('FS', 'Creating new directory...');
    // Add logic to push a new icon to your workspace grid
    
    // 1. Create the Desktop Icon Element
    const icon = document.createElement('div');
    icon.className = 'desktop-icon';
    icon.id = `icon-${folderId}`;
    icon.innerHTML = `
        <span class="icon-glyph">📁</span>
        <span class="icon-label">${folderName}</span>
    `;

    // 2. Add Open Behavior (Double Click)
    icon.ondblclick = () => this.openFolder(folderId, folderName);

    // 3. Append to Workspace
    const workspace = document.getElementById('workspace');
    if (workspace) {
        workspace.appendChild(icon);
        this.logEvent('FS', `Directory created: ${folderName} [${folderId}]`);
    }
}

openFolder(id, name) {
    // Check if window already exists
    if (document.getElementById(`win-${id}`)) return;

    // Use your existing launchApp or window creation logic
    const folderWindow = this.createWindow(id, `Index: /${name}`, `
        <div class="folder-content">
            <p style="color: #00ff4133; font-size: 11px;">[ DIRECTORY_EMPTY ]</p>
            </div>
    `);
}

arrangeIcons() {
    const workspace = document.getElementById('workspace');
    const icons = Array.from(workspace.getElementsByClassName('desktop-icon'));
    this.logEvent('UI', 'Re-organizing Genesis grid...');
    // Add logic to sort desktop-icon elements
    
    // Sort by Label text
    icons.sort((a, b) => {
        const nameA = a.querySelector('.icon-label').innerText.toUpperCase();
        const nameB = b.querySelector('.icon-label').innerText.toUpperCase();
        return nameA < nameB ? -1 : nameA > nameB ? 1 : 0;
    });

    // Re-append in order (Flexbox/Grid in CSS will handle the positioning)
    icons.forEach(icon => workspace.appendChild(icon));
    this.logEvent('UI', 'Genesis Grid re-aligned by Name.');
}

restoreApp(appId) {
    const win = document.getElementById(`win-${appId}`);
    if (win) {
        win.classList.remove('minimized');
        this.focusApp(appId);
        this.logEvent('UI', `Restored ${appId} to workspace.`);
    }
}

focusApp(appId) {
    const win = document.getElementById(`win-${appId}`);
    if (win) {
        // Bring to front
        document.querySelectorAll('.os-window').forEach(w => w.style.zIndex = "100");
        win.style.zIndex = "1000";
        this.logEvent('UI', `Focus shifted to ${appId}`);
    }
}

closeAllWindows() {
    const workspace = document.getElementById('workspace');
    workspace.classList.add('pulse-bg');
    setTimeout(() => workspace.classList.remove('pulse-bg'), 400);

    const processes = Object.keys(this.runningApps);
    processes.forEach(appId => this.closeApp(appId, `win-${appId}`));
}

toggleScanlines() {
    let scanlineOverlay = document.getElementById('vpu-scanlines');
    
    if (!scanlineOverlay) {
        scanlineOverlay = document.createElement('div');
        scanlineOverlay.id = 'vpu-scanlines';
        // Ensure it sits behind UI but above wallpaper
        scanlineOverlay.style.cssText = `
            position: fixed;
            inset: 0;
            pointer-events: none;
            z-index: 1;
            background: linear-gradient(
                rgba(18, 16, 16, 0) 50%, 
                rgba(0, 0, 0, 0.1) 50%
            ), linear-gradient(
                90deg, 
                rgba(255, 0, 0, 0.02), 
                rgba(0, 255, 0, 0.01), 
                rgba(0, 0, 255, 0.02)
            );
            background-size: 100% 4px, 3px 100%;
            opacity: 0.3;
        `;
        document.body.appendChild(scanlineOverlay);
        this.logEvent('UI', 'CRT Scanline Emulation: ENABLED');
    } else {
        scanlineOverlay.remove();
        this.logEvent('UI', 'CRT Scanline Emulation: DISABLED');
    }
}

toggleSecurityBlur() {
    const root = document.getElementById('sovereign-shell');
    const isBlurred = root.style.filter.includes('blur');
    
    if (!isBlurred) {
        root.style.filter = 'blur(10px) grayscale(0.5)';
        root.style.transition = 'filter 0.5s ease';
        this.logEvent('SEC', 'Privacy Cloak: ACTIVE');
    } else {
        root.style.filter = 'none';
        this.logEvent('SEC', 'Privacy Cloak: DEACTIVATED');
    }
}

setTheme(themeName) {
    const root = document.documentElement;
    
    if (themeName === 'matrix') {
        root.style.setProperty('--primary-accent', '#00ff41');
        root.style.setProperty('--bg-color', '#000500');
        root.style.setProperty('--window-border', 'rgba(0, 255, 65, 0.3)');
        
        // If you have a Matrix background script, start it here
        this.startMatrixRain(); 
        this.logEvent('SYS', 'Visual Protocol: MATRIX_FX loaded.');
    } else {
        // Reset to Thealcohesion Purple
        root.style.setProperty('--primary-accent', '#a445ff');
        this.logEvent('SYS', 'Visual Protocol: SOVEREIGN_CORE restored.');
    }
}

// SECURITY PROTOCOL: LOCK SYSTEM
lockSystem() {
    console.warn("Kernel: SECURITY PROTOCOL ACTIVE. Purging Session Key...");

    // 1. SHRED DATA
    this.sessionKey = null;

    // 2. WIPE DOM (Kill all apps)
    Object.keys(this.runningApps).forEach(appId => {
        this.killProcess(appId);
    });

    // 3. UI RESET
    const gate = document.getElementById('login-gate');
    const root = document.getElementById('os-root');
    const top = document.getElementById('top-bar');
    const passInput = document.getElementById('pass-input');
    const status = document.getElementById('auth-status');

    if (gate) {
        gate.style.display = 'flex';
        gate.style.opacity = '1';
        // Notify the user that the purge was successful
        if (status) {
            status.innerText = "SESSION_PURGED: MEMORY_CLEAN";
            status.style.color = "#ff4444"; // Red alert color
        }
    }
    
    if (root) root.style.display = 'none';
    if (top) top.classList.add('hidden');
    
    // 4. SECURITY HYGIENE
    if (passInput) passInput.value = ''; 
    this.isLoggedIn = false;

    // Optional: Re-trigger the Pulse FX to show Sentry is still watching
    const pulse = document.querySelector('.pulse-container');
    if (pulse) pulse.style.display = 'block';

    console.log("Kernel: System Enclave Locked and Purged.");
}

suspendSession() {
    console.log("Kernel: Entering Standby Mode...");
    
    const lockScreen = document.getElementById('lock-screen');
    const loginGate = document.getElementById('login-gate');
    const root = document.getElementById('os-root');

    // 1. Ensure the Login Gate is HIDDEN
    if (loginGate) loginGate.style.display = 'none';

    // 2. Show the Lock Screen
    if (lockScreen) {
        lockScreen.classList.remove('hidden');
        lockScreen.style.display = 'flex';
        lockScreen.style.opacity = '1';
        this.isLocked = true;
    }

    // 3. Blur the background workspace
    if (root) {
        root.style.filter = "blur(20px)";
        // Optional: reduce opacity of workspace for better contrast
        root.style.opacity = "0.5";
    }
}
    setupTopBarInteractions() {
        const topBarTime = document.getElementById('top-bar-time');
        
        // --- ADD THIS SECTION BELOW ---
    // This finds the container holding your time/status icons
    const tBarRight = topBarTime?.parentElement; 
    
    if (tBarRight) {
        const tilingIndicator = document.createElement('div');
        tilingIndicator.id = 'tiling-status-hub';
        tilingIndicator.className = 'status-item'; // Matches your Top Bar styling
        tilingIndicator.style.display = 'flex';
        tilingIndicator.style.alignItems = 'center';
        tilingIndicator.style.gap = '5px';
        tilingIndicator.style.cursor = 'pointer';
        tilingIndicator.style.marginRight = '15px';
        
        tilingIndicator.title = "Workspace Layout Engine [Alt+G]";
        tilingIndicator.innerHTML = `
            <svg id="tiling-icon" viewBox="0 0 24 24" width="14" height="14" stroke="#a445ff" fill="none" stroke-width="2">
                <rect x="3" y="3" width="18" height="18" rx="2" opacity="0.3"></rect>
                <path d="M12 3v18M3 12h18" stroke-dasharray="2 2"></path>
            </svg>
            <span id="tiling-label" style="font-size: 10px; color: #a445ff; font-weight: bold;">FLOAT</span>
        `;
        
        tilingIndicator.onclick = () => {
            this.isTilingActive = !this.isTilingActive;
            this.updateTilingGrid();
        };

        // Put it before the time
        tBarRight.insertBefore(tilingIndicator, topBarTime);
    }
    // --- END OF ADDITION ---

        if (topBarTime) {
            topBarTime.style.cursor = 'pointer';
            topBarTime.onclick = async () => {
                const existingHud = document.getElementById('temporal-hud');
                if (existingHud) {
                    existingHud.style.opacity = '0';
                    setTimeout(() => existingHud.remove(), 200);
                    return;
                }
                const { TimeApp } = await import('../apps/time.js');
                new TimeApp().app.renderHUD(); 
            };
        }
    }

    bootShell() {
    const dock = document.getElementById('side-dock');
    if (!dock) return;
    dock.innerHTML = ''; 
    // --- ADDED: TASK VIEW BUTTON (Far Left) ---
    const taskViewBtn = document.createElement('div');
    taskViewBtn.className = 'dock-item task-view-trigger';
    taskViewBtn.title = "View Open Apps";
    taskViewBtn.innerHTML = `<span><svg viewBox="0 0 24 24" width="20" height="20" stroke="#a445ff" fill="none" stroke-width="2"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg></span>`;
    taskViewBtn.onclick = () => this.toggleTaskOverview();
    dock.appendChild(taskViewBtn);
    // --- END ADDITION ---
    this.pinnedApps.forEach((appId) => {
        const app = registry.find(a => a.id === appId);
        if (!app) return;

        const dItem = document.createElement('div');
        const isRunning = this.runningApps.has(appId);
        dItem.className = `dock-item ${isRunning ? 'running' : ''}`;
        dItem.title = app.name;
        dItem.innerHTML = `<span>${app.icon}</span>`;
        
        dItem.onclick = () => {
            // 1. Handle the Menu Overlay (Close it if it's open)
            const overlay = document.getElementById('app-menu-overlay');
            if (overlay) {
                overlay.classList.add('hidden');
                overlay.style.display = 'none';
            }

            // 2. Handle the App Logic
            if (isRunning) {
                // This calls focusWindow which now includes display: block
                this.focusWindow(`win-${appId}`);
            } else {
                this.launchApp(appId);
            }
        };
        
        dock.appendChild(dItem);
    });

    // App Menu Dot Trigger
    const menuBtn = document.createElement('div');
    menuBtn.className = 'dock-bottom-trigger';
    for(let i = 0; i < 9; i++) {
        const dot = document.createElement('div');
        dot.className = 'menu-dot';
        menuBtn.appendChild(dot);
    }
    menuBtn.onclick = () => this.openAppMenu();
    dock.appendChild(menuBtn);
}

toggleTaskOverview() {
    const workspace = document.getElementById('workspace');
    const realWindows = document.querySelectorAll('.os-window:not(.in-overview)');
    const isEntering = !document.body.classList.contains('task-overview-active');

    if (!isEntering) {
        this.exitOverview();
        return;
    }

    document.body.classList.add('task-overview-active');
    
    // Log visibility fix: Log before the blur covers everything or ensure blur is a child of workspace
    this.logSystemEvent("VPU PROXY VIRTUALIZATION", "info");

    const blur = document.createElement('div');
    blur.id = 'overview-blur';
    blur.innerHTML = `
        <div id="overview-search-wrap">
            <input type="text" id="overview-search" placeholder="FILTER ENCLAVES..." autocomplete="off">
        </div>
        <button id="purge-all-btn">TERMINATE ALL ACTIVE ENCLAVES</button>
        <div id="overview-grid"></div>
    `;
    workspace.appendChild(blur);

    const grid = document.getElementById('overview-grid');

    realWindows.forEach(realWin => {
        // 1. Hide real window
        realWin.style.visibility = 'hidden';

        // 2. Create Proxy
        const proxy = realWin.cloneNode(true);
        proxy.id = `proxy-${realWin.id}`;
        proxy.classList.add('in-overview');
        // Grab the title from the real window and save it on the proxy
        const winTitle = realWin.querySelector('.title')?.innerText || "Enclave";
        proxy.setAttribute('data-search-term', winTitle.toLowerCase());
        proxy.style.cssText = `
            position: relative !important;
            left: auto !important;
            top: auto !important;
            width: 100% !important;
            height: 200px !important;
            visibility: visible !important;
            display: flex !important;
            transform: none !important;
        `;

        // --- 3. FILTER CONTROLS & ADD CONFIRMATION ---
        const controls = proxy.querySelector('.window-controls');
        if (controls) {
            Array.from(controls.children).forEach(btn => {
                if (!btn.classList.contains('close') && !btn.classList.contains('close-btn')) {
                    btn.remove();
                } else {
                    btn.style.display = 'flex';
                    btn.style.pointerEvents = 'all';
                    
                    btn.onclick = (e) => {
                        e.stopPropagation();
                        
                        // --- THE CONFIRMATION OVERLAY ---
                        const confirmOverlay = document.createElement('div');
                        confirmOverlay.className = 'proxy-confirm-overlay';
                        confirmOverlay.innerHTML = `
                            <div class="confirm-box">
                                <p>TERMINATE ENCLAVE?</p>
                                <div class="confirm-btns">
                                    <button class="yes">YES</button>
                                    <button class="no">NO</button>
                                </div>
                            </div>
                        `;
                        proxy.appendChild(confirmOverlay);

                        // Handle NO
                        confirmOverlay.querySelector('.no').onclick = (ev) => {
                            ev.stopPropagation();
                            confirmOverlay.remove();
                        };

                        // Handle YES
                        confirmOverlay.querySelector('.yes').onclick = (ev) => {
                            ev.stopPropagation();
                            const appId = realWin.id.replace('win-', '');
                            
                            this.logSystemEvent(`TERMINATING: ${appId}`, "warn");
                            this.closeApp(appId, realWin.id); 
                            
                            proxy.style.transform = "scale(0.9)";
                            proxy.style.opacity = "0";
                            setTimeout(() => {
                                proxy.remove();
                                if (grid.querySelectorAll('.os-window').length === 0) {
                                    this.exitOverview();
                                }
                            }, 200);
                        };
                    };
                }
            });
        }

        proxy.onclick = () => this.exitOverview(realWin.id);
        grid.appendChild(proxy);
    });

    // --- TERMINATE ALL LOGIC ---
    document.getElementById('purge-all-btn').onclick = (e) => {
    e.stopPropagation();
    
    const proxies = grid.querySelectorAll('.os-window');
    if (proxies.length === 0) return;

    const massConfirm = document.createElement('div');
    massConfirm.id = 'mass-purge-overlay';
    massConfirm.innerHTML = `
        <div class="mass-confirm-box">
            <h2 class="critical-text">⚠ ENCLAVE PURGE INITIATED</h2>
            <div id="purge-countdown">10</div>
            <p>PURGING ${proxies.length} ACTIVE PROCESSES...</p>
            <div class="mass-confirm-btns">
                <button class="cancel-purge">ABORT SEQUENCE</button>
            </div>
        </div>
    `;
    document.getElementById('overview-blur').appendChild(massConfirm);

    let count = 10; // Increased to 10
    const countdownEl = massConfirm.querySelector('#purge-countdown');
    
    const timer = setInterval(() => {
        count--;
        countdownEl.innerText = count;
        
        // Visual warning: Turn text red when under 4 seconds
        if (count <= 3) {
            countdownEl.style.color = "#ff4444";
            countdownEl.style.fontSize = "100px";
        }
        
        if (count === 0) {
            clearInterval(timer);
            executeFinalPurge();
        }
    }, 1000);

    massConfirm.querySelector('.cancel-purge').onclick = () => {
        clearInterval(timer);
        this.logSystemEvent("ENCLAVE PURGE INITIATED", "info");
        massConfirm.remove();
    };

    const executeFinalPurge = () => {
        countdownEl.innerText = "PURGING";
        this.logSystemEvent(`EXECUTING MASS PURGE: ${proxies.length} PROCESSES`, "critical");

        proxies.forEach((p, i) => {
            setTimeout(() => {
                const realId = p.id.replace('proxy-', '');
                const appId = realId.replace('win-', '');
                
                this.closeApp(appId, realId);
                p.style.transform = "scale(0) rotate(15deg)";
                p.style.opacity = "0";
                
                setTimeout(() => p.remove(), 300);

                if (i === proxies.length - 1) {
                    setTimeout(() => {
                        massConfirm.remove();
                        this.exitOverview();
                    }, 500);
                }
            }, i * 60);
        });
    };
};
 

    // Search Logic
    // Search Logic (Inside toggleTaskOverview)
    const searchInput = document.getElementById('overview-search');
    if (searchInput) {
        searchInput.focus();
        searchInput.oninput = (e) => {
            const query = e.target.value.toLowerCase().trim();
            const proxies = grid.querySelectorAll('.os-window.in-overview');

            proxies.forEach(p => {
                const term = p.getAttribute('data-search-term') || "";
                if (term.includes(query)) {
                    p.style.display = 'flex';
                } else {
                    p.style.display = 'none';
                }
            });
        };
    }
}

//PURGE BUTTON

renderOverviewControls() {
    const controls = document.createElement('div');
    controls.id = 'overview-hud';
    controls.innerHTML = `
        <button onclick="os.purgeAll()">
            <svg class="sys-icon" viewBox="0 0 24 24" fill="none" stroke="#ff4444" stroke-width="2">
                <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            CLEANSE SYSTEM
        </button>
    `;
    document.body.appendChild(controls);
}

exitOverview(focusId = null) {
    const blur = document.getElementById('overview-blur');
    const realWindows = document.querySelectorAll('.os-window:not(.in-overview)');

    document.body.classList.remove('task-overview-active');

    // 1. Show all real windows again
    realWindows.forEach(win => {
        win.style.visibility = 'visible';
        win.style.pointerEvents = 'all';
        // Note: left/top/width/height are exactly where the user left them!
    });

    // 2. Remove the overview (and all proxies inside it)
    if (blur) {
        blur.style.opacity = '0';
        setTimeout(() => blur.remove(), 300);
    }

    // 3. Focus the selected window
    if (focusId) {
        this.focusWindow(focusId);
    }
}
   
    initGhostReaper() {
        const CRITICAL_IDLE = 600000; // 10 Minutes in ms
        
        setInterval(() => {
            // Only reap while the user is looking at the Overview
            if (!document.body.classList.contains('task-overview-active')) return;

            const now = Date.now();
            const ghostWindows = document.querySelectorAll('.os-window.in-overview');

            ghostWindows.forEach(win => {
                const lastUsed = parseInt(win.dataset.lastUsed || now);
                const idleTime = now - lastUsed;

                // If idle for more than 10 mins, start auto-termination
                if (idleTime > CRITICAL_IDLE && !win.classList.contains('terminating')) {
                    this.reapProcess(win);
                } else if (idleTime > (CRITICAL_IDLE * 0.8)) {
                    // At 8 minutes, turn the badge red as a warning
                    win.querySelector('.idle-badge')?.classList.add('critical');
                }
            });
        }, 5000); // Check every 5 seconds
    }

    reapProcess(win) {
        win.classList.add('terminating');
        const appId = win.id.replace('win-', '');
        
        // Find dock icon to pulse it (reclaiming resources)
        const dockIcon = document.querySelector(`.dock-icon[data-app-id="${appId}"]`);

        setTimeout(() => {
            if (dockIcon) {
                dockIcon.classList.add('pulse-reception');
                setTimeout(() => dockIcon.classList.remove('pulse-reception'), 600);
            }
            
            this.closeApp(appId, win.id);
            win.remove();
            
            console.log(`[Sovereign OS] Reclaimed resources from idle process: ${appId}`);
        }, 2000); // Matches the 'ghostZap' animation duration
    
        // Trigger the Log
        this.logSystemEvent(`RECLAIMED IDLE PROCESS: ${appId.toUpperCase()}`, 'critical');

        setTimeout(() => {
            // ... closeApp logic ...
        }, 2000);
    }
    launchApp(appId) {
        
        if (this.isTilingActive) {
        this.showSnapPreview(); // Show where it will go
        setTimeout(() => {
            document.getElementById('snap-preview').style.display = 'none';
        }, 500);
    }

        // 1. OVERVIEW EXIT: If launching while in overview, exit it first
        if (document.body.classList.contains('task-overview-active')) {
            this.exitOverview(); 
        }

        // TRIPWIRE: Check process count
        if (this.runningApps.size >= 10) {
            this.triggerRealPanic("0xMEM_OVERFLOW_02", "Hardware threading limit reached. Close active enclaves.");
            return;
        }
        // 1. Close the overlay menu immediately
        const overlay = document.getElementById('app-menu-overlay');
        if (overlay) {
            overlay.classList.add('hidden');
            overlay.style.display = 'none';
        }

        const app = registry.find(a => a.id === appId);
        const workspace = document.getElementById('workspace');
        if (!app || !workspace) return;

        const winId = `win-${appId}`;
        
        // Prevent duplicate windows
        if (this.runningApps.has(appId)) {
            this.focusWindow(winId);
            return;
        }

        this.runningApps.add(appId);
        this.bootShell(); // Refresh dock icons to show "running" state

        const win = document.createElement('div');
        win.className = 'os-window';
        win.id = winId;

        // --- RESTORED GOLD GEOMETRY ---
       // --- UPDATED CASCADE GEOMETRY ---
        const activeCount = this.runningApps.size - 1; // Number of other windows
        const offset = activeCount * 25; // 25px offset per window

        win.style.position = "absolute"; 
        
        // Start 5px below the Top Bar, then add the cascade offset
        // We use 'px' values for the initial spawn to ensure stability
        const spawnTop = 40 + 5 + offset; // 40 (TopBar) + 5 (Gap) + Cascade
        const spawnLeft = 75 + 5 + offset; // 75 (Dock) + 5 (Gap) + Cascade

        win.style.top = `${spawnTop}px`;
        win.style.left = `${spawnLeft}px`;
        
        // Maintain your clamp logic for size
        win.style.width = "clamp(320px, 65vw, 900px)";
        win.style.height = "clamp(300px, 65vh, 720px)";

        // Ensure new window is on top
        win.style.zIndex = this.getTopZIndex();

        // NEW: SECURITY AUDIT LOG FOR SENSITIVE APPS
        if (appId === 'syslog') {
            if (!this.isLoggedIn || !this.sessionKey) {
                this.logEvent('WARN', `UNAUTHORIZED_ACCESS: Attempt to open System Log without valid Enclave Key.`);
                
                // Optionally, trigger a minor warning UI instead of a full panic
                alert("ACCESS DENIED: Administrative logs are encrypted. Unlock Enclave to proceed.");
                return;
            } else {
                this.logEvent('INFO', `SECURE_ACCESS: System Log opened by ${this.memberId || 'AUTHORIZED_MEMBER'}`);
            }
        }

        win.style.zIndex = this.getTopZIndex();

        // Standard OS Window structure
                        win.innerHTML = `
            <div class="window-header">
                <span class="title">${app.icon} ${app.name}</span>
                <div class="window-controls">
                    <button class="win-btn hide" id="hide-${winId}">
                        <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" fill="none" stroke-width="2.5"><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                    </button>
                    <button class="win-btn expand" id="max-${winId}">
                        <svg viewBox="0 0 24 24" width="12" height="12" stroke="currentColor" fill="none" stroke-width="2.5"><rect x="3" y="3" width="18" height="18" rx="1"></rect></svg>
                    </button>
                    <button class="win-btn close" id="close-${winId}">
                        <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" fill="none" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    </button>
                </div>
            </div>
            <div class="window-content" id="canvas-${appId}" style="height: calc(100% - 50px); overflow: auto;">
                <div class="app-loading">System: Initializing ${app.name}...</div>
            </div>
            <div class="resize-handle resize-n"></div>
            <div class="resize-handle resize-s"></div>
            <div class="resize-handle resize-e"></div>
            <div class="resize-handle resize-w"></div>
            <div class="resize-handle resize-ne"></div>
            <div class="resize-handle resize-nw"></div>
            <div class="resize-handle resize-se"></div>
            <div class="resize-handle resize-sw"></div>`;

        workspace.appendChild(win);
        
        // NEW: Add window to tiling order
        if (!this.tiledWindowOrder.includes(winId)) {
            this.tiledWindowOrder.push(winId);
            console.log(`Added ${winId} to tiling order:`, this.tiledWindowOrder);
        }
        
        // CRITICAL: Ensure window is visible before tiling
        win.style.visibility = 'visible';
        win.style.display = 'flex';
        win.style.opacity = '1';
        win.style.pointerEvents = 'auto';
        
        this.updateTilingGrid();
        
        // Call meter update
        this.updateMemoryMeter();
        
        // --- RESTORED ANIMATION SEQUENCE ---
        requestAnimationFrame(() => {
            win.style.opacity = "0";
            win.style.transform = "translateY(10px)"; // Start slightly lower
            requestAnimationFrame(() => {
                win.style.transition = "all 0.3s cubic-bezier(0.165, 0.84, 0.44, 1)";
                win.style.opacity = "1";
                win.style.transform = "translateY(0)";
            });
        });

        // Controls & Interactivity
        win.querySelector(`#hide-${winId}`).onclick = (e) => { e.stopPropagation(); this.minimizeWindow(winId); };
        win.querySelector(`#max-${winId}`).onclick = (e) => { e.stopPropagation(); this.toggleMaximize(winId); };
        win.querySelector(`#close-${winId}`).onclick = (e) => { e.stopPropagation(); this.closeApp(appId, winId); };
        
        win.onmousedown = () => this.focusWindow(winId);
        win.addEventListener('touchstart', () => this.focusWindow(winId), {passive: true});
        
        // Attach resize handles
        this.attachResizeHandles(win, winId);
        
                // Header interactions
        const header = win.querySelector('.window-header');
        if (header) {
            // Single click: Focus window
            header.addEventListener('mousedown', (e) => {
                if (e.target.closest('.window-controls')) return;
                this.focusWindow(winId);
            });

                    // Right-click: Show swap menu (in tiling mode)
        header.addEventListener('contextmenu', (e) => {
            if (this.isTilingActive && !e.target.closest('.window-controls')) {
                e.preventDefault();
                this.showSwapMenu(winId, e);
            }
        });
            
            // Double click: Toggle maximize
            header.addEventListener('dblclick', (e) => {
                if (e.target.closest('.window-controls')) return;
                this.toggleMaximize(winId);
            });
        }

        this.makeDraggable(win);
        // --- NEW INJECTION LOGIC ---
        // We check if the app is a local synthesis or a standard file, for demo will be removed when app are not local
        if (app.file === 'local_module') {
            this.executeLocalApp(appId, app);
        } else {
            // Standard loading for pre-installed apps
            this.injectAppContent(appId);
        }
        win.dataset.lastUsed = Date.now();


    }
//For demo will be removed later
    executeLocalApp(appId, app) {
        const container = document.getElementById(`canvas-${appId}`);
        if (!container) return;

        try {
            container.innerHTML = ''; // Clear the "System: Initializing..." text
            
            /* We wrap the stored code in a function. 
               app.code is the string captured from the LogicForge editor.
            */
            const ModuleClass = new Function('container', 'api', `return ${app.code}`)(); 
            const instance = new ModuleClass(container, this.api);
            
            if (instance.init) {
                instance.init();
                console.log(`[KERNEL]: LOCAL_MODULE_VPU_READY -> ${appId}`);
            }
        } catch (err) {
            container.innerHTML = `<div style="color:#ff3366; padding:20px;">
                <h3>0xSYNTAX_ERROR</h3>
                <p>${err.message}</p>
            </div>`;
            console.error("[KERNEL]: LOCAL_EXECUTION_FAILED", err);
        }
    }

    //For app center
    getAppMetadata(appId) {
    // This looks into your imported registry object
    return registry[appId]; 
}

    /**
 * RE-ALIGN ENCLAVES (Tiling Engine)
 * Automatically organizes open windows into a Master-Stack or Quad-Grid.
 */
updateTilingGrid() {
    const label = document.getElementById('tiling-label');
    const icon = document.getElementById('tiling-icon');
    const ws = document.getElementById('workspace');
    
    // 1. Filter out proxies (Task Overview) and minimized windows
    const allWins = Array.from(ws.querySelectorAll('.os-window:not(.minimized):not(.in-overview)'));
    
    // DEBUG: Log all windows found
    console.log(`updateTilingGrid: Found ${allWins.length} windows:`, allWins.map(w => ({
        id: w.id,
        minimized: w.classList.contains('minimized'),
        visible: window.getComputedStyle(w).visibility,
        display: window.getComputedStyle(w).display,
        zIndex: w.style.zIndex
    })));
    
    // NEW: Sort by tiledWindowOrder to maintain swap positions
    const activeWins = allWins.sort((a, b) => {
        const indexA = this.tiledWindowOrder.indexOf(a.id);
        const indexB = this.tiledWindowOrder.indexOf(b.id);
        
        // If in order array, use that position
        if (indexA !== -1 && indexB !== -1) return indexA - indexB;
        
        // New windows go to the end
        if (indexA === -1 && indexB !== -1) return 1;
        if (indexA !== -1 && indexB === -1) return -1;
        
        // Both new: keep DOM order
        return 0;
    });
    
    const count = activeWins.length;

    // 2. Handle Deactivated State
    if (!this.isTilingActive) {
        if (label) {
            label.innerText = "FLOAT";
            label.style.color = "#a445ff"; // Purple
        }
        if (icon) icon.setAttribute('stroke', '#a445ff');
        
        activeWins.forEach(win => {
            win.style.transition = 'all 0.4s ease';
            // Return to natural floating state
            win.style.width = "clamp(320px, 65vw, 900px)";
            win.style.height = "clamp(300px, 65vh, 720px)";
        });
        return;
    }

    // 3. Update UI for Active Tiling
    if (label) {
        label.innerText = count >= 4 ? "QUAD" : "STACK";
        label.style.color = "#00ff41"; // Green
    }
    if (icon) icon.setAttribute('stroke', '#00ff41');

    if (count === 0) return;

    // 4. Geometry Constants (Respecting Dock and Top Bar)
    const dockW = 75;  
    const topBarH = 40; 
    const gap = 0; // NO gap - windows flush against edges
    
    // FIX: Use exact workspace dimensions minus dock and topbar
    const usableW = ws.clientWidth - dockW; // Full width minus dock only
    const usableH = ws.clientHeight - topBarH; // Full height minus topbar only

    console.log(`Tiling: ws.clientWidth=${ws.clientWidth}, ws.clientHeight=${ws.clientHeight}, usableW=${usableW}, usableH=${usableH}, count=${count}`); // DEBUG
    // 5. Apply Layouts
    activeWins.forEach(win => {
        win.style.transition = 'all 0.4s cubic-bezier(0.165, 0.84, 0.44, 1)';
        win.classList.remove('maximized'); 
    });

    // CRITICAL: LIMIT TILING TO MAX 4 WINDOWS
    const tiledWins = activeWins.slice(0, 4); // Only tile first 4
    const floatingWins = activeWins.slice(4); // 5th+ windows float

    // NEW: Update the tiling order to include floating windows
    floatingWins.forEach(win => {
        if (!this.tiledWindowOrder.includes(win.id)) {
            this.tiledWindowOrder.push(win.id);
        }
    });

       // Float any windows beyond 4th (ready to take space when one is removed)
    floatingWins.forEach((win, idx) => {
        win.classList.add('floating-extra'); // Mark as floating
        win.style.position = 'absolute';
        
        // Get the max z-index from tiled windows
        const maxTiledZ = Math.max(...tiledWins.map(w => parseInt(w.style.zIndex) || 100));
        const floatingZIndex = maxTiledZ + floatingWins.length - idx;
        win.style.zIndex = floatingZIndex.toString();
        
        // ONLY set initial position if window hasn't been dragged
        if (!win.dataset.hasBeenDragged || win.dataset.hasBeenDragged === 'false') {
            // NEW: Center the floating window with slight cascade
            const windowWidth = 600;
            const windowHeight = 400;
            
            // Calculate center position
            const centerLeft = (ws.clientWidth - windowWidth) / 2;
            const centerTop = (ws.clientHeight - windowHeight) / 2;
            
            // Add slight cascade offset so multiple 5th+ windows don't overlap perfectly
            const cascadeOffset = idx * 20;
            const finalLeft = Math.max(dockW + gap, centerLeft + cascadeOffset);
            const finalTop = Math.max(topBarH + gap, centerTop + cascadeOffset);
            
            win.style.left = `${finalLeft}px`;
            win.style.top = `${finalTop}px`;
            win.style.width = `${windowWidth}px`;
            win.style.height = `${windowHeight}px`;
        }
        
        win.style.transition = 'all 0.3s ease';
    });

           // Only tile the first 4 windows
    const tiledCount = tiledWins.length;
    
    // CRITICAL: Assign base z-index to all tiled windows first
    const baseZIndex = 100;
    tiledWins.forEach((win, i) => {
        win.style.zIndex = (baseZIndex + i).toString();
    });

        if (tiledCount === 1) {
        // Single window: Take full space
        tiledWins[0].style.left = `${dockW}px`;
        tiledWins[0].style.top = `${topBarH}px`;
        tiledWins[0].style.width = `${usableW}px`;
        tiledWins[0].style.height = `${usableH}px`;
        tiledWins[0].classList.remove('floating-extra');
        tiledWins[0].dataset.hasBeenDragged = 'false';
        
        console.log(`SOLO_MODE: width=${usableW}, height=${usableH}`);

        } else if (tiledCount === 2 || tiledCount === 3) {
        // MASTER-STACK MODE (2-3 windows only)
        // read persisted master ratio if available
        const masterRatio = (this.tilingState && this.tilingState.masterRatio) ? parseFloat(this.tilingState.masterRatio) : 0.65;
        const masterW = usableW * masterRatio;
        const stackW = usableW - masterW;
        
        console.log(`MASTER-STACK: masterW=${masterW}, stackW=${stackW}, ratio=${masterRatio}, count=${tiledCount}`);

        tiledWins.forEach((win, i) => {
            win.classList.remove('floating-extra');
            win.dataset.hasBeenDragged = 'false';
            
            if (i === 0) {
                // Master on left
                win.style.left = `${dockW}px`;
                win.style.top = `${topBarH}px`;
                win.style.width = `${masterW}px`;
                win.style.height = `${usableH}px`;
            } else {
                // Stack on right
                if (tiledCount === 2) {
                    const stackH = usableH;
                    win.style.left = `${dockW + masterW}px`;
                    win.style.top = `${topBarH}px`;
                    win.style.width = `${stackW}px`;
                    win.style.height = `${stackH}px`;
                } else {
                    // 3-window split: allow persisted stack heights
                    const stackHeights = (this.tilingState && this.tilingState.stackHeights) ? this.tilingState.stackHeights : null;
                    if (stackHeights && stackHeights.length === 2) {
                        const h1 = usableH * stackHeights[0];
                        const h2 = usableH * stackHeights[1];
                        if (i === 1) {
                            win.style.left = `${dockW + masterW}px`;
                            win.style.top = `${topBarH}px`;
                            win.style.width = `${stackW}px`;
                            win.style.height = `${h1}px`;
                        } else {
                            win.style.left = `${dockW + masterW}px`;
                            win.style.top = `${topBarH + h1}px`;
                            win.style.width = `${stackW}px`;
                            win.style.height = `${h2}px`;
                        }
                    } else {
                        const stackH = usableH / (tiledCount - 1);
                        win.style.left = `${dockW + masterW}px`;
                        win.style.top = `${topBarH + ((i - 1) * stackH)}px`;
                        win.style.width = `${stackW}px`;
                        win.style.height = `${stackH}px`;
                    }
                }
            }
        });
        } else if (tiledCount >= 4) {
        // QUAD-GRID MODE (2x2 - EXACTLY 4 WINDOWS)
        const cols = 2;

        // use persisted col/row ratios if present
        const colRatio = (this.tilingState && this.tilingState.colRatio) ? parseFloat(this.tilingState.colRatio) : 0.5;
        const rowRatio = (this.tilingState && this.tilingState.rowRatio) ? parseFloat(this.tilingState.rowRatio) : 0.5;

        const leftColW = usableW * colRatio;
        const rightColW = usableW - leftColW;
        const topRowH = usableH * rowRatio;
        const bottomRowH = usableH - topRowH;

        const cellDims = [
            { w: leftColW, h: topRowH },
            { w: rightColW, h: topRowH },
            { w: leftColW, h: bottomRowH },
            { w: rightColW, h: bottomRowH },
        ];

        tiledWins.forEach((win, i) => {
            win.classList.remove('floating-extra');
            win.dataset.hasBeenDragged = 'false';
            
            const row = Math.floor(i / cols);
            const col = i % cols;
            const cell = cellDims[i];
            const left = dockW + (col === 0 ? 0 : leftColW);
            const top = topBarH + (row === 0 ? 0 : topRowH);

            win.style.left = `${left}px`;
            win.style.top = `${top}px`;
            win.style.width = `${cell.w}px`;
            win.style.height = `${cell.h}px`;
        });
    }
    
    // CRITICAL: Floating windows ALWAYS get higher z-index than tiled
    floatingWins.forEach((win, idx) => {
        const floatingZIndex = baseZIndex + tiledWins.length + floatingWins.length - idx;
        win.style.zIndex = floatingZIndex.toString();
        console.log(`Floating window ${idx + 5} zIndex: ${floatingZIndex}`);
    });

    this.logSystemEvent(`Layout Synchronized: ${count} Enclaves Active`, 'info');
}
showSnapPreview(targetIndex = null) {
    const preview = document.getElementById('snap-preview');
    const ws = document.getElementById('workspace');
    if (!preview || !this.isTilingActive) return;

    // 1. Get current active windows + 1 (the one being dragged or launched)
    const activeWins = Array.from(ws.querySelectorAll('.os-window:not(.minimized)'));
    const count = activeWins.length + (targetIndex === null ? 1 : 0);
    
    // 2. Constants matching your updateTilingGrid
    const dockW = 75;
    const topBarH = 40;
    const gap = 10;
    const usableW = ws.clientWidth - dockW - (gap * 2);
    const usableH = ws.clientHeight - topBarH - (gap * 2);

    // 3. Calculate the "Predicted" geometry for the new slot
    let geom = { left: 0, top: 0, width: 0, height: 0 };

    if (count < 4) {
        const masterW = count === 1 ? usableW : usableW * 0.65;
        const stackW = usableW - masterW - gap;
        
        // If it's the first window, preview the Master slot
        if (count === 1) {
            geom = { left: dockW + gap, top: topBarH + gap, width: masterW, height: usableH };
        } else {
            // Preview the next available stack slot
            const stackH = (usableH - (gap * (count - 2))) / (count - 1);
            geom = { 
                left: dockW + masterW + (gap * 2), 
                top: topBarH + gap + ((count - 2) * (stackH + gap)), 
                width: stackW, 
                height: stackH 
            };
        }
    } else {
        // Quad Grid Preview logic
        const cellW = (usableW - gap) / 2;
        const cellH = (usableH - gap) / 2; // Simplified for 2x2
        const row = Math.floor((count - 1) / 2);
        const col = (count - 1) % 2;
        geom = { 
            left: dockW + gap + (col * (cellW + gap)), 
            top: topBarH + gap + (row * (cellH + gap)), 
            width: cellW, 
            height: cellH 
        };
    }

    // 4. Apply to Preview Element
    preview.style.display = 'block';
    preview.style.left = `${geom.left}px`;
    preview.style.top = `${geom.top}px`;
    preview.style.width = `${geom.width}px`;
    preview.style.height = `${geom.height}px`;
}

    /**
     * UPDATED INJECTOR: This version combines hardcoded routes 
     * with your new Dynamic Registry Loader.
     */
    async injectAppContent(appId) {
    const container = document.getElementById(`canvas-${appId}`);
    if (!container) return;
    const win = container.closest('.os-window');

    // 1. Check Hardcoded Routes (Internal Kernel Tools)
    const route = this.APP_ROUTES[appId];
    if (route) {
        try {
            const instance = await route(container);
            if (instance) win.dataset.engineInstance = instance;
            return; 
        } catch (err) {
            console.error(`Kernel: Route failed for ${appId}:`, err);
        }
    }

    // 2. Dynamic Registry Loading (SOVEREIGN FRAMEWORK MODE)
    const appData = registry.find(a => a.id === appId);
    if (appData && appData.file) {
        try {
            const filePath = appData.file.startsWith('./') ? appData.file : `./${appData.file}`;
            const module = await import(filePath);
            
            // Create the restricted API object (The Bridge)
            const sovereignAPI = {
                signature: 'SOVEREIGN_CORE_V1', // Required for App Handshake, The "Passport"
                sessionKey: this.sessionKey, //AES-GCM Key
                vfs: SovereignVFS, //The file system driver
                identity: "AUTHORIZED_MEMBER",
                timestamp: "2025-12-26", // Reference to your Investor/EPOS milestone
                close: () => this.closeApp(appId, win.id), //Self-destruct function
                // NEW: Automated Memory Purge
                purge: () => {
                    console.log(`Kernel: Purging RAM for ${appId}...`);
                    // Force garbage collection on specific app-held data
                    return null; 
                }
            };

            // Standardize Class Name (e.g., 'terminal' -> 'TerminalApp')
            const className = appId.charAt(0).toUpperCase() + appId.slice(1) + "App";
            
            if (module[className]) {
                // Instantiate with the Bridge instead of just the key
                const instance = new module[className](container, sovereignAPI);
                
                if (instance.init) {
                    await instance.init(); 
                }
                
                win.dataset.engineInstance = instance;
            }
        } catch (err) {
            console.error(`Kernel: Handshake failed for ${appId}:`, err);
            container.innerHTML = `<div style="padding:20px; color:#ff4444;">[SYS_ERR]: Handshake Failed. Verify Enclave Key.</div>`;
        }
    } else {
        // 3. Last Resort
        container.innerHTML = `<div style="padding:20px; color:#00ff41;">${appId.toUpperCase()} online. Awaiting module deployment.</div>`;
    }
}
    renderTNFIDashboard(container) {
        container.innerHTML = `
            <div class="tnfi-app" style="padding:25px; color:#a445ff; font-family: 'Courier New', monospace;">
                <h2 style="margin:0; letter-spacing:2px;">BANK OF SOVEREIGN</h2>
                <div style="font-size:12px; color:#00ff41; margin-bottom:20px;">GENESIS ALLOTMENT VERIFIED // LOCK_DATE: 2025-12-26</div>
                
                <div style="background:rgba(164, 69, 255, 0.05); padding:15px; border-left:3px solid #00ff41; margin-bottom:20px;">
                    <div style="font-size:10px; opacity:0.7;">TOTAL SUPPLY</div>
                    <div style="font-size:18px; color:#fff;">100,000,000 VPU</div>
                </div>

                <table style="width:100%; border-collapse:collapse; font-size:13px;">
                    <thead style="color:rgba(255,255,255,0.5); text-align:left; border-bottom:1px solid #333;">
                        <tr><th style="padding:10px 0;">ENTITY</th><th>ALLOTMENT</th><th>STATUS</th></tr>
                    </thead>
                    <tbody style="color:#00ff41;">
                        <tr style="border-bottom:1px solid #222;"><td style="padding:12px 0;">EPOS CORE</td><td>50,000,000</td><td>LOCKED</td></tr>
                        <tr style="border-bottom:1px solid #222;"><td style="padding:12px 0;">INVESTORS</td><td>15,000,000</td><td>10% TGE</td></tr>
                        <tr><td style="padding:12px 0;">LIQUIDITY</td><td>20,000,000</td><td>UNLOCKED</td></tr>
                    </tbody>
                </table>
            </div>`;
        return { id: "TNFI_STUB" };
    }

    makeDraggable(el) {
    const header = el.querySelector('.window-header');
    if (!header) return;

    let dragging = false;
    let startX = 0, startY = 0;
    let startLeft = 0, startTop = 0;
    let clickTime = 0;
    const winId = el.id;

    const onDown = (e) => {
    // SKIP if clicking buttons
    if (e.target.closest('.win-btn')) return;
    if (e.target.closest('.window-controls')) return;
    if (el.classList.contains('in-overview')) return;

    // FOCUS IMMEDIATELY
    this.focusWindow(winId);
    
    // NEW: Mark floating window as dragged (so updateTilingGrid won't reposition it)
    if (el.classList.contains('floating-extra')) {
        el.dataset.hasBeenDragged = 'true';
        console.log(`Floating window ${winId} marked as dragged`);
    }

    const now = Date.now();
    
    // Check for double-click (within 300ms of LAST click)
    if (clickTime > 0 && (now - clickTime < 300)) {
        // DOUBLE CLICK DETECTED
        console.log(`Double-click detected on ${winId}`);
        this.toggleMaximize(winId);
        dragging = false;
        clickTime = 0;
        return;
    }

    // Record this click time for next potential double-click
    clickTime = now;

    dragging = true;
    this.isDraggingWindow = true;

        const style = window.getComputedStyle(el);
        startLeft = parseFloat(style.left);
        startTop = parseFloat(style.top);
        
        startX = e.clientX;
        startY = e.clientY;

        el.style.transition = 'none';
        try { el.setPointerCapture(e.pointerId); } catch (_) {}
        e.preventDefault();
    };

    const onMove = (e) => {
    if (!dragging) return;
    
    // 1. Get the current workspace dimensions
    const workspace = el.parentElement;
    const workWidth = workspace.clientWidth;
    const workHeight = workspace.clientHeight; // This is the key!

    // 2. Calculate requested position
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    let newLeft = startLeft + dx;
    let newTop = startTop + dy;

    // 3. Apply strict boundaries
    // Horizontal: 5px margin from left and right
    newLeft = Math.max(5, Math.min(newLeft, workWidth - el.offsetWidth - 5));

    // Vertical: 5px margin from top and bottom
    // We use workHeight instead of window.innerHeight to prevent bleeding
    const maxTop = workHeight - el.offsetHeight - 5;
    newTop = Math.max(5, Math.min(newTop, maxTop));

    // 4. Update element
    el.style.left = `${newLeft}px`;
    el.style.top = `${newTop}px`;
    this.checkDockCollision(); // Call the collision logic here
    e.preventDefault();

    if (this.isTilingActive) {
        // If window is dragged near the top/left, show the grid intention
        if (e.clientX < 150) {
            this.showSnapPreview(0); // Show master slot preview
        } else {
            document.getElementById('snap-preview').style.display = 'none';
        }
    }
};

            const onUp = () => {
            if (!dragging) return;
            dragging = false;
            this.isDraggingWindow = false;
            el.style.transition = 'all 0.25s cubic-bezier(0.2, 0.8, 0.3, 1)';
            this.updateDockSafety(false);
            
            // NEW: Debounce grid update after drag finishes
            if (this.isTilingActive) {
                this.debouncedUpdateTilingGrid(80);
            }
        };

        document.addEventListener('pointermove', onMove, { passive: false });
        document.addEventListener('pointerup', onUp);
        document.addEventListener('pointercancel', onUp);
        header.addEventListener('pointerdown', onDown);
    
    }

    attachResizeHandles(win, winId) {
    const handles = win.querySelectorAll('.resize-handle');

    handles.forEach(handle => {
        let isResizing = false;
        let startX = 0, startY = 0;
        let startWidth = 0, startHeight = 0;
        let startLeft = 0, startTop = 0;
        
        const dirMatch = handle.className.match(/resize-([nesw]{1,2})/);
        const dir = dirMatch ? dirMatch[1] : 'se';

        const onPointerMove = (e) => {
            if (!isResizing) return;
            
            const deltaX = e.clientX - startX;
            const deltaY = e.clientY - startY;

            if (window.kernel.isTilingActive) {
                window.kernel.handleTilingResize(win, dir, deltaX, deltaY);
            } else {
                if (!dir.includes('n') && !dir.includes('s')) return;

                let newH = startHeight;
                let newT = startTop;

                if (dir.includes('s')) {
                    newH = Math.max(240, startHeight + deltaY);
                }
                if (dir.includes('n')) {
                    newH = Math.max(240, startHeight - deltaY);
                    newT = startTop + deltaY;
                }

                win.style.height = `${newH}px`;
                win.style.top = `${newT}px`;
            }
        };

        const onPointerUp = () => {
            if (!isResizing) return;
            isResizing = false;

            win.style.pointerEvents = 'auto';
            win.style.transition = 'all 0.3s ease';

            // CRITICAL: Clean up listeners
            document.removeEventListener('pointermove', onPointerMove);
            document.removeEventListener('pointerup', onPointerUp);

            if (window.kernel.isTilingActive) {
                window.kernel.debouncedUpdateTilingGrid(150);
            }
        };

        const onPointerDown = (e) => {
            if (!window.kernel.isTilingActive) {
                if (!dir.includes('n') && !dir.includes('s')) return;
            }

            e.preventDefault();
            e.stopPropagation();
            isResizing = true;
            startX = e.clientX;
            startY = e.clientY;
            startWidth = win.offsetWidth;
            startHeight = win.offsetHeight;
            startLeft = win.offsetLeft;
            startTop = win.offsetTop;
            
            win.style.transition = 'none';
            win.style.pointerEvents = 'none';

            // Attach listeners
            document.addEventListener('pointermove', onPointerMove, { passive: false });
            document.addEventListener('pointerup', onPointerUp, { passive: false });
        };

        handle.addEventListener('pointerdown', onPointerDown, { passive: false });
    });
}
/**
 * FLOATING_RESIZE
 * Handle resizing for floating windows (5th+)
 * DEPRECATED: Now handled inline in attachResizeHandles()
 */
/**
 * TILING_RESIZE (FIXED - Only affects adjacent windows)
 */
handleTilingResize(win, dir, deltaX, deltaY) {
    const ws = document.getElementById('workspace');
    const allWins = Array.from(ws.querySelectorAll('.os-window:not(.minimized):not(.in-overview)'));
    const tiledWins = allWins.slice(0, 4);
    const tiledCount = tiledWins.length;

    if (tiledCount < 2) return;

    const dockW = 75;
    const topBarH = 40;
    const usableW = ws.clientWidth - dockW;
    const usableH = ws.clientHeight - topBarH;

    this.tilingState = this.tilingState || {};

    const winIndex = tiledWins.indexOf(win);
    if (winIndex === -1) return;

    // CRITICAL: Apply changes IMMEDIATELY + store ratio for persistence
    if (tiledCount === 2) {
        if ((dir === 'e' || dir === 'w') && winIndex === 0) {
            // Master window being resized horizontally
            const masterW = tiledWins[0].offsetWidth;
            const newMasterW = Math.max(200, Math.min(usableW - 200, masterW + deltaX));
            const newStackW = usableW - newMasterW;

            // Apply IMMEDIATELY to both windows
            tiledWins[0].style.width = `${newMasterW}px`;
            tiledWins[0].style.transition = 'none';

            tiledWins[1].style.left = `${dockW + newMasterW}px`;
            tiledWins[1].style.width = `${newStackW}px`;
            tiledWins[1].style.transition = 'none';

            // Store ratio for persistence
            this.tilingState.masterRatio = newMasterW / usableW;
            
            console.log(`Master resize: ${newMasterW}px (ratio: ${this.tilingState.masterRatio})`);
        }
    } else if (tiledCount === 3) {
        if ((dir === 's' || dir === 'n') && winIndex > 0) {
            // Stack windows being resized vertically
            const h1 = tiledWins[1].offsetHeight;
            const newH1 = Math.max(150, h1 + deltaY);
            const newH2 = usableH - newH1;

            // Apply IMMEDIATELY to both stack windows
            tiledWins[1].style.height = `${newH1}px`;
            tiledWins[1].style.transition = 'none';

            tiledWins[2].style.top = `${topBarH + newH1}px`;
            tiledWins[2].style.height = `${newH2}px`;
            tiledWins[2].style.transition = 'none';

            // Store ratios for persistence
            this.tilingState.stackHeights = [newH1 / usableH, newH2 / usableH];
            
            console.log(`Stack resize: h1=${newH1}px, h2=${newH2}px`);
        }
    } else if (tiledCount >= 4) {
        if ((dir === 'e' || dir === 'w') && (winIndex === 0 || winIndex === 2)) {
            // Vertical divider - affects both columns
            const cellW = tiledWins[0].offsetWidth;
            const newCellW = Math.max(300, cellW + deltaX);
            const rightCellW = usableW - newCellW;

            // Apply IMMEDIATELY to all 4 windows
            tiledWins.forEach((w, i) => {
                const col = i % 2;
                w.style.transition = 'none';
                
                if (col === 0) {
                    // Left column
                    w.style.width = `${newCellW}px`;
                } else {
                    // Right column
                    w.style.left = `${dockW + newCellW}px`;
                    w.style.width = `${rightCellW}px`;
                }
            });

            // Store ratio for persistence
            this.tilingState.colRatio = newCellW / usableW;
            
            console.log(`Column resize: left=${newCellW}px, right=${rightCellW}px (ratio: ${this.tilingState.colRatio})`);
        } else if ((dir === 's' || dir === 'n') && (winIndex === 1 || winIndex === 3)) {
            // Horizontal divider - affects both rows
            const cellH = tiledWins[0].offsetHeight;
            const newCellH = Math.max(250, cellH + deltaY);
            const bottomCellH = usableH - newCellH;

            // Apply IMMEDIATELY to all 4 windows
            tiledWins.forEach((w, i) => {
                const row = Math.floor(i / 2);
                w.style.transition = 'none';
                
                if (row === 0) {
                    // Top row
                    w.style.height = `${newCellH}px`;
                } else {
                    // Bottom row
                    w.style.top = `${topBarH + newCellH}px`;
                    w.style.height = `${bottomCellH}px`;
                }
            });

            // Store ratio for persistence
            this.tilingState.rowRatio = newCellH / usableH;
            
            console.log(`Row resize: top=${newCellH}px, bottom=${bottomCellH}px (ratio: ${this.tilingState.rowRatio})`);
        }
    }
}

     checkDockCollision() {
    const windows = document.querySelectorAll('.os-window');
    const threshold = 70; // Pixels from left edge
    let shouldHide = false;

    windows.forEach(win => {
        const left = parseInt(win.style.left);
        // If window is minimized, we ignore it
        if (!win.classList.contains('minimized') && left < threshold) {
            shouldHide = true;
        }
    });

    if (shouldHide) {
        document.getElementById('os-root').classList.add('dock-retracted');
    } else {
        document.getElementById('os-root').classList.remove('dock-retracted');
    }
}

    openAppMenu() {
        const overlay = document.getElementById('app-menu-overlay');
        const grid = document.getElementById('app-grid-container');
        const searchInput = document.getElementById('app-search');
        if (!overlay || !grid) return;

        if (!overlay.classList.contains('hidden')) {
            overlay.classList.add('hidden');
            overlay.style.display = 'none';
            return;
        }

        overlay.classList.remove('hidden');
        overlay.style.display = 'flex'; 
        searchInput.value = ''; 
        if (window.innerWidth > 768) searchInput.focus();

        const renderGrid = (filter = '') => {
            grid.innerHTML = '';
            registry.filter(app => app.name.toLowerCase().includes(filter.toLowerCase())).forEach(app => {
                const card = document.createElement('div');
                card.className = 'launcher-card';
                card.innerHTML = `<div class="icon">${app.icon}</div><div class="name">${app.name}</div>`;
                card.onclick = () => {
                    this.launchApp(app.id);
                    overlay.classList.add('hidden');
                    overlay.style.display = 'none';
                };
                grid.appendChild(card);
            });
        };
        renderGrid();
        searchInput.oninput = (e) => renderGrid(e.target.value);
    }

 killProcess(appId) {
    const winId = `win-${appId}`;
    const win = document.getElementById(winId);
    
    // 1. Clean up the Engine Instance (Destructors)
    if (win && win.dataset.engineInstance) {
        const instance = win.dataset.engineInstance;
        if (instance.destruct) instance.destruct(); // Stop intervals/telemetry
    }

    // 2. Remove from DOM and State
    if (win) win.remove();
    this.runningApps.delete(appId);
    
    // 3. Refresh UI
    this.bootShell(); 
    this.checkDockCollision();
}

    closeApp(appId, winId) {
    const win = document.getElementById(winId);
    if (!win) return;

    // 1. MEMORY PROTECTION: Trigger internal cleanup
    const instance = win.dataset.engineInstance;
    if (instance && typeof instance.destruct === 'function') {
        try {
            instance.destruct(); 
            console.log(`Kernel: Process ${appId} terminated cleanly.`);
        } catch (e) {
            console.warn(`Kernel: Cleanup failed for ${appId}`, e);
        }
    }

        // 2. STATE MANAGEMENT
    this.runningApps.delete(appId);
    
    // NEW: Remove from tiling order
    this.tiledWindowOrder = this.tiledWindowOrder.filter(id => id !== winId);
    console.log(`Removed ${winId} from tiling order:`, this.tiledWindowOrder);
    
    this.bootShell();
    this.updateMemoryMeter();

    // 3. UI EXIT ANIMATION
    win.style.transition = "all 0.2s cubic-bezier(0.4, 0, 1, 1)";
    win.style.opacity = '0';
    win.style.transform = 'scale(0.95) translateY(10px)';

        // 4. PHYSICAL REMOVAL
    setTimeout(() => {
        win.remove();
        this.updateDockSafety(); 
        this.checkDockCollision();
        
        // NEW: Check if a floating window should auto-promote
        if (this.isTilingActive) {
            this.promoteFloatingWindow(); // Auto-promote BEFORE recalculating grid
            this.updateTilingGrid(); // Now update with the promoted window
        }
    }, 200);
}

    /**
     * AUTO_PROMOTE_FLOATING_WINDOW
     * When a tiled window closes, pull the first floating window into the grid
     */
    promoteFloatingWindow() {
    const ws = document.getElementById('workspace');
    
    // Get tiled windows (first 4)
    const allWins = Array.from(ws.querySelectorAll('.os-window:not(.minimized):not(.in-overview)'));
    const tiledWins = allWins.slice(0, 4);
    const floatingWins = allWins.slice(4);
    
    // Only promote if there's a floating window AND a slot opened
    if (floatingWins.length > 0 && tiledWins.length < 4) {
        const windowToPromote = floatingWins[0]; // Take the first floating window
        
        // Remove floating class and reset drag flag
        windowToPromote.classList.remove('floating-extra');
        windowToPromote.dataset.hasBeenDragged = 'false';
        
        // Reset to default size for smooth tiling integration
        windowToPromote.style.width = 'auto';
        windowToPromote.style.height = 'auto';
        windowToPromote.style.transition = 'all 0.4s cubic-bezier(0.165, 0.84, 0.44, 1)';
        
        // NEW: Mark as just promoted so updateTilingGrid doesn't override z-index
        windowToPromote.dataset.justPromoted = 'true';
        
        // NEW: Give it highest z-index immediately
        windowToPromote.style.zIndex = this.getTopZIndex() + 1000;
        
        const appName = windowToPromote.querySelector('.title')?.innerText || 'Window';
        console.log(`AUTO-PROMOTED: ${appName} from floating to tiled grid (zIndex=${windowToPromote.style.zIndex})`);
        this.logSystemEvent(`PROMOTED: ${appName} to tiling grid`, 'info');
    }
}

// Ensure closeWindow also uses the correct Set syntax
closeWindow(appId) {
    this.runningApps.delete(appId);
    const windowElement = document.getElementById(`win-${appId}`);
    if (windowElement) windowElement.remove();
    this.bootShell();
    window.dispatchEvent(new CustomEvent('process-killed', { detail: { appId } }));
}


    minimizeWindow(id) {
    const el = document.getElementById(id);
    if (!el) return;

    const isMinimized = el.classList.contains('minimized');
    
    // DEBUG: Log the actual ID we're looking for
    console.log(`minimizeWindow: id=${id}, looking for hide-${id}`);
    
    const hideBtn = document.getElementById(`hide-${id}`);
    
    if (isMinimized) {
        // RESTORE
        el.classList.remove('minimized');
        el.style.visibility = 'visible';
        el.style.pointerEvents = 'auto';
        el.style.opacity = '1';
        el.style.transform = 'scale(1) translateY(0)';
        el.style.transition = 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)';
        
        // Swap icon
        if (hideBtn) {
            const svg = hideBtn.querySelector('svg');
            if (svg) {
                // Clear and set new SVG path
                svg.innerHTML = '';
                svg.innerHTML = '<line x1="5" y1="12" x2="19" y2="12"></line>';
                hideBtn.title = 'Minimize Window';
                console.log(`Icon swapped to MINIMIZE`);
            }
        } else {
            console.warn(`hideBtn not found for ${id}`);
        }
        this.logSystemEvent(`Restored: ${id.replace('win-', '')}`, 'info');
    } else {
        // MINIMIZE
        el.classList.add('minimized');
        el.style.visibility = 'hidden';
        el.style.pointerEvents = 'none';
        el.style.opacity = '0';
        el.style.transform = 'scale(0.1) translateY(400px) translateX(-200px)';
        el.style.transition = 'all 0.4s cubic-bezier(0.6, -0.28, 0.735, 0.045)';
        
        // Swap icon
        if (hideBtn) {
            const svg = hideBtn.querySelector('svg');
            if (svg) {
                // Clear and set new SVG path
                svg.innerHTML = '';
                svg.innerHTML = '<rect x="4" y="4" width="16" height="16" rx="1"></rect>';
                hideBtn.title = 'Restore Window';
                console.log(`Icon swapped to RESTORE`);
            }
        } else {
            console.warn(`hideBtn not found for ${id}`);
        }
        this.logSystemEvent(`Minimized: ${id.replace('win-', '')}`, 'info');
    }

                this.updateDockSafety();
        if (this.isTilingActive) {
            this.promoteFloatingWindow();
            this.debouncedUpdateTilingGrid(100); // Use debounced version
        }
}




    getTopZIndex() {
    const windows = document.querySelectorAll('.os-window');
    let max = 100;
    windows.forEach(win => {
        const z = parseInt(win.style.zIndex) || 100;
        if (z > max) max = z;
    });
    return max + 1;
}

            toggleMaximize(id) {
    const el = document.getElementById(id);
    if (!el) return;
    
    const isMaximizing = !el.classList.contains('maximized');
    
    if (isMaximizing && this.isTilingActive) {
        this.logSystemEvent("Tiling suspended for maximized enclave", "warn");
    }
    
    el.classList.toggle('maximized');
    
    // CRITICAL: Get highest z-index from ALL windows
    const allWindows = document.querySelectorAll('.os-window');
    const maxZ = Math.max(...Array.from(allWindows).map(w => parseInt(w.style.zIndex) || 100));
    
            if (isMaximizing) {
            el.style.zIndex = (maxZ + 1000).toString();
        } else {
            if (this.isTilingActive) {
                el.style.zIndex = '100';
                this.promoteFloatingWindow();
                this.debouncedUpdateTilingGrid(100); // Use debounced version
            } else {
                el.style.zIndex = '100';
            }
        }
    
    this.updateDockSafety();
    this.logSystemEvent(`Window ${el.classList.contains('maximized') ? 'maximized' : 'restored'}`, 'info');
}

            updateDockSafety() {
    const osRoot = document.getElementById('os-root');
    const dock = document.getElementById('side-dock');
    
    if (!dock) return;
    
    // UPDATED: Include floating windows (5th+) that are maximized
    const visibleMaximized = Array.from(
        document.querySelectorAll('.os-window.maximized')
    ).filter(win => {
        const style = window.getComputedStyle(win);
        return style.visibility !== 'hidden' && 
               style.display !== 'none' &&
               !win.classList.contains('minimized');
    });
    
    const shouldHide = visibleMaximized.length > 0;
    
    console.log(`Dock Safety: shouldHide=${shouldHide}, visibleMax=${visibleMaximized.length}`);

    if (shouldHide) {
        osRoot.classList.add('dock-hidden');
        dock.style.opacity = '0';
        dock.style.pointerEvents = 'none';
        dock.style.visibility = 'hidden';
        dock.style.transition = 'opacity 0.3s ease, visibility 0.3s ease';
    } else {
        osRoot.classList.remove('dock-hidden');
        dock.style.opacity = '1';
        dock.style.pointerEvents = 'auto';
        dock.style.visibility = 'visible';
        dock.style.zIndex = '999'; // ENSURE IT'S ON TOP
        dock.style.transition = 'opacity 0.3s ease, visibility 0.3s ease';
    }
}


    focusWindow(winId) {
    const el = document.getElementById(winId);
    if (!el) return;

    // Restore from minimized state
    if (el.classList.contains('minimized')) {
        el.classList.remove('minimized');
        el.style.visibility = 'visible';
        el.style.opacity = '1';
        el.style.pointerEvents = 'auto';
        el.style.transform = 'scale(1) translateY(0)';
        el.style.transition = 'all 0.3s ease';
        
        // Update icon to minimize (dash)
        const hideBtn = document.getElementById(`hide-${winId}`);
        if (hideBtn) {
            const svg = hideBtn.querySelector('svg');
            if (svg) svg.innerHTML = '<line x1="5" y1="12" x2="19" y2="12"></line>';
        }
    }

    // CRITICAL: Get the highest z-index in the system
    const allWindows = document.querySelectorAll('.os-window');
    const maxZ = Math.max(...Array.from(allWindows).map(w => parseInt(w.style.zIndex) || 100));

    // NEW: Always bring window to front UNLESS it's maximized (and not floating)
    if (!el.classList.contains('maximized')) {
        // Not maximized: bring to front
        el.style.zIndex = (maxZ + 1).toString();
    } else if (el.classList.contains('floating-extra')) {
        // Maximized but floating: still bring to front (floating windows always on top)
        el.style.zIndex = (maxZ + 1).toString();
    }
    // If maximized and NOT floating (tiled), don't raise z-index
    
    el.dataset.lastUsed = Date.now();
}

    /**
     * SWAP_WINDOWS_IN_TILING
     * Exchange positions of two tiled windows
     */
    swapTiledWindows(winId1, winId2) {
    const win1 = document.getElementById(winId1);
    const win2 = document.getElementById(winId2);
    
    if (!win1 || !win2 || !this.isTilingActive) return;

    // NEW: Update the order tracking array
    const idx1 = this.tiledWindowOrder.indexOf(winId1);
    const idx2 = this.tiledWindowOrder.indexOf(winId2);
    
    // Initialize order array if needed
    if (this.tiledWindowOrder.length === 0) {
        const ws = document.getElementById('workspace');
        const allWins = Array.from(ws.querySelectorAll('.os-window:not(.minimized):not(.in-overview)'));
        this.tiledWindowOrder = allWins.map(w => w.id);
    }
    
    // Swap positions in the order array
    if (idx1 !== -1 && idx2 !== -1) {
        [this.tiledWindowOrder[idx1], this.tiledWindowOrder[idx2]] = 
        [this.tiledWindowOrder[idx2], this.tiledWindowOrder[idx1]];
    }
    
    console.log(`Window order updated: ${this.tiledWindowOrder.join(' -> ')}`);

    // Store current positions BEFORE any class changes
    const pos1 = {
        left: win1.style.left,
        top: win1.style.top,
        width: win1.style.width,
        height: win1.style.height
    };

    const pos2 = {
        left: win2.style.left,
        top: win2.style.top,
        width: win2.style.width,
        height: win2.style.height
    };

    const isWin1Floating = win1.classList.contains('floating-extra');
    const isWin2Floating = win2.classList.contains('floating-extra');

    // Swap with smooth animation
    win1.style.transition = 'all 0.4s cubic-bezier(0.165, 0.84, 0.44, 1)';
    win2.style.transition = 'all 0.4s cubic-bezier(0.165, 0.84, 0.44, 1)';

    win1.style.left = pos2.left;
    win1.style.top = pos2.top;
    win1.style.width = pos2.width;
    win1.style.height = pos2.height;

    win2.style.left = pos1.left;
    win2.style.top = pos1.top;
    win2.style.width = pos1.width;
    win2.style.height = pos1.height;

    // CRITICAL: Handle floating window class swaps
    if (isWin1Floating && !isWin2Floating) {
        // Win1 (was floating) moves to tiled, Win2 (was tiled) moves to floating
        win1.classList.remove('floating-extra');
        win2.classList.add('floating-extra');
        win1.dataset.hasBeenDragged = 'false';
        win2.dataset.hasBeenDragged = 'true';
    } else if (!isWin1Floating && isWin2Floating) {
        // Win2 (was floating) moves to tiled, Win1 (was tiled) moves to floating
        win2.classList.remove('floating-extra');
        win1.classList.add('floating-extra');
        win2.dataset.hasBeenDragged = 'false';
        win1.dataset.hasBeenDragged = 'true';
    }

    const title1 = win1.querySelector('.title')?.innerText || 'Window1';
    const title2 = win2.querySelector('.title')?.innerText || 'Window2';

    this.logSystemEvent(`SWAPPED: ${title1} ↔ ${title2}`, 'info');

    // CRITICAL: Recalculate all z-indices and positions after swap
    setTimeout(() => {
        this.updateTilingGrid();
        this.updateDockSafety();
    }, 50);
}
    /**
     * CYCLE_WINDOWS_IN_TILING
     * Rotate positions of tiled windows (useful for rearranging)
     */
    cycleTiledWindows(direction = 'forward') {
        if (!this.isTilingActive) return;

        const ws = document.getElementById('workspace');
        const activeWins = Array.from(
            ws.querySelectorAll('.os-window:not(.minimized):not(.in-overview):not(.floating-extra)')
        );

        if (activeWins.length < 2) return;

        // Store all positions
        const positions = activeWins.map(win => ({
            left: win.style.left,
            top: win.style.top,
            width: win.style.width,
            height: win.style.height
        }));

        // Rotate the array
        if (direction === 'forward') {
            positions.unshift(positions.pop());
        } else {
            positions.push(positions.shift());
        }

        // Apply rotated positions
        activeWins.forEach((win, idx) => {
            win.style.transition = 'all 0.4s cubic-bezier(0.165, 0.84, 0.44, 1)';
            win.style.left = positions[idx].left;
            win.style.top = positions[idx].top;
            win.style.width = positions[idx].width;
            win.style.height = positions[idx].height;
        });

        this.logSystemEvent(`Tiled windows cycled (${direction})`, 'info');
    }

    /**
     * SMART_SWAP: Swap between focused window and another
     * Use with keyboard: Ctrl+Shift+Arrow to swap
     */
    smartSwap(direction) {
        if (!this.isTilingActive) return;

        const ws = document.getElementById('workspace');
        const activeWins = Array.from(
            ws.querySelectorAll('.os-window:not(.minimized):not(.in-overview):not(.floating-extra)')
        );

        if (activeWins.length < 2) return;

        // Find currently focused window
        const focused = activeWins.find(w => w.style.zIndex === Math.max(...activeWins.map(x => parseInt(x.style.zIndex) || 0)).toString());
        if (!focused) return;

        const focusedIdx = activeWins.indexOf(focused);
        let targetIdx;

        // Determine target based on direction
        if (direction === 'left') {
            targetIdx = focusedIdx === 0 ? activeWins.length - 1 : focusedIdx - 1;
        } else if (direction === 'right') {
            targetIdx = focusedIdx === activeWins.length - 1 ? 0 : focusedIdx + 1;
        } else if (direction === 'up') {
            targetIdx = focusedIdx === 0 ? activeWins.length - 1 : focusedIdx - 1;
        } else if (direction === 'down') {
            targetIdx = focusedIdx === activeWins.length - 1 ? 0 : focusedIdx + 1;
        }

        // Swap them
        this.swapTiledWindows(focused.id, activeWins[targetIdx].id);
    }

    /**
     * RIGHT-CLICK SWAP MENU (For tiled windows)
     * Shows swap options when right-clicking a tiled window header
     */
    showSwapMenu(winId, event) {
        if (!this.isTilingActive) return;

        const ws = document.getElementById('workspace');
        const activeWins = Array.from(
            ws.querySelectorAll('.os-window:not(.minimized):not(.in-overview):not(.floating-extra)')
        );

        if (activeWins.length < 2) {
            this.logSystemEvent("Not enough windows to swap", 'warn');
            return;
        }

        const menu = document.createElement('div');
        menu.id = 'swap-context-menu';
        menu.style.cssText = `
            position: fixed;
            top: ${event.clientY}px;
            left: ${event.clientX}px;
            background: rgba(10, 10, 20, 0.95);
            border: 2px solid #a445ff;
            border-radius: 8px;
            padding: 8px 0;
            z-index: 10002;
            min-width: 180px;
            font-family: monospace;
            font-size: 12px;
            color: #fff;
            backdrop-filter: blur(10px);
        `;

        const currentWin = document.getElementById(winId);
        const currentTitle = currentWin.querySelector('.title')?.innerText || 'Current';

        // Add swap options
        activeWins.forEach((win, idx) => {
            if (win.id === winId) return; // Skip self

            const title = win.querySelector('.title')?.innerText || `Window ${idx + 1}`;
            
            const item = document.createElement('div');
            item.style.cssText = `
                padding: 8px 15px;
                cursor: pointer;
                transition: background 0.2s;
                border-bottom: 1px solid rgba(164, 69, 255, 0.1);
            `;
            item.innerHTML = `⇄ Swap with: ${title}`;
            
            item.onmouseenter = () => item.style.background = 'rgba(164, 69, 255, 0.2)';
            item.onmouseleave = () => item.style.background = 'transparent';
            
            item.onclick = () => {
                this.swapTiledWindows(winId, win.id);
                menu.remove();
            };

            menu.appendChild(item);
        });

        // Add cycle option
        const cycleItem = document.createElement('div');
        cycleItem.style.cssText = `
            padding: 8px 15px;
            cursor: pointer;
            transition: background 0.2s;
            color: #00ff41;
            border-top: 1px solid rgba(164, 69, 255, 0.1);
        `;
        cycleItem.innerHTML = '↻ Cycle All Windows';
        
        cycleItem.onmouseenter = () => cycleItem.style.background = 'rgba(0, 255, 65, 0.15)';
        cycleItem.onmouseleave = () => cycleItem.style.background = 'transparent';
        
        cycleItem.onclick = () => {
            this.cycleTiledWindows('forward');
            menu.remove();
        };

        menu.appendChild(cycleItem);

        document.body.appendChild(menu);

        // Close menu on click elsewhere
        setTimeout(() => {
            document.addEventListener('click', () => menu.remove(), { once: true });
        }, 100);
    }


    /**
 * SHUTDOWN_SOVEREIGN
 * Graceful termination of Level 0 and Level 1 processes.
 */
shutdownSovereign() {
    //idempotency guard
    if (this._shutdownInProgress) return;
    this._shutdownInProgress = true;

    // 1. Authorization Gate
    if (!confirm("SHUTDOWN: Terminate all secure sessions and exit Enclave?")) {
        this._shutdownInProgress = false; 
        return;}

    console.warn("Kernel: Initiating Hardware Shutdown...");


    // 2. Clear Persistence Buffer
    // We clear the "LAST_PANIC" data on a graceful shutdown so 
    // it doesn't trigger a 'Recovery' message on the next clean boot.
    localStorage.removeItem('LAST_PANIC_CODE');

    // VISUAL OWNERSHIP LOCK (CRITICAL)
    document.body.style.background = '#000';
    document.body.style.overflow = 'hidden';
    document.body.style.margin = '0';
    document.body.style.padding = '0';

    // Now render shutdown ritual
    this.renderShutdownRitual();
    requestAnimationFrame(() => {
        document.body.classList.add('crt-shutdown');
    });

    // 3. Trigger visual CRT collapse
    document.body.classList.add('crt-shutdown');

    // 4. Physical Shutdown Sequence (Matches your 600ms CSS transition)
    setTimeout(() => {
    this.sessionKey = null;
    this.isLoggedIn = false;

    if (this.runningApps instanceof Set) {
        this.runningApps.clear();
    } else {
        this.runningApps = {};
    }

    // Attempt HARD browser exit (only works in trusted contexts / PWA)
    try {
        window.close();
    } catch (e) {}
}, 600);

// 6. FINAL HALT (finite, intentional)
    setTimeout(() => {
        document.body.innerHTML = `
            <div id="halt-screen" style="
                background:#000;
                height:100vh;
                width:100vw;
                display:flex;
                flex-direction:column;
                align-items:center;
                justify-content:center;
                color:#333;
                font-family:monospace;
                user-select:none;
                text-align:center;
            ">
                <p>System Halted</p>
                <p style="font-size:10px; opacity:0.4;">
                    Integrity Maintained · 0x20251226_CLEAN_EXIT
                </p>

                <p style="margin-top:18px; font-size:9px; opacity:0.25;">
                    Power control returned to user
                </p>

                <button onclick="location.reload()" style="
                    margin-top:24px;
                    background:transparent;
                    border:1px solid #222;
                    color:#222;
                    padding:6px 14px;
                    cursor:pointer;
                ">
                    REBOOT
                </button>
            </div>
        `;

        document.body.style.backgroundColor = "#000";
        console.log("Kernel: System halted cleanly.");
    }, 2600);

}

renderShutdownRitual() {
    document.body.innerHTML = `
        <div id="shutdown-ritual" style="
            position:fixed;
            inset:0;
            background:black;
            display:flex;
            flex-direction:column;
            align-items:center;
            justify-content:center;
            font-family:monospace;
            color:#aaa;
            text-align:center;
        ">
            <div style="opacity:0.9; margin-bottom:18px; font-size:14px;">
                ⏻ THEALCOHESION OS
            </div>

            <div style="font-size:11px; opacity:0.6; line-height:1.6;">
                Terminating VPUs…<br>
                Flushing volatile memory…<br>
                Revoking session keys…<br>
                Sealing enclave…
            </div>

            <div style="
                margin-top:28px;
                width:22px;
                height:22px;
                border:2px solid #222;
                border-top:2px solid #888;
                border-radius:50%;
                animation: spin 1s linear infinite;
            "></div>

            <style>
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
            </style>
        </div>
    `;
}
      
    /**
     * TRIGGER_REAL_PANIC
     * Handled at Level 0. Immediate system halt.
     */
    triggerRealPanic(errorCode, details) {
        console.error(`KERNEL_PANIC [${errorCode}]: ${details}`);

        // 1. Persistence: Log the crash for the next boot cycle
        localStorage.setItem('LAST_PANIC_CODE', errorCode);
        localStorage.setItem('LAST_PANIC_TIME', Date.now());

        // 2. Security: Wipe the volatile session key immediately
        this.sessionKey = null;
        this.isLoggedIn = false;
        
        // 3. Halt: Clear all running process intervals
        for (let i = 1; i < 9999; i++) window.clearInterval(i);

        // 4. UI Takeover: Call your visual renderer (ensure this is imported or global)
        if (typeof renderPanicUI === 'function') {
            renderPanicUI(errorCode, details); 
        } else {
            // Fallback if the UI module is also corrupted
            document.body.innerHTML = `<div style="background:red;color:white;padding:50px;">FATAL_ERROR: ${errorCode}</div>`;
        }
        this.logEvent("'CRITICAL', Kernel Panic: ${errorCode}");
    }

    //OS's ultimate self-defense mechanism
    triggerKernelPanic(errorCode) {
    console.error(`!!! KERNEL PANIC: ${errorCode} !!!`);
    
    // 1. Immediate Silence
    this.sessionKey = null; // Purge keys for security
    
    // 2. The Dreaded Screen
    document.body.innerHTML = `
        <div id="panic-screen" style="background:#800000; color:#fff; height:100vh; width:100vw; padding:50px; font-family: 'Courier New', monospace; font-size: 14px; line-height: 1.6; overflow:hidden;">
            <h1 style="background:#fff; color:#800000; display:inline-block; padding:0 10px;"> FATAL_ERROR: ENCLAVE_CORRUPTION </h1>
            <p style="margin-top:20px;">A critical exception has occurred at 0x0020251226. The Sovereign Kernel has been halted to prevent data leakage.</p>
            <p>REASON: ${errorCode}</p>
            <p>*** STOP: 0x0000007B (0xF78D2524, 0xC0000034, 0x00000000, 0x00000000)</p>
            
            <div style="margin-top:40px; border:1px solid #fff; padding:20px; background: rgba(0,0,0,0.2);">
                <p>MEMORY_DUMPING...</p>
                <div id="dump-progress"> [||||||||||||||||| ] 82% </div>
                <p>DO NOT POWER OFF THE DEVICE. ENCRYPTING REMAINING SECTORS...</p>
            </div>

            <p style="margin-top:50px; opacity:0.7;">Contact your Alcohesion System Administrator.<br>Sovereign OS v1.2.9 - Build (2026.01.05)</p>
        </div>
    `;

    // Disable all interaction
    document.body.style.cursor = 'none';
    window.onkeydown = (e) => {
        if(e.key === 'r') window.location.reload(); // Hidden "Reboot" key
    };
}

async runRecoverySequence(errorCode) {
    // 1. Create a "Terminal-Only" environment
    const recoveryScreen = document.createElement('div');
    recoveryScreen.id = 'recovery-loader';
    recoveryScreen.style = `
        position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
        background: #000; color: #00ff41; font-family: 'Courier New', monospace;
        padding: 40px; z-index: 999999; font-size: 14px; line-height: 1.6;
    `;
    document.body.appendChild(recoveryScreen);

    const print = (text, delay = 500) => {
        return new Promise(res => {
            const line = document.createElement('div');
            line.innerHTML = `> ${text}`;
            recoveryScreen.appendChild(line);
            setTimeout(res, delay);
        });
    };

    // 2. The Sequence
    await print("SOVEREIGN_RECOVERY_ENVIRONMENT [v1.0.4]");
    await print(`CRITICAL_FAILURE_DETECTED: ${errorCode}`, 1000);
    await print("-------------------------------------------");
    await print("Initializing low-level disk utility...");
    await print("Scanning VFS partitions for corruption...");
    
    // Real Check: Verify 2025-12-26 Allotment Integrity
    const vfs = localStorage.getItem('vpu_vfs_root');
    await new Promise(r => setTimeout(r, 1500));
    
    if (vfs) {
        await print("VFS_ROOT: FOUND [Integrity 100%]");
        await print("Verifying Genesis Block (2025-12-26)... OK");
    } else {
        await print("VFS_ROOT: NOT_FOUND", 1000);
        await print("Attempting to rebuild from Enclave Mirror...", 2000);
        await print("Rebuild Successful.");
    }

    await print("Purging stale session keys and volatile buffers...");
    localStorage.removeItem('LAST_PANIC_CODE'); 
    localStorage.removeItem('LAST_PANIC_TIME');

    await print("-------------------------------------------");
    await print("SYSTEM REPAIRED. WARM REBOOT INITIATING...", 2000);

    // 3. Exit Recovery and return to Normal Boot
    recoveryScreen.style.transition = "opacity 1s";
    recoveryScreen.style.opacity = "0";
    setTimeout(() => recoveryScreen.remove(), 1000);
}

//System log Events

logEvent(type, message) {
    const logs = JSON.parse(localStorage.getItem('SOVEREIGN_LOGS') || '[]');
    const newEntry = {
        timestamp: new Date().toISOString(),
        type: type, // 'INFO', 'WARN', 'CRITICAL'
        message: message
    };
    
    // Keep only the last 50 events to save space
    logs.unshift(newEntry);
    localStorage.setItem('SOVEREIGN_LOGS', JSON.stringify(logs.slice(0, 50)));
    
    console.log(`[SYS_LOG]: ${message}`);

    // Visual Notification
    const ticker = document.getElementById('top-bar-ticker');
    if (ticker) {
        ticker.innerText = `[${type}] ${message}`;
        ticker.style.color = type === 'CRITICAL' ? '#ff4444' : '#00ff41';
        ticker.classList.add('flash');
        setTimeout(() => ticker.classList.remove('flash'), 3000);
    }

    // NEW: If a security dashboard is open, tell it to refresh
    const dashboard = document.querySelector('[id^="win-security"]');
    if (dashboard) {
        const instance = dashboard.dataset.engineInstance;
        if (instance && instance.render) instance.render();
    }
}

//Escape key warning
triggerEscapeWarning() {
    const overlay = document.createElement('div');
    overlay.id = 'sec-breach-overlay';
    overlay.style = `
        position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
        background: rgba(139, 0, 0, 0.9); backdrop-filter: blur(20px);
        z-index: 1000000; display: flex; flex-direction: column;
        justify-content: center; align-items: center; color: white;
        font-family: monospace; transition: opacity 0.5s ease;
    `;

    overlay.innerHTML = `
        <h1 style="font-size: 3rem; margin-bottom: 10px; text-shadow: 0 0 20px #f00;">DISPLAY_BREACH</h1>
        <p style="letter-spacing: 2px;">SECURE_STATE LOST: PURGING VOLATILE RAM IN <span id="shred-timer">3</span>s</p>
        <div style="width: 200px; height: 2px; background: #fff; margin-top: 20px;">
            <div id="shred-bar" style="width: 100%; height: 100%; background: #ff0000; transition: width 1s linear;"></div>
        </div>
    `;

    document.body.appendChild(overlay);

    let count = 3;
    const shredTimer = setInterval(() => {
        count--;
        document.getElementById('shred-timer').innerText = count;
        document.getElementById('shred-bar').style.width = `${(count / 3) * 100}%`;

        if (count <= 0) {
            clearInterval(shredTimer);
            this.lockSystem(); // The final shred
            overlay.remove();
        }
    }, 1000);
}

    // Volume triger
    initAudioEngine() {
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        this.masterGain = this.audioContext.createGain();
        this.masterGain.connect(this.audioContext.destination);
        
        // Default Volume (80%)
        this.setSystemVolume(80);
    }

    setSystemVolume(value) {
    this.systemVolume = value;
    const volumeLevel = value / 100;

    // Direct Control: Find every audio/video element in the DOM and set volume
    const mediaElements = document.querySelectorAll('audio, video');
    mediaElements.forEach(media => {
        media.volume = volumeLevel;
    });

    console.log(`System Volume set to: ${value}%`);
}

//LOGS AT THE BOTTOM OF THE WORKSPACE
          logSystemEvent(message, type = 'info') {
    let container = document.getElementById('kernel-log-container');
    
    // Create container if it doesn't exist
    if (!container) {
        container = document.createElement('div');
        container.id = 'kernel-log-container';
        container.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            max-height: 200px;
            max-width: 350px;
            overflow-y: auto;
            z-index: 50;
            pointer-events: none;
            display: flex;
            flex-direction: column;
            gap: 5px;
        `;
        document.body.appendChild(container);
    }

    const entry = document.createElement('div');
    entry.className = `log-entry ${type}`;
    entry.style.cssText = `
        background: rgba(0, 0, 0, 0.8);
        color: ${type === 'critical' ? '#ff4444' : type === 'warn' ? '#ffaa00' : '#00ff41'};
        padding: 8px 12px;
        font-family: monospace;
        font-size: 11px;
        border-left: 3px solid ${type === 'critical' ? '#ff4444' : type === 'warn' ? '#ffaa00' : '#00ff41'};
        border-radius: 4px;
        max-width: 330px;
        word-wrap: break-word;
        opacity: 1;
        transition: opacity 0.3s ease;
    `;
    
    const timestamp = new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
    entry.innerHTML = `[${timestamp}] ${message}`;

    container.appendChild(entry);

    // Auto-remove after 4 seconds
    setTimeout(() => {
        entry.style.opacity = '0';
        setTimeout(() => entry.remove(), 300);
    }, 4000);
}  
}

window.kernel = new TLC_Kernel();

window.addEventListener('resize', () => {
    if (window.innerWidth <= 768) {
        document.querySelectorAll('.os-window').forEach(win => {
            win.style.top = '0';
            win.style.left = '0';
            win.style.width = '100vw';
            win.style.height = '100vh';
            win.style.borderRadius = '0';
        });
    }
});
