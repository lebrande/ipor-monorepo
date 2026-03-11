'use client';

import { useQuery } from '@tanstack/react-query';
import { createYoClient } from '@yo-protocol/core';
export interface YoVaultData {
  id: string;
  name: string;
  vaultAddress: string;
  underlying: string;
  underlyingDecimals: number;
  apy7d: string | null;
  tvlFormatted: string | null;
  sharePriceFormatted: string | null;
  chainId: number;
}

/**
 * Fetches YO vault metadata (APR, TVL) via @yo-protocol/core REST API.
 * Uses createYoClient().getVaults() for stats — returns VaultStatsItem[]
 * which already includes yield and tvl.
 */
export function useYoVaultsData(chainId: number) {
  return useQuery<YoVaultData[]>({
    queryKey: ['yo-vaults-data', chainId],
    queryFn: async () => {
      const client = createYoClient({
        chainId: chainId as 1 | 8453 | 42161,
      });

      // getVaults() returns VaultStatsItem[] which already includes yield + tvl
      const vaults = await client.getVaults();

      return vaults.map((v) => ({
        id: v.id,
        name: v.name,
        vaultAddress: v.contracts.vaultAddress,
        underlying: v.asset.symbol,
        underlyingDecimals: v.asset.decimals,
        apy7d: v.yield['7d'],
        tvlFormatted: v.tvl.formatted,
        sharePriceFormatted: v.sharePrice.formatted,
        chainId: v.chain.id,
      }));
    },
    staleTime: 60_000,
    refetchInterval: 120_000,
  });
}

/**
 * Fetches token prices via @yo-protocol/core getPrices() API.
 */
export function useYoPrices(chainId: number) {
  return useQuery<Record<string, number>>({
    queryKey: ['yo-prices', chainId],
    queryFn: async () => {
      const client = createYoClient({
        chainId: chainId as 1 | 8453 | 42161,
      });
      const prices = await client.getPrices();
      // PriceMap — convert to Record<lowercase address, number>
      const result: Record<string, number> = {};
      for (const [key, value] of Object.entries(prices)) {
        result[key.toLowerCase()] = value as number;
      }
      return result;
    },
    staleTime: 30_000,
    refetchInterval: 60_000,
  });
}
