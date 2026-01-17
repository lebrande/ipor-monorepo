import { z } from 'zod';
import { apiClient } from '@/lib/api-client';
import { useQuery } from '@tanstack/react-query';
import { addressSchema } from '@/lib/schema';
import { chainIdSchema } from '@/app/wagmi-provider';

const assetDataSchema = z.object({
  chainId: chainIdSchema,
  address: addressSchema,
  symbol: z.string(),
});

const assetAPIResponseSchema = z.object({
  assets: z.array(assetDataSchema),
});

const fetchAvailableAssets = async () => {
  const response = await apiClient.get('/api/assets');
  return assetAPIResponseSchema.parse(response.data);
};

export const useAssetsQuery = () => {
  // Fetch available assets for filter options
  return useQuery({
    queryKey: ['useAssetsQuery'],
    queryFn: fetchAvailableAssets,
    staleTime: 30 * 60 * 1000, // 30 minutes
  });
};
