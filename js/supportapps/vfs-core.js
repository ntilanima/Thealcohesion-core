/**
 * Sovereign VFS - Core Security Drivers (Debugged)
 */
export const SovereignVFS = {
    DB_NAME: "SovereignCore_VFS",
    STORE_NAME: "vault",
    _db: null, // Singleton connection cache

    async init() {
        if (this._db) return this._db; // Return existing connection if open
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.DB_NAME, 1);
            request.onupgradeneeded = (e) => {
                const db = e.target.result;
                if (!db.objectStoreNames.contains(this.STORE_NAME)) {
                    db.createObjectStore(this.STORE_NAME, { keyPath: "path" });
                }
            };
            request.onsuccess = () => {
                this._db = request.result;
                resolve(this._db);
            };
            request.onerror = () => reject("Hardware Access Error");
        });
    },

    async deriveKey(password, memberId) {
        try {
            const enc = new TextEncoder();
            const salt = enc.encode(`sovereign_${memberId}`);
            const baseKey = await crypto.subtle.importKey(
                "raw", enc.encode(password), "PBKDF2", false, ["deriveKey"]
            );
            return await crypto.subtle.deriveKey(
                { name: "PBKDF2", salt, iterations: 100000, hash: "SHA-256" },
                baseKey, { name: "AES-GCM", length: 256 }, false, ["encrypt", "decrypt"]
            );
        } catch (e) {
            console.error("VFS_CORE: Key Derivation Failed", e);
            throw e;
        }
    },

    async write(path, content, key) {
        const db = await this.init();
        const iv = crypto.getRandomValues(new Uint8Array(12));
        const encoded = new TextEncoder().encode(content);
        const ciphertext = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, encoded);

        return new Promise((resolve, reject) => {
            const tx = db.transaction(this.STORE_NAME, "readwrite");
            const store = tx.objectStore(this.STORE_NAME);
            const request = store.put({
                path, data: ciphertext, iv, size: content.length, modified: Date.now()
            });
            tx.oncomplete = () => resolve();
            tx.onerror = () => reject("Write transaction failed");
        });
    },

    async read(path, key) {
        const db = await this.init();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(this.STORE_NAME, "readonly");
            const store = tx.objectStore(this.STORE_NAME);
            const request = store.get(path);

            request.onsuccess = async () => {
                const record = request.result;
                if (!record) return resolve(null);
                try {
                    const decrypted = await crypto.subtle.decrypt(
                        { name: "AES-GCM", iv: record.iv }, 
                        key, 
                        record.data
                    );
                    resolve(new TextDecoder().decode(decrypted));
                } catch (e) {
                    reject("Decryption error: Possibly bad key");
                }
            };
            request.onerror = () => reject("Read transaction failed");
        });
    }
};