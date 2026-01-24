import { db } from 'ponder:api';
import { and, eq, gte, gt, sql } from 'ponder';
import schema from 'ponder:schema';
import { Address } from 'viem';
import { getUnixTime } from 'date-fns';
import {
  BUCKET_SIZE,
  getBucketId,
  getDepositBucketSchema,
  getWithdrawBucketSchema,
} from '../../utils/buckets';

export interface VaultDbData {
  depositorCount: number;
  netFlow7d: bigint;
  firstDepositTimestamp: number | null;
}

const DEFAULT_DB_DATA: VaultDbData = {
  depositorCount: 0,
  netFlow7d: 0n,
  firstDepositTimestamp: null,
};

export const fetchVaultDbData = async (
  chainId: number,
  vaultAddress: Address,
): Promise<VaultDbData> => {
  const normalizedAddress = vaultAddress.toLowerCase() as Address;

  try {
    // Query 1: Active depositor count
    const depositorResult = await db
      .select({
        count: sql<number>`count(distinct ${schema.depositor.depositorAddress})`,
      })
      .from(schema.depositor)
      .where(
        and(
          eq(schema.depositor.chainId, chainId),
          eq(schema.depositor.vaultAddress, normalizedAddress),
          gt(schema.depositor.shareBalance, 0n),
        ),
      );

    // Query 2: First deposit timestamp
    const firstDepositResult = await db
      .select({
        firstDeposit: sql<number>`min(${schema.depositEvent.timestamp})`,
      })
      .from(schema.depositEvent)
      .where(
        and(
          eq(schema.depositEvent.chainId, chainId),
          eq(schema.depositEvent.vaultAddress, normalizedAddress),
        ),
      );

    // Query 3: 7-day net flow
    const now = getUnixTime(new Date());
    const endBucketId = getBucketId(now, '2_HOURS');
    const startBucketId = endBucketId - 84 * BUCKET_SIZE['2_HOURS']; // 84 buckets = 7 days

    const depositBucketSchema = getDepositBucketSchema('2_HOURS');
    const withdrawBucketSchema = getWithdrawBucketSchema('2_HOURS');

    const [depositSum, withdrawSum] = await Promise.all([
      db
        .select({
          total: sql<bigint>`coalesce(sum(${depositBucketSchema.sum}), 0)`,
        })
        .from(depositBucketSchema)
        .where(
          and(
            eq(depositBucketSchema.chainId, chainId),
            eq(depositBucketSchema.vaultAddress, normalizedAddress),
            gte(depositBucketSchema.bucketId, startBucketId),
          ),
        ),
      db
        .select({
          total: sql<bigint>`coalesce(sum(${withdrawBucketSchema.sum}), 0)`,
        })
        .from(withdrawBucketSchema)
        .where(
          and(
            eq(withdrawBucketSchema.chainId, chainId),
            eq(withdrawBucketSchema.vaultAddress, normalizedAddress),
            gte(withdrawBucketSchema.bucketId, startBucketId),
          ),
        ),
    ]);

    const depositTotal = depositSum[0]?.total ?? 0n;
    const withdrawTotal = withdrawSum[0]?.total ?? 0n;
    const netFlow7d = depositTotal - withdrawTotal;

    // Ensure depositorCount is a number (SQL count can return string in some drivers)
    const rawCount = depositorResult[0]?.count;
    const depositorCount = typeof rawCount === 'string' ? parseInt(rawCount, 10) : (rawCount ?? 0);

    return {
      depositorCount,
      netFlow7d,
      firstDepositTimestamp: firstDepositResult[0]?.firstDeposit ?? null,
    };
  } catch (error) {
    console.error(
      `Failed to fetch DB data for ${chainId}:${vaultAddress}`,
      error,
    );
    return DEFAULT_DB_DATA;
  }
};

// Batch fetch for all vaults with concurrency limit
export const fetchAllVaultsDbData = async (
  vaults: Array<{ chainId: number; address: Address }>,
): Promise<Map<string, VaultDbData>> => {
  const results = new Map<string, VaultDbData>();

  // Fetch in parallel with concurrency limit to avoid DB connection exhaustion
  const BATCH_SIZE = 10;
  for (let i = 0; i < vaults.length; i += BATCH_SIZE) {
    const batch = vaults.slice(i, i + BATCH_SIZE);
    await Promise.all(
      batch.map(async (vault) => {
        const data = await fetchVaultDbData(vault.chainId, vault.address);
        results.set(`${vault.chainId}:${vault.address.toLowerCase()}`, data);
      }),
    );
  }

  return results;
};
