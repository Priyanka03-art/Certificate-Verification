// ============================================
// server.js - Main Backend Server
// Certificate Verification System
// BSc CS Final Year Project
// ============================================

const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3000;

// ---- Middleware ----
app.use(cors());
app.use(express.json());

// Serve frontend files (HTML, CSS, JS)
app.use(express.static(path.join(__dirname, '../frontend')));

// Initialize database file if it doesn't exist
const DB_PATH = path.join(__dirname, 'db.json');
if (!fs.existsSync(DB_PATH)) {
  fs.writeFileSync(DB_PATH, JSON.stringify({ documents: [] }, null, 2));
  console.log('Database initialized: db.json created');
}

// ---- Import Routes ----
const docsRouter = require('./routes/docs');
app.use('/api', docsRouter);

// ---- Root route ----
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// ---- Start Server ----
app.listen(PORT, () => {
  console.log('===========================================');
  console.log(` Certificate Verifier running!`);
  console.log(` Open: http://localhost:${PORT}`);
  console.log('===========================================');
});
