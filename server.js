// Application entry point. Express serves both the files in public/
// and the JSON API used by the shop pages.
const express = require("express");
const path = require('path');
const cors = require("cors");

if (!process.env.JWT_SECRET) {
  // The secret signs authentication tokens. Without it, startup would leave
  // authentication in an insecure state, so the app exits immediately.
  console.error('JWT_SECRET is not set. Add it to .env or the environment.');
  process.exit(1);
}

const pool = require('./src/utils/db.js');
const authRoutes = require('./src/routes/auth.js');
const catalogRoutes = require('./src/routes/catalog.js');

const app = express();
// HTML/CSS/JS files and images in public/ become directly accessible by URL.
app.use(express.static(path.join(__dirname, 'public')));
// Parses JSON request bodies into the req.body object.
app.use(express.json());
// Enables CORS for requests from other origins (e.g. a separate frontend).
app.use(cors());

app.get('/api/hello', (req, res) => {
  res.json({ message: 'Hello from Node!' });
});

// Simple diagnostic endpoint: confirms the server can query PostgreSQL.
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
// Routers export endpoints grouped by domain; prefixes are added here.
app.use('/api', catalogRoutes);
app.use('/api/contact', require('./src/routes/contact.js'));
app.use('/api/cart', require('./src/routes/cart.js'));

app.use('/api', (req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// The final middleware centralizes errors. It is placed after the routes so it receives
// errors propagated by middleware and does not leak internal details in the response.
app.use((err, req, res, next) => {
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Invalid JSON body' });
  }
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

const PORT = process.env.PORT || 3001;
// Starts the HTTP listener after all middleware and routes are mounted.
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
