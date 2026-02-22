/**
 * founder-badge.js
 * SOVEREIGN_ASSET_DESIGN // VPU_VISUAL_CORE
 */

export const FounderBadge = {
    generateSVG: (name, rank = "INVESTOR") => {
        return `
        <svg width="400" height="400" viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg">
            <path d="M200 20 L350 90 V250 C350 330 200 380 200 380 C200 380 50 330 50 250 V90 L200 20Z" fill="#050505" stroke="#d4af37" stroke-width="8"/>
            
            <path d="M200 40 L330 100 V240 C330 310 200 350 200 350 C200 350 70 310 70 240 V100 L200 40Z" fill="url(#grad1)" opacity="0.3"/>
            
            <circle cx="200" cy="180" r="60" fill="none" stroke="#d4af37" stroke-width="2" stroke-dasharray="10,5"/>
            <text x="200" y="195" font-family="monospace" font-size="40" fill="#d4af37" text-anchor="middle" font-weight="bold">VPU</text>
            
            <text x="200" y="280" font-family="monospace" font-size="16" fill="#d4af37" text-anchor="middle" letter-spacing="3">${name.toUpperCase()}</text>
            <text x="200" y="310" font-family="monospace" font-size="12" fill="#00ff41" text-anchor="middle" letter-spacing="5">${rank}</text>
            
            <rect x="140" y="330" width="120" height="1" fill="#d4af37" opacity="0.5"/>
            
            <defs>
                <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" style="stop-color:#d4af37;stop-opacity:1" />
                    <stop offset="100%" style="stop-color:#000000;stop-opacity:1" />
                </linearGradient>
            </defs>
        </svg>`;
    },

    /**
     * Converts the SVG to a Canvas Image so ShadowWeave can process it.
     */
    async getCanvasImage(name, rank) {
        return new Promise((resolve) => {
            const svgData = this.generateSVG(name, rank);
            const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const img = new Image();
            img.onload = () => resolve(img);
            img.src = url;
        });
    }
};