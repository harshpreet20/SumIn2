import Dexie, { type Table } from 'dexie';
import type { Prescription } from '@/types';

class HealthCampDB extends Dexie {
  prescriptions!: Table<Prescription>;

  constructor() {
    super('healthcamp');
    this.version(1).stores({
      prescriptions: 'id, registrationNumber, patientName, doctorName, department, createdAt, syncStatus',
    });
  }
}

export const db = new HealthCampDB();
