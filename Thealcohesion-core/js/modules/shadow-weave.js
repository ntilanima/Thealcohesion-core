/**
 * shadow-weave.js
 * SOVEREIGN_STEGANOGRAPHY_ENGINE // VPU_SHADOW_CORE
 * PURPOSE: Encodes/Decodes data within the Alpha channel of PNG assets.
 */

export const ShadowWeave = {
    /**
     * ENCODE: Injects a secret string into an image.
     * @param {string} secretData - The text/code to hide.
     * @param {HTMLImageElement} imgElement - The carrier image (e.g., Founder Badge).
     * @returns {string} - Data URL of the modified PNG.
     */
    encode: (secretData, imgElement) => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        canvas.width = imgElement.width;
        canvas.height = imgElement.height;
        ctx.drawImage(imgElement, 0, 0);

        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const pixels = imgData.data;

        // We use a specific 'Shadow Header' so the decoder knows this image 
        // actually contains Sovereign data.
        const header = "SVGN_";
        const payload = header + secretData + "\0"; // \0 is the null terminator

        if (payload.length > (pixels.length / 4)) {
            throw new Error("DATA_OVERFLOW: Payload too large for carrier image.");
        }

        for (let i = 0; i < payload.length; i++) {
            // Index (i * 4 + 3) targets the Alpha (transparency) channel of each pixel
            // Visual impact is effectively zero in high-res PNGs.
            pixels[i * 4 + 3] = payload.charCodeAt(i);
        }

        ctx.putImageData(imgData, 0, 0);
        return canvas.toDataURL('image/png');
    },

    /**
     * DECODE: Extracts secret strings from a shadow-encoded image.
     * @param {HTMLImageElement} imgElement - The image to scan.
     * @returns {string|null} - The hidden message or null if no header found.
     */
    decode: (imgElement) => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        canvas.width = imgElement.width;
        canvas.height = imgElement.height;
        ctx.drawImage(imgElement, 0, 0);

        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const pixels = imgData.data;
        let extracted = "";

        for (let i = 0; i < pixels.length; i += 4) {
            const charCode = pixels[i + 3];
            if (charCode === 0) break; // Stop at null terminator
            extracted += String.fromCharCode(charCode);
        }

        // Verify the Sovereign Header
        if (extracted.startsWith("SVGN_")) {
            return extracted.replace("SVGN_", "");
        }
        
        return null; // No shadow data found
    }
};