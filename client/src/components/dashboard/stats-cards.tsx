'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { api } from '@/lib/api';
import { FileText, CalendarCheck, Printer, Database } from 'lucide-react';
import type { AnalyticsSummary } from '@/types';

export function StatsCards() {
  const [stats, setStats] = useState<AnalyticsSummary | null>(null);

  useEffect(() => {
    api.getSummary().then(setStats).catch(() => {});
  }, []);

  const cards = [
    { label: "Today's Prescriptions", value: stats?.today ?? '-', icon: CalendarCheck, color: 'text-blue-600' },
    { label: 'Total Prescriptions', value: stats?.total ?? '-', icon: FileText, color: 'text-green-600' },
    { label: 'Printed', value: stats?.printed ?? '-', icon: Printer, color: 'text-purple-600' },
    { label: 'Imported Records', value: stats?.imported ?? '-', icon: Database, color: 'text-orange-600' },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {cards.map((card) => (
        <Card key={card.label} className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">{card.label}</p>
              <p className="text-2xl font-bold mt-1">{card.value}</p>
            </div>
            <card.icon className={`h-8 w-8 ${card.color} opacity-80`} />
          </div>
        </Card>
      ))}
    </div>
  );
}
