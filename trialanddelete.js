require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');
const cors = require('cors');
const crypto = require('crypto');
// Entry point at login for VPU Access Verification
const bcrypt = require('bcryptjs');
const rateLimit = require('express-rate-limit');
const generateSecureHash = () => crypto.randomBytes(32).toString('hex');

const app = express();

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

// JWT_SECRET is critical for the integrity of the authentication system.
if (!process.env.JWT_SECRET) {
    console.error("[CRITICAL] JWT_SECRET is not defined!");
    process.exit(1);
}

// --- MIDDLEWARE SETUP ---
app.use(helmet());
app.disable('x-powered-by');
app.use(cors()); // Allows the OS Frontend to talk to this Backend
app.use(express.json());
app.use(globalLimiter);

// Database Connection Pool
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

// Middleware to protect routes that require authentication
const bridgeGuardian = async (req, res, next) => {
    const sessionToken = req.headers['x-vpu-token']; // Expecting the raw key here
    const sessionId = req.headers['x-vpu-session-id'];

    if (!sessionToken || !sessionId) {
        return res.status(401).json({ error: "ACCESS_DENIED: Missing Security Vectors" });
    }

    try {
        // Hash the incoming token to compare with DB
        const incomingHash = crypto.createHash('sha256').update(sessionToken).digest('hex');

        const result = await pool.query(
            `SELECT s.*, p.identity_state 
             FROM security_session s
             JOIN person p ON s.person_id = p.id
             WHERE s.id = $1 AND s.session_key_hash = $2 AND s.expires_at > NOW()`,
            [sessionId, incomingHash]
        );

        if (result.rows.length === 0) {
            return res.status(403).json({ error: "SESSION_EXPIRED_OR_INVALID" });
        }

        if (result.rows[0].identity_state === 'LOCKED') {
            return res.status(403).json({ error: "IDENTITY_LOCKED_PENDING_RECOVERY" });
        }

        // Attach user info to request for the next function
        req.user = result.rows[0];
        next();
    } catch (err) {
        res.status(500).json({ error: "GUARDIAN_FAULT" });
    }
};

// ---VPU LOGIN (Identity Binding) ---
app.post('/api/vpu/login', loginLimiter, async (req, res) => {
    const username = req.body.username || req.body.id; 
    const password = req.body.password || req.body.pass;
    const machineFingerprint = req.body.machineFingerprint || req.body.hwSig;
    const ipAddress = req.body.ipAddress || req.ip || "127.0.0.1";

    try {
        const result = await pool.query('SELECT * FROM person WHERE user_name ILIKE $1', [username]);
        
        if (result.rows.length === 0) {
            return res.json({ success: false, message: "IDENTITY_NOT_FOUND" });
        }

        const person = result.rows[0];

        // 1. CHECK IF FROZEN
        if (person.is_frozen) {
            return res.json({ success: false, message: "ACCOUNT_FROZEN" });
        }

        // 2. PASSWORD CHECK
        const validPassword = await bcrypt.compare(password, person.password_hash);
        if (!validPassword) {
            return res.json({ success: false, message: "INVALID_CREDENTIALS" });
        }

        // 3. GENESIS BINDING
        if (!person.bound_machine_id) {
            await pool.query(
                'UPDATE person SET bound_machine_id = $1, bound_ip_address = $2, binding_date = NOW(), failed_attempts = 0 WHERE user_name ILIKE $3',
                [machineFingerprint, ipAddress, username]
            );
            // Update local person object for the JWT payload below
            person.bound_machine_id = machineFingerprint;
        } 
        // 4. HARDWARE ENFORCEMENT
        else if (person.bound_machine_id !== machineFingerprint) {
            const newAttempts = (person.failed_attempts || 0) + 1;
            if (newAttempts >= 3) {
                await pool.query('UPDATE person SET is_frozen = TRUE, failed_attempts = $1 WHERE user_name ILIKE $2', [newAttempts, username]);
                return res.json({ success: false, message: "ACCOUNT_FROZEN" });
            } else {
                await pool.query('UPDATE person SET failed_attempts = $1 WHERE user_name ILIKE $2', [newAttempts, username]);
                return res.json({ success: false, message: "HARDWARE_ID_REJECTED" });
            }
        }

        // 5. PREPARE PASSPORT (JWT)
        // We only get here if password and hardware match
        await pool.query('UPDATE person SET failed_attempts = 0 WHERE user_name ILIKE $1', [username]);

        const token = jwt.sign(
            { id: person.id, username: person.user_name, state: person.identity_state },
            process.env.JWT_SECRET,
            { expiresIn: '2h' }
        );

        console.log(`>>> ACCESS GRANTED: ${username} [Passport Issued]`);

        return res.json({ 
            success: true, 
            token: token, 
            user: {
                username: person.user_name,
                state: person.identity_state,
                bound_machine_id: person.bound_machine_id
            }
        });

    } catch (err) {
        console.error("VPU_CORE_CRITICAL_ERROR:", err);
        return res.status(500).json({ success: false, message: "INTERNAL_ERROR" });
    }
});

// SOVEREIGN SNIFFER (Ingress Verification) ---
// SOVEREIGN SNIFFER (Ingress Verification) ---
app.post('/api/spacs/sniffer', loginLimiter, async (req, res) => {
    const { hw_id, arch } = req.body;
    console.log(`>>> SNIFFER_PROBE: HW_ID [${hw_id?.substring(0,16)}]`);

    try {
        const query = `
            SELECT 
                p.id as person_id,
                p.user_name,
                p.identity_state,
                p.password_hash,
                sd.revoked, 
                sd.os_signature,
                mb.provisioning_status as birthright_status
            FROM security_device sd
            LEFT JOIN person p ON sd.person_id = p.id
            LEFT JOIN member_birthright mb ON p.id = mb.person_id
            LEFT JOIN person_security ps ON p.id = ps.person_id
            WHERE sd.device_fingerprint_hash = $1
        `;
        
        const result = await pool.query(query, [hw_id]);

        if (result.rows.length > 0) {
            
            if (result.rows.length === 0 || !result.rows[0].person_id) {
                return res.json({ status: 'UNPROVISIONED' }); // Gateway 0 -> Form A
            }

            const entry = result.rows[0];

            // STAGE 1: SECURITY KILL-SWITCH (REVOCATION)
            if (entry.revoked || ['REVOKED', 'LOCKED', 'BLACKLISTED'].includes(entry.identity_state)) {
                return res.json({ status: 'REVOKED' });
            }

            // STAGE 2: IDENTITY GATE (WAITING ROOM)
            // If they are a prospect or unverified, they stop here.
            if (!entry.membership_no) {
                return res.json({ status: 'PENDING' }); 
            }

            // STAGE 3: BIRTHRIGHT CLAIM (FORM B)
            // User is ACTIVE/VERIFIED but has not provisioned system resources yet.
            if (entry.birthright_status !== 'ACTIVE') {
                return res.json({ 
                    status: 'REQUIRE_FORM_B',
                    locked_arch: entry.os_signature 
                });
            }

            // STAGE 4: PROFILE SYNC (COMPLETE PROFILE)
            // System is ready, but no password/sovereign profile exists.
            if (!entry.password_hash) {
                return res.json({ status: 'INCOMPLETE' });
            }

            // FINAL STAGE: ACCESS GRANTED
            return res.json({
                status: 'PROVISIONED', 
                user: entry.user_name,
                management: entry.os_signature
            });
        }

        // AUTO-REGISTRATION HANDSHAKE
        // If the hardware isn't in the DB, we record it and send them to Form A.
        await pool.query(
            `INSERT INTO security_device (device_fingerprint_hash, os_signature)
             VALUES ($1, $2) ON CONFLICT DO NOTHING`,
            [hw_id, arch]
        );

    } catch (err) {
        console.error("SNIFFER_FAULT:", err.message);
        res.status(500).json({ error: "BRIDGE_FAULT" });
    }
});

// ---SPACS PROVISIONING WORKFLOW---
// --- FORM A: EXPRESSION OF INTEREST (Identity Lockdown) ---
app.post('/api/spacs/interest', async (req, res) => {
    const { 
        name, email, phone, country, declaration_of_intent, country_code, phone_code, 
        hw_id, arch 
    } = req.body;

    if (!hw_id || !email || !name) {
        return res.status(400).json({ error: "REQUIRED_VECTORS_MISSING" });
    }

    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        // 1. Check if hardware is ALREADY bound to a REAL person (not just a ghost entry)
        const hwCheck = await client.query(
            `SELECT p.official_name FROM person p 
            INNER JOIN security_device sd ON sd.person_id = p.id 
            WHERE sd.device_fingerprint_hash = $1 AND sd.person_id IS NOT NULL`, [hw_id]
        );

        if (hwCheck.rows.length > 0) {
            return res.status(409).json({ 
                success: false, 
                device_locked: true, 
                message: `HARDWARE_LOCKED: Bound to ${hwCheck.rows[0].official_name}` 
            });
        }

        // 2. Insert the Person using columns from your schema.sql
        // Using 'declaration_of_intent' as provided by the frontend
        const personRes = await client.query(
            `INSERT INTO person (official_name, country, identity_state, declaration_of_intent) 
             VALUES ($1, $2, 'PROSPECT', $3) RETURNING id`,
            [name.trim(), country || 'Unknown', declaration_of_intent]
        );
        const personId = personRes.rows[0].id;

        // 3. Adopt the "Ghost Device" created by the Sniffer
        // We UPDATE the record where person_id is currently NULL
        const deviceUpdate = await client.query(
            `UPDATE security_device 
             SET person_id = $1, os_signature = $2 
             WHERE device_fingerprint_hash = $3`,
            [personId, arch || 'Unknown', hw_id]
        );

        // 4. If the device wasn't there (Sniffer missed it), Create it
        if (deviceUpdate.rowCount === 0) {
            await client.query(
                `INSERT INTO security_device (person_id, device_fingerprint_hash, os_signature)
                 VALUES ($1, $2, $3)`,
                [personId, hw_id, arch || 'Unknown']
            );
            
        }
        

        // 5. Bind Contact Info
        const fullPhone = (phone_code && !phone.includes(phone_code)) ? `${phone_code}${phone}` : phone;
        const contacts = [
            ['EMAIL', email.toLowerCase().trim()],
            ['PHONE', fullPhone.trim()]
        ];

        for (let [type, val] of contacts) {
            await client.query(
                `INSERT INTO contact_information (person_id, contact_type, contact_value) VALUES ($1, $2, $3)`,
                [personId, type, val]
            );
        }
        // 6. Initialize Birthright Claim (Form B)
        await client.query(
            `INSERT INTO member_birthright (person_id, provisioning_status) 
            VALUES ($1, 'PENDING')`, [personId]
        );
        await client.query('COMMIT');
        return res.status(201).json({ success: true, message: "IDENTITY_INITIALIZED" });

    } catch (err) {
        await client.query('ROLLBACK');
        if (err.code === '23505') {
            return res.status(400).json({ 
                success: false, 
                already_exists: true, 
                message: "This identity (Email or HW) is already registered." 
            });
        }
        console.error("DATABASE_GENESIS_FAULT:", err.message);
        return res.status(500).json({ error: "REGISTRY_FAILURE" });
    } finally {
        client.release();
    }
});

// Verify Membership and Finalize Provisioning
app.post('/api/spacs/verify-provision', async (req, res) => {
    const { 
        hw_id, official_name, membership_no, license_key, 
        email, phone, phone_code, country, enclave_public_key
    } = req.body;

    // 0. Preliminary Check
    if (!hw_id || !membership_no || !license_key || !enclave_public_key) {
        return res.status(400).json({ error: "REQUIRED_VECTORS_MISSING" });
    }

    const client = await pool.connect();
    const current_ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

    try {
        await client.query('BEGIN');

        // 1. Verify Member + Hardware Match
        const result = await client.query(
            `SELECT p.*, sd.id as device_id 
             FROM person p
             JOIN security_device sd ON sd.person_id = p.id
             WHERE sd.device_fingerprint_hash = $1 
             AND p.membership_no = $2 
             AND p.license_key = $3`,
            [hw_id, membership_no, license_key]
        );

        if (result.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(401).json({ 
                success: false, 
                message: "INVALID_CREDENTIALS: Match not found in Sovereign Registry." 
            });
        }

        const personId = result.rows[0].id;

        // 2. Update Person record with latest metadata
        await client.query(
            `UPDATE person SET 
                official_name = $1, 
                country = $2, 
                identity_state = 'VERIFIED', 
                registration_state = 'complete',
                bound_ip_address = $3,
                binding_date = NOW() 
             WHERE id = $4`,
            [official_name, country, current_ip, personId]
        );

        // 3. Security Tables: Attest Enclave & Primary Binding
        await client.query(
            `UPDATE person_security SET 
                enclave_public_key = $1, 
                enclave_attested = TRUE,
                primary_ip_binding = $2, 
                last_login_ip = $2
             WHERE person_id = $3`, 
            [enclave_public_key, current_ip, personId]
        );
 
        // 4. Contact Info: Update Email & Phone
        const fullPhone = `${phone_code}${phone}`;
        const contacts = [['EMAIL', email.toLowerCase()], ['PHONE', fullPhone]];
        for (let [type, val] of contacts) {
            await client.query(
                `INSERT INTO contact_information (person_id, contact_type, contact_value)
                 VALUES ($1, $2, $3)
                 ON CONFLICT (person_id, contact_type) DO UPDATE SET contact_value = $3`,
                [personId, type, val]
            );
        }

        // 5. Initialize Root Trust Chain
        await client.query(
            `INSERT INTO identity_trust_chain (person_id, public_key, key_purpose)
             VALUES ($1, $2, 'ROOT')`, 
            [personId, enclave_public_key]
        );

        // 6. Birthright Activation
        await client.query(
            `UPDATE member_birthright SET provisioning_status = 'ACTIVE', activated_at = NOW() 
             WHERE person_id = $1`, [personId]
        );
        

       // 7. Generate Initial Security Session (Sticky IP logic lives here)
        const sessionData = await createSecuritySession(personId, current_ip, result.rows[0].device_id);

        await client.query('COMMIT');


        // 8. Final Success Response
        res.json({ 
            success: true, 
            message: "PROVISION_GRANTED",
            shell_url: "/builds/core-os-v1.iso",
            session_id: sessionData.sessionId,
            token: sessionData.sessionKey 
        });

    } catch (err) {
        await client.query('ROLLBACK');
        
        // Specific handling for the Sticky IP Lock
        if (err.message.includes("HIJACK_DETECTION")) {
            console.error(`>>> SECURITY_ALERT: ${official_name} locked due to IP mismatch.`);
            return res.status(403).json({ 
                success: false, 
                error: "SECURITY_LOCK", 
                message: err.message 
            });
        }

        console.error("PROVISION_FAULT:", err.message);
        res.status(500).json({ error: "INTERNAL_BRIDGE_FAULT" });
    } finally {
        client.release();
    }
});

// --- COMPLETE PROFILE (Final Identity Handshake) ---
app.post('/api/spacs/complete-profile', bridgeGuardian, async (req, res) => {
    res.json({ message: "Welcome to the Enclave", user: req.user.person_id });
    const { 
        hw_id, 
        password, 
        user_name, 
        date_of_birth, 
        gender, 
        bio, 
        titles, 
        avatar 
    } = req.body;

    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        // 1. LOCATE THE PERSON VIA HARDWARE BINDING
        // We find the person associated with the security device that sent this request
        const bindingQuery = `
            SELECT p.id, p.identity_state 
            FROM person p
            JOIN security_device sd ON sd.person_id = p.id
            WHERE sd.device_fingerprint_hash = $1
            LIMIT 1
        `;
        const bindingResult = await client.query(bindingQuery, [hw_id]);

        if (bindingResult.rows.length === 0) {
            throw new Error("DEVICE_NOT_RECOGNIZED: Complete Provisioning Step 2 first.");
        }

        const personId = bindingResult.rows[0].id;

        // 2. UPDATE PRIMARY IDENTITY
        // We update the fields, set status to ACTIVE, and stage to COMPLETE
        const updatePersonQuery = `
            UPDATE person SET 
                user_name = $1, 
                date_of_birth = $2, 
                gender = $3, 
                contact_meta = jsonb_set(COALESCE(contact_meta, '{}'), '{bio}', $4),
                titles = $5,
                avatar_data = $6,
                provision_stage = 'COMPLETE',
                identity_state = 'ACTIVE',
                updated_at = NOW()
            WHERE id = $7
        `;
        await client.query(updatePersonQuery, [
            user_name, 
            date_of_birth, 
            gender, 
            JSON.stringify(bio), 
            titles, 
            avatar, 
            personId
        ]);

        // 3. SECURE PASSWORDS
        // Hash the password and store in the person_security table
        const saltRounds = 12;
        const passwordHash = await bcrypt.hash(password, saltRounds);

        const securityQuery = `
            INSERT INTO person_security (person_id, password_hash, updated_at)
            VALUES ($1, $2, NOW())
            ON CONFLICT (person_id) 
            DO UPDATE SET password_hash = $2, updated_at = NOW()
        `;
        await client.query(securityQuery, [personId, passwordHash]);

        // 4. ATTEST THE DEVICE AS FULLY INITIALIZED
        await client.query(
            `UPDATE security_device SET enclave_attested = TRUE WHERE device_fingerprint_hash = $1`,
            [hw_id]
        );

        await client.query(
    `INSERT INTO person_security (person_id, password_hash) VALUES ($1, $2)`,
            [personId, passwordHash]
        );
        await client.query(`UPDATE person SET identity_state = 'ACTIVE' WHERE id = $1`, [personId]);

        await client.query('COMMIT');

        console.log(`>>> INGRESS_COMPLETE: ${user_name} has entered the Enclave.`);

        res.status(200).json({ 
            success: true, 
            message: "IDENTITY_SYNCHRONIZED",
            redirect: "./Thealcohesion-core/index.html" 
        });

    } catch (err) {
        await client.query('ROLLBACK');
        console.error("INGRESS_FAULT:", err.message);
        res.status(500).json({ error: err.message || "DATABASE_UPLINK_CRITICAL" });
    } finally {
        client.release();
    }
});

// API: Check Citizenship Approval Status
app.get('/api/spacs/check-status', async (req, res) => {
    res.set({
    'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0'
    });
    const { hw_id } = req.query;

    try {
        // Query looking for the person bound to this hardware
        // We check 'person' table because that's where identity_state lives
        const result = await pool.query(
            `SELECT p.identity_state, p.is_frozen 
             FROM person p
             JOIN security_device sd ON sd.person_id = p.id
             WHERE sd.device_fingerprint_hash = $1`, 
            [hw_id]
        );

        const user = result.rows[0];

        if (!user) {
            return res.json({ status: 'NOT_FOUND', message: 'ID not in Registry.' });
        }

        if (user.is_frozen) {
            return res.json({ status: 'FROZEN' });
        }

        // Match the 'ACTIVE' state set in your /complete-profile route
        if (user.identity_state === 'ACTIVE' || user.identity_state === 'verified') {
            return res.json({ status: 'APPROVED' });
        }

        // If state is 'PROSPECT' or 'unverified', it remains PENDING
        res.json({ status: 'PENDING' });

    } catch (err) {
        console.error("DATABASE_ERROR:", err.message);
        res.status(500).json({ error: "CORE_UPLINK_OFFLINE" });
    }
});

async function createSecuritySession(personId, current_ip, device_id) {
    const client = await pool.connect();
    try {
        const p = (await client.query(`SELECT * FROM person WHERE id = $1`, [personId])).rows[0];

        // LOGIC 1: STICKY IP BINDING (24h Window)
        const bindingAgeHours = (new Date() - new Date(p.binding_date)) / 36e5;
        
        // Ensure we actually have a binding_date before checking age
        if (p.binding_date && bindingAgeHours < 24 && p.bound_ip_address !== current_ip) {
            await client.query(`UPDATE person SET identity_state = 'LOCKED' WHERE id = $1`, [personId]);
            throw new Error("HIJACK_DETECTION: IP mismatch in 24h window. Identity LOCKED.");
        }

        // LOGIC 2: SESSION TRUST KEY
        const sessionKey = generateSecureHash();
        const sessionKeyHash = crypto.createHash('sha256').update(sessionKey).digest('hex');

        
        const session = await client.query(
            `INSERT INTO security_session (person_id, device_id, session_key_hash, ip_address, trust_snapshot, expires_at)
            VALUES ($1, $2, $3, $4, $5, NOW() + interval '4 hours') RETURNING id`,
            [personId, device_id, sessionKeyHash, current_ip, p.trust_level || 1]
        );

        // LOGIC 3: UPDATE TRUST CHAIN (Rotation)
        await client.query(
            `INSERT INTO identity_trust_chain (person_id, parent_chain_id, public_key, key_purpose)
             VALUES ($1, (SELECT id FROM identity_trust_chain WHERE person_id = $1 AND key_purpose = 'ROOT' LIMIT 1), $2, 'SESSION')`,
            [personId, sessionKey]
        );

        return { sessionId: session.rows[0].id, sessionKey: sessionKey };
    } finally { 
        client.release(); 
    }
}

app.listen(3000, () => console.log('Sovereign Link: Port 3000'));