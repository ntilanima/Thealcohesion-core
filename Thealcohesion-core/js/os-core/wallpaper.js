/**
 * THEALCOHESION NEURAL WALLPAPER
 * Logic: Generative Synaptic Mesh
 * Binding: Kernel Memory & Process Load
 */
export class NeuralWallpaper {
    constructor(canvasId, kernel) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.kernel = kernel;
        this.points = [];
        this.maxPoints = 80;
        this.baseConnectionDist = 150;
        
        this.init();
    }

    init() {
        this.resize();
        window.addEventListener('resize', () => this.resize());
        
        // Create initial neural nodes
        for (let i = 0; i < this.maxPoints; i++) {
            this.points.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                vx: (Math.random() - 0.5) * 0.5,
                vy: (Math.random() - 0.5) * 0.5
            });
        }
        this.animate();
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    animate() {
        // Sync with Kernel Load
        const loadFactor = this.kernel.currentMemory / this.kernel.maxMemory;
        const speedMultiplier = 1 + (loadFactor * 5); // Faster pulse when busy
        
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.fillStyle = '#000'; // Pure Sovereign Black
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        this.points.forEach((p, i) => {
            p.x += p.vx * speedMultiplier;
            p.y += p.vy * speedMultiplier;

            // Boundary bounce
            if (p.x < 0 || p.x > this.canvas.width) p.vx *= -1;
            if (p.y < 0 || p.y > this.canvas.height) p.vy *= -1;

            // Draw Node
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, 1.5, 0, Math.PI * 2);
            this.ctx.fillStyle = loadFactor > 0.7 ? '#ff4444' : '#a445ff'; // Red alert if high load
            this.ctx.fill();

            // Draw Synaptic Connections
            for (let j = i + 1; j < this.points.length; j++) {
                const p2 = this.points[j];
                const dist = Math.hypot(p.x - p2.x, p.y - p2.y);
                
                if (dist < this.baseConnectionDist) {
                    this.ctx.beginPath();
                    this.ctx.moveTo(p.x, p.y);
                    this.ctx.lineTo(p2.x, p2.y);
                    // Opacity tied to proximity
                    this.ctx.strokeStyle = `rgba(164, 69, 255, ${1 - dist/this.baseConnectionDist})`;
                    this.ctx.lineWidth = 0.5;
                    this.ctx.stroke();
                }
            }
        });

        requestAnimationFrame(() => this.animate());
    }
}