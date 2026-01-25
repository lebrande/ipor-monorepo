import { z } from 'zod';
import { addressSchema } from '@/lib/schema';
import { chainIdSchema } from '@/app/chains.config';

// Remove trailing slash from API_URL to prevent double slashes
const API_URL = (
  process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || ''
).replace(/\/$/, '');

// Vault data schema (reused from use-vaults-query.ts)
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

const vaultsResponseSchema = z.object({
  vaults: z.array(vaultDataSchema),
  pagination: z.object({
    currentPage: z.number(),
    totalPages: z.number(),
    totalCount: z.number(),
    hasNext: z.boolean(),
    hasPrevious: z.boolean(),
  }),
});

export type VaultsResponse = z.infer<typeof vaultsResponseSchema>;

// Metadata schema
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

export interface VaultSearchParams {
  page?: string;
  sort?: string;
  tvl_min?: string;
  tvl_max?: string;
  depositors_min?: string;
  depositors_max?: string;
  net_flow?: string;
  underlying_assets?: string;
  chains?: string;
  protocols?: string;
}

export async function fetchVaults(
  searchParams: VaultSearchParams
): Promise<VaultsResponse> {
  const params = new URLSearchParams();

  params.set('page', searchParams.page || '1');
  params.set('limit', '20');
  params.set('sort', searchParams.sort || 'tvl');

  if (searchParams.tvl_min) params.set('tvl_min', searchParams.tvl_min);
  if (searchParams.tvl_max) params.set('tvl_max', searchParams.tvl_max);
  if (searchParams.depositors_min)
    params.set('depositors_min', searchParams.depositors_min);
  if (searchParams.depositors_max)
    params.set('depositors_max', searchParams.depositors_max);
  if (searchParams.net_flow && searchParams.net_flow !== 'all')
    params.set('net_flow', searchParams.net_flow);
  if (searchParams.underlying_assets)
    params.set('underlying_assets', searchParams.underlying_assets);
  if (searchParams.chains) params.set('chains', searchParams.chains);
  if (searchParams.protocols) params.set('protocols', searchParams.protocols);

  const response = await fetch(`${API_URL}/api/vaults?${params.toString()}`, {
    next: { revalidate: 60 }, // Cache for 60 seconds
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch vaults: ${response.statusText}`);
  }

  const data = await response.json();
  return vaultsResponseSchema.parse(data);
}

export async function fetchVaultsMetadata(): Promise<VaultsMetadata> {
  const response = await fetch(`${API_URL}/api/vaults/metadata`, {
    next: { revalidate: 300 }, // Cache for 5 minutes
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch metadata: ${response.statusText}`);
  }

  const data = await response.json();
  return vaultsMetadataSchema.parse(data);
}
