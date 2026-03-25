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
  syncVersion?: number;
}

export interface Device {
  id: string;
  name: string;
  lastSeen: string;
}

export interface PrintJob {
  id: string;
  prescriptionId: string;
  printerName?: string;
  status: 'pending' | 'printing' | 'done' | 'failed';
  cupsJobId?: string;
  createdAt: string;
  error?: string;
}

export interface Printer {
  name: string;
  displayName?: string;
  isEnabled: boolean;
  queueLength: number;
  lastUsed?: string;
}

export interface ImportedRecord {
  id: string;
  sourceFile: string;
  patientName?: string;
  age?: number;
  gender?: string;
  department?: string;
  diagnosis?: string;
  treatment?: string;
  visitDate?: string;
  address?: string;
  contact?: string;
  rawData?: string;
  importedAt: string;
}

export interface CampConfig {
  departments: string[];
  campName: string;
  campDate: string;
  campLocation: string;
  organizationName: string;
}

export const DEFAULT_DEPARTMENTS = [
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

export const DEFAULT_CAMP_CONFIG: CampConfig = {
  departments: [...DEFAULT_DEPARTMENTS],
  campName: 'FREE Health & Wellness Checkup Camp',
  campDate: '2026-03-28',
  campLocation: 'Ayur Factory, 3026 Ranjeet Nagar, Near Hanuman Chowk, South Patel Nagar',
  organizationName: 'SSA Patel Nagar',
};
