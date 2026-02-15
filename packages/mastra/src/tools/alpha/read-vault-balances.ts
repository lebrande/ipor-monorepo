import { type Address, type PublicClient, erc20Abi, formatUnits } from 'viem';
import {
  PlasmaVault,
  MARKET_ID,
  substrateToAddress,
  AaveV3,
  Morpho,
  EulerV2,
  type MarketSubstrateBalance,
} from '@ipor/fusion-sdk';
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

/** Balance snapshot for a vault — ERC20 tokens + market positions */
export interface BalanceSnapshot {
  assets: Array<{
    address: string;
    name: string;
    symbol: string;
    decimals: number;
    balance: string;
    balanceFormatted: string;
    priceUsd: string;
    valueUsd: string;
  }>;
  markets: MarketAllocation[];
  totalValueUsd: string;
}

/**
 * Read vault balances using the fusion SDK.
 * Extracted from getMarketBalancesTool so both the balances tool
 * and the simulation tool can reuse the same logic.
 *
 * @param publicClient - Any viem PublicClient (can point to live chain or Anvil fork)
 * @param vaultAddress - PlasmaVault contract address
 */
export async function readVaultBalances(
  publicClient: PublicClient,
  vaultAddress: Address,
): Promise<BalanceSnapshot> {
  const plasmaVault = await PlasmaVault.create(
    publicClient,
    vaultAddress,
  );

  let totalValueUsdFloat = 0;

  // ─── ERC20 unallocated tokens ───

  const substrates = await plasmaVault.getMarketSubstrates(
    MARKET_ID.ERC20_VAULT_BALANCE,
  );

  let assets: BalanceSnapshot['assets'] = [];

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

  // ─── Market allocations ───

  const markets: MarketAllocation[] = [];

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

  const marketIdSet = new Set<string>();
  for (const id of activeMarketIds) {
    marketIdSet.add(getMarketName(id));
  }

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
        continue;
      }

      let marketTotalUsd = 0;
      const positions = balances.map((b) => {
        const totalFloat = Number(b.totalBalanceUsd_18) / 1e18;
        marketTotalUsd += totalFloat;
        return {
          substrate: b.substrate,
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

  return {
    assets,
    markets,
    totalValueUsd: totalValueUsdFloat.toFixed(2),
  };
}
