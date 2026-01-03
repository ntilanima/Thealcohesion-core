/**
 * VPU TERMINAL SYSTEM - SOVEREIGN EDITION
 * Compiled Module: TerminalApp (v1.0.3)
 */

export class TerminalApp {
    constructor(container) {
        this.container = container;
        this.output = null;
        this.input = null;
        this.isTyping = false; // Prevents command spamming during output
        this.vpuLogo = `
        _   _  ____  _   _ 
        | | | ||  _ \\| | | |
        | | | || |_) | | | |
        | |/ / |  __/| |_| |
        |___/  |_|    \\___/ 
        VIRTUAL PRAGMATIC UNIVERSE`;
    }

    init() {
        this.container.innerHTML = `
            <div id="vpu-terminal" style="background:#000; color:#00ff41; font-family: 'Courier New', monospace; height:100%; display:flex; flex-direction:column; padding:15px; box-sizing:border-box; position: relative; overflow: hidden;">
                <div id="term-output" style="flex:1; overflow-y:auto; margin-bottom:10px; font-size:13px; line-height:1.5; white-space: pre-wrap; z-index: 5;"></div>
                
                <div class="input-line" style="display:flex; align-items:center; gap:10px; z-index: 5;">
                    <span style="color:#a445ff; font-weight:bold; white-space: nowrap;">admin@vpu:~$</span>
                    <input type="text" id="term-input" autocomplete="off" spellcheck="false" 
                        style="background:transparent; border:none; color:#00ff41; font-family:inherit; outline:none; flex:1; font-size: 13px;">
                </div>

                <div style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.1) 50%); background-size: 100% 4px; pointer-events: none; opacity: 0.2; z-index: 10;"></div>
            </div>`;
        
        this.output = this.container.querySelector('#term-output');
        this.input = this.container.querySelector('#term-input');
        
        setTimeout(() => this.input.focus(), 50);

        this.input.onkeydown = (e) => {
            if (e.key === 'Enter' && !this.isTyping) {
                const commandText = this.input.value;
                this.handleCommand(commandText);
                this.input.value = '';
            }
        };

        this.container.onclick = () => this.input.focus();
        this.typeWrite("VPU SOVEREIGN TERMINAL v1.0.3\nSystem: Command Core Initialized...\nType 'help' for commands.");
    }

    async typeWrite(text, color = "#00ff41") {
        this.isTyping = true;
        const line = document.createElement('div');
        line.style.color = color;
        this.output.appendChild(line);

        const chars = text.split("");
        for (let char of chars) {
            line.textContent += char;
            this.output.scrollTop = this.output.scrollHeight;
            // Adjustable typing speed (ms)
            await new Promise(res => setTimeout(res, 5)); 
        }
        this.isTyping = false;
    }

    async handleCommand(cmd) {
        if (!cmd.trim()) return;

        // Print the user's command immediately
        const userLine = document.createElement('div');
        userLine.innerHTML = `<span style="color:rgba(255,255,255,0.4);">admin@vpu:~$ ${cmd}</span>`;
        this.output.appendChild(userLine);

        let response = "";
        const cleanCmd = cmd.trim().toLowerCase();
        
        switch (cleanCmd) {
            case 'help':
                response = "AVAILABLE COMMANDS:\n  status    - View system health\n  allotment - Check initial allotment strategy\n  neofetch  - System information\n  clear     - Clear terminal buffer";
                break;
            case 'status':
                response = "SYSTEM: ONLINE\nKERNEL: V1.0.2 [SOVEREIGN]\nSHIELD: ACTIVE";
                break;
            case 'neofetch':
                response = this.vpuLogo + "\nOS: VPU Sovereign OS\nKernel: 1.0.2-theal";
                break;
            case 'allotment':
                response = "QUERY: Allotment Genesis Strategy...\nRESULT: [EPOS] and [Investors] confirmed.\nDATE: December 26, 2025";
                break;
            case 'clear':
                this.output.innerHTML = '';
                return;
            default:
                response = `Command not recognized: ${cleanCmd}`;
        }

        await this.typeWrite(response);
    }

    destruct() {
        console.log("Terminal: Shutdown sequence initiated.");
    }
}