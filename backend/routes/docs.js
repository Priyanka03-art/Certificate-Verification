// ============================================
// routes/docs.js - All API Endpoints
// ============================================

const express = require('express');
const router = express.Router();
const multer = require('multer');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// ---- Multer Setup (File Upload Handler) ----
// Files are stored in backend/uploads/ folder
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../uploads/'));
  },
  filename: function (req, file, cb) {
    // Save file with timestamp to avoid name conflicts
    const uniqueName = Date.now() + '-' + file.originalname;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 } // Max 10MB
});

// ---- Database helper functions ----
const DB_PATH = path.join(__dirname, '../db.json');

function readDB() {
  const data = fs.readFileSync(DB_PATH, 'utf-8');
  return JSON.parse(data);
}

function writeDB(data) {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
}

// ---- SHA-256 Hash Generator ----
// This is the CORE of the project!
// Reads the file buffer and generates a unique 64-char hash
function generateHash(filePath) {
  const fileBuffer = fs.readFileSync(filePath);
  const hash = crypto.createHash('sha256');
  hash.update(fileBuffer);
  return hash.digest('hex'); // Returns 64-character hex string
}

// ============================================
// API 1: REGISTER a new document
// POST /api/register
// ============================================
router.post('/register', upload.single('document'), (req, res) => {
  try {
    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const { issuer, studentName, course } = req.body;

    // Generate SHA-256 hash of the uploaded file
    const hash = generateHash(req.file.path);

    // Read current database
    const db = readDB();

    // Check if this exact document is already registered
    const alreadyExists = db.documents.find(doc => doc.hash === hash);
    if (alreadyExists) {
      // Delete the duplicate uploaded file
      fs.unlinkSync(req.file.path);
      return res.status(409).json({
        success: false,
        message: 'This document is already registered!',
        existingRecord: alreadyExists
      });
    }

    // Create new document record
    const newDoc = {
      id: Date.now().toString(),           // Unique ID
      originalName: req.file.originalname, // Original filename
      savedAs: req.file.filename,          // Name saved on server
      hash: hash,                          // SHA-256 hash (THE KEY!)
      issuer: issuer || 'Not specified',
      studentName: studentName || 'Not specified',
      course: course || 'Not specified',
      fileSize: req.file.size,
      registeredAt: new Date().toISOString(),
      status: 'verified'
    };

    // Save to database
    db.documents.push(newDoc);
    writeDB(db);

    console.log(`[REGISTERED] ${req.file.originalname} | Hash: ${hash.substring(0, 20)}...`);

    res.json({
      success: true,
      message: 'Document registered successfully!',
      document: newDoc
    });

  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ success: false, message: 'Server error: ' + error.message });
  }
});

// ============================================
// API 2: VERIFY a document
// POST /api/verify
// ============================================
router.post('/verify', upload.single('document'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    // Generate hash of the uploaded document
    const hash = generateHash(req.file.path);

    // Delete the uploaded verification file (we only need the hash)
    fs.unlinkSync(req.file.path);

    // Search in database for matching hash
    const db = readDB();
    const matchedDoc = db.documents.find(doc => doc.hash === hash);

    console.log(`[VERIFY] Hash: ${hash.substring(0, 20)}... | Match: ${matchedDoc ? 'YES' : 'NO'}`);

    if (matchedDoc) {
      // HASH MATCHED - Document is REAL
      res.json({
        success: true,
        isAuthentic: true,
        message: 'Document is AUTHENTIC',
        hash: hash,
        matchedWith: matchedDoc
      });
    } else {
      // HASH NOT FOUND - Document is FAKE or TAMPERED
      res.json({
        success: true,
        isAuthentic: false,
        message: 'Document is FAKE or TAMPERED',
        hash: hash,
        matchedWith: null
      });
    }

  } catch (error) {
    console.error('Verify error:', error);
    res.status(500).json({ success: false, message: 'Server error: ' + error.message });
  }
});

// ============================================
// API 3: GET all registered documents
// GET /api/documents
// ============================================
router.get('/documents', (req, res) => {
  try {
    const db = readDB();
    // Return documents without file paths (security)
    const safeList = db.documents.map(doc => ({
      id: doc.id,
      originalName: doc.originalName,
      hash: doc.hash,
      issuer: doc.issuer,
      studentName: doc.studentName,
      course: doc.course,
      fileSize: doc.fileSize,
      registeredAt: doc.registeredAt,
      status: doc.status
    }));

    res.json({ success: true, count: safeList.length, documents: safeList });

  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error: ' + error.message });
  }
});

// ============================================
// API 4: DELETE a document (Admin only)
// DELETE /api/documents/:id
// ============================================
router.delete('/documents/:id', (req, res) => {
  try {
    const db = readDB();
    const index = db.documents.findIndex(doc => doc.id === req.params.id);

    if (index === -1) {
      return res.status(404).json({ success: false, message: 'Document not found' });
    }

    // Delete the physical file from uploads folder
    const savedAs = db.documents[index].savedAs;
    const filePath = path.join(__dirname, '../uploads/', savedAs);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // Remove from database
    db.documents.splice(index, 1);
    writeDB(db);

    res.json({ success: true, message: 'Document deleted successfully' });

  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error: ' + error.message });
  }
});

module.exports = router;
