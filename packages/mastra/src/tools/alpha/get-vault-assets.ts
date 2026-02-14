import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { type Address, erc20Abi, formatUnits } from 'viem';
import { PlasmaVault, MARKET_ID, substrateToAddress } from '@ipor/fusion-sdk';
import { getPublicClient } from '../plasma-vault/utils/viem-clients';

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

export const getVaultAssetsTool = createTool({
  id: 'get-vault-assets',
  description: `Read the ERC20 tokens that a Plasma Vault holds.
Returns each token's name, symbol, balance held by the vault, USD price, and total dollar value.
Call this tool when you need to know what tokens are available in the vault, their balances, or before creating actions that reference tokens by name.
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
    type: z.literal('vault-assets'),
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
    totalValueUsd: z
      .string()
      .describe('Total USD value across all tokens'),
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

      // 1. Read ERC20 market substrates
      const substrates = await plasmaVault.getMarketSubstrates(
        MARKET_ID.ERC20_VAULT_BALANCE,
      );

      if (substrates.length === 0) {
        return {
          type: 'vault-assets' as const,
          success: true,
          assets: [],
          totalValueUsd: '0.00',
          message: 'No ERC20 tokens tracked by this vault',
        };
      }

      // 2. Convert substrates to addresses
      const tokenAddresses = substrates
        .map((s) => substrateToAddress(s))
        .filter((addr): addr is Address => addr !== undefined);

      if (tokenAddresses.length === 0) {
        return {
          type: 'vault-assets' as const,
          success: true,
          assets: [],
          totalValueUsd: '0.00',
          message: 'No valid token addresses found in substrates',
        };
      }

      // 3. Multicall: ERC20 metadata + balances (4 calls per token, 1 RPC round trip)
      const metadataResults = await publicClient.multicall({
        contracts: tokenAddresses.flatMap((addr) => [
          { address: addr, abi: erc20Abi, functionName: 'name' as const },
          { address: addr, abi: erc20Abi, functionName: 'symbol' as const },
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

      // 4. Multicall: USD prices from price oracle (1 call per token, 1 RPC round trip)
      const priceResults = await publicClient.multicall({
        contracts: tokenAddresses.map((addr) => ({
          address: plasmaVault.priceOracle,
          abi: getAssetPriceAbi,
          functionName: 'getAssetPrice' as const,
          args: [addr],
        })),
        allowFailure: true,
      });

      // 5. Assemble results
      let totalValueUsdFloat = 0;
      const assets = tokenAddresses.map((addr, i) => {
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

          // Price per token in USD
          const priceFloat = Number(rawPrice) / 10 ** pDecimals;
          priceUsd = priceFloat.toFixed(2);

          // Total value = balance * price / 10^(decimals + priceDecimals)
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

      return {
        type: 'vault-assets' as const,
        success: true,
        assets,
        totalValueUsd: totalValueUsdFloat.toFixed(2),
        message: `${assets.length} token${assets.length === 1 ? '' : 's'} tracked by this vault`,
      };
    } catch (error) {
      return {
        type: 'vault-assets' as const,
        success: false,
        assets: [],
        totalValueUsd: '0.00',
        message: 'Failed to read vault assets',
        error: error instanceof Error ? error.message : String(error),
      };
    }
  },
});
