/**
 * auth.js - SOVEREIGN ORCHESTRATOR (v3.0)
 * Role: Conductor / Wiring (No Authority)
 */
import { Sniffer } from './sniffer.ingress.js';
import { GateKeeper } from './gatekeeper.core.js';
import { Deadlock } from './deadlock.enforcer.js';
import { Uplink } from './uplink.session.js';
import { EnclaveCrypto } from './enclave.crypto.js';
import { VoidEnclave } from './void_enclave.js';

export class SovereignAuth {
    constructor(container, kernel) {
        this.container = container;
        this.kernel = kernel;

        // Initialize Specialized Modules
        this.void = new VoidEnclave(container);
        this.crypto = new EnclaveCrypto();
        this.deadlock = new Deadlock(kernel, container); // Deadlock needs UI access to "Void" it
        this.gatekeeper = new GateKeeper(kernel, this.deadlock);
        this.sniffer = new Sniffer();
        this.uplink = new Uplink(kernel);

        this.kernel.auth = this;
    }

    /**
     * ROLE 1: SNIFFER INGRESS (Activation)
     * "Awakens" the HTML Login-Gate
     */
    activateSniffer() {
        this.container.style.display = 'flex';
        const btn = document.getElementById('login-btn');
        const userField = document.getElementById('username');
        const passField = document.getElementById('pass-input');

        if (!btn) return;

        btn.onclick = async () => {
            const credentials = {
                id: userField.value.toUpperCase(),
                pass: passField.value,
                timestamp: Date.now()
            };

            await this.handleHandshake(credentials);
        };
    }

    /**
     * THE HANDSHAKE FLOW
     * Coordinates the 8-Component Architecture
     */
    async handleHandshake(creds) {
        const status = document.getElementById('auth-status');
        
        try {
            // 1. SNIFFER: Observe Ingress (Zero-Trust)
            const observation = await this.sniffer.observe(creds);

            // 2. GATEKEEPER: Behavioral Judgement
            const judgement = await this.gatekeeper.evaluate(observation);

            if (!judgement.authorized) {
                // If Gatekeeper didn't trigger Deadlock, show failure
                status.innerText = judgement.reason || "DENIED";
                return;
            }

            // 3. CRYPTO: Key Generation
            const enclaveKey = await this.crypto.deriveKey(creds.pass, observation.hwSig);

            // 4. UPLINK: Establish Session
            const session = await this.uplink.establish({
                identity: creds.id,
                key: enclaveKey,
                sig: observation.hwSig
            });

            // 5. SHELL HANDOVER
            status.innerText = "» MATERIALIZING_ENCLAVE...";
            setTimeout(() => {
                this.container.style.display = 'none';
                this.kernel.isBooted = true;
                this.kernel.init(); 
            }, 1000);

        } catch (e) {
            status.innerText = "CRITICAL_AUTH_ERROR";
            console.error("ORCHESTRATOR_FAULT:", e);
        }
    }

    // Proxy for Kernel events to trigger the Red Box (Gatekeeper UI)
    renderGatekeeperUI(reason) {
        this.gatekeeper.renderRedBox(this.container, reason);
    }
}