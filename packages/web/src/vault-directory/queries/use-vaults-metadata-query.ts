import { z } from 'zod';
import { apiClient } from '@/lib/api-client';
import { useQuery } from '@tanstack/react-query';
import { addressSchema } from '@/lib/schema';

const chainSchema = z.object({
  chainId: z.number(),
  name: z.string(),
});

const assetSchema = z.object({
  symbol: z.string(),
  chainId: z.number(),
  address: addressSchema,
});

const vaultsMetadataSchema = z.object({
  ranges: z.object({
    tvl: z.object({ min: z.number(), max: z.number() }),
    depositors: z.object({ min: z.number(), max: z.number() }),
  }),
  chains: z.array(chainSchema),
  protocols: z.array(z.string()),
  assets: z.array(assetSchema),
  totalVaults: z.number(),
});

export type VaultsMetadata = z.infer<typeof vaultsMetadataSchema>;

const fetchVaultsMetadata = async () => {
  const response = await apiClient.get('/api/vaults/metadata');
  return vaultsMetadataSchema.parse(response.data);
};

export const useVaultsMetadataQuery = () => {
  return useQuery({
    queryKey: ['vaultsMetadata'],
    queryFn: fetchVaultsMetadata,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};
