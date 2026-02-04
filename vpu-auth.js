//This module provides two core functions: Setting a password and Verifying credentials.
const bcrypt = require('bcryptjs');
const { Pool } = require('pg');

const pool = new Pool({
  user: 'archanti',
  host: 'localhost',
  database: 'thealcohesion_vpu',
  password: 'amagod', 
  port: 5432,
});

const SALT_ROUNDS = 12;

/**
 * Sets or updates a Sovereign's password
 */
async function setSovereignPassword(username, password) {
  const hash = await bcrypt.hash(password, SALT_ROUNDS);
  const query = 'UPDATE person SET password_hash = $1 WHERE user_name = $2 RETURNING user_name;';
  
  try {
    const res = await pool.query(query, [hash, username]);
    if (res.rowCount > 0) {
      console.log(`[AUTH] Password initialized for: ${username}`);
    } else {
      console.log(`[AUTH] User ${username} not found.`);
    }
  } catch (err) {
    console.error('[AUTH ERROR]', err.message);
  }
}

/**
 * Verifies ARCHAN_SUPREME or any Sovereign credentials
 */
async function verifyVPUAccess(username, password) {
  const query = `
    SELECT p.id, p.password_hash, r.name as rank 
    FROM person p
    JOIN person_rank pr ON p.id = pr.person_id
    JOIN rank r ON pr.rank_id = r.id
    WHERE p.user_name = $1;
  `;

  try {
    const res = await pool.query(query, [username]);
    if (res.rows.length === 0) return { success: false, message: "Identity not recognized." };

    const user = res.rows[0];
    const match = await bcrypt.compare(password, user.password_hash);

    if (match) {
      return { 
        success: true, 
        rank: user.rank,
        message: `Access Granted. Welcome, ${user.rank}.` 
      };
    } else {
      return { success: false, message: "Invalid credentials." };
    }
  } catch (err) {
    console.error('[AUTH ERROR]', err.message);
    return { success: false, message: "Kernel connection failure." };
  }
}

// EXPORT FOR KERNEL USE
module.exports = { setSovereignPassword, verifyVPUAccess, pool };

// --- SELF-TEST LOGIC ---
if (require.main === module) {
  (async () => {
    console.log("--- VPU AUTH TEST ---");
    // 1. Initialize ARCHAN_SUPREME with a password
    await setSovereignPassword('ARCHAN_SUPREME', 'Sovereign-2026');
    
    // 2. Try to Login
    const login = await verifyVPUAccess('ARCHAN_SUPREME', 'Sovereign-2026');
    console.log(login.message);
    
    process.exit();
  })();
}