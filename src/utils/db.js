// PostgreSQL connection pool. The URL comes from DATABASE_URL.
// Local Docker Postgres has no SSL, so SSL is off unless DATABASE_SSL=true.
const { Pool } = require('pg');

const useSsl = process.env.DATABASE_SSL === 'true';

// The pool reuses connections across requests, avoiding opening a new
// connection for each endpoint. DATABASE_URL provides host, port, user and password.
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: useSsl ? { rejectUnauthorized: false } : false,
});

module.exports = pool;
