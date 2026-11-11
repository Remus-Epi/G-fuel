// server.js
const express = require("express");
const path = require('path');
const cors = require("cors");

if (!process.env.JWT_SECRET) {
  console.error('JWT_SECRET is not set. Add it to .env or the environment.');
  process.exit(1);
}

const pool = require('./src/utils/RenderDbConnection.js');
const authRoutes = require('./src/routes/auth.js');
const catalogRoutes = require('./src/routes/catalog.js');

const app = express();
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(cors());

app.get('/api/hello', (req, res) => {
  res.json({ message: 'Hello from Node!' });
});

// API endpoint for database query
app.get('/api/db-query', async (req, res) => {
    try {
        const result = await pool.query('SELECT NOW()');
        res.json({ timestamp: result.rows[0].now });
    } catch (error) {
        console.error('Database error:', error);
        res.status(500).json({ error: 'Database query failed' });
    }
});

app.use('/api/auth', authRoutes);
app.use('/api', catalogRoutes);
app.use('/api/contact', require('./src/routes/contact.js'));
app.use('/api/cart', require('./src/routes/cart.js'));

app.use('/api', (req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Malformed JSON bodies and other unhandled errors
app.use((err, req, res, next) => {
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Invalid JSON body' });
  }
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
