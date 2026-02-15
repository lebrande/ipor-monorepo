import type { Meta, StoryObj } from '@storybook/react';
import { MockWalletDecorator } from '@/app/mock-wallet.decorator';
import { ExecuteActions } from './execute-actions';

const meta: Meta<typeof ExecuteActions> = {
  title: 'Vault Details / ExecuteActions',
  component: ExecuteActions,
  decorators: [MockWalletDecorator],
};

export default meta;
type Story = StoryObj<typeof ExecuteActions>;

/** Supply 1 USDC to Aave V3 on Base — real vault, real fuse action data */
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

/** Multiple actions */
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
