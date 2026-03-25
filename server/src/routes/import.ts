import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { getDb } from '../db/connection.js';
import { parseExcelOrCsv, parsedRowsToRecords } from '../import/parser.js';

const upload = multer({
  dest: path.join(process.cwd(), 'uploads'),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
  fileFilter: (_req, file, cb) => {
    const allowed = ['.csv', '.xlsx', '.xls', '.pdf'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error(`Unsupported file type: ${ext}. Allowed: ${allowed.join(', ')}`));
    }
  },
});

const router = Router();

// POST / - Upload and import file
router.post('/', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const ext = path.extname(req.file.originalname).toLowerCase();
    const fs = require('fs');
    const buffer = fs.readFileSync(req.file.path);
    let rows;

    if (ext === '.pdf') {
      // PDF parsing
      try {
        const pdfParse = require('pdf-parse');
        const pdfData = await pdfParse(buffer);
        // Simple line-based extraction — PDFs are unstructured
        const lines = pdfData.text.split('\n').filter((l: string) => l.trim());
        rows = lines.map((line: string) => ({
          patientName: line.trim(),
          rawData: { text: line.trim() },
        }));
      } catch {
        return res.status(400).json({ error: 'Failed to parse PDF. Please use CSV or Excel format for structured data.' });
      }
    } else {
      rows = parseExcelOrCsv(buffer, req.file.originalname);
    }

    const records = parsedRowsToRecords(rows, req.file.originalname);

    // Insert into database
    const db = getDb();
    const stmt = db.prepare(`
      INSERT INTO imported_records (id, source_file, patient_name, age, gender, department,
        diagnosis, treatment, visit_date, address, contact, raw_data)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const insertAll = db.transaction((recs: typeof records) => {
      for (const r of recs) {
        stmt.run(r.id, r.sourceFile, r.patientName, r.age, r.gender, r.department,
          r.diagnosis, r.treatment, r.visitDate, r.address, r.contact, r.rawData);
      }
    });

    insertAll(records);

    // Cleanup uploaded file
    try { fs.unlinkSync(req.file.path); } catch { /* ignore */ }

    res.json({
      success: true,
      imported: records.length,
      filename: req.file.originalname,
      preview: records.slice(0, 5),
    });
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

// GET /history - List imports
router.get('/history', (_req, res) => {
  try {
    const db = getDb();
    const history = db.prepare(`
      SELECT source_file, COUNT(*) as record_count,
        MIN(imported_at) as imported_at
      FROM imported_records
      GROUP BY source_file
      ORDER BY imported_at DESC
    `).all();
    res.json(history);
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

export { router as importRoutes };
