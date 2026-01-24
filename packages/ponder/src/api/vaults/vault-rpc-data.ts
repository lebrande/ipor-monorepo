import { Address, erc20Abi, formatUnits } from 'viem';
import { getPublicClient } from '../../utils/clients';
import { ChainId } from '../../utils/chains';
import { erc4626ABI } from '../../../abis/erc4626ABI';
import { getFromCache, setInCache, getCacheKey } from '../../utils/cache';

export interface VaultRpcData {
  totalAssets: bigint;
  totalSupply: bigint;
  assetAddress: Address;
  assetSymbol: string;
  assetDecimals: number;
  sharePrice: number; // Normalized (e.g., 1.0234)
}

const DEFAULT_RPC_DATA: VaultRpcData = {
  totalAssets: 0n,
  totalSupply: 0n,
  assetAddress: '0x0000000000000000000000000000000000000000',
  assetSymbol: 'UNKNOWN',
  assetDecimals: 18,
  sharePrice: 0,
};

const fetchWithRetry = async <T>(
  fn: () => Promise<T>,
  retries = 3,
  delay = 1000,
): Promise<T> => {
  try {
    return await fn();
  } catch (error) {
    if (retries === 0) throw error;
    await new Promise((resolve) => setTimeout(resolve, delay));
    return fetchWithRetry(fn, retries - 1, delay * 2);
  }
};

export const fetchVaultRpcData = async (
  chainId: ChainId,
  vaultAddress: Address,
): Promise<VaultRpcData> => {
  const cacheKey = getCacheKey(chainId, vaultAddress);
  const cached = getFromCache<VaultRpcData>(cacheKey);
  if (cached) return cached;

  try {
    const client = getPublicClient(chainId);

    // First multicall: get vault data
    const vaultResults = await fetchWithRetry(() =>
      client.multicall({
        contracts: [
          {
            address: vaultAddress,
            abi: erc4626ABI,
            functionName: 'totalAssets',
          },
          {
            address: vaultAddress,
            abi: erc4626ABI,
            functionName: 'totalSupply',
          },
          { address: vaultAddress, abi: erc4626ABI, functionName: 'asset' },
        ],
      }),
    );

    const totalAssets = vaultResults[0].result ?? 0n;
    const totalSupply = vaultResults[1].result ?? 0n;
    const assetAddress = vaultResults[2].result as Address;

    if (!assetAddress) {
      console.error(
        `Failed to get asset address for ${chainId}:${vaultAddress}`,
      );
      setInCache(cacheKey, DEFAULT_RPC_DATA);
      return DEFAULT_RPC_DATA;
    }

    // Second multicall: get asset info
    const assetResults = await fetchWithRetry(() =>
      client.multicall({
        contracts: [
          { address: assetAddress, abi: erc20Abi, functionName: 'symbol' },
          { address: assetAddress, abi: erc20Abi, functionName: 'decimals' },
        ],
      }),
    );

    const assetSymbol = (assetResults[0].result as string) ?? 'UNKNOWN';
    const assetDecimals = (assetResults[1].result as number) ?? 18;

    // Calculate share price: totalAssets / totalSupply (normalized)
    let sharePrice = 1.0;
    if (totalSupply > 0n) {
      sharePrice =
        Number(formatUnits(totalAssets, assetDecimals)) /
        Number(formatUnits(totalSupply, assetDecimals));
    }

    const data: VaultRpcData = {
      totalAssets,
      totalSupply,
      assetAddress,
      assetSymbol,
      assetDecimals,
      sharePrice,
    };

    setInCache(cacheKey, data);
    return data;
  } catch (error) {
    console.error(
      `Failed to fetch RPC data for ${chainId}:${vaultAddress}`,
      error,
    );
    setInCache(cacheKey, DEFAULT_RPC_DATA);
    return DEFAULT_RPC_DATA;
  }
};

// Batch fetch for all vaults
export const fetchAllVaultsRpcData = async (
  vaults: Array<{ chainId: ChainId; address: Address }>,
): Promise<Map<string, VaultRpcData>> => {
  const results = new Map<string, VaultRpcData>();

  // Group by chain for efficient parallel fetching
  const byChain = new Map<ChainId, Address[]>();
  for (const vault of vaults) {
    const list = byChain.get(vault.chainId) || [];
    list.push(vault.address);
    byChain.set(vault.chainId, list);
  }

  // Fetch each chain's vaults in parallel
  await Promise.all(
    Array.from(byChain.entries()).map(async ([chainId, addresses]) => {
      // Fetch all vaults on this chain in parallel
      await Promise.all(
        addresses.map(async (address) => {
          const data = await fetchVaultRpcData(chainId, address);
          results.set(getCacheKey(chainId, address), data);
        }),
      );
    }),
  );

  return results;
};
