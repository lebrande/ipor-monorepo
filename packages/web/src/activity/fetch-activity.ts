import { z } from 'zod';
import { addressSchema } from '@/lib/schema';
import { isHex } from 'viem';

// Remove trailing slash from API_URL to prevent double slashes
const API_URL = (
  process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || ''
).replace(/\/$/, '');

// Transaction hash schema (0x + 64 hex chars = 32 bytes)
const txHashSchema = z.string().refine(
  (val) => isHex(val) && val.length === 66,
  { message: 'Invalid transaction hash' }
);

// Activity item schema
const activityItemSchema = z.object({
  id: z.string(),
  type: z.enum(['deposit', 'withdraw']),
  chainId: z.number(),
  vaultAddress: addressSchema,
  vaultName: z.string(),
  depositorAddress: addressSchema,
  amount: z.number(),
  assetAmount: z.string(),
  assetSymbol: z.string(),
  assetDecimals: z.number(),
  transactionHash: txHashSchema,
  timestamp: z.number(),
});

export type ActivityItem = z.infer<typeof activityItemSchema>;

const activityResponseSchema = z.object({
  activities: z.array(activityItemSchema),
  pagination: z.object({
    nextCursor: z.string().nullable(),
    hasMore: z.boolean(),
  }),
});

export type ActivityResponse = z.infer<typeof activityResponseSchema>;

// Inflows schema
const inflowsPeriodSchema = z.object({
  deposits: z.number(),
  withdrawals: z.number(),
  net: z.number(),
});

const inflowsResponseSchema = z.object({
  inflows: z.object({
    day1: inflowsPeriodSchema,
    day7: inflowsPeriodSchema,
    day30: inflowsPeriodSchema,
  }),
});

export type InflowsResponse = z.infer<typeof inflowsResponseSchema>;

// Metadata schema
const chainMetadataSchema = z.object({
  chainId: z.number(),
  name: z.string(),
});

const vaultMetadataSchema = z.object({
  chainId: z.number(),
  address: addressSchema,
  name: z.string(),
});

const activityMetadataSchema = z.object({
  chains: z.array(chainMetadataSchema),
  vaults: z.array(vaultMetadataSchema),
});

export type ActivityMetadata = z.infer<typeof activityMetadataSchema>;

// Search params interface
export interface ActivitySearchParams {
  chains?: string;
  vaults?: string;
  type?: string;
  min_amount?: string;
  depositor?: string;
}

// Fetch activity list (server-side)
export async function fetchActivity(
  params: ActivitySearchParams,
  cursor?: string
): Promise<ActivityResponse> {
  const searchParams = new URLSearchParams();

  if (cursor) searchParams.set('cursor', cursor);
  if (params.chains) searchParams.set('chains', params.chains);
  if (params.vaults) searchParams.set('vaults', params.vaults);
  if (params.type && params.type !== 'all') searchParams.set('type', params.type);
  if (params.min_amount) searchParams.set('min_amount', params.min_amount);
  if (params.depositor) searchParams.set('depositor', params.depositor);

  searchParams.set('limit', '50');

  const response = await fetch(`${API_URL}/api/activity?${searchParams.toString()}`, {
    next: { revalidate: 30 }, // Cache for 30 seconds
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch activity: ${response.statusText}`);
  }

  const data = await response.json();
  return activityResponseSchema.parse(data);
}

// Fetch inflows summary (server-side)
export async function fetchActivityInflows(
  chains?: string
): Promise<InflowsResponse> {
  const searchParams = new URLSearchParams();
  if (chains) searchParams.set('chains', chains);

  const url = searchParams.toString()
    ? `${API_URL}/api/activity/inflows?${searchParams.toString()}`
    : `${API_URL}/api/activity/inflows`;

  const response = await fetch(url, {
    next: { revalidate: 60 }, // Cache for 1 minute
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch inflows: ${response.statusText}`);
  }

  const data = await response.json();
  return inflowsResponseSchema.parse(data);
}

// Fetch activity metadata (server-side)
export async function fetchActivityMetadata(): Promise<ActivityMetadata> {
  const response = await fetch(`${API_URL}/api/activity/metadata`, {
    next: { revalidate: 300 }, // Cache for 5 minutes
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch activity metadata: ${response.statusText}`);
  }

  const data = await response.json();
  return activityMetadataSchema.parse(data);
}
