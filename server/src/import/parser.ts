import * as XLSX from 'xlsx';
import { v4 as uuidv4 } from 'uuid';
import type { ImportedRecord } from '../../shared-types.js';

export interface ParsedRow {
  patientName?: string;
  age?: number;
  gender?: string;
  department?: string;
  diagnosis?: string;
  treatment?: string;
  visitDate?: string;
  address?: string;
  contact?: string;
  rawData: Record<string, any>;
}

// Common column name mappings
const COLUMN_MAP: Record<string, keyof ParsedRow> = {
  'patient name': 'patientName', 'patient_name': 'patientName', 'name': 'patientName', 'patient': 'patientName',
  'age': 'age',
  'gender': 'gender', 'sex': 'gender',
  'department': 'department', 'dept': 'department',
  'diagnosis': 'diagnosis', 'finding': 'diagnosis', 'findings': 'diagnosis',
  'treatment': 'treatment', 'prescription': 'treatment', 'medicine': 'treatment', 'rx': 'treatment',
  'date': 'visitDate', 'visit_date': 'visitDate', 'visit date': 'visitDate',
  'address': 'address',
  'contact': 'contact', 'phone': 'contact', 'mobile': 'contact',
};

function mapColumns(row: Record<string, any>): ParsedRow {
  const result: ParsedRow = { rawData: row };
  for (const [key, value] of Object.entries(row)) {
    const normalized = key.toLowerCase().trim();
    const mappedKey = COLUMN_MAP[normalized];
    if (mappedKey && value !== undefined && value !== null && value !== '') {
      if (mappedKey === 'age') {
        result[mappedKey] = parseInt(String(value)) || undefined;
      } else {
        (result as any)[mappedKey] = String(value);
      }
    }
  }
  return result;
}

export function parseExcelOrCsv(buffer: Buffer, filename: string): ParsedRow[] {
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const jsonData = XLSX.utils.sheet_to_json<Record<string, any>>(sheet);
  return jsonData.map(mapColumns);
}

export function parsedRowsToRecords(rows: ParsedRow[], sourceFile: string): Omit<ImportedRecord, 'importedAt'>[] {
  return rows.map(row => ({
    id: uuidv4(),
    sourceFile,
    patientName: row.patientName,
    age: row.age,
    gender: row.gender,
    department: row.department,
    diagnosis: row.diagnosis,
    treatment: row.treatment,
    visitDate: row.visitDate,
    address: row.address,
    contact: row.contact,
    rawData: JSON.stringify(row.rawData),
  }));
}
