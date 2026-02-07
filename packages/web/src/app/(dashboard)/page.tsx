import { fetchDashboardMetrics } from '@/dashboard/fetch-dashboard-metrics';
import { DashboardMetrics } from '@/dashboard/components/dashboard-metrics';
import { DashboardFlowChart } from '@/dashboard/dashboard-flow-chart';

export default async function DashboardPage() {
  const metrics = await fetchDashboardMetrics();

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Protocol overview across all vaults and chains
        </p>
      </div>
      <DashboardMetrics metrics={metrics} />
      <DashboardFlowChart />
    </div>
  );
}
