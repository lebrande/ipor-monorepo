'use client';

import type { ChainId } from '@/app/chains.config';
import type { Address } from 'viem';
import { useYoVaultDetail } from '../hooks/use-yo-vault-detail';
import { YoVaultMetrics } from './yo-vault-metrics';
import { YoVaultCharts } from './yo-vault-charts';
import { YoSharePriceChart } from './yo-share-price-chart';

interface Props {
  chainId: ChainId;
  vaultAddress: Address;
}

export function YoVaultOverview({ chainId, vaultAddress }: Props) {
  const detail = useYoVaultDetail(chainId, vaultAddress);

  return (
    <div className="space-y-6 font-yo">
      <YoVaultMetrics
        snapshot={detail.snapshot}
        performance={detail.performance}
        isLoading={detail.isLoading}
      />
      <YoVaultCharts
        yieldHistory={detail.yieldHistory}
        tvlHistory={detail.tvlHistory}
        isLoading={detail.isChartsLoading}
      />
      <YoSharePriceChart
        history={detail.sharePriceHistory}
        isLoading={detail.isChartsLoading}
      />
    </div>
  );
}
