import type { Meta, StoryObj } from '@storybook/react';
import { YoVaultsList } from './yo-vaults-list';
import { withAppProviders } from '@/app/app-providers-decorator';

/**
 * Displays available YO Protocol vaults with APY, TVL, and the user's current
 * position (shares, underlying amount, USD value). Also shows unallocated
 * balance per vault. Rendered when the agent calls `getYoVaultsTool`.
 */
const meta: Meta<typeof YoVaultsList> = {
  title: 'Alpha Tools / YoVaultsList',
  component: YoVaultsList,
  decorators: [withAppProviders],
  parameters: { layout: 'centered' },
};

export default meta;
type Story = StoryObj<typeof YoVaultsList>;

/** Four YO vaults on Base with user positions and unallocated balances */
export const Default: Story = {
  args: {
    chainId: 8453,
    output: {
      type: 'yo-vaults',
      success: true,
      chainId: 8453,
      vaults: [
        {
          address: '0x0000000f2eb9f69274678c76222b35eec7588a65',
          name: 'YO USD',
          symbol: 'yoUSD',
          underlying: 'USDC',
          underlyingAddress: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
          underlyingDecimals: 6,
          chainId: 8453,
          apy7d: '19.42',
          tvl: '$12,450,000',
          unallocatedBalance: '250.50',
          userPosition: {
            shares: '1000000000',
            underlyingAmount: '1050000000',
            underlyingFormatted: '1050.00',
            valueUsd: '1050.00',
          },
        },
        {
          address: '0x3a43aec53490cb9fa922847385d82fe25d0e9de7',
          name: 'YO ETH',
          symbol: 'yoETH',
          underlying: 'WETH',
          underlyingAddress: '0x4200000000000000000000000000000000000006',
          underlyingDecimals: 18,
          chainId: 8453,
          apy7d: '8.75',
          tvl: '$5,230,000',
          unallocatedBalance: '0.125000',
          userPosition: {
            shares: '500000000000000000',
            underlyingAmount: '520000000000000000',
            underlyingFormatted: '0.520000',
            valueUsd: '1820.00',
          },
        },
        {
          address: '0xbcbc8cb4d1e8ed048a6276a5e94a3e952660bcbc',
          name: 'YO BTC',
          symbol: 'yoBTC',
          underlying: 'cbBTC',
          underlyingAddress: '0xcbB7C0000aB88B473b1f5aFd9ef808440eed33Bf',
          underlyingDecimals: 8,
          chainId: 8453,
          apy7d: '5.20',
          tvl: '$3,100,000',
          unallocatedBalance: '0.001500',
          userPosition: {
            shares: '10000000',
            underlyingAmount: '10200000',
            underlyingFormatted: '0.102000',
            valueUsd: '6800.00',
          },
        },
        {
          address: '0x50c749ae210d3977adc824ae11f3c7fd10c871e9',
          name: 'YO EUR',
          symbol: 'yoEUR',
          underlying: 'EURC',
          underlyingAddress: '0x60a3E35Cc302bFA44Cb288Bc5a4F316Fdb1adb42',
          underlyingDecimals: 6,
          chainId: 8453,
          apy7d: '12.30',
          tvl: '$1,800,000',
          unallocatedBalance: '0',
        },
      ],
      message: 'YO vaults on Base',
    },
  },
};

/** Vaults without any user positions */
export const NoPositions: Story = {
  args: {
    chainId: 8453,
    output: {
      type: 'yo-vaults',
      success: true,
      chainId: 8453,
      vaults: [
        {
          address: '0x0000000f2eb9f69274678c76222b35eec7588a65',
          name: 'YO USD',
          symbol: 'yoUSD',
          underlying: 'USDC',
          underlyingAddress: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
          underlyingDecimals: 6,
          chainId: 8453,
          apy7d: '19.42',
          tvl: '$12,450,000',
        },
        {
          address: '0x3a43aec53490cb9fa922847385d82fe25d0e9de7',
          name: 'YO ETH',
          symbol: 'yoETH',
          underlying: 'WETH',
          underlyingAddress: '0x4200000000000000000000000000000000000006',
          underlyingDecimals: 18,
          chainId: 8453,
          apy7d: '8.75',
          tvl: '$5,230,000',
        },
      ],
      message: 'YO vaults on Base',
    },
  },
};

/** Error state when vault data fails to load */
export const Error: Story = {
  args: {
    chainId: 8453,
    output: {
      type: 'yo-vaults',
      success: false,
      chainId: 8453,
      vaults: [],
      error: 'RPC request failed: could not connect to Base RPC endpoint',
      message: '',
    },
  },
};
