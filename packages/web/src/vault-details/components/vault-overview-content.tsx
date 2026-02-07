'use client';

import { VaultMetrics } from '@/vault-metrics/vault-metrics';
import { FlowChart } from '@/flow-chart/flow-chart';

export const VaultOverviewContent = () => {
  return (
    <div className="space-y-6">
      <VaultMetrics />
      <FlowChart />
    </div>
  );
};
