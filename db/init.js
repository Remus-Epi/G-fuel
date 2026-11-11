// Creates the tables and seed data: npm run db:init
const fs = require('fs');
const path = require('path');
const pool = require('../src/utils/RenderDbConnection.js');

(async () => {
  try {
    await pool.query(fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8'));
    console.log('Database initialized.');
  } catch (error) {
    console.error('Database init failed:', error.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
})();
