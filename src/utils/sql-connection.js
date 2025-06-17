const sql = require('mssql');

const config = {
  user: 'sa',
  password: 'Springline1997eps!',
  server: 'localhost', // or 127.0.0.1
  port: 11433, // important — your exposed host port
  database: 'master', // or your target DB name
  options: {
    encrypt: false, // true if using Azure; false for local
    trustServerCertificate: true, // required for self-signed certs in Docker
  },
};

async function connectToDB() {
  try {
    const pool = await sql.connect(config);
    console.log('✅ Connected to SQL Server!');
    
    const result = await pool.request().query('SELECT GETDATE() AS now');
    console.log('Current time from DB:', result.recordset[0]);

    return pool;
  } catch (err) {
    console.error('❌ DB connection failed:', err);
  }
}

module.exports = connectToDB;