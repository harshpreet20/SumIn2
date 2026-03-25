import express from 'express';
import cors from 'cors';
import path from 'path';
import { prescriptionRoutes } from './routes/prescriptions.js';
import { printRoutes } from './routes/print.js';
import { healthRoutes } from './routes/health.js';
import { importRoutes } from './routes/import.js';
import { analyticsRoutes } from './routes/analytics.js';
import { configRoutes } from './routes/config.js';

const app = express();

app.use(cors({
  origin: true,
  credentials: true,
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true }));

// Serve uploaded logos
app.use('/logos', express.static(path.join(process.cwd(), 'public', 'logos')));

// API routes
app.use('/api', healthRoutes);
app.use('/api/prescriptions', prescriptionRoutes);
app.use('/api/print', printRoutes);
app.use('/api/import', importRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/config', configRoutes);

// Serve static client build (production)
const clientBuildPath = path.join(process.cwd(), '..', 'client', 'out');
app.use(express.static(clientBuildPath));

// SPA fallback — serve index.html for all non-API routes
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api/')) return next();
  const fs = require('fs');
  const indexPath = path.join(clientBuildPath, 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(404).send('Client not built. Run: cd client && npm run build');
  }
});

export { app };
