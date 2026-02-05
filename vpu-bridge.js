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
// --- FORM A: EXPRESSION OF INTEREST ---
/* --- LEAD INTAKE: EXPRESSION OF INTEREST --- */
app.post('/api/spacs/interest', async (req, res) => {
    const { name, country, phone, email, reason } = req.body;

    try {
        // 1. CHECK FOR EXISTING IDENTITY (Email or Phone)
        const checkQuery = `
            SELECT p.id, p.official_name, p.identity_state 
            FROM person p
            LEFT JOIN contact_information c ON p.id = c.person_id
            WHERE c.contact_value = $1 OR c.contact_value = $2
            LIMIT 1
        `;
        const existing = await pool.query(checkQuery, [email, phone]);

        if (existing.rows.length > 0) {
            const user = existing.rows[0];
            
            // IF THEY EXIST: Tell them to go to Provisioning
            return res.status(200).json({ 
                success: false, // False because we aren't creating a new lead
                already_exists: true,
                message: `IDENTITY_FOUND: ${user.official_name}, your credentials are already in our registry. Please use the 'Verify & Provision' form to claim your architecture.`,
                action: "SWITCH_TO_PROVISION" 
            });
        }

        // 2. NEW PROSPECT: Create the Person Entry
        const newPerson = await pool.query(
            `INSERT INTO person (official_name, country, identity_state, contact_meta) 
             VALUES ($1, $2, 'PENDING_APPROVAL', $3) RETURNING id`,
            [name, country, `INITIAL_INTEREST: ${reason}`]
        );

        const personId = newPerson.rows[0].id;

        // 3. STORE CONTACT DETAILS
        await pool.query(
            `INSERT INTO contact_information (person_id, contact_type, contact_value) 
             VALUES ($1, 'EMAIL', $2), ($1, 'PHONE', $3)`,
            [personId, email, phone]
        );

        res.status(201).json({ 
            success: true, 
            message: "SOVEREIGN_REGISTRY_UPDATED: Your interest has been logged. Admin review pending." 
        });

    } catch (err) {
        console.error("INTEREST_SUBMISSION_ERROR:", err);
        res.status(500).json({ error: "REGISTRY_LINK_FAULT" });
    }
});

// --- FORM B: VERIFY & PROVISION (With Shell Logic) ---
// Handle Verify & Provision
app.post('/api/spacs/verify-provision', async (req, res) => {
    const { name, license, membership_no, phone, email, hw_id, arch } = req.body;

    try {
        // 1. CHECK LICENSE & MEMBERSHIP EXISTENCE
        const licenseCheck = await pool.query(
            `SELECT p.id, p.official_name, c.contact_value as phone, (SELECT c2.contact_value FROM contact_information c2 WHERE c2.person_id = p.id AND c2.contact_type = 'EMAIL' LIMIT 1) as registered_email
             FROM person p
             LEFT JOIN contact_information c ON p.id = c.person_id AND c.contact_type = 'PHONE'
             WHERE p.license_key = $1 OR p.membership_no = $2`,
            [license, membership_no]
        );

        if (licenseCheck.rows.length === 0) {
            return res.status(401).json({ error: "INVALID_PROTOCOL: License or Membership No. not found in Sovereign Registry." });
        }

        const registeredUser = licenseCheck.rows[0];

        // 2. DETECT IDENTITY MISMATCH (Security Flag)
        // If the license exists but the name provided doesn't match the database
        if (registeredUser.official_name.toLowerCase() !== name.toLowerCase()) {
            console.warn(`[SECURITY ALERT] Identity Mismatch for License ${license}. Provided: ${name}, Expected: ${registeredUser.official_name}`);
            return res.status(403).json({ 
                error: "IDENTITY_CONFLICT: The provided name does not match the record bound to this License Key. Verification logged." 
            });
        }

        // 3. DETECT CONTACT MISMATCH
        // If phone/email is valid elsewhere but doesn't match this specific license
        if (registeredUser.registered_phone !== phone || registeredUser.registered_email !== email) {
            return res.status(403).json({ 
                error: "CONTACT_MISMATCH: Provided phone or email does not match..." 
            });
        }

        // 4. HARDWARE BINDING CHECK
        const hardwareCheck = await pool.query(
            `SELECT person_id FROM security_device WHERE device_fingerprint_hash = $1`,
            [hw_id]
        );

        if (hardwareCheck.rows.length > 0 && hardwareCheck.rows[0].person_id !== registeredUser.id) {
            return res.status(403).json({ 
                error: "HARDWARE_LOCK: This device is already bound to another Sovereign Identity." 
            });
        }

        // 5. SUCCESS: UPDATE & DELIVER
        await pool.query(
            `UPDATE security_device SET person_id = $1, enclave_attested = TRUE, last_sync = NOW() WHERE device_fingerprint_hash = $2`,
            [registeredUser.id, hw_id]
        );

        const download = await pool.query(
            `SELECT download_url FROM operating_system WHERE os_name ILIKE $1 AND is_active = TRUE`,
            [`%${arch}%`]
        );

        res.json({ 
            success: true, 
            shell_url: download.rows[0]?.download_url || "/builds/default-kernel.iso",
            message: "PROVISION_GRANTED" 
        });

    } catch (err) {
        console.error("SEC_ENGINE_CRASH:", err);
        res.status(500).json({ error: "INTERNAL_KERNEL_ERROR" });
    }
});
app.listen(3000, () => console.log('Sovereign Link: Port 3000'));