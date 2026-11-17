// Admin script separate from the server: reads the full schema (tables, indexes
// and demo data) and sends it to PostgreSQL over a single connection.
const fs = require('fs');
const path = require('path');
const pool = require('../src/utils/db.js');

(async () => {
  try {
    // __dirname makes the path independent of the directory the command was run from.
    await pool.query(fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8'));
    console.log('Database initialized.');
  } catch (error) {
    console.error('Database init failed:', error.message);
    process.exitCode = 1;
  } finally {
    // Close the pool even when initialization fails, so the process can exit.
    await pool.end();
  }
})();
