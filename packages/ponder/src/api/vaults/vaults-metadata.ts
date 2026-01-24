import { Hono } from 'hono';
import { formatUnits } from 'viem';
import { ERC4626_VAULTS } from '../../contracts';
import { fetchAllVaultsRpcData } from './vault-rpc-data';
import { fetchAllVaultsDbData } from './vault-db-data';
import { getCacheKey } from '../../utils/cache';
import { ChainId } from '../../utils/chains';

// Chain name mapping
const CHAIN_NAMES: Record<number, string> = {
  1: 'Ethereum',
  42161: 'Arbitrum',
  8453: 'Base',
  43114: 'Avalanche',
  130: 'Unichain',
  9745: 'Sonic',
};

export const vaultsMetadata = new Hono();

vaultsMetadata.get('/metadata', async (c) => {
  const vaults = ERC4626_VAULTS.map((v) => ({
    chainId: v.chainId as ChainId,
    address: v.address,
  }));

  // Fetch data in parallel
  const [rpcDataMap, dbDataMap] = await Promise.all([
    fetchAllVaultsRpcData(vaults),
    fetchAllVaultsDbData(vaults),
  ]);

  // Compute aggregated metadata
  let maxTvl = 0;
  let maxDepositors = 0;
  const chainsSet = new Set<number>();
  const protocolsSet = new Set<string>();
  const assetsMap = new Map<string, { symbol: string; chainId: number; address: string }>();

  for (const vault of ERC4626_VAULTS) {
    const rpcKey = getCacheKey(vault.chainId, vault.address);
    const dbKey = `${vault.chainId}:${vault.address.toLowerCase()}`;

    const rpcData = rpcDataMap.get(rpcKey);
    const dbData = dbDataMap.get(dbKey);

    // TVL
    const tvl =
      rpcData && rpcData.assetDecimals
        ? Number(formatUnits(rpcData.totalAssets, rpcData.assetDecimals))
        : 0;
    if (tvl > maxTvl) maxTvl = tvl;

    // Depositors
    const depositorCount = dbData?.depositorCount ?? 0;
    if (depositorCount > maxDepositors) maxDepositors = depositorCount;

    // Chains
    chainsSet.add(vault.chainId);

    // Protocols
    protocolsSet.add(vault.protocol);

    // Assets (dedupe by symbol, prefer lower chainId for address)
    if (rpcData?.assetSymbol && rpcData.assetSymbol !== 'UNKNOWN') {
      const existing = assetsMap.get(rpcData.assetSymbol);
      if (!existing || vault.chainId < existing.chainId) {
        assetsMap.set(rpcData.assetSymbol, {
          symbol: rpcData.assetSymbol,
          chainId: vault.chainId,
          address: rpcData.assetAddress,
        });
      }
    }
  }

  // Build chains array with names
  const chains = Array.from(chainsSet)
    .sort((a, b) => a - b)
    .map((chainId) => ({
      chainId,
      name: CHAIN_NAMES[chainId] || `Chain ${chainId}`,
    }));

  // Build protocols array
  const protocols = Array.from(protocolsSet).sort();

  // Build assets array
  const assets = Array.from(assetsMap.values()).sort((a, b) =>
    a.symbol.localeCompare(b.symbol),
  );

  return c.json({
    ranges: {
      tvl: { min: 0, max: Math.ceil(maxTvl) },
      depositors: { min: 0, max: maxDepositors },
    },
    chains,
    protocols,
    assets,
    totalVaults: ERC4626_VAULTS.length,
  });
});
