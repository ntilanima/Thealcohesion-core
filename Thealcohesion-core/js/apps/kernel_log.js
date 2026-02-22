/**
 * apps/kernel_log.js - Real-time System Event Stream
 */
export class KernelLogApp {
    constructor(container, api) {
        this.container = container;
        this.api = api;
        this.logLimit = 200;
        this.isAutoScrolling = true;
    }

    init() {
        this.render();
        this.attachListeners();
        this.pushLog("SYSTEM", "Kernel Log Interface Initialized...", "success");
    }

    render() {
        this.container.innerHTML = `
            <div style="height: 100%; background: #050505; color: #aaa; font-family: 'JetBrains Mono', 'Courier New', monospace; display: flex; flex-direction: column;">
                <div style="padding: 10px; background: #000; border-bottom: 1px solid #1a1a1a; display: flex; justify-content: space-between; align-items: center;">
                    <span style="font-size: 10px; color: #00ff41;">TERMINAL_V1 // KERNEL_STREAM</span>
                    <div style="display: flex; gap: 10px;">
                        <button id="log-clear" style="background:none; border: 1px solid #333; color: #666; font-size: 9px; cursor: pointer;">CLEAR</button>
                        <button id="log-scroll-toggle" style="background:none; border: 1px solid #00ff41; color: #00ff41; font-size: 9px; cursor: pointer;">AUTOSCROLL: ON</button>
                    </div>
                </div>

                <div id="log-stream" style="flex: 1; overflow-y: auto; padding: 15px; font-size: 12px; line-height: 1.4; scroll-behavior: smooth;">
                    </div>

                <div style="padding: 10px; background: #000; border-top: 1px solid #1a1a1a; display: flex; gap: 10px;">
                    <span style="color: #00ff41;">></span>
                    <input type="text" id="log-input" placeholder="Enter System Command..." style="background: transparent; border: none; color: #fff; outline: none; flex: 1; font-family: inherit; font-size: 12px;">
                </div>
            </div>
        `;
    }

    attachListeners() {
        const stream = this.container.querySelector('#log-stream');
        
        // Handle Manual Scroll Interruption
        stream.onscroll = () => {
            const isAtBottom = stream.scrollHeight - stream.scrollTop <= stream.clientHeight + 10;
            this.updateScrollToggle(isAtBottom);
        };

        this.container.querySelector('#log-clear').onclick = () => stream.innerHTML = '';
        
        // Listen for Kernel Events (Global Hook)
        window.addEventListener('kernel_event', (e) => {
            this.pushLog(e.detail.source, e.detail.message, e.detail.type);
        });
    }

    pushLog(source, message, type = 'info') {
        const stream = this.container.querySelector('#log-stream');
        const colors = { info: '#aaa', success: '#00ff41', error: '#ff4444', warn: '#f1c40f' };
        
        const line = document.createElement('div');
        line.style.marginBottom = '4px';
        line.innerHTML = `
            <span style="color: #444;">[${new Date().toLocaleTimeString()}]</span>
            <span style="color: ${colors[type] || '#aaa'};">[${source}]</span> 
            <span style="color: #eee;">${message}</span>
        `;

        stream.appendChild(line);

        // Maintain Buffer Limit
        if (stream.children.length > this.logLimit) stream.removeChild(stream.firstChild);

        // Auto-Scroll
        if (this.isAutoScrolling) stream.scrollTop = stream.scrollHeight;
    }

    updateScrollToggle(state) {
        this.isAutoScrolling = state;
        const btn = this.container.querySelector('#log-scroll-toggle');
        btn.innerText = `AUTOSCROLL: ${state ? 'ON' : 'OFF'}`;
        btn.style.borderColor = state ? '#00ff41' : '#333';
        btn.style.color = state ? '#00ff41' : '#666';
    }

    destruct() {
        window.removeEventListener('kernel_event', this.logHandler);
    }
}