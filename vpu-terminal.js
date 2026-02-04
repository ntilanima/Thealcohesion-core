const fs = require('fs');
const path = require('path');

// Link to OS Filesystem
const logStream = fs.createWriteStream(path.join(__dirname, 'vpu_kernel.log'), { flags: 'a' });

function osLog(command, user) {
  const timestamp = new Date().toISOString();
  const entry = `[${timestamp}] USER:${user} | CMD:${command}\n`;
  logStream.write(entry);
}

const readline = require('readline');
const { verifyVPUAccess, pool } = require('./vpu-auth');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  prompt: 'VPU-OS> '
});

let sessionUser = null;

/**
 * The Command Map
 * Logic for every functional area of the VPU
 */
const commands = {
  // --- SYSTEM INFO ---
  'status': async () => {
    const res = await pool.query(`
      SELECT 
        (SELECT COUNT(*) FROM person) as members,
        (SELECT COUNT(*) FROM action_center) as centers,
        (SELECT COUNT(*) FROM tlc) as units,
        (SELECT SUM(epos_balance) FROM member_birthright) as total_epos
    `);
    const s = res.rows[0];
    console.log(`\n--- VPU GLOBAL STATUS ---`);
    console.log(`Sovereign Count : ${s.members}`);
    console.log(`Action Centers  : ${s.centers}`);
    console.log(`TLC Units       : ${s.units}`);
    console.log(`Global Liquidity: ${parseFloat(s.total_epos).toLocaleString()} EPOS\n`);
  },

  // --- SEARCH & INTELLIGENCE ---
  'find': async (args) => {
    const term = args.join(' ');
    const res = await pool.query(`
      SELECT p.user_name, p.sovereign_name, p.country, r.name as rank, b.epos_balance
      FROM person p
      JOIN person_rank pr ON p.id = pr.person_id
      JOIN rank r ON pr.rank_id = r.id
      JOIN member_birthright b ON p.id = b.person_id
      WHERE p.user_name ILIKE $1 OR p.country ILIKE $1
      LIMIT 10`, [`%${term}%`]);
    console.table(res.rows);
  },

  // --- FINANCIALS: EPOS TRANSFER ---
  'transfer': async (args) => {
    if (args.length < 3) return console.log("Usage: transfer [from_user] [to_user] [amount]");
    const [from, to, amount] = args;
    
    try {
      await pool.query('BEGIN');
      const decr = await pool.query(`UPDATE member_birthright SET epos_balance = epos_balance - $1 WHERE person_id = (SELECT id FROM person WHERE user_name = $2) RETURNING epos_balance`, [amount, from]);
      const incr = await pool.query(`UPDATE member_birthright SET epos_balance = epos_balance + $1 WHERE person_id = (SELECT id FROM person WHERE user_name = $2)`, [amount, to]);
      
      if (decr.rowCount > 0 && incr.rowCount > 0) {
        await pool.query('COMMIT');
        console.log(`[FINANCIAL] Transferred ${amount} EPOS from ${from} to ${to}.`);
      } else {
        throw new Error("One or both users not found.");
      }
    } catch (e) {
      await pool.query('ROLLBACK');
      console.log(`[TX ERROR] ${e.message}`);
    }
  },

  // --- JUDICIARY: ORDERLY ROOM ---
  'court': async () => {
    const res = await pool.query(`
      SELECT js.id, p.user_name as defendant, js.session_type, js.status
      FROM judicial_session js
      JOIN person p ON js.defendant_id = p.id
      WHERE js.status = 'OPEN' LIMIT 10`);
    console.log("\n--- ACTIVE JUDICIAL SESSIONS ---");
    console.table(res.rows);
  },

  // --- GEOGRAPHY: ACTION CENTERS ---
  'map': async (args) => {
    const country = args.join(' ');
    const res = await pool.query(`
      SELECT name as ac_name, area_code, physical_area_name 
      FROM action_center 
      WHERE name ILIKE $1`, [`%${country}%`]);
    console.log(`\n--- Action Centers in ${country || 'Global'} ---`);
    console.table(res.rows);
  },

  // --- HELP & UTILS ---
  'help': () => {
    console.log(`
Available Commands:
  status             - View global population and liquidity
  find [term]        - Search members by username or country
  transfer [f] [t] [a]- Move EPOS between members
  court              - View open judicial sessions
  map [country]      - List Action Centers in a territory
  clear              - Wipe terminal screen
  exit               - Terminate VPU Uplink
    `);
  },
  'clear': () => console.clear(),
  'exit': () => { console.log("Uplink Terminated."); process.exit(0); }
};

/**
 * Entry Point
 */
async function startVPU() {
  console.clear();
  console.log("====================================================");
  console.log("   ARCHANTI SOVEREIGN VPU - KERNEL v1.0 (2026)      ");
  console.log("====================================================");

  rl.question('ID: ', async (user) => {
    rl.question('KEY: ', async (pass) => {
      const auth = await verifyVPUAccess(user, pass);
      if (auth.success) {
        sessionUser = { username: user, rank: auth.rank };
        console.log(`\nWelcome, ${auth.rank}. Access Level: OMNI\n`);
        commands.help();
        rl.setPrompt(`[${user}]@[${auth.rank}]> `);
        rl.prompt();
      } else {
        console.log(`\n[!] ${auth.message}`);
        process.exit();
      }
    });
  });
}

rl.on('line', async (line) => {
  osLog(line, sessionUser.username);
  const [cmd, ...args] = line.trim().split(/\s+/);
  const commandFunc = commands[cmd.toLowerCase()];

  if (commandFunc) {
    try {
      await commandFunc(args);
    } catch (err) {
      console.error(`[KERNEL ERROR] ${err.message}`);
    }
  } else if (line.length > 0) {
    console.log(`Unknown command: ${cmd}. Type 'help' for options.`);
  }
  rl.prompt();
});

startVPU();