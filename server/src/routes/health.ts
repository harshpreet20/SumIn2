import { Router } from 'express';
import { getDb } from '../db/connection.js';

const router = Router();

router.get('/health', (_req, res) => {
  try {
    const db = getDb();
    const result = db.prepare('SELECT COUNT(*) as count FROM prescriptions').get() as { count: number };
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      prescriptionCount: result.count,
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: String(error) });
  }
});

export { router as healthRoutes };
