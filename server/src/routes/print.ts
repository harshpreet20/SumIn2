import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getDb } from '../db/connection.js';
import { renderPrescriptionHtml } from '../print/renderer.js';
import { printHtml, getJobStatus } from '../print/cups.js';
import { selectBestPrinter, getAvailablePrinters } from '../print/load-balancer.js';
import type { Prescription } from '../../shared-types.js';

const router = Router();

// POST /prescriptions/:id/print - handled via /api/print/:id
router.post('/:id', (req, res) => {
  try {
    const db = getDb();
    const prescription = db.prepare('SELECT * FROM prescriptions WHERE id = ?').get(req.params.id) as any;
    if (!prescription) {
      return res.status(404).json({ error: 'Prescription not found' });
    }

    // Map DB columns to type
    const rxData: Prescription = {
      id: prescription.id,
      registrationNumber: prescription.registration_number,
      department: prescription.department,
      doctorName: prescription.doctor_name,
      patientName: prescription.patient_name,
      guardianName: prescription.guardian_name,
      age: prescription.age,
      gender: prescription.gender,
      contact: prescription.contact,
      address: prescription.address,
      diagnosis: prescription.diagnosis,
      treatment: prescription.treatment,
      notes: prescription.notes,
      deviceId: prescription.device_id,
      createdAt: prescription.created_at,
      updatedAt: prescription.updated_at,
    };

    // Select best printer
    const printerName = selectBestPrinter();

    // Render HTML
    const html = renderPrescriptionHtml(rxData);

    // Send to printer
    const result = printHtml(html, printerName || '');

    // Record print job
    const jobId = uuidv4();
    db.prepare(`
      INSERT INTO print_jobs (id, prescription_id, printer_name, status, cups_job_id, error)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      jobId, req.params.id, printerName,
      result.success ? 'printing' : 'failed',
      result.jobId || null, result.error || null
    );

    // Update prescription printed_at
    if (result.success) {
      db.prepare('UPDATE prescriptions SET printed_at = datetime("now") WHERE id = ?').run(req.params.id);
    }

    res.json({
      jobId,
      printerName,
      status: result.success ? 'printing' : 'failed',
      cupsJobId: result.jobId,
      error: result.error,
    });
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

// GET /status/:jobId
router.get('/status/:jobId', (req, res) => {
  try {
    const db = getDb();
    const job = db.prepare('SELECT * FROM print_jobs WHERE id = ?').get(req.params.jobId) as any;
    if (!job) {
      return res.status(404).json({ error: 'Print job not found' });
    }

    // Check live status if still printing
    if (job.status === 'printing' && job.cups_job_id) {
      const liveStatus = getJobStatus(job.cups_job_id);
      if (liveStatus === 'done') {
        db.prepare('UPDATE print_jobs SET status = ? WHERE id = ?').run('done', req.params.jobId);
        job.status = 'done';
      }
    }

    res.json(job);
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

// GET /printers - List all printers
router.get('/printers', (_req, res) => {
  try {
    const printers = getAvailablePrinters();
    res.json(printers);
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

export { router as printRoutes };
