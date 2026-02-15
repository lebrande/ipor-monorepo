import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { type Address } from 'viem';
import { getPublicClient } from '../plasma-vault/utils/viem-clients';
import { readVaultBalances } from './read-vault-balances';

const marketPositionSchema = z.object({
  underlyingToken: z.string(),
  underlyingSymbol: z.string(),
  supplyFormatted: z.string(),
  supplyValueUsd: z.string(),
  borrowFormatted: z.string(),
  borrowValueUsd: z.string(),
  totalValueUsd: z.string(),
});

const marketAllocationSchema = z.object({
  marketId: z.string(),
  protocol: z.string(),
  positions: z.array(marketPositionSchema),
  totalValueUsd: z.string(),
});

export const getMarketBalancesTool = createTool({
  id: 'get-market-balances',
  description: `Read the vault's unallocated ERC20 tokens AND allocated DeFi market positions (Aave V3, Morpho, Euler V2).
Returns each token's name, symbol, balance, USD price, and per-market supply/borrow positions with USD values.
Call this tool when you need to know what tokens are available, what's allocated to markets, or before creating actions.
Requires vault address and chain ID.`,
  inputSchema: z.object({
    vaultAddress: z
      .string()
      .describe('Plasma Vault contract address (0x...)'),
    chainId: z
      .number()
      .describe('Chain ID (1=Ethereum, 42161=Arbitrum, 8453=Base)'),
  }),
  outputSchema: z.object({
    type: z.literal('market-balances'),
    success: z.boolean(),
    assets: z.array(
      z.object({
        address: z.string().describe('Token contract address'),
        name: z.string().describe('Token name (e.g. "USD Coin")'),
        symbol: z.string().describe('Token symbol (e.g. "USDC")'),
        decimals: z.number().describe('Token decimals'),
        balance: z.string().describe('Raw balance in smallest unit'),
        balanceFormatted: z
          .string()
          .describe('Human-readable balance'),
        priceUsd: z.string().describe('USD price per token'),
        valueUsd: z.string().describe('Total USD value of holdings'),
      }),
    ),
    markets: z.array(marketAllocationSchema),
    totalValueUsd: z
      .string()
      .describe('Total USD value across all tokens and markets'),
    message: z.string(),
    error: z.string().optional(),
  }),
  execute: async ({ vaultAddress, chainId }) => {
    try {
      const publicClient = getPublicClient(chainId);
      const snapshot = await readVaultBalances(
        publicClient,
        vaultAddress as Address,
      );

      const tokenCount = snapshot.assets.length;
      const marketCount = snapshot.markets.length;
      const parts: string[] = [];
      if (tokenCount > 0)
        parts.push(
          `${tokenCount} token${tokenCount === 1 ? '' : 's'}`,
        );
      if (marketCount > 0)
        parts.push(
          `${marketCount} market${marketCount === 1 ? '' : 's'}`,
        );

      return {
        type: 'market-balances' as const,
        success: true,
        ...snapshot,
        message:
          parts.length > 0
            ? `${parts.join(' and ')} found`
            : 'No positions found',
      };
    } catch (error) {
      return {
        type: 'market-balances' as const,
        success: false,
        assets: [],
        markets: [],
        totalValueUsd: '0.00',
        message: 'Failed to read market balances',
        error: error instanceof Error ? error.message : String(error),
      };
    }
  },
});
