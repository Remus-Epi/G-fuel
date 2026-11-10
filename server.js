// server.js
const express = require("express");
const path = require('path');
const cors = require("cors");

const app = express();
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(cors());
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});

app.get('/api/hello', (req, res) => {
  res.json({ message: 'Hello from Node!' });
});

// API endpoint for database query
app.get('/api/db-query', async (req, res) => {
    try {
        const pool = require('./src/utils/RenderDbConnection.js');
        const result = await pool.query('SELECT NOW()');
        res.json({ timestamp: result.rows[0].now });
    } catch (error) {
        console.error('Database error:', error);
        res.status(500).json({ error: 'Database query failed' });
    }
});
