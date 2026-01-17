import { useQuery } from '@tanstack/react-query';
import { z } from 'zod';
import { apiClient } from '@/lib/api-client';
import { useVaultContext } from '@/vault/vault.context';

export const vaultMetricsResponseSchema = z.object({
  metrics: z.object({
    totalShareBalance: z.coerce.bigint(),
    activeDepositors: z.coerce.number(),
    allTimeDepositors: z.coerce.number(),
    firstDeposit: z.number(),
  }),
});

export type VaultMetricsResponse = z.infer<typeof vaultMetricsResponseSchema>;

export const useVaultMetricsQuery = () => {
  const { chainId, vaultAddress } = useVaultContext();

  return useQuery({
    queryKey: ['vault-metrics', chainId, vaultAddress],
    queryFn: async () => {
      const response = await apiClient.get(
        `/api/vaults/${chainId}/${vaultAddress}/metrics`,
      );
      return vaultMetricsResponseSchema.parse(response.data);
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
};
