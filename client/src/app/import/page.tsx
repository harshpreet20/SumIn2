'use client';

import { useState, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { api } from '@/lib/api';
import { Upload, FileSpreadsheet, Loader2, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useEffect } from 'react';

export default function ImportPage() {
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    api.getImportHistory().then(setHistory).catch(() => {});
  }, []);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setResult(null);
    try {
      const res = await api.importFile(file);
      setResult(res);
      toast.success(`Imported ${res.imported} records from ${res.filename}`);
      // Refresh history
      api.getImportHistory().then(setHistory).catch(() => {});
    } catch (err: any) {
      toast.error(`Import failed: ${err.message}`);
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Import Data</h1>
        <p className="text-sm text-muted-foreground">
          Upload historical patient data (CSV, Excel, or PDF) for analytics and trend analysis.
        </p>
      </div>

      {/* Upload Area */}
      <Card className="p-8">
        <div className="flex flex-col items-center justify-center gap-4">
          <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
            <Upload className="h-8 w-8 text-primary" />
          </div>
          <div className="text-center">
            <h3 className="font-semibold">Upload Patient Data</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Supported formats: .csv, .xlsx, .xls, .pdf
            </p>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept=".csv,.xlsx,.xls,.pdf"
            onChange={handleUpload}
            className="hidden"
          />
          <Button
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="gap-2"
          >
            {uploading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <FileSpreadsheet className="h-4 w-4" />
            )}
            {uploading ? 'Importing...' : 'Choose File'}
          </Button>
        </div>
      </Card>

      {/* Import Result */}
      {result && (
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <h3 className="font-semibold">Import Successful</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            {result.imported} records imported from <strong>{result.filename}</strong>
          </p>
          {result.preview?.length > 0 && (
            <div className="mt-4">
              <p className="text-xs font-medium mb-2">Preview (first 5 records):</p>
              <div className="overflow-x-auto">
                <table className="text-xs w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-1">Name</th>
                      <th className="text-left p-1">Age</th>
                      <th className="text-left p-1">Gender</th>
                      <th className="text-left p-1">Department</th>
                      <th className="text-left p-1">Diagnosis</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.preview.map((r: any, i: number) => (
                      <tr key={i} className="border-b">
                        <td className="p-1">{r.patientName || '-'}</td>
                        <td className="p-1">{r.age || '-'}</td>
                        <td className="p-1">{r.gender || '-'}</td>
                        <td className="p-1">{r.department || '-'}</td>
                        <td className="p-1">{r.diagnosis || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </Card>
      )}

      {/* Import History */}
      {history.length > 0 && (
        <Card className="p-6">
          <h3 className="font-semibold mb-3">Import History</h3>
          <div className="space-y-2">
            {history.map((h: any, i: number) => (
              <div key={i} className="flex items-center justify-between py-2 border-b last:border-0">
                <div className="flex items-center gap-2">
                  <FileSpreadsheet className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">{h.source_file}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant="secondary">{h.record_count} records</Badge>
                  <span className="text-xs text-muted-foreground">
                    {new Date(h.imported_at).toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
