import { Router } from 'express';
import { getDb } from '../db/connection.js';

const router = Router();

// GET / - Get all config
router.get('/', (_req, res) => {
  try {
    const db = getDb();
    const rows = db.prepare('SELECT key, value FROM camp_config').all() as { key: string; value: string }[];
    const config: Record<string, any> = {};
    for (const row of rows) {
      config[row.key] = JSON.parse(row.value);
    }
    res.json(config);
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

// PUT / - Update config
router.put('/', (req, res) => {
  try {
    const db = getDb();
    const upsert = db.prepare('INSERT OR REPLACE INTO camp_config (key, value) VALUES (?, ?)');
    const updateMany = db.transaction((entries: [string, any][]) => {
      for (const [key, value] of entries) {
        upsert.run(key, JSON.stringify(value));
      }
    });
    updateMany(Object.entries(req.body));
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

export { router as configRoutes };
