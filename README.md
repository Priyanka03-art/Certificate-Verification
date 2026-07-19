# Certificate Verification System using SHA-256 Hash
### BSc Computer Science — Final Year Project

---

## Project Overview
A web application that verifies document authenticity using cryptographic SHA-256 hashing. 
When a document is registered, its unique hash fingerprint is stored. 
During verification, the uploaded file's hash is compared — any tampering changes the hash completely.

---

## Tech Stack
| Layer     | Technology                   |
|-----------|------------------------------|
| Frontend  | HTML, CSS, JavaScript        |
| Backend   | Node.js + Express.js         |
| Hashing   | SHA-256 (Node.js crypto module) |
| Database  | JSON file (db.json)          |
| File Upload | Multer                     |

---

## Project Structure
```
certificate-verifier/
├── backend/
│   ├── server.js          ← Main server file
│   ├── routes/
│   │   └── docs.js        ← All API routes
│   ├── uploads/           ← Uploaded files stored here
│   └── db.json            ← JSON database (auto-created)
├── frontend/
│   ├── index.html         ← Main webpage
│   ├── css/style.css      ← Styling
│   └── js/main.js         ← Frontend logic
├── package.json
└── README.md
```

---

## How to Run

### Step 1: Install Node.js
Download from: https://nodejs.org (LTS version)

### Step 2: Install dependencies
```bash
cd certificate-verifier
npm install
```

### Step 3: Start the server
```bash
node backend/server.js
```

### Step 4: Open in browser
```
http://localhost:3000
```

---

## API Endpoints

| Method | Endpoint              | Description                    |
|--------|-----------------------|--------------------------------|
| POST   | /api/register         | Register a new document        |
| POST   | /api/verify           | Verify an uploaded document    |
| GET    | /api/documents        | Get all registered documents   |
| DELETE | /api/documents/:id    | Delete a document record       |

---

## How SHA-256 Works (For Viva)

1. SHA-256 is a **one-way cryptographic hash function**
2. It produces a **256-bit (64 hex character)** output
3. **Deterministic** — same input always gives same output
4. **Avalanche effect** — even 1 bit change = completely different hash
5. **Collision resistant** — two different files cannot have same hash

Example:
- Original file hash: `a3f5c8...` → registered in DB
- Tampered file hash: `9b2d14...` → NOT in DB → FAKE detected

---

## Features
- Register original documents with metadata (student name, course, issuer)
- Verify any document instantly 
- View all registered documents in database
- Delete document records
- Responsive design

---

## Future Enhancements (mention in viva)
- Blockchain integration for immutable hash storage
- QR code on certificates for quick verification
- Email notification on verification
- Admin login system
- Batch verification of multiple documents
