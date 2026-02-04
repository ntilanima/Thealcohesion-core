const { Pool } = require('pg');

const pool = new Pool({
  user: 'archanti',
  host: 'localhost',
  database: 'thealcohesion_vpu',
  password: 'amagod', // Ensure this matches what you set in Step 1
  port: 5432,
});

async function searchSovereign(term) {
  const query = `
    SELECT p.user_name, p.sovereign_name, p.country, r.name as rank_title
    FROM person p
    JOIN person_rank pr ON p.id = pr.person_id
    JOIN rank r ON pr.rank_id = r.id
    WHERE p.user_name ILIKE $1 OR p.country ILIKE $1
    LIMIT 10;
  `;
  
  try {
    const client = await pool.connect();
    try {
      const res = await client.query(query, [`%${term}%`]);
      console.log(`\n[VPU RESULT] Records found: ${res.rowCount}`);
      console.table(res.rows);
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('\n[KERNEL LINK ERROR]');
    console.error(err.message);
  } finally {
    await pool.end();
  }
}

const searchterm = process.argv[2] || 'Kenya';
searchSovereign(searchterm);