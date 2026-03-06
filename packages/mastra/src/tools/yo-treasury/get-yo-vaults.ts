import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { createYoClient } from '@yo-protocol/core';
import type { YoVaultsOutput } from './types';

export const getYoVaultsTool = createTool({
  id: 'get-yo-vaults',
  description: `List available YO Protocol vaults with underlying asset info.
Call this when the user asks about yield options, available vaults, or "where can I earn yield?"`,
  inputSchema: z.object({
    chainId: z.number().describe('Chain ID (8453=Base, 1=Ethereum, 42161=Arbitrum)'),
  }),
  outputSchema: z.object({
    type: z.literal('yo-vaults'),
    success: z.boolean(),
    chainId: z.number(),
    vaults: z.array(z.object({
      symbol: z.string(),
      name: z.string(),
      address: z.string(),
      underlying: z.string(),
      underlyingAddress: z.string(),
      underlyingDecimals: z.number(),
      apy7d: z.string().nullable(),
      tvl: z.string().nullable(),
      chainId: z.number(),
    })),
    message: z.string(),
    error: z.string().optional(),
  }),
  execute: async ({ chainId }): Promise<YoVaultsOutput> => {
    try {
      const client = createYoClient({ chainId: chainId as 1 | 8453 | 42161 });
      const vaults = await client.getVaults();

      const vaultData = vaults.map((vault) => ({
        symbol: vault.shareAsset.symbol,
        name: vault.name,
        address: vault.contracts.vaultAddress,
        underlying: vault.asset.symbol,
        underlyingAddress: vault.asset.address,
        underlyingDecimals: vault.asset.decimals,
        apy7d: vault.yield['7d'],
        tvl: vault.tvl.formatted,
        chainId: vault.chain.id,
      }));

      return {
        type: 'yo-vaults' as const,
        success: true,
        chainId,
        vaults: vaultData,
        message: `Found ${vaultData.length} YO vaults on chain ${chainId}`,
      };
    } catch (error) {
      return {
        type: 'yo-vaults' as const,
        success: false,
        chainId,
        vaults: [],
        message: 'Failed to fetch YO vaults',
        error: error instanceof Error ? error.message : String(error),
      };
    }
  },
});
