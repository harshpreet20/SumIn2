import { PrescriptionTable } from '@/components/prescriptions/prescription-table';

export default function PrescriptionsPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">All Prescriptions</h1>
        <p className="text-sm text-muted-foreground">
          View, search, and print all prescriptions.
        </p>
      </div>
      <PrescriptionTable />
    </div>
  );
}
