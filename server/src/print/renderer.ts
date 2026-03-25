import type { Prescription } from '../../shared-types.js';
import { getDb } from '../db/connection.js';

function getConfigValue(key: string): string {
  try {
    const db = getDb();
    const row = db.prepare('SELECT value FROM camp_config WHERE key = ?').get(key) as { value: string } | undefined;
    return row ? JSON.parse(row.value) : '';
  } catch {
    return '';
  }
}

export function renderPrescriptionHtml(prescription: Prescription): string {
  const campName = getConfigValue('camp_name') || 'FREE Health & Wellness Checkup Camp';
  const orgName = getConfigValue('organization_name') || 'SSA Patel Nagar';
  const campLocation = getConfigValue('camp_location') || '';

  const date = new Date(prescription.createdAt);
  const formattedDate = date.toLocaleDateString('en-IN', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  });
  const formattedTime = date.toLocaleTimeString('en-IN', {
    hour: '2-digit', minute: '2-digit', hour12: true,
  });

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>OPD Card - ${prescription.registrationNumber}</title>
  <style>
    @page { size: A4; margin: 0; }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Arial', 'Helvetica', sans-serif;
      width: 210mm; height: 297mm;
      padding: 8mm 10mm;
      color: #1a1a1a;
      font-size: 11pt;
    }
    .header {
      text-align: center;
      border-bottom: 2px solid #8B0000;
      padding-bottom: 6mm;
      margin-bottom: 4mm;
    }
    .logos-row {
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 12mm;
      margin-bottom: 3mm;
    }
    .logo-placeholder {
      width: 18mm; height: 18mm;
      border: 1px dashed #ccc;
      display: flex; align-items: center; justify-content: center;
      font-size: 7pt; color: #999;
    }
    .header-title {
      font-size: 16pt;
      font-weight: bold;
      color: #8B0000;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    .header-subtitle {
      font-size: 10pt;
      color: #333;
      margin-top: 1mm;
    }
    .header-org {
      font-size: 12pt;
      font-weight: bold;
      color: #333;
      margin-bottom: 2mm;
    }
    .section {
      margin-bottom: 3mm;
    }
    .section-title {
      font-size: 9pt;
      font-weight: bold;
      text-transform: uppercase;
      color: #8B0000;
      border-bottom: 1px solid #ddd;
      padding-bottom: 1mm;
      margin-bottom: 2mm;
    }
    .info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1.5mm 8mm;
    }
    .info-grid.three-col {
      grid-template-columns: 1fr 1fr 1fr;
    }
    .info-item {
      display: flex;
      gap: 2mm;
    }
    .info-label {
      font-size: 9pt;
      font-weight: bold;
      color: #555;
      white-space: nowrap;
    }
    .info-value {
      font-size: 10pt;
      border-bottom: 1px dotted #999;
      flex: 1;
      min-width: 20mm;
      padding-bottom: 0.5mm;
    }
    .body-area {
      border: 1px solid #333;
      min-height: 140mm;
      display: flex;
      margin-bottom: 4mm;
    }
    .body-left, .body-right {
      flex: 1;
      padding: 3mm;
    }
    .body-left {
      border-right: 1px solid #333;
    }
    .body-col-title {
      font-size: 9pt;
      font-weight: bold;
      color: #8B0000;
      text-align: center;
      border-bottom: 1px solid #ddd;
      padding-bottom: 1mm;
      margin-bottom: 2mm;
    }
    .body-content {
      font-size: 10pt;
      white-space: pre-wrap;
      line-height: 1.6;
    }
    .footer {
      border-top: 2px solid #8B0000;
      padding-top: 3mm;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
    }
    .footer-thanks {
      font-size: 9pt;
      color: #555;
      font-style: italic;
    }
    .footer-signature {
      text-align: center;
    }
    .signature-line {
      width: 50mm;
      border-top: 1px solid #333;
      margin-bottom: 1mm;
    }
    .signature-label {
      font-size: 8pt;
      color: #555;
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="logos-row">
      <div class="logo-placeholder">SUM INDIA</div>
      <div class="logo-placeholder">Birth to Career</div>
      <div class="logo-placeholder">Aloe Vera</div>
      <div class="logo-placeholder">Ayur Herbals</div>
      <div class="logo-placeholder">Dr. Shroff's</div>
    </div>
    <div class="header-org">${orgName}</div>
    <div class="header-title">OPD CARD — ${campName}</div>
    <div class="header-subtitle">${campLocation}</div>
  </div>

  <div class="section">
    <div class="section-title">Registration Details</div>
    <div class="info-grid">
      <div class="info-item">
        <span class="info-label">Reg No:</span>
        <span class="info-value">${prescription.registrationNumber}</span>
      </div>
      <div class="info-item">
        <span class="info-label">Department:</span>
        <span class="info-value">${prescription.department || ''}</span>
      </div>
      <div class="info-item">
        <span class="info-label">Date & Time:</span>
        <span class="info-value">${formattedDate} ${formattedTime}</span>
      </div>
      <div class="info-item">
        <span class="info-label">Doctor:</span>
        <span class="info-value">Dr. ${prescription.doctorName}</span>
      </div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Patient Information</div>
    <div class="info-grid">
      <div class="info-item">
        <span class="info-label">Patient Name:</span>
        <span class="info-value">${prescription.patientName}</span>
      </div>
      <div class="info-item">
        <span class="info-label">Guardian:</span>
        <span class="info-value">${prescription.guardianName || ''}</span>
      </div>
      <div class="info-item">
        <span class="info-label">Age:</span>
        <span class="info-value">${prescription.age || ''}</span>
      </div>
      <div class="info-item">
        <span class="info-label">Gender:</span>
        <span class="info-value">${prescription.gender || ''}</span>
      </div>
      <div class="info-item">
        <span class="info-label">Contact:</span>
        <span class="info-value">${prescription.contact || ''}</span>
      </div>
      <div class="info-item">
        <span class="info-label">Address:</span>
        <span class="info-value">${prescription.address || ''}</span>
      </div>
    </div>
  </div>

  <div class="body-area">
    <div class="body-left">
      <div class="body-col-title">Diagnosis / Findings</div>
      <div class="body-content">${prescription.diagnosis || ''}</div>
    </div>
    <div class="body-right">
      <div class="body-col-title">Treatment / Prescription</div>
      <div class="body-content">${prescription.treatment || ''}</div>
    </div>
  </div>

  ${prescription.notes ? `<div class="section"><div class="section-title">Notes</div><p style="font-size:10pt;">${prescription.notes}</p></div>` : ''}

  <div class="footer">
    <div class="footer-thanks">
      Thank you for visiting our Health Camp.<br>
      Wishing you good health!
    </div>
    <div class="footer-signature">
      <div class="signature-line"></div>
      <div class="signature-label">Doctor's Signature</div>
      <div style="font-size:9pt;margin-top:1mm;">Dr. ${prescription.doctorName}</div>
    </div>
  </div>
</body>
</html>`;
}
