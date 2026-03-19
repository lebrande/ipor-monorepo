'use client';

import { useQuery } from '@tanstack/react-query';
import { createYoClient } from '@yo-protocol/core';
import type { Address } from 'viem';

/**
 * Fetches detailed YO vault data (snapshot, yield/TVL/share price history, performance)
 * via @yo-protocol/core REST API. Uses createYoClient directly with useQuery —
 * same pattern as useYoVaultsData.
 */
export function useYoVaultDetail(chainId: number, vaultAddress: Address) {
  const client = createYoClient({
    chainId: chainId as 1 | 8453 | 42161,
  });

  const snapshot = useQuery({
    queryKey: ['yo-vault-snapshot', vaultAddress, chainId],
    queryFn: () => client.getVaultSnapshot(vaultAddress),
    staleTime: 60_000,
    refetchInterval: 120_000,
  });

  const yieldHistory = useQuery({
    queryKey: ['yo-vault-yield-history', vaultAddress, chainId],
    queryFn: () => client.getVaultYieldHistory(vaultAddress),
    staleTime: 300_000,
  });

  const tvlHistory = useQuery({
    queryKey: ['yo-vault-tvl-history', vaultAddress, chainId],
    queryFn: () => client.getVaultTvlHistory(vaultAddress),
    staleTime: 300_000,
  });

  const sharePriceHistory = useQuery({
    queryKey: ['yo-share-price-history', vaultAddress, chainId],
    queryFn: () => client.getSharePriceHistory(vaultAddress),
    staleTime: 300_000,
  });

  const performance = useQuery({
    queryKey: ['yo-vault-performance', vaultAddress, chainId],
    queryFn: () => client.getVaultPerformance(vaultAddress),
    staleTime: 60_000,
  });

  return {
    snapshot: snapshot.data,
    yieldHistory: yieldHistory.data,
    tvlHistory: tvlHistory.data,
    sharePriceHistory: sharePriceHistory.data,
    performance: performance.data,
    isLoading: snapshot.isLoading,
    isChartsLoading:
      yieldHistory.isLoading ||
      tvlHistory.isLoading ||
      sharePriceHistory.isLoading,
  };
}
