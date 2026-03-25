export interface Prescription {
  id: string;
  registrationNumber: string;
  department: string;
  doctorName: string;
  patientName: string;
  guardianName?: string;
  age?: number;
  gender?: 'Male' | 'Female' | 'Other';
  contact?: string;
  address?: string;
  diagnosis?: string;
  treatment?: string;
  notes?: string;
  deviceId: string;
  createdAt: string;
  updatedAt: string;
  printedAt?: string;
  syncStatus?: 'synced' | 'pending' | 'conflict';
}

export interface PrintJob {
  jobId: string;
  printerName: string;
  status: 'pending' | 'printing' | 'done' | 'failed';
  cupsJobId?: string;
  error?: string;
}

export interface AnalyticsSummary {
  today: number;
  total: number;
  imported: number;
  printed: number;
  topDepartments: { department: string; count: number }[];
}

export const DEPARTMENTS = [
  'General Medicine',
  'Gynecologist (Women)',
  'Dental (Teeth)',
  'Ophthalmologist (Eye)',
  'Ortho & Physio (Bones)',
  'Psychology/Counseling',
  'Physiotherapy',
  'Accupressure',
  'ECG',
  'Bp & Sugar',
  'Pharmacy',
  'Medico Legal Aid',
] as const;
