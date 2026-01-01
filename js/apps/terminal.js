const terminalApp = {
    id: "vpu-terminal",
    name: "Terminal Core",
    
    // ISOLATED CSS: Scoped specifically to #vpu-terminal
    css: `
        #vpu-terminal {
            background: #000;
            color: #00ff41;
            font-family: 'Courier New', monospace;
            height: 100%;
            display: flex;
            flex-direction: column;
            padding: 15px;
            box-sizing: border-box;
        }
        #vpu-terminal .output-area {
            flex: 1;
            overflow-y: auto;
            margin-bottom: 10px;
            font-size: 14px;
            line-height: 1.5;
            white-space: pre-wrap;
        }
        #vpu-terminal .input-line {
            display: flex;
            align-items: center;
            gap: 10px;
        }
        #vpu-terminal .prompt { color: #a445ff; font-weight: bold; }
        #vpu-terminal input {
            background: transparent;
            border: none;
            color: #00ff41;
            font-family: inherit;
            font-size: 14px;
            outline: none;
            flex: 1;
        }
    `,

    render() {
        // Inject CSS once
        if (!document.getElementById(`css-${this.id}`)) {
            const style = document.createElement('style');
            style.id = `css-${this.id}`;
            style.innerHTML = this.css;
            document.head.appendChild(style);
        }

        // Return HTML
        return `
            <div id="${this.id}">
                <div class="output-area" id="term-output">VPU Sovereign Terminal v1.0.0\nType 'help' for commands...</div>
                <div class="input-line">
                    <span class="prompt">admin@vpu:~$</span>
                    <input type="text" id="term-input" autocomplete="off" autofocus>
                </div>
            </div>
        `;
    },

    // Add this inside the terminalApp object
    handleCommand(cmd) {
    const output = document.getElementById('term-output');
    let response = "";

        const command = cmd.toLowerCase().trim();
    if (command === 'help') {
        response = "Available: status, allotment, clear, whoami, exit";
    } else if (command === 'status') {
        response = "System: ONLINE\nKernel: V1.0.2\nSovereign Shield: ACTIVE";
    } else if (command === 'allotment') {
        response = "QUERY: Initial Allotment Strategy...\nRESULT: EPOS and Investors confirmed for Phase 1 distribution.";
    } else if (command === 'whoami') {
        response = `Current User: ${kernel.member ? kernel.member.username : 'Unauthorized'}\nRole: ${kernel.member ? kernel.member.role : 'None'}`;
    } else if (command === 'clear') {
        output.innerHTML = "";
        return;
    } else {
        response = `Command not recognized: ${command}`;
    }

    output.innerHTML += `\n<span style="color:#888;">> ${cmd}</span>\n${response}\n`;
    output.scrollTop = output.scrollHeight;
}
};