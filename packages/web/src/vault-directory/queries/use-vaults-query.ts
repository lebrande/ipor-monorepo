import { z } from 'zod';
import { apiClient } from '@/lib/api-client';
import { useQuery } from '@tanstack/react-query';
import { addressSchema } from '@/lib/schema';
import { chainIdSchema } from '@/app/wagmi-provider';

export interface VaultAPIParams {
  page: number;
  limit: number; // Fixed at 20
  sort: 'tvl' | 'depositors' | 'age';
  tvl_min?: number;
  tvl_max?: number;
  depositors_min?: number;
  depositors_max?: number;
  net_flow?: 'positive' | 'negative';
  underlying_assets?: string; // Comma-separated
  chains?: string; // Comma-separated chain IDs
  protocols?: string; // Comma-separated protocol names
}

const vaultDataSchema = z.object({
  chainId: chainIdSchema,
  address: addressSchema,
  name: z.string(),
  protocol: z.string(),
  tvl: z.number(),
  underlyingAsset: z.string(),
  underlyingAssetAddress: addressSchema,
  depositorCount: z.number(),
  netFlow7d: z.number(),
  creationDate: z.string().transform((str) => new Date(str)),
  sharePrice: z.number(),
});

export type VaultData = z.infer<typeof vaultDataSchema>;

const vaultAPIResponseSchema = z.object({
  vaults: z.array(vaultDataSchema),
  pagination: z.object({
    currentPage: z.number(),
    totalPages: z.number(),
    totalCount: z.number(),
    hasNext: z.boolean(),
    hasPrevious: z.boolean(),
  }),
});

const fetchVaults = async (params: VaultAPIParams) => {
  const response = await apiClient.get('/api/vaults', { params });
  return vaultAPIResponseSchema.parse(response.data);
};

export const useVaultsQuery = ({
  params,
  enabled,
}: {
  params: VaultAPIParams;
  enabled: boolean;
}) => {
  return useQuery({
    queryKey: ['vaults', params],
    queryFn: () => fetchVaults(params),
    enabled,
  });
};
