// db.js or wherever you handle DB
const { Pool } = require('pg');

// use the full URL or individual fields
const pool = new Pool({
  connectionString: 'postgresql://remusepi:S7cEnoUe1Cxzouk58bQw8Ti11c00vs6o@dpg-d18sjejipnbc73980r3g-a/gfueldb',
  ssl: {
    rejectUnauthorized: false  // important: Render uses SSL by default
  }
});

module.exports = pool;
