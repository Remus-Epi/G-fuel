// db.js or wherever you handle DB
const { Pool } = require('pg');

// use the full URL or individual fields
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false  // important: Render uses SSL by default
  }
});

module.exports = pool;
