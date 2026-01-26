import { Hono } from 'hono';
import { db } from 'ponder:api';
import { and, eq, gte, or, sql } from 'ponder';
import schema from 'ponder:schema';
import { z } from 'zod';
import { getUnixTime, subDays } from 'date-fns';
import { ERC4626_VAULTS } from '../../contracts';
import { fetchAllVaultsRpcData } from '../vaults/vault-rpc-data';
import { formatUnits } from 'viem';
import { ChainId } from '../../utils/chains';

const inflowsQuerySchema = z.object({
  chains: z.string().optional(),
});

export const inflows = new Hono();

inflows.get('/inflows', async (c) => {
  const queryResult = inflowsQuerySchema.safeParse(
    Object.fromEntries(new URL(c.req.url).searchParams),
  );
  if (!queryResult.success) {
    return c.json(
      { error: 'Invalid query parameters', details: queryResult.error.flatten() },
      400,
    );
  }
  const query = queryResult.data;

  // Parse chain filter
  const chainIds = query.chains
    ? query.chains.split(',').map((c) => parseInt(c.trim(), 10)).filter((c) => !isNaN(c))
    : null;

  // Get RPC data for decimals
  const vaultsForRpc = ERC4626_VAULTS.map((v) => ({
    chainId: v.chainId as ChainId,
    address: v.address,
  }));
  const rpcDataMap = await fetchAllVaultsRpcData(vaultsForRpc);

  // Calculate timestamps
  const now = getUnixTime(new Date());
  const day1Ago = getUnixTime(subDays(new Date(), 1));
  const day7Ago = getUnixTime(subDays(new Date(), 7));
  const day30Ago = getUnixTime(subDays(new Date(), 30));

  // Build conditions
  const buildChainCondition = (schema: { chainId: any }) => {
    if (chainIds && chainIds.length > 0) {
      return or(...chainIds.map((cid) => eq(schema.chainId, cid)));
    }
    return undefined;
  };

  // Query deposit sums for each period
  const fetchDepositSum = async (sinceTimestamp: number) => {
    const conditions = [gte(schema.depositEvent.timestamp, sinceTimestamp)];
    const chainCond = buildChainCondition(schema.depositEvent);
    if (chainCond) conditions.push(chainCond);

    const result = await db
      .select({
        total: sql<bigint>`coalesce(sum(${schema.depositEvent.assets}), 0)`,
      })
      .from(schema.depositEvent)
      .where(and(...conditions));

    return result[0]?.total ?? 0n;
  };

  // Query withdrawal sums for each period
  const fetchWithdrawSum = async (sinceTimestamp: number) => {
    const conditions = [gte(schema.withdrawalEvent.timestamp, sinceTimestamp)];
    const chainCond = buildChainCondition(schema.withdrawalEvent);
    if (chainCond) conditions.push(chainCond);

    const result = await db
      .select({
        total: sql<bigint>`coalesce(sum(${schema.withdrawalEvent.assets}), 0)`,
      })
      .from(schema.withdrawalEvent)
      .where(and(...conditions));

    return result[0]?.total ?? 0n;
  };

  // Fetch all periods in parallel
  const [
    deposits1d,
    deposits7d,
    deposits30d,
    withdrawals1d,
    withdrawals7d,
    withdrawals30d,
  ] = await Promise.all([
    fetchDepositSum(day1Ago),
    fetchDepositSum(day7Ago),
    fetchDepositSum(day30Ago),
    fetchWithdrawSum(day1Ago),
    fetchWithdrawSum(day7Ago),
    fetchWithdrawSum(day30Ago),
  ]);

  // Calculate net flows (simplified - using 18 decimals for display)
  // In production, should aggregate per-vault with correct decimals
  const formatAmount = (amount: bigint) => {
    // Use 18 decimals as default (most common for DeFi)
    // Handle negative numbers manually since formatUnits expects positive bigints
    const isNegative = amount < 0n;
    const absAmount = isNegative ? -amount : amount;
    const formatted = Number(formatUnits(absAmount, 18));
    // Handle NaN/Infinity cases
    if (!Number.isFinite(formatted)) return 0;
    return isNegative ? -formatted : formatted;
  };

  // Calculate deposits, withdrawals, and net for a period
  const calculatePeriod = (deposits: bigint, withdrawals: bigint) => ({
    deposits: formatAmount(deposits),
    withdrawals: formatAmount(withdrawals),
    net: formatAmount(deposits) - formatAmount(withdrawals),
  });

  return c.json({
    inflows: {
      day1: calculatePeriod(deposits1d, withdrawals1d),
      day7: calculatePeriod(deposits7d, withdrawals7d),
      day30: calculatePeriod(deposits30d, withdrawals30d),
    },
  });
});
