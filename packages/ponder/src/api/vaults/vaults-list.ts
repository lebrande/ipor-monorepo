import { Hono } from 'hono';
import { formatUnits } from 'viem';
import { z } from 'zod';
import { ERC4626_VAULTS } from '../../contracts';
import { fetchAllVaultsRpcData } from './vault-rpc-data';
import { fetchAllVaultsDbData } from './vault-db-data';
import { getCacheKey } from '../../utils/cache';
import { ChainId } from '../../utils/chains';

// Query parameter schema
const vaultsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  sort: z.enum(['tvl', 'depositors', 'age']).default('tvl'),
  tvl_min: z.coerce.number().optional(),
  tvl_max: z.coerce.number().optional(),
  depositors_min: z.coerce.number().int().optional(),
  depositors_max: z.coerce.number().int().optional(),
  net_flow: z.enum(['positive', 'negative']).optional(),
  underlying_assets: z.string().optional(), // Comma-separated symbols
  chains: z.string().optional(), // Comma-separated chain IDs
  protocols: z.string().optional(), // Comma-separated protocol names
});

export const vaultsList = new Hono();

vaultsList.get('/', async (c) => {
  // Parse and validate query parameters
  const queryResult = vaultsQuerySchema.safeParse(
    Object.fromEntries(new URL(c.req.url).searchParams),
  );
  if (!queryResult.success) {
    return c.json(
      { error: 'Invalid query parameters', details: queryResult.error.flatten() },
      400,
    );
  }
  const query = queryResult.data;

  const vaults = ERC4626_VAULTS.map((v) => ({
    chainId: v.chainId as ChainId,
    address: v.address,
  }));

  // Fetch data in parallel from RPC and DB
  const [rpcDataMap, dbDataMap] = await Promise.all([
    fetchAllVaultsRpcData(vaults),
    fetchAllVaultsDbData(vaults),
  ]);

  // Combine all data sources into enriched vaults
  let enrichedVaults = ERC4626_VAULTS.map((vault) => {
    const rpcKey = getCacheKey(vault.chainId, vault.address);
    const dbKey = `${vault.chainId}:${vault.address.toLowerCase()}`;

    const rpcData = rpcDataMap.get(rpcKey);
    const dbData = dbDataMap.get(dbKey);

    // Calculate TVL in underlying asset terms
    const tvl =
      rpcData && rpcData.assetDecimals
        ? Number(formatUnits(rpcData.totalAssets, rpcData.assetDecimals))
        : 0;

    // Calculate net flow in underlying asset terms
    let netFlow7d = 0;
    if (dbData && rpcData && rpcData.assetDecimals && dbData.netFlow7d !== null) {
      const formatted = Number(formatUnits(dbData.netFlow7d, rpcData.assetDecimals));
      netFlow7d = Number.isNaN(formatted) ? 0 : formatted;
    }

    // Format creation date from first deposit timestamp
    const creationDate = dbData?.firstDepositTimestamp
      ? new Date(dbData.firstDepositTimestamp * 1000).toISOString().split('T')[0]
      : '1970-01-01'; // Fallback for vaults without deposits

    return {
      chainId: vault.chainId,
      address: vault.address,
      name: vault.name,
      protocol: vault.protocol,
      tvl,
      underlyingAsset: rpcData?.assetSymbol ?? 'UNKNOWN',
      underlyingAssetAddress:
        rpcData?.assetAddress ?? '0x0000000000000000000000000000000000000000',
      depositorCount: dbData?.depositorCount ?? 0,
      netFlow7d,
      creationDate,
      sharePrice: rpcData?.sharePrice ?? 0,
    };
  });

  // Apply filters
  if (query.tvl_min !== undefined) {
    enrichedVaults = enrichedVaults.filter((v) => v.tvl >= query.tvl_min!);
  }
  if (query.tvl_max !== undefined) {
    enrichedVaults = enrichedVaults.filter((v) => v.tvl <= query.tvl_max!);
  }
  if (query.depositors_min !== undefined) {
    enrichedVaults = enrichedVaults.filter((v) => v.depositorCount >= query.depositors_min!);
  }
  if (query.depositors_max !== undefined) {
    enrichedVaults = enrichedVaults.filter((v) => v.depositorCount <= query.depositors_max!);
  }
  if (query.net_flow === 'positive') {
    enrichedVaults = enrichedVaults.filter((v) => v.netFlow7d > 0);
  } else if (query.net_flow === 'negative') {
    enrichedVaults = enrichedVaults.filter((v) => v.netFlow7d < 0);
  }
  if (query.underlying_assets) {
    const assets = query.underlying_assets.split(',').map((a) => a.trim().toUpperCase());
    enrichedVaults = enrichedVaults.filter((v) =>
      assets.includes(v.underlyingAsset.toUpperCase()),
    );
  }
  if (query.chains) {
    const chainIds = query.chains.split(',').map((c) => parseInt(c.trim(), 10));
    enrichedVaults = enrichedVaults.filter((v) => chainIds.includes(v.chainId));
  }
  if (query.protocols) {
    const protocols = query.protocols.split(',').map((p) => p.trim().toLowerCase());
    enrichedVaults = enrichedVaults.filter((v) =>
      protocols.includes(v.protocol.toLowerCase()),
    );
  }

  // Apply sorting
  enrichedVaults.sort((a, b) => {
    switch (query.sort) {
      case 'tvl':
        return b.tvl - a.tvl; // Descending
      case 'depositors':
        return b.depositorCount - a.depositorCount; // Descending
      case 'age':
        // Newest first (most recent creation date)
        return (
          new Date(b.creationDate || '1970-01-01').getTime() -
          new Date(a.creationDate || '1970-01-01').getTime()
        );
      default:
        return 0;
    }
  });

  // Apply pagination
  const totalCount = enrichedVaults.length;
  const totalPages = Math.ceil(totalCount / query.limit);
  const startIndex = (query.page - 1) * query.limit;
  const paginatedVaults = enrichedVaults.slice(startIndex, startIndex + query.limit);

  return c.json({
    vaults: paginatedVaults,
    pagination: {
      currentPage: query.page,
      totalPages,
      totalCount,
      hasNext: query.page < totalPages,
      hasPrevious: query.page > 1,
    },
  });
});
