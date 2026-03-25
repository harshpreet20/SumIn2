'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export function RecentPrescriptions() {
  const [prescriptions, setPrescriptions] = useState<any[]>([]);

  useEffect(() => {
    api.getPrescriptions({ page: 1 })
      .then((r) => setPrescriptions(r.data.slice(0, 10)))
      .catch(() => {});
  }, []);

  if (prescriptions.length === 0) {
    return (
      <Card className="p-6">
        <h3 className="font-semibold mb-3">Recent Prescriptions</h3>
        <p className="text-sm text-muted-foreground">No prescriptions yet. Create your first one!</p>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <h3 className="font-semibold mb-3">Recent Prescriptions</h3>
      <div className="space-y-2">
        {prescriptions.map((rx) => (
          <div key={rx.id} className="flex items-center justify-between py-2 border-b last:border-0">
            <div>
              <p className="text-sm font-medium">{rx.patient_name}</p>
              <p className="text-xs text-muted-foreground">
                {rx.registration_number} &middot; {rx.department} &middot; Dr. {rx.doctor_name}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">
                {new Date(rx.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
              </p>
              {rx.printed_at ? (
                <Badge variant="secondary" className="text-xs">Printed</Badge>
              ) : (
                <Badge variant="outline" className="text-xs">Pending</Badge>
              )}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
