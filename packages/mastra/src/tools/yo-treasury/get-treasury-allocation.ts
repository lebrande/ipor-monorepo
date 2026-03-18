import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { type Address } from 'viem';
import { getPublicClient } from '../plasma-vault/utils/viem-clients';
import { readYoTreasuryBalances } from './read-yo-treasury-balances';
import { mapYoPositionsToMarkets } from './map-yo-to-market-balances';
import type { MarketBalancesOutput } from '../alpha/types';

export const getTreasuryAllocationTool = createTool({
  id: 'get-treasury-allocation',
  description: `Read the treasury vault's current holdings: unallocated tokens and YO vault allocations.
Shows each token balance, YO vault share positions, and USD values.
Call when the user asks "where are my funds?", "show my portfolio", or "what's my allocation?"`,
  inputSchema: z.object({
    vaultAddress: z.string().describe('Treasury PlasmaVault address'),
    chainId: z.number().describe('Chain ID'),
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
  execute: async ({ vaultAddress, chainId }): Promise<MarketBalancesOutput> => {
    try {
      const publicClient = getPublicClient(chainId);
      const snapshot = await readYoTreasuryBalances(publicClient, vaultAddress as Address);

      return {
        type: 'market-balances' as const,
        success: true,
        assets: snapshot.assets,
        markets: mapYoPositionsToMarkets(snapshot.yoPositions),
        totalValueUsd: snapshot.totalValueUsd,
        message: '[UI rendered treasury holdings — do NOT list or repeat balances in text]',
      };
    } catch (error) {
      return {
        type: 'market-balances' as const,
        success: false,
        assets: [],
        markets: [],
        totalValueUsd: '0.00',
        message: 'Failed to read treasury allocation',
        error: error instanceof Error ? error.message : String(error),
      };
    }
  },
});
