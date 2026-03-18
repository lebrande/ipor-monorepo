import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { type Address } from 'viem';
import { createYoClient } from '@yo-protocol/core';
import { getPublicClient } from '../plasma-vault/utils/viem-clients';
import { readYoTreasuryBalances } from './read-yo-treasury-balances';
import { mapYoPositionsToMarkets } from './map-yo-to-market-balances';
import type { MarketBalancesOutput } from '../alpha/types';

export const getYoVaultsTool = createTool({
  id: 'get-yo-vaults',
  description: `List available YO Protocol vaults with underlying asset info and user positions.
Call this when the user asks about yield options, available vaults, or "where can I earn yield?"
If a vaultAddress is provided, includes the user's current position in each vault.`,
  inputSchema: z.object({
    chainId: z.number().describe('Chain ID (8453=Base, 1=Ethereum, 42161=Arbitrum)'),
    vaultAddress: z.string().optional().describe('Treasury PlasmaVault address — if provided, includes user positions'),
  }),
  outputSchema: z.object({
    type: z.literal('market-balances'),
    success: z.boolean(),
    assets: z.array(z.object({
      address: z.string(),
      name: z.string(),
      symbol: z.string(),
      decimals: z.number(),
      balance: z.string(),
      balanceFormatted: z.string(),
      priceUsd: z.string(),
      valueUsd: z.string(),
    })),
    markets: z.array(z.any()),
    totalValueUsd: z.string(),
    message: z.string(),
    error: z.string().optional(),
  }),
  execute: async ({ chainId, vaultAddress }): Promise<MarketBalancesOutput> => {
    try {
      const client = createYoClient({ chainId: chainId as 1 | 8453 | 42161 });
      const vaults = await client.getVaults();

      const vaultSummary = vaults.map(v =>
        `${v.shareAsset.symbol} (${v.asset.symbol}, chain ${v.chain.id})`
      ).join(', ');

      let assets: MarketBalancesOutput['assets'] = [];
      let markets: MarketBalancesOutput['markets'] = [];
      let totalValueUsd = '0.00';

      if (vaultAddress) {
        const publicClient = getPublicClient(chainId);
        try {
          const snapshot = await readYoTreasuryBalances(publicClient, vaultAddress as Address);
          assets = snapshot.assets;
          markets = mapYoPositionsToMarkets(snapshot.yoPositions);
          totalValueUsd = snapshot.totalValueUsd;
        } catch {
          // Position read failed — continue with empty
        }
      }

      return {
        type: 'market-balances' as const,
        success: true,
        assets,
        markets,
        totalValueUsd,
        message: `[UI rendered ${vaults.length} vaults. Available: ${vaultSummary}. Do NOT repeat data in text]`,
      };
    } catch (error) {
      return {
        type: 'market-balances' as const,
        success: false,
        assets: [],
        markets: [],
        totalValueUsd: '0.00',
        message: 'Failed to fetch YO vaults',
        error: error instanceof Error ? error.message : String(error),
      };
    }
  },
});
