import type { Meta, StoryObj } from '@storybook/react';
import { MarketBalancesList } from './market-balances-list';
import { withAppProviders } from '@/app/app-providers-decorator';

/**
 * Displays the Plasma Vault's unallocated ERC20 tokens and allocated DeFi
 * market positions (Aave V3, Morpho, Euler V2). Shows token balances, USD
 * values, supply/borrow positions per market. Rendered when the agent calls
 * `getMarketBalancesTool`.
 */
const meta: Meta<typeof MarketBalancesList> = {
  title: 'Alpha Tools / MarketBalancesList',
  component: MarketBalancesList,
  decorators: [withAppProviders],
  parameters: { layout: 'centered' },
};

export default meta;
type Story = StoryObj<typeof MarketBalancesList>;

/** Vault with unallocated tokens and multi-protocol allocations */
export const Default: Story = {
  args: {
    chainId: 8453,
    totalValueUsd: '15230.50',
    message: 'Vault portfolio overview',
    assets: [
      {
        address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
        name: 'USD Coin',
        symbol: 'USDC',
        decimals: 6,
        balance: '1250000000',
        balanceFormatted: '1250.00',
        priceUsd: '1.00',
        valueUsd: '1250.00',
      },
      {
        address: '0x4200000000000000000000000000000000000006',
        name: 'Wrapped Ether',
        symbol: 'WETH',
        decimals: 18,
        balance: '500000000000000000',
        balanceFormatted: '0.50',
        priceUsd: '3500.00',
        valueUsd: '1750.00',
      },
    ],
    markets: [
      {
        marketId: 'aave-v3-usdc',
        protocol: 'aave-v3',
        totalValueUsd: '5230.50',
        positions: [
          {
            underlyingToken: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
            underlyingSymbol: 'USDC',
            substrate: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
            supplyFormatted: '5000.00',
            supplyValueUsd: '5000.00',
            borrowFormatted: '0',
            borrowValueUsd: '0',
            totalValueUsd: '5000.00',
          },
          {
            underlyingToken: '0x4200000000000000000000000000000000000006',
            underlyingSymbol: 'WETH',
            substrate: '0x4200000000000000000000000000000000000006',
            supplyFormatted: '0.066',
            supplyValueUsd: '230.50',
            borrowFormatted: '0',
            borrowValueUsd: '0',
            totalValueUsd: '230.50',
          },
        ],
      },
      {
        marketId: 'morpho-weth-usdc',
        protocol: 'morpho',
        totalValueUsd: '7000.00',
        positions: [
          {
            underlyingToken: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
            underlyingSymbol: 'USDC',
            label: 'WETH/USDC 86%',
            substrate: '0xabcd1234567890abcdef1234567890abcdef1234567890abcdef1234567890ab',
            supplyFormatted: '7000.00',
            supplyValueUsd: '7000.00',
            borrowFormatted: '0',
            borrowValueUsd: '0',
            totalValueUsd: '7000.00',
          },
        ],
      },
    ],
  },
};

/** Vault with supply and borrow positions */
export const WithBorrows: Story = {
  args: {
    chainId: 8453,
    totalValueUsd: '3500.00',
    message: 'Vault with leveraged positions',
    assets: [],
    markets: [
      {
        marketId: 'aave-v3-leveraged',
        protocol: 'aave-v3',
        totalValueUsd: '3500.00',
        positions: [
          {
            underlyingToken: '0x4200000000000000000000000000000000000006',
            underlyingSymbol: 'WETH',
            substrate: '0x4200000000000000000000000000000000000006',
            supplyFormatted: '2.00',
            supplyValueUsd: '7000.00',
            borrowFormatted: '0',
            borrowValueUsd: '0',
            totalValueUsd: '7000.00',
          },
          {
            underlyingToken: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
            underlyingSymbol: 'USDC',
            substrate: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
            supplyFormatted: '0',
            supplyValueUsd: '0',
            borrowFormatted: '3500.00',
            borrowValueUsd: '3500.00',
            totalValueUsd: '-3500.00',
          },
        ],
      },
    ],
  },
};

/** Empty vault with no positions */
export const EmptyVault: Story = {
  args: {
    chainId: 8453,
    totalValueUsd: '0',
    message: 'No positions found in this vault',
    assets: [],
    markets: [],
  },
};
