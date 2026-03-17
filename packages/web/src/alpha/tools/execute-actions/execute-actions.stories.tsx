import type { Meta, StoryObj } from '@storybook/react';
import { WalletDecorator } from '@/app/wallet.decorator';
import { ExecuteActions } from './execute-actions';

/**
 * 5-step execution wizard: connect wallet -> switch chain -> check ALPHA_ROLE
 * -> simulate -> execute. Renders when the agent calls `executePendingActionsTool`.
 * Auto-skips client simulation since the agent already simulated on an Anvil fork.
 */
const meta: Meta<typeof ExecuteActions> = {
  title: 'Alpha Tools / ExecuteActions',
  component: ExecuteActions,
  decorators: [WalletDecorator],
};

export default meta;
type Story = StoryObj<typeof ExecuteActions>;

/** Supply 1 USDC to Aave V3 on Base — single fuse action */
export const SupplyUsdcAaveV3: Story = {
  args: {
    vaultAddress: '0xa13f7342a1db4c32f8dc0539e3b6d1cf101e7d04',
    chainId: 8453,
    flatFuseActions: [
      {
        fuse: '0x26fD6EF391E98C78CfCA27e00c3d15be4D941625',
        data: '0x41b11ae7000000000000000000000000833589fcd6edb6e08f4c7c32d4f71b54bda0291300000000000000000000000000000000000000000000000000000000000f42400000000000000000000000000000000000000000000000000000000000000000',
      },
    ],
    actionsCount: 1,
    fuseActionsCount: 1,
    actionsSummary:
      'supply on aave-v3: Aave V3 supply 1000000 of asset 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
  },
};

/** Two Aave V3 supply actions batched together */
export const MultipleActions: Story = {
  args: {
    vaultAddress: '0xa13f7342a1db4c32f8dc0539e3b6d1cf101e7d04',
    chainId: 8453,
    flatFuseActions: [
      {
        fuse: '0x26fD6EF391E98C78CfCA27e00c3d15be4D941625',
        data: '0x41b11ae7000000000000000000000000833589fcd6edb6e08f4c7c32d4f71b54bda0291300000000000000000000000000000000000000000000000000000000000f42400000000000000000000000000000000000000000000000000000000000000000',
      },
      {
        fuse: '0x26fD6EF391E98C78CfCA27e00c3d15be4D941625',
        data: '0x41b11ae7000000000000000000000000833589fcd6edb6e08f4c7c32d4f71b54bda0291300000000000000000000000000000000000000000000000000000000000f42400000000000000000000000000000000000000000000000000000000000000000',
      },
    ],
    actionsCount: 2,
    fuseActionsCount: 2,
    actionsSummary:
      'supply on aave-v3: Aave V3 supply 1000000 USDC\nsupply on aave-v3: Aave V3 supply 1000000 USDC',
  },
};

/** YO vault allocation on Base */
export const YoAllocation: Story = {
  args: {
    vaultAddress: '0x09d1C2E03F73853916Ee86b4e1A729F9FbAA960D',
    chainId: 8453,
    flatFuseActions: [
      {
        fuse: '0xaabbccdd11223344aabbccdd11223344aabbccdd',
        data: '0x12345678000000000000000000000000000000000000000000000000000000001dcd6500',
      },
    ],
    actionsCount: 1,
    fuseActionsCount: 1,
    actionsSummary: 'supply on yo-erc4626: Allocate 500 USDC to yoUSD',
  },
};
