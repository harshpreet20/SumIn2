'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Printer, Search, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { DEPARTMENTS } from '@/types';
import { toast } from 'sonner';

export function PrescriptionTable() {
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [department, setDepartment] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [printingId, setPrintingId] = useState<string | null>(null);

  const fetchPrescriptions = async () => {
    setLoading(true);
    try {
      const result = await api.getPrescriptions({ page, search, department });
      setPrescriptions(result.data);
      setTotalPages(result.pagination.totalPages);
    } catch {
      // Try IndexedDB fallback
      const { db } = await import('@/lib/db');
      const all = await db.prescriptions.orderBy('createdAt').reverse().toArray();
      setPrescriptions(all as any[]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrescriptions();
  }, [page, search, department]);

  const handlePrint = async (id: string) => {
    setPrintingId(id);
    try {
      const result = await api.printPrescription(id);
      if (result.status === 'printing') {
        toast.success(`Printing on ${result.printerName || 'default printer'}`);
      } else {
        toast.error(`Print failed: ${result.error}`);
      }
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setPrintingId(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search patients, doctors, reg numbers..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="pl-9"
          />
        </div>
        <Select value={department} onValueChange={(v: any) => { setDepartment(!v || v === 'all' ? '' : String(v)); setPage(1); }}>
          <SelectTrigger className="w-56">
            <SelectValue placeholder="All Departments" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Departments</SelectItem>
            {DEPARTMENTS.map((d) => (
              <SelectItem key={d} value={d}>{d}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-32">Reg No.</TableHead>
              <TableHead>Patient</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Doctor</TableHead>
              <TableHead className="w-20">Age</TableHead>
              <TableHead className="w-24">Gender</TableHead>
              <TableHead className="w-40">Date</TableHead>
              <TableHead className="w-24">Status</TableHead>
              <TableHead className="w-20">Print</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                </TableCell>
              </TableRow>
            ) : prescriptions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                  No prescriptions found
                </TableCell>
              </TableRow>
            ) : (
              prescriptions.map((rx) => (
                <TableRow key={rx.id}>
                  <TableCell className="font-mono text-xs">
                    {rx.registration_number || rx.registrationNumber}
                  </TableCell>
                  <TableCell className="font-medium">
                    {rx.patient_name || rx.patientName}
                  </TableCell>
                  <TableCell>{rx.department}</TableCell>
                  <TableCell>{rx.doctor_name || rx.doctorName}</TableCell>
                  <TableCell>{rx.age || '-'}</TableCell>
                  <TableCell>{rx.gender || '-'}</TableCell>
                  <TableCell className="text-xs">
                    {new Date(rx.created_at || rx.createdAt).toLocaleString('en-IN')}
                  </TableCell>
                  <TableCell>
                    {(rx.printed_at || rx.printedAt) ? (
                      <Badge variant="secondary" className="text-xs">Printed</Badge>
                    ) : (
                      <Badge variant="outline" className="text-xs">Pending</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handlePrint(rx.id)}
                      disabled={printingId === rx.id}
                    >
                      {printingId === rx.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Printer className="h-4 w-4" />
                      )}
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-end gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
