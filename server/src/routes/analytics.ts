import { Router } from 'express';
import { getDb } from '../db/connection.js';

const router = Router();

// GET /trends - Prescriptions over time
router.get('/trends', (req, res) => {
  try {
    const db = getDb();
    const days = parseInt(req.query.days as string) || 30;

    // Prescriptions per day
    const daily = db.prepare(`
      SELECT DATE(created_at) as date, COUNT(*) as count
      FROM prescriptions
      WHERE created_at >= datetime('now', ? || ' days')
      GROUP BY DATE(created_at)
      ORDER BY date
    `).all(`-${days}`);

    // Imported records per visit_date
    const imported = db.prepare(`
      SELECT visit_date as date, COUNT(*) as count
      FROM imported_records
      WHERE visit_date IS NOT NULL
      GROUP BY visit_date
      ORDER BY date
    `).all();

    res.json({ daily, imported });
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

// GET /departments - Stats by department
router.get('/departments', (_req, res) => {
  try {
    const db = getDb();

    const current = db.prepare(`
      SELECT department, COUNT(*) as count
      FROM prescriptions
      WHERE department IS NOT NULL
      GROUP BY department
      ORDER BY count DESC
    `).all();

    const historical = db.prepare(`
      SELECT department, COUNT(*) as count
      FROM imported_records
      WHERE department IS NOT NULL
      GROUP BY department
      ORDER BY count DESC
    `).all();

    res.json({ current, historical });
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

// GET /demographics - Age/gender breakdown
router.get('/demographics', (_req, res) => {
  try {
    const db = getDb();

    const genderDist = db.prepare(`
      SELECT gender, COUNT(*) as count
      FROM prescriptions
      WHERE gender IS NOT NULL
      GROUP BY gender
    `).all();

    const ageDist = db.prepare(`
      SELECT
        CASE
          WHEN age < 18 THEN '0-17'
          WHEN age BETWEEN 18 AND 30 THEN '18-30'
          WHEN age BETWEEN 31 AND 45 THEN '31-45'
          WHEN age BETWEEN 46 AND 60 THEN '46-60'
          ELSE '60+'
        END as age_group,
        COUNT(*) as count
      FROM prescriptions
      WHERE age IS NOT NULL
      GROUP BY age_group
      ORDER BY age_group
    `).all();

    // Combine with imported data
    const importedGender = db.prepare(`
      SELECT gender, COUNT(*) as count
      FROM imported_records
      WHERE gender IS NOT NULL
      GROUP BY gender
    `).all();

    const importedAge = db.prepare(`
      SELECT
        CASE
          WHEN age < 18 THEN '0-17'
          WHEN age BETWEEN 18 AND 30 THEN '18-30'
          WHEN age BETWEEN 31 AND 45 THEN '31-45'
          WHEN age BETWEEN 46 AND 60 THEN '46-60'
          ELSE '60+'
        END as age_group,
        COUNT(*) as count
      FROM imported_records
      WHERE age IS NOT NULL
      GROUP BY age_group
      ORDER BY age_group
    `).all();

    res.json({
      current: { gender: genderDist, age: ageDist },
      historical: { gender: importedGender, age: importedAge },
    });
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

// GET /summary - Overall summary
router.get('/summary', (_req, res) => {
  try {
    const db = getDb();

    const todayCount = db.prepare(`
      SELECT COUNT(*) as count FROM prescriptions WHERE DATE(created_at) = DATE('now')
    `).get() as { count: number };

    const totalCount = db.prepare(`SELECT COUNT(*) as count FROM prescriptions`).get() as { count: number };
    const importedCount = db.prepare(`SELECT COUNT(*) as count FROM imported_records`).get() as { count: number };
    const printedCount = db.prepare(`SELECT COUNT(*) as count FROM prescriptions WHERE printed_at IS NOT NULL`).get() as { count: number };

    const topDepartments = db.prepare(`
      SELECT department, COUNT(*) as count
      FROM prescriptions WHERE department IS NOT NULL
      GROUP BY department ORDER BY count DESC LIMIT 5
    `).all();

    res.json({
      today: todayCount.count,
      total: totalCount.count,
      imported: importedCount.count,
      printed: printedCount.count,
      topDepartments,
    });
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

export { router as analyticsRoutes };
