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
        // 1. PRIMARY CHECK: Is this device already in our Registry?
        const checkQuery = `
            SELECT 
                p.id as person_id, 
                p.official_name, 
                p.identity_state,      
                p.registration_state, 
                p.membership_no, 
                p.license_key,
                p.password_hash,
                p.user_name,
                sd.revoked, 
                mb.provisioning_status 
            FROM security_device sd
            LEFT JOIN person p ON sd.person_id = p.id
            LEFT JOIN member_birthright mb ON p.id = mb.person_id
            WHERE sd.device_fingerprint_hash = $1
        `;
        
        const result = await pool.query(checkQuery, [hw_id]);

        // --- BLOCK A: HARDWARE RECOGNIZED (NO GHOST ALLOWED) ---
        if (result.rows.length > 0) {
            const u = result.rows[0];

            //If device exists but person is missing, 
            // stop here so Case B is never reached.
            if (!u.person_id) return res.json({ status: 'INITIAL' });

            // 6) GO OS-CORE: Registration=COMPLETE, Identity=VERIFIED, Provisioning=PROVISIONED, Password & Username NOT EMPTY
            if (u.registration_state === 'COMPLETE' && 
                u.identity_state === 'VERIFIED' && 
                u.provisioning_status === 'PROVISIONED' &&
                u.password_hash && u.user_name) {
                return res.json({ status: 'PROVISIONED', user: u.official_name });
            }

            // 5) GO TO COMPLETE-PROFILE: Registration=PRECOMPLETE, Provisioning=PROVISIONED, Identity=PREVERIFIED
            if (u.registration_state === 'PRECOMPLETE' && 
                u.provisioning_status === 'PROVISIONED' && 
                u.identity_state === 'PREVERIFIED') {
                return res.json({ status: 'REQUIRE_PROFILE' });
            }

            // 3) GO TO FORM B: Registration=PENDING, Identity=UNVERIFIED, Provisioning=UNPROVISIONED, Keys NOT EMPTY
            if (u.registration_state === 'PENDING' && 
                u.identity_state === 'UNVERIFIED' && 
                u.provisioning_status === 'UNPROVISIONED' && 
                u.membership_no && u.license_key) {
                return res.json({ status: 'REQUIRE_FORM_B' });
            }

            // 4) GO TO WAITING: Registration=PENDING, Identity=UNVERIFIED, Provisioning=UNPROVISIONED, Keys EMPTY
            if (u.registration_state === 'PENDING' && 
                u.identity_state === 'UNVERIFIED' && 
                u.provisioning_status === 'UNPROVISIONED' && 
                !u.membership_no) {
                return res.json({ status: 'WAITING' });
            }

            // 2) TO FORM A: Official_name=PROSPECT_RESERVED, Registration=INITIAL, Identity=PROSPECT, Provisioning=PENDING
            if (u.official_name === 'PROSPECT_RESERVED' && 
                u.registration_state === 'INITIAL' && 
                u.identity_state === 'PROSPECT') {
                return res.json({ status: 'INITIAL' });
            }

            /** * CRITICAL FALLBACK: 
             * If the hw_id exists but matched none of the specific logic above, 
             * we return 'INITIAL' to prevent the code from continuing to Case B.
             */
            return res.json({ status: 'INITIAL' });
            
        } else {
        // --- CASE B: GHOST HANDSHAKE (First time seeing this hardware) ---
        // We use a transactional client to prevent "No Parameter $1" errors
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            // 1. Create Identity
            const personRes = await client.query(
                `INSERT INTO person (official_name, identity_state, registration_state) 
                 VALUES ('PROSPECT_RESERVED', 'PROSPECT', 'INITIAL') RETURNING id`
            );
            const personId = personRes.rows[0].id;

            // 2. Bind Hardware (Ensure all columns match your schema)
            await client.query(
                `INSERT INTO security_device (person_id, device_fingerprint_hash, device_type, os_signature)
                 VALUES ($1, $2, $3, $4) 
                 ON CONFLICT (device_fingerprint_hash) DO UPDATE SET person_id = EXCLUDED.person_id`,
                [personId, hw_id, 'VPU_STATION', arch || 'Unknown']
            );

            // 3. Initialize Birthright Slot
            await client.query(
                `INSERT INTO member_birthright (person_id, provisioning_status) 
                 VALUES ($1, 'PENDING')`, 
                [personId]
            );

            await client.query('COMMIT');
            console.log(`>>> GENESIS SUCCESS: HW_ID [${hw_id.substring(0,8)}] Registered to Person [${personId}]`);
            return res.json({ status: 'INITIAL' });

        } catch (handshakeErr) {
            await client.query('ROLLBACK');
            // Handle race condition if two requests hit at the exact same millisecond
            if (handshakeErr.code === '23505') {
                return res.json({ status: 'INITIAL' });
            }
            throw handshakeErr; 
        } finally {
            client.release();
        }
    }
    } catch (err) {
        console.error("SNIFFER_FAULT:", err.message);
        res.status(500).json({ error: "BRIDGE_FAULT" });
    }
});

// ---SPACS PROVISIONING WORKFLOW---
// --- FORM A: EXPRESSION OF INTEREST (Identity Lockdown) ---
// --- FORM A: EXPRESSION OF INTEREST (Update Existing Prospect) ---
app.post('/api/spacs/interest', async (req, res) => {
    const { 
        name, email, phone, country, declaration_of_intent, phone_code, 
        hw_id, arch 
    } = req.body;

    if (!hw_id || !email || !name || !phone || !country || !declaration_of_intent || !phone_code || !arch) {
        return res.status(400).json({ error: "REQUIRED_VECTORS_MISSING" });
    }

    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        // 1. Resolve Person ID (Link Ghost record to real identity)
        const checkResult = await client.query(
            `SELECT p.id FROM person p 
             JOIN security_device sd ON sd.person_id = p.id 
             WHERE sd.device_fingerprint_hash = $1`, 
            [hw_id]
        );

        let personId;

        if (checkResult.rows.length > 0) {
            personId = checkResult.rows[0].id;
            // UPDATE: Move from INITIAL to PENDING/UNVERIFIED logic
            await client.query(
                `UPDATE person 
                 SET official_name = $1, 
                     country = $2, 
                     registration_state = 'PENDING', 
                     identity_state = 'UNVERIFIED', 
                     declaration_of_intent = $3
                 WHERE id = $4`,
                [name.trim(), country || 'Unknown', declaration_of_intent, personId]
            );
        } else {
            // FALLBACK: Create fresh with correct Stage 2/4 states
            const personRes = await client.query(
                `INSERT INTO person (official_name, country, registration_state, identity_state, declaration_of_intent) 
                 VALUES ($1, $2, 'PENDING', 'UNVERIFIED', $3) RETURNING id`,
                [name.trim(), country || 'Unknown', declaration_of_intent]
            );
            personId = personRes.rows[0].id;

            await client.query(
                `INSERT INTO security_device (person_id, device_fingerprint_hash, os_signature)
                 VALUES ($1, $2, $3) 
                 ON CONFLICT (device_fingerprint_hash) DO UPDATE SET person_id = EXCLUDED.person_id`,
                [personId, hw_id, arch || 'Unknown']
            );
        }

        // 2. CONTACT VECTORS: Insert Phone, Phone Code, and Email
        // We wipe old ghost contacts to ensure clean data
        await client.query(`DELETE FROM contact_information WHERE person_id = $1`, [personId]);
        
        const cleanEmail = email.toLowerCase().trim();
        const fullPhone = `${phone_code}${phone}`.replace(/\s+/g, ''); // Removes spaces to ensure uniqueness

        // Insert Email
        await client.query(
                `INSERT INTO contact_information (person_id, contact_type, contact_value, is_primary) 
                VALUES ($1, 'email', $2, TRUE)`,
                [personId, cleanEmail]
            );

        // Insert Combined Phone
        await client.query(
                `INSERT INTO contact_information (person_id, contact_type, contact_value, is_primary) 
                VALUES ($1, 'phone', $2, FALSE)`,
                [personId, fullPhone]
            );
        // 3. INITIALIZE BIRTHRIGHT (Ensures Form B target exists)
        await client.query(
            `INSERT INTO member_birthright (person_id, provisioning_status) 
             VALUES ($1, 'UNPROVISIONED') 
             ON CONFLICT (person_id) DO UPDATE SET provisioning_status = 'UNPROVISIONED'`,
            [personId]
        );

        await client.query('COMMIT');
        return res.status(201).json({ success: true, message: "IDENTITY_LOCKED_PENDING_APPROVAL" });

    } catch (err) {
        await client.query('ROLLBACK');
        console.error("REGISTRY_LOCKDOWN_FAULT:", err.message);
        
        // Custom error for the user if they use an email already in the system
        if (err.message.includes('unique_contact_value')) {
            return res.status(409).json({ error: "CONTACT_VECTOR_ALREADY_REGISTERED" });
        }
        
        return res.status(500).json({ error: "REGISTRY_FAILURE" });
    } finally {
        client.release();
    }
});

// Verify Membership and Finalize Provisioning
app.post('/api/spacs/verify-provision', async (req, res) => {
    const { 
        hw_id, official_name, membership_no, license_key, 
        email, phone, phone_code, country 
    } = req.body;

    // 1. STAGE 1: FULL VECTOR GATE
    if (!hw_id || !membership_no || !license_key || !email || !phone || !official_name) {
        return res.status(400).json({ error: "REQUIRED_VECTORS_MISSING" });
    }

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // 2. STAGE 2: IDENTITY & HARDWARE LOCK-IN
        const result = await client.query(
            `SELECT p.id FROM person p
             JOIN security_device sd ON sd.person_id = p.id
             WHERE sd.device_fingerprint_hash LIKE $1
             AND p.membership_no = $2 
             AND p.license_key = $3
             AND p.official_name = $4
             AND p.country = $5`,
            [`%${hw_id}%`, membership_no, license_key, official_name.trim(), country]
        );

        if (result.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(401).json({ error: "REGISTRY_MISMATCH" });
        }

        const personId = result.rows[0].id;

        // 3. STAGE 3: CONTACT VECTOR VALIDATION (Implicitly checks Phone Code)
        const cleanEmail = email.toLowerCase().trim();
        const fullPhoneCheck = `${phone_code}${phone}`.replace(/\s+/g, '');

        const contactMatch = await client.query(
            `SELECT id FROM contact_information 
             WHERE person_id = $1 AND contact_value IN ($2, $3)`,
            [personId, cleanEmail, fullPhoneCheck]
        );

        // Fail if we can't find both the email and the phone assigned to this person
        if (contactMatch.rows.length < 2) {
            await client.query('ROLLBACK');
            return res.status(401).json({ error: "CONTACT_VERIFICATION_FAILED" });
        }

        // 4. STAGE 4: PROVISIONING FINALIZATION
        await client.query(
            `UPDATE person SET identity_state = 'PREVERIFIED', registration_state = 'PRECOMPLETE' WHERE id = $1`,
            [personId]
        );

        await client.query(
            `UPDATE member_birthright SET provisioning_status = 'PROVISIONED', updated_at = NOW() WHERE person_id = $1`,
            [personId]
        );

        await client.query('COMMIT');
        res.json({ success: true, shell_url: "/builds/core-os-v1.iso" });

    } catch (err) {
        await client.query('ROLLBACK');
        console.error("VERIFY_PROVISION_FAULT:", err.message);
        res.status(500).json({ error: "INTERNAL_BRIDGE_FAULT" });
    } finally {
        client.release();
    }
});
// --- COMPLETE PROFILE (Final Identity Handshake) ---
app.post('/api/spacs/complete-profile', async (req, res) => {
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
                identity_state = 'VERIFIED',
                registration_state = 'COMPLETE',
                updated_at = NOW()
            WHERE id = $5
        `;
        await client.query(updatePersonQuery, [
            user_name, 
            date_of_birth, 
            gender, 
            JSON.stringify(bio), 
            personId
        ]);

        // --- NEW HANDLE TITLES IN person_titles TABLE ---
        if (titles && titles.length > 0) { 
            // Clear old titles first to prevent duplicates if re-syncing
            await client.query(`DELETE FROM person_titles WHERE person_id = $1`, [personId]);

            // Insert each title provided in the payload
            for (let title of titles) {
                await client.query(
                    `INSERT INTO person_titles (person_id, title) VALUES ($1, $2)`,
                    [personId, title]
                );
            }
        }

        // --- HANDLE AVATAR (person_media table)
        if (avatar) {
            await client.query(
                `DELETE FROM person_media WHERE person_id = $1 AND media_type = 'profile'`, 
                [personId]
            );
            await client.query(
                `INSERT INTO person_media (person_id, url, media_type) 
                 VALUES ($1, $2, 'profile')`,
                [personId, avatar]
            );
        }


       // -3. SECURE PASSWORDS ---
        // Hash the password and update the 'password_hash' column directly in the 'person' table
        const saltRounds = 12;
        const passwordHash = await bcrypt.hash(password, saltRounds);

        // Corrected: No person_security table exists. We update the person record created/updated in step 1.
        const securityQuery = `
            UPDATE person 
            SET password_hash = $1, 
                updated_at = NOW() 
            WHERE id = $2
        `;
        await client.query(securityQuery, [passwordHash, personId]);

        // 4. ATTEST THE DEVICE AS FULLY INITIALIZED
        await client.query(
            `UPDATE security_device SET enclave_attested = TRUE WHERE device_fingerprint_hash = $1`,
            [hw_id]
        );

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
        // IMPROVED QUERY: Join member_birthright to see the actual provisioning status
        const result = await pool.query(
            `SELECT 
                p.identity_state, 
                p.is_frozen, 
                p.registration_state,
                mb.provisioning_status 
             FROM person p
             JOIN security_device sd ON sd.person_id = p.id
             LEFT JOIN member_birthright mb ON p.id = mb.person_id
             WHERE sd.device_fingerprint_hash = $1`, 
            [hw_id]
        );

        const user = result.rows[0];

        if (!user) {
            return res.json({ status: 'NOT_FOUND' });
        }

        if (user.is_frozen) {
            return res.json({ status: 'FROZEN' });
        }

        // Normalize states to uppercase to avoid case-sensitivity bugs
        const idState = (user.identity_state || "").toUpperCase();
        const provStatus = (user.provisioning_status || "").toUpperCase();
        const regState = (user.registration_state || "").toLowerCase();

        // SUCCESS CONDITION: 
        // Either they are fully ACTIVE, or Form B marked them as VERIFIED + PROVISIONED
        if (idState === 'ACTIVE' || 
           (idState === 'VERIFIED' && provStatus === 'PROVISIONED') ||
           (regState === 'COMPLETE')) {
            
            return res.json({ 
                status: 'APPROVED',
                provision_status: 'PROVISIONED' 
            });
        }

        // If they are still a PROSPECT, they stay in the waiting room
        res.json({ status: 'UNVERIFIED' });

    } catch (err) {
        console.error("CHECK_STATUS_FAULT:", err.message);
        res.status(500).json({ error: "CORE_UPLINK_OFFLINE" });
    }
});


/**
 * SOVEREIGN AUTH MIDDLEWARE
 * Ensures the request is coming from a validated Enclave session.
 */
const verifySovereignKey = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const machineSig = req.headers['x-machine-id'];

    // For the 2025-12-26 Allotment Protocol, we require both a Bearer token and a HW Signature
    if (!authHeader || !machineSig) {
        console.error(`[SEC_ALERT] Unauthorized access attempt from ${req.ip}`);
        return res.status(403).json({ 
            success: false, 
            message: "SOVEREIGN_ERR: ENCLAVE_UPLINK_REQUIRED" 
        });
    }

    // Optional: Add logic here to verify the token against your session store
    // For now, we will allow the "Bearer temp_key" or your specific sessionKey
    next();
};

//Identity registry connection
// vpu-bridge.js
app.get('/api/vpu/registry', verifySovereignKey, async (req, res) => {
    try {
        console.log("[UPLINK] Generating Sovereign Registry from Relational Schema...");

        // This query joins your tables to build the "Member" object the frontend needs
        const query = `
            SELECT 
                p.id, p.official_name, p.sovereign_name, p.membership_no,
                r.name as rank_name, r.code as rank_code,
                ac.name as action_center_name, ac.area_code as ac_id,
                t.name as tlc_name, t.area_code as tlc_id,
                ps.security_clearance,
                p.identity_state
            FROM person p
            LEFT JOIN person_rank pr ON p.id = pr.person_id AND pr.end_date IS NULL
            LEFT JOIN rank r ON pr.rank_id = r.id
            LEFT JOIN person_security ps ON p.id = ps.person_id
            LEFT JOIN action_center_officials aco ON p.id = aco.person_id
            LEFT JOIN action_center ac ON aco.action_center_id = ac.id
            LEFT JOIN tlc_officials tlco ON p.id = tlco.person_id
            LEFT JOIN tlc t ON tlco.tlc_id = t.id
            WHERE p.is_frozen = FALSE
            ORDER BY r.rank_order DESC, p.official_name ASC;
        `;

        const result = await pool.query(query);

        // Map the flat SQL rows into the nested JSON objects the frontend expects
        const members = result.rows.map(row => ({
            security: { 
                uid: row.id, 
                rank: row.rank_name || 'PROSPECT', 
                abbr: row.rank_code || 'PRSP', 
                clearance: row.security_clearance || 0 
            },
            personal: { 
                official_name: row.official_name, 
                sovereign_name: row.sovereign_name || row.official_name 
            },
            tactical: { 
                ac_id: row.ac_id || 'UNASSIGNED', 
                tlc_id: row.tlc_id || 'UNASSIGNED' 
            },
            status: { 
                remarks: row.identity_state || 'ACTIVE' 
            }
        }));

        // Fallback for Dec 26th Allotment if DB is currently empty
        if (members.length === 0) {
            return res.json([{
                security: { uid: "0000", rank: "ARCHON", abbr: "ARCH", clearance: 10 },
                personal: { officialName: "Michael Audi", sovereignName: "ARCHANTI" },
                tactical: { ac_id: "AC_NAIROBI", tlc_id: "TLC_01" },
                status: { remarks: "SEED_DATA_REQUIRED" }
            }]);
        }

        res.json(members);
    } catch (err) {
        console.error("!!! PG_UPLINK_CRASH:", err);
        res.status(500).json({ error: "DATABASE_QUERY_ERROR", details: err.message });
    }
});


app.post('/api/vpu/allotment/claim', verifySovereignKey, async (req, res) => {
    const { allotmentCode } = req.body;
    const userId = req.user.id;

    try {
        // 1. Check if code is valid/unused (You can have a table for valid codes)
        // 2. Update person_birthright
        await pool.query(
            `UPDATE person_birthright 
             SET storage_quota_mb = storage_quota_mb + 100 
             WHERE person_id = $1`, 
            [userId]
        );

        res.json({ success: true, message: "BIRTHRIGHT_EXPANDED: 100MB_ADDED" });
    } catch (err) {
        res.status(500).json({ error: "DATABASE_SYNC_FAILED" });
    }
});

app.listen(3000, () => console.log('Sovereign Link: Port 3000'));