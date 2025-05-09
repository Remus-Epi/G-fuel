// server.js
const express = require("express");
const path = require('path');
const sql = require("mssql");
const bodyParser = require("body-parser");
const cors = require("cors");

const app = express();
app.use(bodyParser.json());
app.use(cors());
app.use(express.static("public"));
const PORT = 3000;

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});

// SQL Server Configuration
const dbConfig = {
    user: "remus",
    password: "cacatgros20",
    server: "DESKTOP-SNA4PTC", // e.g., localhost or an IP address
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

// Start Server
app.listen(3000, () => console.log("Server running on http://localhost:3000"))

