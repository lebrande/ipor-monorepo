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
  /** TVL in underlying token amount (human-readable, e.g. 7695.3 WETH) */
  tvlAmount: number | null;
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
        // tvl.formatted is the human-readable token amount (e.g. "7695.3" WETH)
        tvlAmount: v.tvl.formatted ? parseFloat(String(v.tvl.formatted)) : null,
        sharePriceFormatted: v.sharePrice.formatted,
        chainId: v.chain.id,
      }));
    },
    staleTime: 60_000,
    refetchInterval: 120_000,
  });
}

/**
 * CoinGecko ID → token address mapping for Base chain.
 * getPrices() returns prices keyed by CoinGecko IDs, but our
 * components look up prices by token address.
 */
const COINGECKO_TO_ADDRESS: Record<string, string> = {
  'usd-coin': '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913',
  'ethereum': '0x4200000000000000000000000000000000000006',
  'coinbase-wrapped-btc': '0xcbb7c0000ab88b473b1f5afd9ef808440eed33bf',
  'euro-coin': '0x60a3e35cc302bfa44cb288bc5a4f316fdb1adb42',
};

/**
 * Fetches token prices via @yo-protocol/core getPrices() API.
 * Returns Record<lowercase-token-address, usd-price>.
 */
export function useYoPrices(chainId: number) {
  return useQuery<Record<string, number>>({
    queryKey: ['yo-prices', chainId],
    queryFn: async () => {
      const client = createYoClient({
        chainId: chainId as 1 | 8453 | 42161,
      });
      const prices = await client.getPrices();
      // Map CoinGecko IDs to token addresses
      const result: Record<string, number> = {};
      for (const [coingeckoId, usdPrice] of Object.entries(prices)) {
        const addr = COINGECKO_TO_ADDRESS[coingeckoId];
        if (addr) {
          result[addr] = usdPrice as number;
        }
      }
      return result;
    },
    staleTime: 30_000,
    refetchInterval: 60_000,
  });
}
