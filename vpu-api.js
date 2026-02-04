const express = require('express');
const { pool } = require('./vpu-auth');
const app = express();

app.get('/api/vpu/status', async (req, res) => {
    const data = await pool.query('SELECT r.name, COUNT(*) FROM person_rank pr JOIN rank r ON pr.rank_id = r.id GROUP BY r.name');
    res.json(data.rows);
});

app.listen(3000, () => console.log('VPU OS Bridge live on port 3000'));
