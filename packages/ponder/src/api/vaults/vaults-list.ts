import { Hono } from 'hono';
import { formatUnits } from 'viem';
import { ERC4626_VAULTS } from '../../contracts';
import { fetchAllVaultsRpcData } from './vault-rpc-data';
import { fetchAllVaultsDbData } from './vault-db-data';
import { getCacheKey } from '../../utils/cache';
import { ChainId } from '../../utils/chains';

export const vaultsList = new Hono();

vaultsList.get('/', async (c) => {
  const vaults = ERC4626_VAULTS.map((v) => ({
    chainId: v.chainId as ChainId,
    address: v.address,
  }));

  // Fetch data in parallel from RPC and DB
  const [rpcDataMap, dbDataMap] = await Promise.all([
    fetchAllVaultsRpcData(vaults),
    fetchAllVaultsDbData(vaults),
  ]);

  // Combine all data sources
  const enrichedVaults = ERC4626_VAULTS.map((vault) => {
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
        rpcData?.assetAddress ??
        '0x0000000000000000000000000000000000000000',
      depositorCount: dbData?.depositorCount ?? 0,
      netFlow7d,
      creationDate,
      sharePrice: rpcData?.sharePrice ?? 0,
    };
  });

  return c.json({
    vaults: enrichedVaults,
    pagination: {
      currentPage: 1,
      totalPages: 1,
      totalCount: enrichedVaults.length,
      hasNext: false,
      hasPrevious: false,
    },
  });
});
