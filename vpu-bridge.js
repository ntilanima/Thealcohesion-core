require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');
const cors = require('cors');
// Entry point at login for VPU Access Verification
const bcrypt = require('bcryptjs');

const app = express();
app.use(helmet());
app.disable('x-powered-by');
app.use(cors()); // Allows the OS Frontend to talk to this Backend
app.use(express.json());

const rateLimit = require('express-rate-limit');

// 1. THE CITY WALL: Global limiter (Prevents server exhaustion)
const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per window
    message: { error: "VPU_TRAFFIC_OVERLOAD: Access throttled for 15 mins." },
    standardHeaders: true, 
    legacyHeaders: false,
});

// 2. THE VAULT DOOR: Strict Login Limiter (Prevents Brute-Force)
const loginLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour window
    max: 5, // Only 5 attempts per hour
    message: { error: "SECURITY_LOCKOUT: Too many failed identity syncs. Try again in 1 hour." },
    // Only count failed attempts? You can add logic for that, 
    // but for "Sovereign" security, it's safer to limit all hits to this endpoint.
});

// Add this log to verify the bridge sees the password during startup
console.log(`[SYS] Initializing Bridge for User: ${process.env.DB_USER}`);
if (!process.env.DB_PASSWORD) {
    console.error("[CRITICAL] DB_PASSWORD is not defined in .env!");
}

const pool = new Pool({
  user: process.env.DB_USER || 'archanti',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'thealcohesion_vpu',
  password: String(process.env.DB_PASSWORD || 'archanti'), // Force string type
  port: process.env.DB_PORT || 5432,
});

// Diagnostic check on startup
console.log(`[UPLINK] Attempting connection to ${process.env.DB_NAME} as ${process.env.DB_USER}...`);
pool.query('SELECT NOW()', (err) => {
    if (err) {
        console.error("!!! DATABASE_CONNECTION_FAILED:", err.message);
    } else {
        console.log(">>> DATABASE_LINK_ESTABLISHED: OK");
    }
});

// API Endpoint for the OS Kernel to fetch global status
app.get('/api/vpu/status', async (req, res) => {
    try {
        const result = await pool.query('SELECT COUNT(*) FROM person');
        res.json({ total_members: result.rows[0].count, status: 'ONLINE' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});



// ---VPU LOGIN (Identity Binding) ---
app.post('/api/vpu/login', loginLimiter, async (req, res) => {
    // FIX: Map frontend names (id/pass/hwSig) to backend variables
    const username = req.body.username || req.body.id; 
    const password = req.body.password || req.body.pass;
    const machineFingerprint = req.body.machineFingerprint || req.body.hwSig;
    const ipAddress = req.body.ipAddress || req.ip || "127.0.0.1";

    console.log(`>>> UPLINK_REQUEST: Identity [${username}] from Machine [${machineFingerprint}]`);

    try {
        const result = await pool.query('SELECT * FROM person WHERE user_name = $1', [username]);
        
        if (result.rows.length === 0) {
            console.error(`[!!] IDENTITY_NOT_FOUND: User "${username}" not found in database.`);
            return res.json({ success: false, message: "IDENTITY_NOT_FOUND" });
        }

        const person = result.rows[0];

        // 1. CHECK IF FROZEN
        if (person.is_frozen) {
            console.log(`[REJECT] ${username} is FROZEN.`);
            return res.json({ success: false, message: "ACCOUNT_FROZEN" });
        }

        // 2. PASSWORD CHECK
        const validPassword = await bcrypt.compare(password, person.password_hash);
        if (!validPassword) {
            console.log(`[REJECT] Invalid password for ${username}.`);
            return res.json({ success: false, message: "INVALID_CREDENTIALS" });
        }

        // 3. GENESIS BINDING (If first time or recently reset to NULL)
        if (!person.bound_machine_id) {
            await pool.query(
                'UPDATE person SET bound_machine_id = $1, bound_ip_address = $2, binding_date = NOW(), failed_attempts = 0 WHERE user_name = $3',
                [machineFingerprint, ipAddress, username]
            );
            console.log(`>>> GENESIS LINK ESTABLISHED: ${username} bound to machine ${machineFingerprint}`);
            // Fetch updated person for success response
            const updatedResult = await pool.query('SELECT * FROM person WHERE user_name = $1', [username]);
            return res.json({ success: true, user: { ...updatedResult.rows[0], bound_machine_id: machineFingerprint } });
        };

        // 4. SECURITY ENFORCEMENT (Hardware/IP Match)
        const machineMatch = person.bound_machine_id === machineFingerprint;
        
        if (!machineMatch) {
            const newAttempts = (person.failed_attempts || 0) + 1;
            if (newAttempts >= 3) {
                await pool.query('UPDATE person SET is_frozen = TRUE, failed_attempts = $1 WHERE user_name = $2', [newAttempts, username]);
                return res.json({ success: false, message: "ACCOUNT_FROZEN" });
            } else {
                await pool.query('UPDATE person SET failed_attempts = $1 WHERE user_name = $2', [newAttempts, username]);
                return res.json({ success: false, message: "HARDWARE_ID_REJECTED" });
            }
        };

        // 5. SUCCESS
        await pool.query('UPDATE person SET failed_attempts = 0 WHERE user_name = $1', [username]);
        console.log(`>>> ACCESS GRANTED: ${username}`);
        return res.json({ success: true, user: person });

            } catch (err) {
                console.error("VPU_CORE_CRITICAL_ERROR:", err);
                res.status(500).json({ success: false, message: "INTERNAL_ERROR" });
            }

        const token = jwt.sign(
            { 
                id: person.id, 
                username: person.user_name,
                state: person.identity_state 
            },
            process.env.JWT_SECRET,
            { expiresIn: '2h' } // Token expires in 2 hours
        );

        console.log(`>>> ACCESS GRANTED: ${username} [Passport Issued]`);

        return res.json({ 
            success: true, 
            token: token, // Send the passport to the frontend
            user: {
                username: person.user_name,
                state: person.identity_state
            }
        });
});

// SOVEREIGN SNIFFER (Ingress Verification) ---
app.post('/api/spacs/sniffer', loginLimiter, async (req, res) => {
    const { hw_id, arch} = req.body; // Full payload from landing.js
    
    console.log(`>>> SNIFFER_PROBE: HW_ID [${hw_id?.substring(0,16)}]`);

    try {
        // Query looks for Device Security, Person Identity, and Birthright Allotments
        const query = `
            SELECT 
                p.user_name,
                p.identity_state,
                sd.revoked, 
                sd.enclave_attested,
                sd.os_signature,
                mb.storage_quota_mb
            FROM security_device sd
            LEFT JOIN person p ON sd.person_id = p.id
            LEFT JOIN member_birthright mb ON p.id = mb.person_id
            WHERE sd.device_fingerprint_hash = $1
        `;
        
        const result = await pool.query(query, [hw_id]);

        if (result.rows.length > 0) {
            const entry = result.rows[0];

            if (entry.revoked || entry.identity_state === 'BLACKLISTED') {
                return res.status(403).json({ provision_stage: 'REVOKED' });
            }

            return res.json({
                provision_stage: entry.enclave_attested ? 'PROVISIONED' : 'UNPROVISIONED',
                // Tells the frontend which OS this device is bound to
                registration_state: entry.identity_state || 'incompleteRegistration',
                provision_management: entry.os_signature, 
                user: entry.user_name,
                birthright: {
                    quota: entry.storage_quota_mb,
                }
            });
        }

        // AUTO-REGISTRATION: Log new hardware candidates into the schema
        await pool.query(
            `INSERT INTO security_device (device_fingerprint_hash, os_signature, enclave_attested)
             VALUES ($1, $2, FALSE) ON CONFLICT DO NOTHING`,
            [hw_id, arch]
        );

        res.json({ provision_stage: 'INITIAL'});

    } catch (err) {
        console.error("SNIFFER_FAULT:", err.message);
        res.status(500).json({ error: "BRIDGE_FAULT" });
    }
});

pool.on('error', (err, client) => {
  console.error('Unexpected error on idle client', err);
  // Do not process.exit() - keep the server alive!
});

// ---SPACS PROVISIONING WORKFLOW---
// A. EXPRESSION OF INTEREST (PRE-REGISTRATION)
app.post('/api/spacs/interest', async (req, res) => {
    const { name, email, phone, reason, country } = req.body;
    try {
        await pool.query(
            `INSERT INTO person (user_name, identity_state, contact_meta) 
             VALUES ($1, 'PENDING_APPROVAL', $2)`,
            [name, JSON.stringify({ email, phone, reason, country })]
        );
        res.json({ success: true, message: "REQUEST_LOGGED: Wait for Admin Dispatch." });
    } catch (err) {
        res.status(500).json({ error: "REGISTRATION_FAULT" });
    }
});

// B. VERIFY & PROVISION (FINAL BINDING)
app.post('/api/spacs/verify-provision', async (req, res) => {
    const { license, membership_no, hw_id, arch } = req.body;

    try {
        // 1. Check if License and Member No. exist and are valid
        // Note: In production, you'd have a 'license_keys' table linked to 'person'
        const userCheck = await pool.query(
            `SELECT p.id, p.user_name FROM person p 
             WHERE p.membership_no = $1 AND p.license_key = $2`,
            [membership_no, license]
        );

        if (userCheck.rows.length === 0) {
            return res.status(403).json({ error: "INVALID_CREDENTIALS" });
        }

        const personId = userCheck.rows[0].id;

        // 2. Bind the Hardware
        await pool.query(
            `UPDATE security_device 
             SET person_id = $1, enclave_attested = TRUE, os_signature = $2 
             WHERE device_fingerprint_hash = $3`,
            [personId, arch, hw_id]
        );

        // 3. Check for Shell Availability (Logic for your question)
        const shellCheck = await pool.query(`SELECT download_url FROM platform WHERE os_name = $1`, [arch]);
        const shellUrl = shellCheck.rows[0]?.download_url || null;

        res.json({ 
            success: true, 
            shell_download: shellUrl, 
            message: shellUrl ? "SHELL_FOUND: INITIALIZING_DOWNLOAD" : "WEB_ONLY_PROVISION_COMPLETE" 
        });

    } catch (err) {
        res.status(500).json({ error: "PROVISIONING_CRITICAL_FAILURE" });
    }
});
app.listen(3000, () => console.log('Sovereign Link: Port 3000'));