export class SpatialCluster {
    constructor(kernel) {
        this.kernel = kernel;
        this.rings = {
            POWER: { radius: 180, apps: ['tnfi', 'terminal', 'files', 'docs'], color: 'gold' },
            UTILITY: { radius: 340, apps: ['time', 'browser', 'messages', 'camera', 'vscode', 'settings'], color: 'green' }
        };
    }

    applyLayout() {
        const centerX = window.innerWidth / 2;
        const centerY = window.innerHeight / 2;
        const scale = window.innerWidth < 768 ? 0.6 : 1.0;

        Object.values(this.rings).forEach((ring) => {
            const appsInRing = ring.apps.filter(id => document.querySelector(`[data-app-id="${id}"]`));
            const total = appsInRing.length;

            appsInRing.forEach((appId, i) => {
                const angle = (i / total) * Math.PI * 2;
                const r = ring.radius * scale;
                const x = centerX + r * Math.cos(angle);
                const y = centerY + r * Math.sin(angle);

                const el = document.querySelector(`[data-app-id="${appId}"].desktop-icon`);
                if (el) {
                    el.style.left = "0px";
                    el.style.top = "0px";
                    // Using translate for hardware acceleration (smooth on mobile)
                    el.style.transform = `translate(${x - 40}px, ${y - 45}px)`;
                    
                    if (ring.color === 'gold') {
                        el.classList.add('liquid-gold');
                    }
                    
                    // Tell the background where we are
                    this.kernel.iconCoordinateMap.set(appId, { x, y, color: ring.color });
                }
            });
        });
    }
}