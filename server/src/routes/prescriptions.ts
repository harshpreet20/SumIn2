import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getDb } from '../db/connection.js';

const router = Router();

// Generate registration number: HC-YYYYMMDD-NNN
function generateRegNumber(db: ReturnType<typeof getDb>): string {
  const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const prefix = `HC-${today}-`;
  const result = db.prepare(
    `SELECT COUNT(*) as count FROM prescriptions WHERE registration_number LIKE ?`
  ).get(`${prefix}%`) as { count: number };
  const seq = String(result.count + 1).padStart(3, '0');
  return `${prefix}${seq}`;
}

// GET / - List prescriptions
router.get('/', (req, res) => {
  try {
    const db = getDb();
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const search = req.query.search as string;
    const department = req.query.department as string;
    const offset = (page - 1) * limit;

    let query = 'SELECT * FROM prescriptions';
    const conditions: string[] = [];
    const params: any[] = [];

    if (search) {
      conditions.push('(patient_name LIKE ? OR registration_number LIKE ? OR doctor_name LIKE ?)');
      const searchParam = `%${search}%`;
      params.push(searchParam, searchParam, searchParam);
    }
    if (department) {
      conditions.push('department = ?');
      params.push(department);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }
    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const prescriptions = db.prepare(query).all(...params);

    let countQuery = 'SELECT COUNT(*) as total FROM prescriptions';
    if (conditions.length > 0) {
      countQuery += ' WHERE ' + conditions.join(' AND ');
    }
    const countResult = db.prepare(countQuery).get(...params.slice(0, -2)) as { total: number };

    res.json({
      data: prescriptions,
      pagination: { page, limit, total: countResult.total, totalPages: Math.ceil(countResult.total / limit) },
    });
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

// GET /next-reg - Get next registration number
router.get('/next-reg', (_req, res) => {
  try {
    const db = getDb();
    res.json({ registrationNumber: generateRegNumber(db) });
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

// GET /:id - Get single prescription
router.get('/:id', (req, res) => {
  try {
    const db = getDb();
    const prescription = db.prepare('SELECT * FROM prescriptions WHERE id = ?').get(req.params.id);
    if (!prescription) {
      return res.status(404).json({ error: 'Prescription not found' });
    }
    res.json(prescription);
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

// POST / - Create prescription
router.post('/', (req, res) => {
  try {
    const db = getDb();
    const id = req.body.id || uuidv4();
    const regNumber = req.body.registration_number || generateRegNumber(db);
    const now = new Date().toISOString();

    const stmt = db.prepare(`
      INSERT INTO prescriptions (id, registration_number, department, doctor_name, patient_name,
        guardian_name, age, gender, contact, address, diagnosis, treatment, notes,
        device_id, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id, regNumber, req.body.department, req.body.doctor_name, req.body.patient_name,
      req.body.guardian_name || null, req.body.age || null, req.body.gender || null,
      req.body.contact || null, req.body.address || null, req.body.diagnosis || null,
      req.body.treatment || null, req.body.notes || null,
      req.body.device_id || 'server', now, now
    );

    const prescription = db.prepare('SELECT * FROM prescriptions WHERE id = ?').get(id);
    res.status(201).json(prescription);
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

// PUT /:id - Update prescription
router.put('/:id', (req, res) => {
  try {
    const db = getDb();
    const existing = db.prepare('SELECT * FROM prescriptions WHERE id = ?').get(req.params.id);
    if (!existing) {
      return res.status(404).json({ error: 'Prescription not found' });
    }

    const now = new Date().toISOString();
    const stmt = db.prepare(`
      UPDATE prescriptions SET
        department = COALESCE(?, department),
        doctor_name = COALESCE(?, doctor_name),
        patient_name = COALESCE(?, patient_name),
        guardian_name = COALESCE(?, guardian_name),
        age = COALESCE(?, age),
        gender = COALESCE(?, gender),
        contact = COALESCE(?, contact),
        address = COALESCE(?, address),
        diagnosis = COALESCE(?, diagnosis),
        treatment = COALESCE(?, treatment),
        notes = COALESCE(?, notes),
        updated_at = ?
      WHERE id = ?
    `);

    stmt.run(
      req.body.department, req.body.doctor_name, req.body.patient_name,
      req.body.guardian_name, req.body.age, req.body.gender,
      req.body.contact, req.body.address, req.body.diagnosis,
      req.body.treatment, req.body.notes, now, req.params.id
    );

    const updated = db.prepare('SELECT * FROM prescriptions WHERE id = ?').get(req.params.id);
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

export { router as prescriptionRoutes };
