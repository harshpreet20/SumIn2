'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { api } from '@/lib/api';
import { db } from '@/lib/db';
import { addPrescriptionToSync } from '@/lib/sync';
import { DEPARTMENTS } from '@/types';
import { Printer, Save, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const schema = z.object({
  doctorName: z.string().min(1, 'Doctor name is required'),
  department: z.string().min(1, 'Department is required'),
  patientName: z.string().min(1, 'Patient name is required'),
  guardianName: z.string().optional(),
  age: z.string().optional(),
  gender: z.string().optional(),
  contact: z.string().optional(),
  address: z.string().optional(),
  diagnosis: z.string().optional(),
  treatment: z.string().optional(),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export function PrescriptionForm() {
  const router = useRouter();
  const [regNumber, setRegNumber] = useState('');
  const [saving, setSaving] = useState(false);
  const [printing, setPrinting] = useState(false);
  const firstFieldRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      doctorName: '',
      department: '',
      patientName: '',
    },
  });

  // Fetch next registration number
  useEffect(() => {
    api.getNextRegNumber()
      .then((data) => setRegNumber(data.registrationNumber))
      .catch(() => {
        // Generate offline reg number
        const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        setRegNumber(`HC-${today}-OFF`);
      });
  }, []);

  // Auto-focus first field
  useEffect(() => {
    setTimeout(() => firstFieldRef.current?.focus(), 100);
  }, []);

  const onSubmit = async (data: FormData, shouldPrint = false) => {
    setSaving(true);
    try {
      const id = uuidv4();
      const now = new Date().toISOString();

      const prescription = {
        id,
        registration_number: regNumber,
        department: data.department,
        doctor_name: data.doctorName,
        patient_name: data.patientName,
        guardian_name: data.guardianName || undefined,
        age: data.age ? parseInt(data.age) : undefined,
        gender: data.gender || undefined,
        contact: data.contact || undefined,
        address: data.address || undefined,
        diagnosis: data.diagnosis || undefined,
        treatment: data.treatment || undefined,
        notes: data.notes || undefined,
        device_id: getDeviceId(),
      };

      // Save to local IndexedDB
      await db.prescriptions.put({
        id,
        registrationNumber: regNumber,
        department: data.department,
        doctorName: data.doctorName,
        patientName: data.patientName,
        guardianName: data.guardianName,
        age: data.age ? parseInt(data.age) : undefined,
        gender: data.gender as any,
        contact: data.contact,
        address: data.address,
        diagnosis: data.diagnosis,
        treatment: data.treatment,
        notes: data.notes,
        deviceId: getDeviceId(),
        createdAt: now,
        updatedAt: now,
        syncStatus: 'pending',
      });

      // Add to Yjs sync
      addPrescriptionToSync({
        id,
        registrationNumber: regNumber,
        ...data,
        createdAt: now,
      });

      // Try to save to server
      try {
        await api.createPrescription(prescription);
        await db.prescriptions.update(id, { syncStatus: 'synced' });
      } catch {
        // Will sync later
      }

      toast.success(`Prescription ${regNumber} saved`);

      // Auto-print if requested
      if (shouldPrint) {
        setPrinting(true);
        try {
          const result = await api.printPrescription(id);
          if (result.status === 'printing') {
            toast.success(`Printing on ${result.printerName || 'default printer'}`);
          } else {
            toast.error(`Print failed: ${result.error}`);
          }
        } catch (e: any) {
          toast.error(`Print error: ${e.message}`);
        } finally {
          setPrinting(false);
        }
      }

      // Reset form for next patient
      reset();
      // Get next reg number
      try {
        const next = await api.getNextRegNumber();
        setRegNumber(next.registrationNumber);
      } catch {
        // increment offline
        const match = regNumber.match(/(\d+)$/);
        if (match) {
          const num = parseInt(match[1]) + 1;
          setRegNumber(regNumber.replace(/\d+$/, String(num).padStart(3, '0')));
        }
      }
      firstFieldRef.current?.focus();
    } catch (error: any) {
      toast.error(`Save failed: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  // Handle keyboard: Enter on last field submits, Ctrl+P prints
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'p') {
        e.preventDefault();
        handleSubmit((data) => onSubmit(data, true))();
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        handleSubmit((data) => onSubmit(data, false))();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handleSubmit, regNumber]);

  return (
    <form
      onSubmit={handleSubmit((data) => onSubmit(data, false))}
      className="space-y-6 max-w-4xl"
    >
      {/* Registration Info */}
      <div className="bg-card rounded-lg border p-4">
        <h3 className="text-sm font-semibold text-primary mb-3 uppercase tracking-wide">
          Registration Details
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <Label className="text-xs">Reg. Number</Label>
            <Input value={regNumber} readOnly className="bg-muted font-mono text-sm" />
          </div>
          <div>
            <Label className="text-xs">Department *</Label>
            <Select onValueChange={(v: any) => v && setValue('department', String(v))}>
              <SelectTrigger>
                <SelectValue placeholder="Select department" />
              </SelectTrigger>
              <SelectContent>
                {DEPARTMENTS.map((dept) => (
                  <SelectItem key={dept} value={dept}>
                    {dept}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.department && (
              <p className="text-xs text-destructive mt-1">{errors.department.message}</p>
            )}
          </div>
          <div>
            <Label className="text-xs">Date & Time</Label>
            <Input value={new Date().toLocaleString('en-IN')} readOnly className="bg-muted text-sm" />
          </div>
          <div>
            <Label className="text-xs">Doctor Name *</Label>
            <Input
              {...register('doctorName')}
              ref={firstFieldRef}
              placeholder="Dr."
              autoComplete="off"
            />
            {errors.doctorName && (
              <p className="text-xs text-destructive mt-1">{errors.doctorName.message}</p>
            )}
          </div>
        </div>
      </div>

      {/* Patient Info */}
      <div className="bg-card rounded-lg border p-4">
        <h3 className="text-sm font-semibold text-primary mb-3 uppercase tracking-wide">
          Patient Information
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div>
            <Label className="text-xs">Patient Name *</Label>
            <Input {...register('patientName')} placeholder="Full name" autoComplete="off" />
            {errors.patientName && (
              <p className="text-xs text-destructive mt-1">{errors.patientName.message}</p>
            )}
          </div>
          <div>
            <Label className="text-xs">Guardian Name</Label>
            <Input {...register('guardianName')} placeholder="S/O, D/O, W/O" autoComplete="off" />
          </div>
          <div>
            <Label className="text-xs">Age</Label>
            <Input {...register('age')} type="number" placeholder="Years" autoComplete="off" />
          </div>
          <div>
            <Label className="text-xs">Gender</Label>
            <Select onValueChange={(v: any) => v && setValue('gender', String(v))}>
              <SelectTrigger>
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Male">Male</SelectItem>
                <SelectItem value="Female">Female</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Contact</Label>
            <Input {...register('contact')} type="tel" placeholder="Phone number" autoComplete="off" />
          </div>
          <div>
            <Label className="text-xs">Address</Label>
            <Input {...register('address')} placeholder="Address" autoComplete="off" />
          </div>
        </div>
      </div>

      {/* Diagnosis & Treatment */}
      <div className="bg-card rounded-lg border p-4">
        <h3 className="text-sm font-semibold text-primary mb-3 uppercase tracking-wide">
          Diagnosis & Treatment
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label className="text-xs">Diagnosis / Findings</Label>
            <textarea
              {...register('diagnosis')}
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring min-h-[120px] resize-y"
              placeholder="Findings, symptoms..."
            />
          </div>
          <div>
            <Label className="text-xs">Treatment / Prescription</Label>
            <textarea
              {...register('treatment')}
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring min-h-[120px] resize-y"
              placeholder="Medicines, dosage..."
            />
          </div>
        </div>
        <div className="mt-4">
          <Label className="text-xs">Additional Notes</Label>
          <Input {...register('notes')} placeholder="Follow-up, special instructions..." autoComplete="off" />
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3">
        <Button type="submit" disabled={saving} className="gap-2">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save (⌘S)
        </Button>
        <Button
          type="button"
          variant="secondary"
          disabled={saving || printing}
          onClick={handleSubmit((data) => onSubmit(data, true))}
          className="gap-2"
        >
          {printing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Printer className="h-4 w-4" />}
          Save & Print (⌘P)
        </Button>
      </div>
    </form>
  );
}

function getDeviceId(): string {
  if (typeof window === 'undefined') return 'server';
  let id = localStorage.getItem('device_id');
  if (!id) {
    id = uuidv4();
    localStorage.setItem('device_id', id);
  }
  return id;
}
