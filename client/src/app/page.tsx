import { StatsCards } from '@/components/dashboard/stats-cards';
import { RecentPrescriptions } from '@/components/dashboard/recent-prescriptions';

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Health Camp — Prescription Management
        </p>
      </div>
      <StatsCards />
      <RecentPrescriptions />
    </div>
  );
}
