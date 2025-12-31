import { registry } from './registry.js';

class TLC_Kernel {
    constructor() {
        this.initListeners();
    }

    initListeners() {
        document.getElementById('login-btn').addEventListener('click', () => this.login());
    }

    login() {
        // Here you would check credentials against auth.js logic
        console.log("Identity Verified.");
        document.getElementById('login-gate').classList.add('hidden');
        document.getElementById('sovereign-shell').classList.remove('hidden');
        this.bootShell();
    }

    bootShell() {
        const launcher = document.getElementById('bento-launcher');
        launcher.innerHTML = ''; // Clear

        registry.forEach(app => {
            const card = document.createElement('div');
            card.className = 'bento-card';
            card.innerHTML = `
                <div class="bento-icon">${app.icon}</div>
                <div class="bento-name">${app.name}</div>
            `;
            card.onclick = () => console.log(`Launching ${app.file}...`);
            launcher.appendChild(card);
        });
    }
}

const kernel = new TLC_Kernel();