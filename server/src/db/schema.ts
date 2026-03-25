import type Database from 'better-sqlite3';
import { DEFAULT_CAMP_CONFIG } from '../../shared-types.js';

export function initSchema(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS prescriptions (
      id TEXT PRIMARY KEY,
      registration_number TEXT NOT NULL,
      department TEXT,
      doctor_name TEXT NOT NULL,
      patient_name TEXT NOT NULL,
      guardian_name TEXT,
      age INTEGER,
      gender TEXT CHECK(gender IN ('Male','Female','Other')),
      contact TEXT,
      address TEXT,
      diagnosis TEXT,
      treatment TEXT,
      notes TEXT,
      device_id TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      printed_at TEXT,
      sync_version INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS devices (
      id TEXT PRIMARY KEY,
      name TEXT,
      last_seen TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS sync_metadata (
      doc_name TEXT PRIMARY KEY,
      state BLOB NOT NULL,
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS print_jobs (
      id TEXT PRIMARY KEY,
      prescription_id TEXT NOT NULL REFERENCES prescriptions(id),
      printer_name TEXT,
      status TEXT CHECK(status IN ('pending','printing','done','failed')) DEFAULT 'pending',
      cups_job_id TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      error TEXT
    );

    CREATE TABLE IF NOT EXISTS printers (
      name TEXT PRIMARY KEY,
      display_name TEXT,
      is_enabled INTEGER DEFAULT 1,
      queue_length INTEGER DEFAULT 0,
      last_used TEXT
    );

    CREATE TABLE IF NOT EXISTS imported_records (
      id TEXT PRIMARY KEY,
      source_file TEXT NOT NULL,
      patient_name TEXT,
      age INTEGER,
      gender TEXT,
      department TEXT,
      diagnosis TEXT,
      treatment TEXT,
      visit_date TEXT,
      address TEXT,
      contact TEXT,
      raw_data TEXT,
      imported_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS camp_config (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_prescriptions_reg ON prescriptions(registration_number);
    CREATE INDEX IF NOT EXISTS idx_prescriptions_date ON prescriptions(created_at);
    CREATE INDEX IF NOT EXISTS idx_prescriptions_dept ON prescriptions(department);
    CREATE INDEX IF NOT EXISTS idx_prescriptions_doctor ON prescriptions(doctor_name);
    CREATE INDEX IF NOT EXISTS idx_imported_date ON imported_records(visit_date);
    CREATE INDEX IF NOT EXISTS idx_imported_dept ON imported_records(department);
  `);

  // Seed default config if empty
  const configCount = db.prepare('SELECT COUNT(*) as count FROM camp_config').get() as { count: number };
  if (configCount.count === 0) {
    const insert = db.prepare('INSERT OR IGNORE INTO camp_config (key, value) VALUES (?, ?)');
    insert.run('departments', JSON.stringify(DEFAULT_CAMP_CONFIG.departments));
    insert.run('camp_name', JSON.stringify(DEFAULT_CAMP_CONFIG.campName));
    insert.run('camp_date', JSON.stringify(DEFAULT_CAMP_CONFIG.campDate));
    insert.run('camp_location', JSON.stringify(DEFAULT_CAMP_CONFIG.campLocation));
    insert.run('organization_name', JSON.stringify(DEFAULT_CAMP_CONFIG.organizationName));
  }
}
