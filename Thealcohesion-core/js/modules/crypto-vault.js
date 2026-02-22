/**
 * crypto-vault.js
 * SOVEREIGN_ENCRYPTION_SUITE // VPU_VAULT_CORE
 * PURPOSE: AES-GCM 256-bit encryption for Shadow-Link payloads.
 */

export const CryptoVault = {
    // A Sovereign Salt for key derivation
    SALT: new TextEncoder().encode("ARCHANTILANI_GENESIS_2026"),

    /**
     * Derives a cryptographic key from a user's passphrase/SovereignKey
     */
    async deriveKey(passphrase) {
        const encoder = new TextEncoder();
        const baseKey = await crypto.subtle.importKey(
            "raw",
            encoder.encode(passphrase),
            "PBKDF2",
            false,
            ["deriveKey"]
        );

        return crypto.subtle.deriveKey(
            {
                name: "PBKDF2",
                salt: this.SALT,
                iterations: 100000,
                hash: "SHA-256"
            },
            baseKey,
            { name: "AES-GCM", length: 256 },
            true,
            ["encrypt", "decrypt"]
        );
    },

    /**
     * Encrypts plain text into a hex-encoded string
     */
    async encrypt(plainText, passphrase) {
        const key = await this.deriveKey(passphrase);
        const iv = crypto.getRandomValues(new Uint8Array(12)); // Initialization Vector
        const encoded = new TextEncoder().encode(plainText);

        const ciphertext = await crypto.subtle.encrypt(
            { name: "AES-GCM", iv: iv },
            key,
            encoded
        );

        // Combine IV and Ciphertext for transport
        const combined = new Uint8Array(iv.length + ciphertext.byteLength);
        combined.set(iv);
        combined.set(new Uint8Array(ciphertext), iv.length);

        // Return as Hex string for easy storage in image pixels
        return Array.from(combined).map(b => b.toString(16).padStart(2, '0')).join('');
    },

    /**
     * Decrypts a hex-encoded shadow payload
     */
    async decrypt(hexString, passphrase) {
        try {
            const key = await this.deriveKey(passphrase);
            const combined = new Uint8Array(hexString.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));
            
            const iv = combined.slice(0, 12);
            const ciphertext = combined.slice(12);

            const decrypted = await crypto.subtle.decrypt(
                { name: "AES-GCM", iv: iv },
                key,
                ciphertext
            );

            return new TextDecoder().decode(decrypted);
        } catch (err) {
            console.error("DECRYPTION_FAILED: Invalid Key or Corrupt Payload.");
            return null;
        }
    }
};