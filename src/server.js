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

// Login Endpoint
app.post("/login", async (req, res) => {
    const { username, password } = req.body;

    try {
        await sql.connect(dbConfig);
        const result = await sql.query`SELECT * FROM Users WHERE username=${username} AND password=${password}`;

        if (result.recordset.length > 0) {
            res.json({ success: true, message: "Login successful!" });
        } else {
            res.json({ success: false, message: "Invalid username or password." });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Server error." });
    }
});

// Search Endpoint
app.post("/search", async (req, res) => {
    const searchedText = req.body;

    try{
        await sql.connect(dbConfig);
        const result = await sql.query`INSERT INTO [dbo].[SearchHistory] values (1, ${searchedText}, GETDATE())`;
        console.log(result.output)
        // if (result.recordset.length > 0) {
        //     res.json({ success: true, message: ""});
        // }
    } catch(err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Server error." });
    }

});

