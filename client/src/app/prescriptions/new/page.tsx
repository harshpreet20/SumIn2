import { PrescriptionForm } from '@/components/prescriptions/prescription-form';

export default function NewPrescriptionPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">New Prescription</h1>
        <p className="text-sm text-muted-foreground">
          Fill in patient details. Press ⌘S to save, ⌘P to save & print.
        </p>
      </div>
      <PrescriptionForm />
    </div>
  );
}
