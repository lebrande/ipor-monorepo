import type { Meta, StoryObj } from '@storybook/react';
import { TreasuryBalances } from './treasury-balances';
import { withAppProviders } from '@/app/app-providers-decorator';

/**
 * Shows the treasury vault's current holdings: unallocated ERC20 tokens and
 * allocated YO vault positions with USD values. Rendered when the agent calls
 * `getTreasuryAllocationTool`.
 */
const meta: Meta<typeof TreasuryBalances> = {
  title: 'Alpha Tools / TreasuryBalances',
  component: TreasuryBalances,
  decorators: [withAppProviders],
  parameters: { layout: 'centered' },
};

export default meta;
type Story = StoryObj<typeof TreasuryBalances>;

/** Full treasury with unallocated tokens and YO allocations */
export const Default: Story = {
  args: {
    chainId: 8453,
    output: {
      type: 'treasury-balances',
      success: true,
      totalValueUsd: '9670.50',
      assets: [
        {
          address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
          name: 'USD Coin',
          symbol: 'USDC',
          decimals: 6,
          balance: '250500000',
          balanceFormatted: '250.50',
          priceUsd: '1.00',
          valueUsd: '250.50',
        },
        {
          address: '0x4200000000000000000000000000000000000006',
          name: 'Wrapped Ether',
          symbol: 'WETH',
          decimals: 18,
          balance: '125000000000000000',
          balanceFormatted: '0.125',
          priceUsd: '3500.00',
          valueUsd: '437.50',
        },
      ],
      yoPositions: [
        {
          vaultAddress: '0x0000000f2eb9f69274678c76222b35eec7588a65',
          vaultSymbol: 'yoUSD',
          shares: '1050000000',
          underlyingAddress: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
          underlyingSymbol: 'USDC',
          underlyingDecimals: 6,
          underlyingAmount: '1050000000',
          underlyingFormatted: '1050.00',
          valueUsd: '1050.00',
        },
        {
          vaultAddress: '0x3a43aec53490cb9fa922847385d82fe25d0e9de7',
          vaultSymbol: 'yoETH',
          shares: '520000000000000000',
          underlyingAddress: '0x4200000000000000000000000000000000000006',
          underlyingSymbol: 'WETH',
          underlyingDecimals: 18,
          underlyingAmount: '520000000000000000',
          underlyingFormatted: '0.520',
          valueUsd: '1820.00',
        },
        {
          vaultAddress: '0xbcbc8cb4d1e8ed048a6276a5e94a3e952660bcbc',
          vaultSymbol: 'yoBTC',
          shares: '10200000',
          underlyingAddress: '0xcbB7C0000aB88B473b1f5aFd9ef808440eed33Bf',
          underlyingSymbol: 'cbBTC',
          underlyingDecimals: 8,
          underlyingAmount: '10200000',
          underlyingFormatted: '0.102',
          valueUsd: '6112.50',
        },
      ],
      message: 'Treasury overview for 0x09d1...60D on Base',
    },
  },
};

/** Treasury with only unallocated tokens, no YO positions */
export const UnallocatedOnly: Story = {
  args: {
    chainId: 8453,
    output: {
      type: 'treasury-balances',
      success: true,
      totalValueUsd: '688.00',
      assets: [
        {
          address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
          name: 'USD Coin',
          symbol: 'USDC',
          decimals: 6,
          balance: '500000000',
          balanceFormatted: '500.00',
          priceUsd: '1.00',
          valueUsd: '500.00',
        },
        {
          address: '0x4200000000000000000000000000000000000006',
          name: 'Wrapped Ether',
          symbol: 'WETH',
          decimals: 18,
          balance: '54000000000000000',
          balanceFormatted: '0.054',
          priceUsd: '3500.00',
          valueUsd: '188.00',
        },
      ],
      yoPositions: [],
      message: 'No YO allocations yet',
    },
  },
};

/** Treasury with only YO allocations, nothing unallocated */
export const AllocatedOnly: Story = {
  args: {
    chainId: 8453,
    output: {
      type: 'treasury-balances',
      success: true,
      totalValueUsd: '1050.00',
      assets: [],
      yoPositions: [
        {
          vaultAddress: '0x0000000f2eb9f69274678c76222b35eec7588a65',
          vaultSymbol: 'yoUSD',
          shares: '1050000000',
          underlyingAddress: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
          underlyingSymbol: 'USDC',
          underlyingDecimals: 6,
          underlyingAmount: '1050000000',
          underlyingFormatted: '1050.00',
          valueUsd: '1050.00',
        },
      ],
      message: 'All funds allocated to YO vaults',
    },
  },
};

/** Error state */
export const Error: Story = {
  args: {
    chainId: 8453,
    output: {
      type: 'treasury-balances',
      success: false,
      totalValueUsd: '0',
      assets: [],
      yoPositions: [],
      error: 'Failed to read treasury balances: vault not found',
      message: '',
    },
  },
};
