import { Hono } from 'hono';
import { db } from 'ponder:api';
import { and, eq, gte, desc, sql, or, lt } from 'ponder';
import schema from 'ponder:schema';
import { z } from 'zod';
import { ERC4626_VAULTS } from '../../contracts';
import { fetchAllVaultsRpcData } from '../vaults/vault-rpc-data';
import { Address, formatUnits } from 'viem';
import { ChainId } from '../../utils/chains';

// Query parameter schema
const activityQuerySchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().positive().max(100).default(50),
  chains: z.string().optional(),
  vaults: z.string().optional(),
  type: z.enum(['deposit', 'withdraw', 'all']).default('all'),
  min_amount: z.coerce.number().optional(),
  depositor: z.string().optional(),
});

// Cursor format: timestamp:id
function parseCursor(cursor: string): { timestamp: number; id: string } | null {
  const parts = cursor.split(':');
  if (parts.length < 2) return null;
  const timestampStr = parts[0];
  if (!timestampStr) return null;
  const timestamp = parseInt(timestampStr, 10);
  const id = parts.slice(1).join(':');
  if (isNaN(timestamp) || !id) return null;
  return { timestamp, id };
}

function encodeCursor(timestamp: number, id: string): string {
  return `${timestamp}:${id}`;
}

export const activity = new Hono();

activity.get('/', async (c) => {
  // Parse and validate query parameters
  const queryResult = activityQuerySchema.safeParse(
    Object.fromEntries(new URL(c.req.url).searchParams),
  );
  if (!queryResult.success) {
    return c.json(
      { error: 'Invalid query parameters', details: queryResult.error.flatten() },
      400,
    );
  }
  const query = queryResult.data;

  // Parse cursor if provided
  const cursorData = query.cursor ? parseCursor(query.cursor) : null;

  // Parse filter arrays
  const chainIds = query.chains
    ? query.chains.split(',').map((c) => parseInt(c.trim(), 10)).filter((c) => !isNaN(c))
    : null;
  const vaultAddresses = query.vaults
    ? query.vaults.split(',').map((v) => v.trim().toLowerCase() as Address)
    : null;
  const depositorAddress = query.depositor
    ? (query.depositor.trim().toLowerCase() as Address)
    : null;

  // Build vault lookup map
  const vaultLookup = new Map<string, { name: string; chainId: ChainId }>();
  for (const vault of ERC4626_VAULTS) {
    vaultLookup.set(
      `${vault.chainId}:${vault.address.toLowerCase()}`,
      { name: vault.name, chainId: vault.chainId as ChainId },
    );
  }

  // Get RPC data for USD conversion
  const vaultsForRpc = ERC4626_VAULTS.map((v) => ({
    chainId: v.chainId as ChainId,
    address: v.address,
  }));
  const rpcDataMap = await fetchAllVaultsRpcData(vaultsForRpc);

  // Fetch deposits if needed
  let deposits: Array<{
    id: string;
    type: 'deposit';
    chainId: number;
    vaultAddress: Address;
    depositorAddress: Address;
    assets: bigint;
    timestamp: number;
    transactionHash: Address;
  }> = [];

  if (query.type === 'all' || query.type === 'deposit') {
    const depositConditions = [];

    if (chainIds && chainIds.length > 0) {
      depositConditions.push(
        or(...chainIds.map((cid) => eq(schema.depositEvent.chainId, cid))),
      );
    }

    if (vaultAddresses && vaultAddresses.length > 0) {
      depositConditions.push(
        or(...vaultAddresses.map((addr) => eq(schema.depositEvent.vaultAddress, addr))),
      );
    }

    if (depositorAddress) {
      depositConditions.push(eq(schema.depositEvent.receiver, depositorAddress));
    }

    if (cursorData) {
      depositConditions.push(
        or(
          lt(schema.depositEvent.timestamp, cursorData.timestamp),
          and(
            eq(schema.depositEvent.timestamp, cursorData.timestamp),
            lt(schema.depositEvent.id, cursorData.id),
          ),
        ),
      );
    }

    const depositQuery = db
      .select({
        id: schema.depositEvent.id,
        chainId: schema.depositEvent.chainId,
        vaultAddress: schema.depositEvent.vaultAddress,
        depositorAddress: schema.depositEvent.receiver,
        assets: schema.depositEvent.assets,
        timestamp: schema.depositEvent.timestamp,
        transactionHash: schema.depositEvent.transactionHash,
      })
      .from(schema.depositEvent)
      .orderBy(desc(schema.depositEvent.timestamp), desc(schema.depositEvent.id))
      .limit(query.limit + 1);

    if (depositConditions.length > 0) {
      deposits = (await depositQuery.where(and(...depositConditions))).map((d) => ({
        ...d,
        type: 'deposit' as const,
        vaultAddress: d.vaultAddress as Address,
        depositorAddress: d.depositorAddress as Address,
        transactionHash: d.transactionHash as Address,
      }));
    } else {
      deposits = (await depositQuery).map((d) => ({
        ...d,
        type: 'deposit' as const,
        vaultAddress: d.vaultAddress as Address,
        depositorAddress: d.depositorAddress as Address,
        transactionHash: d.transactionHash as Address,
      }));
    }
  }

  // Fetch withdrawals if needed
  let withdrawals: Array<{
    id: string;
    type: 'withdraw';
    chainId: number;
    vaultAddress: Address;
    depositorAddress: Address;
    assets: bigint;
    timestamp: number;
    transactionHash: Address;
  }> = [];

  if (query.type === 'all' || query.type === 'withdraw') {
    const withdrawConditions = [];

    if (chainIds && chainIds.length > 0) {
      withdrawConditions.push(
        or(...chainIds.map((cid) => eq(schema.withdrawalEvent.chainId, cid))),
      );
    }

    if (vaultAddresses && vaultAddresses.length > 0) {
      withdrawConditions.push(
        or(...vaultAddresses.map((addr) => eq(schema.withdrawalEvent.vaultAddress, addr))),
      );
    }

    if (depositorAddress) {
      withdrawConditions.push(eq(schema.withdrawalEvent.owner, depositorAddress));
    }

    if (cursorData) {
      withdrawConditions.push(
        or(
          lt(schema.withdrawalEvent.timestamp, cursorData.timestamp),
          and(
            eq(schema.withdrawalEvent.timestamp, cursorData.timestamp),
            lt(schema.withdrawalEvent.id, cursorData.id),
          ),
        ),
      );
    }

    const withdrawQuery = db
      .select({
        id: schema.withdrawalEvent.id,
        chainId: schema.withdrawalEvent.chainId,
        vaultAddress: schema.withdrawalEvent.vaultAddress,
        depositorAddress: schema.withdrawalEvent.owner,
        assets: schema.withdrawalEvent.assets,
        timestamp: schema.withdrawalEvent.timestamp,
        transactionHash: schema.withdrawalEvent.transactionHash,
      })
      .from(schema.withdrawalEvent)
      .orderBy(desc(schema.withdrawalEvent.timestamp), desc(schema.withdrawalEvent.id))
      .limit(query.limit + 1);

    if (withdrawConditions.length > 0) {
      withdrawals = (await withdrawQuery.where(and(...withdrawConditions))).map((w) => ({
        ...w,
        type: 'withdraw' as const,
        vaultAddress: w.vaultAddress as Address,
        depositorAddress: w.depositorAddress as Address,
        transactionHash: w.transactionHash as Address,
      }));
    } else {
      withdrawals = (await withdrawQuery).map((w) => ({
        ...w,
        type: 'withdraw' as const,
        vaultAddress: w.vaultAddress as Address,
        depositorAddress: w.depositorAddress as Address,
        transactionHash: w.transactionHash as Address,
      }));
    }
  }

  // Merge and sort by timestamp desc, id desc
  const combined = [...deposits, ...withdrawals].sort((a, b) => {
    if (b.timestamp !== a.timestamp) return b.timestamp - a.timestamp;
    return b.id.localeCompare(a.id);
  });

  // Take limit + 1 to check if there are more
  const hasMore = combined.length > query.limit;
  const activities = combined.slice(0, query.limit);

  // Filter by min_amount if specified (need USD value)
  const enrichedActivities = activities
    .map((activity) => {
      const vaultKey = `${activity.chainId}:${activity.vaultAddress.toLowerCase()}`;
      const vaultInfo = vaultLookup.get(vaultKey);
      const rpcKey = `${activity.chainId}:${activity.vaultAddress}`;
      const rpcData = rpcDataMap.get(rpcKey);

      // Calculate USD amount (assuming 1:1 for now, should use price oracle in production)
      const assetAmount = rpcData?.assetDecimals
        ? Number(formatUnits(activity.assets, rpcData.assetDecimals))
        : Number(formatUnits(activity.assets, 18));

      return {
        id: activity.id,
        type: activity.type,
        chainId: activity.chainId,
        vaultAddress: activity.vaultAddress,
        vaultName: vaultInfo?.name ?? 'Unknown Vault',
        depositorAddress: activity.depositorAddress,
        amount: assetAmount, // USD amount (simplified, using asset amount)
        assetAmount: activity.assets.toString(),
        assetSymbol: rpcData?.assetSymbol ?? 'UNKNOWN',
        assetDecimals: rpcData?.assetDecimals ?? 18,
        transactionHash: activity.transactionHash,
        timestamp: activity.timestamp,
      };
    })
    .filter((activity) => {
      if (query.min_amount !== undefined) {
        return activity.amount >= query.min_amount;
      }
      return true;
    });

  // Determine next cursor
  const lastActivity = enrichedActivities[enrichedActivities.length - 1];
  const nextCursor =
    hasMore && lastActivity
      ? encodeCursor(lastActivity.timestamp, lastActivity.id)
      : null;

  return c.json({
    activities: enrichedActivities,
    pagination: {
      nextCursor,
      hasMore,
    },
  });
});
