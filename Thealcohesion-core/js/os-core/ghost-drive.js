/**
 * ghost-drive.js
 * SOVEREIGN_STORAGE // SHADOW_ASSET_VAULT // BATTLE_TESTED_UI
 */
import { CryptoVault } from '../modules/crypto-vault.js';

export class GhostDrive {
    constructor(container, api) {
        this.container = container;
        this.api = api; 
        this.shards = [];
        this.activeShardId = null;
    }

    async init() {
        await this.loadShards();
        this.render();
    }

    async loadShards() {
        this.shards = [
            { id: 'SH-01', type: 'EPOS_ALLOTMENT', investor: 'ALPHA', data: 'ENC_BLOB_01' },
            { id: 'SH-02', type: 'FOUNDER_BADGE', investor: 'BETA', data: 'ENC_BLOB_02' },
            { id: 'SH-03', type: 'GENESIS_NODE', investor: 'GAMMA', data: 'ENC_BLOB_03' },
            { id: 'SH-04', type: 'EPOS_ALLOTMENT', investor: 'DELTA', data: 'ENC_BLOB_04' }
        ];
    }

    async revealShard(shard, element) {
        this.activeShardId = shard.id;
        let decryptedID;

        try {
            decryptedID = await CryptoVault.decrypt(shard.data, this.api.session);
        } catch (e) {
            decryptedID = `NON_VETTED_ID_${shard.id}`; 
        }

        if (this.activeShardId !== shard.id) return;

        const imgEl = element.querySelector('.shard-preview');
        imgEl.style.opacity = "1";
        imgEl.style.filter = "blur(0px) brightness(1.2)";
        imgEl.style.borderColor = "#00ff41";
        
        const info = this.container.querySelector('#active-info');
        if (info) {
            info.innerHTML = `STATUS: <span style="color:#00ff41">DECRYPTED</span><br>INVESTOR: ${decryptedID}<br>TYPE: ${shard.type}`;
        }
    }

    hideShard(element) {
        this.activeShardId = null;
        const imgEl = element.querySelector('.shard-preview');
        if (imgEl) {
            imgEl.style.opacity = "0.1";
            imgEl.style.filter = "blur(20px)";
            imgEl.style.borderColor = "#222";
        }
    }

    render() {
        this.container.innerHTML = `
            <style>
                .ghost-drive {
                    background: #020202;
                    color: #d4af37;
                    height: 100%;
                    width: 100%;
                    display: flex;
                    flex-direction: column;
                    font-family: 'Courier New', monospace;
                    overflow: hidden;
                    position: relative;
                    border: 1px solid #1a1a1a;
                }

                /* CRT Scanline Overlay */
                .ghost-drive::before {
                    content: " ";
                    position: absolute;
                    top: 0; left: 0; bottom: 0; right: 0;
                    background: linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%), 
                                linear-gradient(90deg, rgba(255, 0, 0, 0.06), rgba(0, 255, 0, 0.02), rgba(0, 0, 255, 0.06));
                    background-size: 100% 2px, 3px 100%;
                    pointer-events: none;
                    z-index: 100;
                }

                .drive-header {
                    padding: 10px 15px;
                    border-bottom: 2px solid #111;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    background: #000;
                }

                .shard-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
                    gap: 10px;
                    padding: 15px;
                    overflow-y: auto;
                    flex-grow: 1;
                }

                .shard-container {
                    aspect-ratio: 1;
                    background: #050505;
                    border: 1px solid #111;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    position: relative;
                }

                .shard-preview {
                    width: 60%;
                    height: 60%;
                    border: 1px solid #222;
                    background: repeating-linear-gradient(45deg, #000, #000 5px, #050505 5px, #050505 10px);
                    opacity: 0.1;
                    filter: blur(20px);
                    transition: all 0.3s ease;
                }

                .shard-id {
                    font-size: 8px;
                    color: #333;
                    margin-top: 5px;
                    letter-spacing: 2px;
                }

                .vault-readout {
                    height: 100px;
                    background: #000;
                    border-top: 2px solid #111;
                    padding: 10px 15px;
                    font-size: 10px;
                    display: flex;
                    justify-content: space-between;
                    z-index: 101;
                }

                .glitch-text {
                    text-transform: uppercase;
                    line-height: 1.4;
                    color: #555;
                }

                .sov-btn-sm {
                    background: transparent;
                    border: 1px solid #d4af37;
                    color: #d4af37;
                    padding: 5px 10px;
                    font-size: 9px;
                    cursor: pointer;
                    transition: 0.2s;
                }
                .sov-btn-sm:hover { background: #d4af37; color: #000; }
            </style>

            <div class="ghost-drive">
                <div class="drive-header">
                    <div style="font-size: 10px; letter-spacing: 4px;">STORAGE://GHOST_DRIVE_V2</div>
                    <div style="font-size: 10px; color:#00ff41;">SHARDS_SYNCED: TRUE</div>
                </div>

                <div class="shard-grid">
                    ${this.shards.map(shard => `
                        <div class="shard-container" data-id="${shard.id}">
                            <div class="shard-preview"></div>
                            <div class="shard-id">${shard.id}</div>
                        </div>
                    `).join('')}
                </div>

                <div class="vault-readout">
                    <div class="glitch-text" id="active-info">
                        READY_FOR_SHARD_ACCESS...<br>
                        AWAITING_HOLOGRAPHIC_INPUT...
                    </div>
                    <div style="text-align: right;">
                        <button class="sov-btn-sm" id="purge-btn">PURGE_DRIVE</button>
                    </div>
                </div>
            </div>
        `;

        this.attachEvents();
    }

    attachEvents() {
        this.container.querySelectorAll('.shard-container').forEach(el => {
            const id = el.getAttribute('data-id');
            const shard = this.shards.find(s => s.id === id);

            el.onmouseenter = () => this.revealShard(shard, el);
            el.onmouseleave = () => {
                this.hideShard(el);
                const info = this.container.querySelector('#active-info');
                if (info) info.innerHTML = "READY_FOR_SHARD_ACCESS...<br>AWAITING_HOLOGRAPHIC_INPUT...";
            };
            
            el.onclick = () => {
                if(this.api.notify) this.api.notify(`EXTRACTING_IDENTITY: ${shard.investor}`, "success");
            };
        });

        this.container.querySelector('#purge-btn').onclick = () => {
            this.shards = [];
            this.render();
        };
    }
}