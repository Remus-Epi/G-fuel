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

