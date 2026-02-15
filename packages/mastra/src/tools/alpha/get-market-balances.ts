import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { type Address, erc20Abi, formatUnits } from 'viem';
import {
  PlasmaVault,
  MARKET_ID,
  substrateToAddress,
  AaveV3,
  Morpho,
  EulerV2,
  type MarketSubstrateBalance,
} from '@ipor/fusion-sdk';
import { getPublicClient } from '../plasma-vault/utils/viem-clients';
import type { MarketAllocation } from './types';

/** Minimal ABI for price oracle's getAssetPrice */
const getAssetPriceAbi = [
  {
    type: 'function',
    name: 'getAssetPrice',
    inputs: [{ name: 'asset_', type: 'address', internalType: 'address' }],
    outputs: [
      { name: '', type: 'uint256', internalType: 'uint256' },
      { name: '', type: 'uint256', internalType: 'uint256' },
    ],
    stateMutability: 'view',
  },
] as const;

/** Reverse-lookup market ID bigint to its constant name */
function getMarketName(marketId: bigint): string {
  for (const [name, id] of Object.entries(MARKET_ID)) {
    if (id === marketId) return name;
  }
  return `MARKET_${marketId}`;
}

/** Human-readable protocol name from market ID name */
function formatProtocolName(marketId: string): string {
  const names: Record<string, string> = {
    AAVE_V3: 'Aave V3',
    AAVE_V3_LIDO: 'Aave V3 Lido',
    MORPHO: 'Morpho',
    EULER_V2: 'Euler V2',
    COMPOUND_V3_USDC: 'Compound V3',
    COMPOUND_V3_USDT: 'Compound V3',
    COMPOUND_V3_WETH: 'Compound V3',
    SPARK: 'Spark',
    MOONWELL: 'Moonwell',
  };
  return names[marketId] ?? marketId;
}

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
      const plasmaVault = await PlasmaVault.create(
        publicClient,
        vaultAddress as Address,
      );

      let totalValueUsdFloat = 0;

      // ─── ERC20 unallocated tokens (existing logic) ───

      const substrates = await plasmaVault.getMarketSubstrates(
        MARKET_ID.ERC20_VAULT_BALANCE,
      );

      let assets: Array<{
        address: string;
        name: string;
        symbol: string;
        decimals: number;
        balance: string;
        balanceFormatted: string;
        priceUsd: string;
        valueUsd: string;
      }> = [];

      if (substrates.length > 0) {
        const tokenAddresses = substrates
          .map((s) => substrateToAddress(s))
          .filter((addr): addr is Address => addr !== undefined);

        if (tokenAddresses.length > 0) {
          const metadataResults = await publicClient.multicall({
            contracts: tokenAddresses.flatMap((addr) => [
              { address: addr, abi: erc20Abi, functionName: 'name' as const },
              {
                address: addr,
                abi: erc20Abi,
                functionName: 'symbol' as const,
              },
              {
                address: addr,
                abi: erc20Abi,
                functionName: 'decimals' as const,
              },
              {
                address: addr,
                abi: erc20Abi,
                functionName: 'balanceOf' as const,
                args: [plasmaVault.address],
              },
            ]),
            allowFailure: true,
          });

          const priceResults = await publicClient.multicall({
            contracts: tokenAddresses.map((addr) => ({
              address: plasmaVault.priceOracle,
              abi: getAssetPriceAbi,
              functionName: 'getAssetPrice' as const,
              args: [addr],
            })),
            allowFailure: true,
          });

          assets = tokenAddresses.map((addr, i) => {
            const nameResult = metadataResults[i * 4 + 0];
            const symbolResult = metadataResults[i * 4 + 1];
            const decimalsResult = metadataResults[i * 4 + 2];
            const balanceResult = metadataResults[i * 4 + 3];
            const priceResult = priceResults[i];

            const name =
              nameResult.status === 'success'
                ? (nameResult.result as string)
                : addr;
            const symbol =
              symbolResult.status === 'success'
                ? (symbolResult.result as string)
                : '???';
            const decimals =
              decimalsResult.status === 'success'
                ? Number(decimalsResult.result)
                : 18;
            const balance =
              balanceResult.status === 'success'
                ? (balanceResult.result as bigint)
                : 0n;

            const balanceFormatted = formatUnits(balance, decimals);

            let priceUsd = '0.00';
            let valueUsd = '0.00';

            if (priceResult.status === 'success') {
              const [rawPrice, rawPriceDecimals] = priceResult.result as [
                bigint,
                bigint,
              ];
              const pDecimals = Number(rawPriceDecimals);
              const priceFloat = Number(rawPrice) / 10 ** pDecimals;
              priceUsd = priceFloat.toFixed(2);

              if (balance > 0n && rawPrice > 0n) {
                const valueFloat =
                  Number(balance * rawPrice) / 10 ** (decimals + pDecimals);
                valueUsd = valueFloat.toFixed(2);
                totalValueUsdFloat += valueFloat;
              }
            }

            return {
              address: addr,
              name,
              symbol,
              decimals,
              balance: balance.toString(),
              balanceFormatted,
              priceUsd,
              valueUsd,
            };
          });
        }
      }

      // ─── Market allocations (new) ───

      const markets: MarketAllocation[] = [];

      // Get all market IDs that have balance fuses (excluding ERC20_VAULT_BALANCE)
      let activeMarketIds: bigint[] = [];
      try {
        const allMarketIds = await plasmaVault.getMarketIds({
          include: ['balanceFuses'],
        });
        activeMarketIds = allMarketIds.filter(
          (id) => id !== MARKET_ID.ERC20_VAULT_BALANCE,
        );
      } catch {
        // If getMarketIds fails, skip market balance reading
      }

      // Collect unique market ID names we'll process
      const marketIdSet = new Set<string>();
      for (const id of activeMarketIds) {
        marketIdSet.add(getMarketName(id));
      }

      // Read balances per protocol
      for (const marketName of marketIdSet) {
        try {
          let balances: MarketSubstrateBalance[] = [];

          if (
            marketName === 'AAVE_V3' ||
            marketName === 'AAVE_V3_LIDO'
          ) {
            const aaveV3 = new AaveV3(plasmaVault);
            balances = await aaveV3.getBalances();
          } else if (marketName === 'MORPHO') {
            const morpho = new Morpho(plasmaVault);
            balances = await morpho.getBalances();
          } else if (marketName === 'EULER_V2') {
            const eulerV2 = new EulerV2(plasmaVault);
            balances = await eulerV2.getBalances();
          } else {
            // Skip unsupported markets
            continue;
          }

          let marketTotalUsd = 0;
          const positions = balances.map((b) => {
            const totalFloat = Number(b.totalBalanceUsd_18) / 1e18;
            marketTotalUsd += totalFloat;
            return {
              underlyingToken: b.underlyingTokenAddress,
              underlyingSymbol: b.underlyingTokenSymbol,
              supplyFormatted: formatUnits(
                b.supplyBalance,
                b.underlyingTokenDecimals,
              ),
              supplyValueUsd: (
                Number(b.supplyBalanceUsd_18) / 1e18
              ).toFixed(2),
              borrowFormatted: formatUnits(
                b.borrowBalance,
                b.underlyingTokenDecimals,
              ),
              borrowValueUsd: (
                Number(b.borrowBalanceUsd_18) / 1e18
              ).toFixed(2),
              totalValueUsd: totalFloat.toFixed(2),
            };
          });

          markets.push({
            marketId: marketName,
            protocol: formatProtocolName(marketName),
            positions,
            totalValueUsd: marketTotalUsd.toFixed(2),
          });

          totalValueUsdFloat += marketTotalUsd;
        } catch {
          // Skip failed market reads
        }
      }

      const tokenCount = assets.length;
      const marketCount = markets.length;
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
        assets,
        markets,
        totalValueUsd: totalValueUsdFloat.toFixed(2),
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
