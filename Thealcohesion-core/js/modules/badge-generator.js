/**
 * badge-generator.js
 * PROCEDURAL_ASSET_SYNTHESIS
 */
export const BadgeGenerator = {
    async generateFromInstructions(instructions) {
        const canvas = document.createElement('canvas');
        canvas.width = 400; canvas.height = 400;
        const ctx = canvas.getContext('2d');

        // Base Coat (Obsidian)
        ctx.fillStyle = '#050505';
        ctx.fillRect(0, 0, 400, 400);

        // Apply Styles based on "Instructions"
        if (instructions.includes('RUBY')) ctx.strokeStyle = '#ff0000';
        else if (instructions.includes('GOLD')) ctx.strokeStyle = '#d4af37';
        else ctx.strokeStyle = '#00ff41';

        // Draw Shield
        ctx.lineWidth = 10;
        ctx.strokeRect(50, 50, 300, 300);
        
        // Add Digital Noise/Text
        ctx.fillStyle = ctx.strokeStyle;
        ctx.font = '20px monospace';
        ctx.fillText("VPU_SOVEREIGN", 120, 100);
        ctx.fillText(instructions.substring(0, 20), 100, 350);

        return canvas; // Returns the canvas object for ShadowWeave
    }
};