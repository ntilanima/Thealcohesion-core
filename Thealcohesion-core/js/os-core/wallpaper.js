
/**
 * THEALCOHESION NEURAL WALLPAPER (TEMPORAL HUD INTEGRATED)
 * Original Mesh + Full Sovereign Metrics
 */
export class NeuralWallpaper {
    constructor(canvasId, kernel) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.kernel = kernel;
        this.temporal = window.thealTimeApp; 
        this.points = [];
        this.maxPoints = 80;
        this.baseConnectionDist = 150;
        
        this.init();
    }

    init() {
        this.resize();
        window.addEventListener('resize', () => this.resize());
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
        const now = new Date();
        const thealH = this.temporal.convertToThealHour(now.getHours()); 
        const arcProgress = (thealH - 1 + (now.getMinutes() / 60) + (now.getSeconds() / 3600)) / 11;
        const isReturning = (now.getHours() >= 19 || now.getHours() < 7);
        const peakHeight = this.canvas.height * 0.75;

        // Calculate Bubble Position first to target the Torch
        let xPos = isReturning ? this.canvas.width - (arcProgress * this.canvas.width) : arcProgress * this.canvas.width;
        let yPos = this.canvas.height - (Math.sin(Math.PI * arcProgress) * peakHeight + 150);
        const bubbleSize = 100 + ((now.getMinutes() * 60 + now.getSeconds()) / 3600) * 120;

        // 1. CLEAR AND BACKGROUND
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.fillStyle = '#000'; 
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // --- 2. THE TORCH LIGHT BEAM ---
        const beamOriginX = this.canvas.width / 2;
        const beamOriginY = this.canvas.height;
        
        // Color follows the cycle color
        const thealDate = this.temporal.getThealDate(now);
        let color = (thealDate.type === "holiday") ? "#00d4ff" : (thealDate.type === "milestone" ? "#ffd700" : "#a445ff");

        const beamGrad = this.ctx.createRadialGradient(beamOriginX, beamOriginY, 0, xPos, yPos, this.canvas.height);
        beamGrad.addColorStop(0, `${color}33`); // Faint start at bottom
        beamGrad.addColorStop(0.5, `${color}11`); // Very faint middle
        beamGrad.addColorStop(1, 'transparent');

        this.ctx.beginPath();
        this.ctx.moveTo(beamOriginX, beamOriginY);
        // Create a cone shape toward the bubble
        this.ctx.lineTo(xPos - bubbleSize, yPos);
        this.ctx.lineTo(xPos + bubbleSize, yPos);
        this.ctx.closePath();
        this.ctx.fillStyle = beamGrad;
        this.ctx.fill();

        // --- 3. RESTORED NEURAL ENGINE ---
        const loadFactor = this.kernel.currentMemory / this.kernel.maxMemory;
        const speedMultiplier = 1 + (loadFactor * 5);

        this.points.forEach((p, i) => {
            p.x += p.vx * speedMultiplier;
            p.y += p.vy * speedMultiplier;

            if (p.x < 0 || p.x > this.canvas.width) p.vx *= -1;
            if (p.y < 0 || p.y > this.canvas.height) p.vy *= -1;

            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, 1.5, 0, Math.PI * 2);
            this.ctx.fillStyle = loadFactor > 0.7 ? '#ff4444' : color; 
            this.ctx.fill();

            for (let j = i + 1; j < this.points.length; j++) {
                const p2 = this.points[j];
                const dist = Math.hypot(p.x - p2.x, p.y - p2.y);
                if (dist < this.baseConnectionDist) {
                    this.ctx.beginPath();
                    this.ctx.moveTo(p.x, p.y);
                    this.ctx.lineTo(p2.x, p2.y);
                    this.ctx.strokeStyle = `rgba(164, 69, 255, ${(1 - dist/this.baseConnectionDist) * 0.6})`;
                    this.ctx.lineWidth = 0.5;
                    this.ctx.stroke();
                }
            }
        });

        // --- 4. VISIBLE ORBIT PATH ---
        this.ctx.beginPath();
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
        this.ctx.setLineDash([5, 15]);
        for (let i = 0; i <= 1; i += 0.02) {
            const ox = isReturning ? this.canvas.width - (i * this.canvas.width) : i * this.canvas.width;
            const oy = this.canvas.height - (Math.sin(Math.PI * i) * peakHeight + 150);
            if (i === 0) this.ctx.moveTo(ox, oy);
            else this.ctx.lineTo(ox, oy);
        }
        this.ctx.stroke();
        this.ctx.setLineDash([]);

        // --- 5. BUBBLE HUD ---
        this.drawTemporalBubble(xPos, yPos, bubbleSize, thealDate, this.temporal.getTemporalMetrics(now), now);

        requestAnimationFrame(() => this.animate());
    }

    drawTemporalBubble(x, y, size, theal, metrics, now) {
        const ctx = this.ctx;
        let color = (theal.type === "holiday") ? "#00d4ff" : (theal.type === "milestone" ? "#ffd700" : "#a445ff");
        
        const grad = ctx.createRadialGradient(x, y, size*0.1, x, y, size);
        grad.addColorStop(0, `${color}88`);
        grad.addColorStop(1, 'transparent');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI*2);
        ctx.fill();

        ctx.textAlign = 'center';
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 16px monospace';
        const h = this.temporal.convertToThealHour(now.getHours()).toString().padStart(2,"0");
        const m = now.getMinutes().toString().padStart(2,"0");
        const s = now.getSeconds().toString().padStart(2,"0");
        ctx.fillText(`${h}:${m}:${s}`, x, y - 20);
        
        ctx.font = '8px monospace';
        ctx.fillStyle = 'rgba(255,255,255,0.5)';
        ctx.fillText(now.toLocaleTimeString(), x, y - 5);

        ctx.font = 'bold 9px monospace';
        ctx.fillStyle = color;
        ctx.fillText(theal.label.split(',')[0].toUpperCase(), x, y + 10);
        ctx.font = '7px monospace';
        ctx.fillStyle = 'rgba(255,255,255,0.8)';
        ctx.fillText(`CYCLE: ${metrics.nextCirclePercent}% | ${metrics.holidayName}: ${metrics.daysToHoliday}D`, x, y + 25);
    }
    //THE HUD
    drawObserver() {
    const coords = this.kernel.iconCoordinateMap;
    if (!coords) return;

    coords.forEach((pos) => {
        const dist = Math.hypot(this.mouse.x - pos.x, this.mouse.y - pos.y);
        if (dist < 250) {
            this.ctx.beginPath();
            this.ctx.moveTo(this.mouse.x, this.mouse.y);
            this.ctx.lineTo(pos.x, pos.y);
            this.ctx.strokeStyle = pos.color === 'gold' ? 'rgba(255,215,0,0.3)' : 'rgba(0,255,65,0.15)';
            this.ctx.lineWidth = pos.color === 'gold' ? 1.5 : 0.5;
            this.ctx.stroke();
        }
    });
}
}