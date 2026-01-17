import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { z } from 'zod';
import type { TimeRange } from '../flow-chart.types';
import { apiClient } from '@/lib/api-client';
import type { Address } from 'viem';
import type { ChainId } from '@/app/wagmi-provider';

export const vaultFlowChartSchema = z.object({
  flowChart: z.object({
    chartData: z.array(
      z.object({
        // bucketId is a unix timestamp of bucket start time
        bucketId: z.number(),
        withdraw: z.object({
          sum: z.coerce.bigint(),
          count: z.number(),
        }),
        deposit: z.object({
          sum: z.coerce.bigint(),
          count: z.number(),
        }),
      }),
    ),
  }),
});

const fetchFlowChartData = async (
  address: Address,
  chainId: ChainId,
  timeRange: TimeRange,
) => {
  const response = await apiClient.get(
    `/api/vaults/${chainId}/${address}/flow-chart`,
    {
      params: { timeRange },
    },
  );
  return vaultFlowChartSchema.parse(response.data);
};

interface FlowChartQueryOptions {
  vaultAddress: Address;
  chainId: ChainId;
  timeRange: TimeRange;
  enabled?: boolean;
}

export const useFlowChartQuery = ({
  vaultAddress,
  chainId,
  timeRange,
  enabled = true,
}: FlowChartQueryOptions) => {
  return useQuery({
    queryKey: ['flowChart', vaultAddress, chainId, timeRange],
    queryFn: () => fetchFlowChartData(vaultAddress, chainId, timeRange),
    enabled,
    staleTime: 2 * 60 * 1000, // 2 minutes
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    placeholderData: keepPreviousData,
  });
};
