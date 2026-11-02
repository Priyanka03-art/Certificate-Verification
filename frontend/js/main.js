// ============================================
// main.js - Frontend JavaScript
// Certificate Verification System
// ============================================

const API_URL = 'http://localhost:3000/api';

// ---- Helper: Format file size ----
function formatSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / 1048576).toFixed(2) + ' MB';
}

// ---- Helper: Format date ----
function formatDate(isoString) {
  const d = new Date(isoString);
  return d.toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
}

// ============================================
// TAB SWITCHING
// ============================================
function showTab(name) {
  // Hide all tab contents
  document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
  // Deactivate all tab buttons
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));

  // Show selected tab
  document.getElementById('tab-' + name).classList.add('active');
  document.getElementById('btn-' + name).classList.add('active');
}

// ============================================
// FILE SELECT HANDLER (used by both forms)
// prefix: 'reg' for Register, 'ver' for Verify
// ============================================
function onFileSelect(input, prefix) {
  const file = input.files[0];
  if (!file) return;

  // Show preview, hide upload area
  document.getElementById(prefix + '-upload-area').style.opacity = '0.5';
  document.getElementById(prefix + '-preview').classList.remove('hidden');
  document.getElementById(prefix + '-filename').textContent = file.name;
  document.getElementById(prefix + '-filesize').textContent = formatSize(file.size);
}

// ---- Remove selected file ----
function removeFile(prefix) {
  const inputId = prefix === 'reg' ? 'regFile' : 'verFile';
  document.getElementById(inputId).value = '';
  document.getElementById(prefix + '-upload-area').style.opacity = '1';
  document.getElementById(prefix + '-preview').classList.add('hidden');

  // Hide any previous result
  const resultBox = document.getElementById(prefix + '-result');
  resultBox.classList.add('hidden');
  resultBox.innerHTML = '';
}

// ============================================
// REGISTER FORM SUBMIT
// ============================================
document.getElementById('registerForm').addEventListener('submit', async function (e) {
  e.preventDefault();

  const fileInput = document.getElementById('regFile');
  const file = fileInput.files[0];

  // Validation
  if (!file) {
    alert('Please select a document to register!');
    return;
  }

  // Collect form data
  const formData = new FormData();
  formData.append('document', file);
  formData.append('studentName', document.getElementById('studentName').value);
  formData.append('course', document.getElementById('course').value);
  formData.append('issuer', document.getElementById('issuer').value);

  // Disable button + show loading
  const btn = document.getElementById('reg-submit-btn');
  btn.disabled = true;
  btn.innerHTML = '<i class="ti ti-loader-2"></i> Registering...';

  try {
    // SEND to backend API
    const response = await fetch(`${API_URL}/register`, {
      method: 'POST',
      body: formData
    });

    const data = await response.json();
    const resultBox = document.getElementById('reg-result');
    resultBox.classList.remove('hidden', 'success', 'error', 'info');

    if (data.success) {
      const doc = data.document;
      resultBox.classList.add('success');
      resultBox.innerHTML = `
        <div class="result-header">
          <span class="result-icon">✅</span>
          <div>
            <div class="result-title">Document Registered!</div>
          </div>
        </div>
        <div class="result-detail"><span class="key">Student</span><span class="val">${doc.studentName}</span></div>
        <div class="result-detail"><span class="key">Course</span><span class="val">${doc.course}</span></div>
        <div class="result-detail"><span class="key">Issuer</span><span class="val">${doc.issuer}</span></div>
        <div class="result-detail"><span class="key">File</span><span class="val">${doc.originalName}</span></div>
        <div class="result-detail"><span class="key">Size</span><span class="val">${formatSize(doc.fileSize)}</span></div>
        <div class="result-detail"><span class="key">Registered At</span><span class="val">${formatDate(doc.registeredAt)}</span></div>
        <div class="hash-box">
          <div class="hash-label">SHA-256 Hash (stored in database)</div>
          ${doc.hash}
        </div>
      `;

      // Reset form
      this.reset();
      removeFile('reg');

    } else {
      resultBox.classList.add('error');
      resultBox.innerHTML = `
        <div class="result-header">
          <span class="result-icon">⚠️</span>
          <div><div class="result-title">${data.message}</div></div>
        </div>
        ${data.existingRecord ? `<p style="font-size:13px;color:#64748b;margin-top:8px;">Already registered on: ${formatDate(data.existingRecord.registeredAt)}</p>` : ''}
      `;
    }

  } catch (err) {
    const resultBox = document.getElementById('reg-result');
    resultBox.classList.remove('hidden');
    resultBox.classList.add('error');
    resultBox.innerHTML = `
      <div class="result-header">
        <span class="result-icon">❌</span>
        <div><div class="result-title">Connection Error</div></div>
      </div>
      <p style="font-size:13px;color:#64748b;margin-top:8px;">Cannot connect to server. Make sure the backend is running on port 3000.</p>
      <p style="font-size:12px;color:#94a3b8;margin-top:4px;">Error: ${err.message}</p>
    `;
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<i class="ti ti-database-plus"></i> Register Document';
  }
});

// ============================================
// VERIFY FORM SUBMIT
// ============================================
document.getElementById('verifyForm').addEventListener('submit', async function (e) {
  e.preventDefault();

  const fileInput = document.getElementById('verFile');
  const file = fileInput.files[0];

  if (!file) {
    alert('Please select a document to verify!');
    return;
  }

  const formData = new FormData();
  formData.append('document', file);

  // Disable button
  const btn = document.getElementById('ver-submit-btn');
  btn.disabled = true;
  btn.innerHTML = '<i class="ti ti-loader-2"></i> Verifying...';

  try {
    // SEND to backend API
    const response = await fetch(`${API_URL}/verify`, {
      method: 'POST',
      body: formData
    });

    const data = await response.json();
    const resultBox = document.getElementById('ver-result');

    // Clear old classes and make visible
    resultBox.className = 'result-box';

    if (data.isAuthentic) {
      // REAL DOCUMENT
      const match = data.matchedWith;
      resultBox.classList.add('success');
      resultBox.innerHTML = `
        <div class="result-header">
          <span class="result-icon">✅</span>
          <div>
            <div class="result-title">Document is AUTHENTIC</div>
          </div>
        </div>
        <p style="font-size:13px;color:#15803d;margin-bottom:16px;">Hash matched in database. This document has NOT been tampered with.</p>
        <div class="result-detail"><span class="key">Original Name</span><span class="val">${match.originalName}</span></div>
        <div class="result-detail"><span class="key">Student</span><span class="val">${match.studentName}</span></div>
        <div class="result-detail"><span class="key">Course</span><span class="val">${match.course}</span></div>
        <div class="result-detail"><span class="key">Issuer</span><span class="val">${match.issuer}</span></div>
        <div class="result-detail"><span class="key">Registered On</span><span class="val">${formatDate(match.registeredAt)}</span></div>
        <div class="hash-box">
          <div class="hash-label">SHA-256 Hash (matched!)</div>
          ${data.hash}
        </div>
      `;
    } else {
      // FAKE / TAMPERED
      resultBox.classList.add('error');
      resultBox.innerHTML = `
        <div class="result-header">
          <span class="result-icon">❌</span>
          <div>
            <div class="result-title">Document is FAKE / TAMPERED</div>
          </div>
        </div>
        <p style="font-size:13px;color:#dc2626;margin-bottom:16px;">No matching hash found in the database. This document may have been modified or is not registered.</p>
        <div class="hash-box">
          <div class="hash-label">Computed SHA-256 Hash (no match)</div>
          ${data.hash}
        </div>
      `;
    }

    // Scroll to result so user can see it
    resultBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

  } catch (err) {
    const resultBox = document.getElementById('ver-result');
    resultBox.classList.remove('hidden');
    resultBox.classList.add('error');
    resultBox.innerHTML = `
      <div class="result-header">
        <span class="result-icon">❌</span>
        <div><div class="result-title">Connection Error</div></div>
      </div>
      <p style="font-size:13px;color:#64748b;margin-top:8px;">Cannot connect to server. Make sure the backend is running.<br>Error: ${err.message}</p>
    `;
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<i class="ti ti-shield-search"></i> Verify Now';
  }
});

// ============================================
// LOAD ALL DOCUMENTS (Database tab)
// ============================================
async function loadDocuments() {
  const container = document.getElementById('db-content');
  container.innerHTML = '<div class="loading"><i class="ti ti-loader-2"></i> Loading...</div>';

  try {
    const response = await fetch(`${API_URL}/documents`);
    const data = await response.json();

    if (!data.success || data.documents.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <i class="ti ti-database-off"></i>
          <p>No documents registered yet.</p>
          <p style="font-size:12px;margin-top:4px;">Register a document first to see it here.</p>
        </div>
      `;
      return;
    }

    let rows = data.documents.map(doc => `
      <tr>
        <td>
          <div style="font-weight:500;">${doc.studentName}</div>
          <div style="font-size:12px;color:#94a3b8;">${doc.course}</div>
        </td>
        <td>${doc.originalName}</td>
        <td>${doc.issuer}</td>
        <td><span class="hash-preview">${doc.hash.substring(0, 16)}...</span></td>
        <td>${formatDate(doc.registeredAt)}</td>
        <td><span class="badge-verified">✓ Verified</span></td>
        <td>
          <button class="delete-btn" onclick="deleteDocument('${doc.id}')">
            <i class="ti ti-trash"></i> Delete
          </button>
        </td>
      </tr>
    `).join('');

    container.innerHTML = `
      <p style="font-size:13px;color:#64748b;margin-bottom:12px;">Total: <strong>${data.count}</strong> document(s) registered</p>
      <div class="db-table-wrap">
        <table>
          <thead>
            <tr>
              <th>Student</th>
              <th>File Name</th>
              <th>Issuer</th>
              <th>Hash (preview)</th>
              <th>Registered At</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    `;

  } catch (err) {
    container.innerHTML = `
      <div class="empty-state">
        <i class="ti ti-wifi-off"></i>
        <p>Cannot connect to server.</p>
        <p style="font-size:12px;color:#94a3b8;">Make sure backend is running: node backend/server.js</p>
      </div>
    `;
  }
}

// ============================================
// DELETE DOCUMENT
// ============================================
async function deleteDocument(id) {
  if (!confirm('Are you sure you want to delete this document record?')) return;

  try {
    const response = await fetch(`${API_URL}/documents/${id}`, { method: 'DELETE' });
    const data = await response.json();

    if (data.success) {
      loadDocuments(); // Refresh table
    } else {
      alert('Error: ' + data.message);
    }
  } catch (err) {
    alert('Connection error: ' + err.message);
  }
}
