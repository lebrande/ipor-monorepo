import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { type Address } from 'viem';
import { createYoClient } from '@yo-protocol/core';
import { getPublicClient } from '../plasma-vault/utils/viem-clients';
import { readYoTreasuryBalances } from './read-yo-treasury-balances';
import type { YoVaultsOutput, YoVaultUserPosition } from './types';

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
      userPosition: z.object({
        shares: z.string(),
        underlyingAmount: z.string(),
        underlyingFormatted: z.string(),
        valueUsd: z.string(),
      }).optional(),
    })),
    message: z.string(),
    error: z.string().optional(),
  }),
  execute: async ({ chainId, vaultAddress }): Promise<YoVaultsOutput> => {
    try {
      const client = createYoClient({ chainId: chainId as 1 | 8453 | 42161 });
      const vaults = await client.getVaults();

      // Optionally read user positions
      let positionsByVault: Map<string, YoVaultUserPosition> | undefined;
      if (vaultAddress) {
        try {
          const publicClient = getPublicClient(chainId);
          const snapshot = await readYoTreasuryBalances(publicClient, vaultAddress as Address);
          positionsByVault = new Map();
          for (const pos of snapshot.yoPositions) {
            positionsByVault.set(pos.vaultAddress.toLowerCase(), {
              shares: pos.shares,
              underlyingAmount: pos.underlyingAmount,
              underlyingFormatted: pos.underlyingFormatted,
              valueUsd: pos.valueUsd,
            });
          }
        } catch {
          // Positions read failed — continue without them
        }
      }

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
        userPosition: positionsByVault?.get(vault.contracts.vaultAddress.toLowerCase()),
      }));

      return {
        type: 'yo-vaults' as const,
        success: true,
        chainId,
        vaults: vaultData,
        message: `[UI rendered a table with ${vaultData.length} vaults — do NOT list or repeat vault data in text]`,
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
