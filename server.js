// server.js
const express = require("express");
const path = require('path');
const sql = require("mssql");
const bodyParser = require("body-parser");
const cors = require("cors");

const app = express();
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.json());
app.use(cors());
const PORT = 3001
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});

app.get('/api/hello', (req, res) => {
  res.json({ message: 'Hello from Node!' });
});
// SQL Server Configuration
const dbConfig = {
    user: "sa",
    password: "Springline1997eps!",
    server: "localhost", // e.g., localhost or an IP address
    database: "Accounts",
    options: {
        trustServerCertificate: true,
        encrypt : false,
    }
};


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
