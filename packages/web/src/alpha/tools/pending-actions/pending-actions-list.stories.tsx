import type { Meta, StoryObj } from '@storybook/react';
import { PendingActionsList } from './pending-actions-list';

/**
 * Displays the queue of pending fuse actions awaiting execution. Each action
 * shows protocol icon, description, action type, and expandable raw payload
 * with copy-to-clipboard. Rendered when the agent calls `displayPendingActionsTool`.
 */
const meta: Meta<typeof PendingActionsList> = {
  title: 'Alpha Tools / PendingActionsList',
  component: PendingActionsList,
  parameters: { layout: 'centered' },
};

export default meta;
type Story = StoryObj<typeof PendingActionsList>;

/** Three pending actions across different protocols */
export const WithActions: Story = {
  args: {
    message: '3 actions queued for execution',
    actions: [
      {
        id: '1',
        protocol: 'aave-v3',
        actionType: 'supply',
        description: 'Aave V3 supply 1000 USDC',
        fuseActions: [
          {
            fuse: '0x26fD6EF391E98C78CfCA27e00c3d15be4D941625',
            data: '0x41b11ae7000000000000000000000000833589fcd6edb6e08f4c7c32d4f71b54bda02913',
          },
        ],
      },
      {
        id: '2',
        protocol: 'morpho',
        actionType: 'withdraw',
        description: 'Morpho withdraw 500 USDC from WETH/USDC market',
        fuseActions: [
          {
            fuse: '0x1234567890abcdef1234567890abcdef12345678',
            data: '0xabcdef00000000000000000000000000000000000000000000000000000000001e8480',
          },
        ],
      },
      {
        id: '3',
        protocol: 'yo-erc4626',
        actionType: 'supply',
        description: 'Allocate 200 USDC to yoUSD',
        fuseActions: [
          {
            fuse: '0xaabbccdd11223344aabbccdd11223344aabbccdd',
            data: '0x12345678000000000000000000000000000000000000000000000000000000000bebc200',
          },
        ],
      },
    ],
  },
};

/** Single pending action */
export const SingleAction: Story = {
  args: {
    message: '1 action queued',
    actions: [
      {
        id: '1',
        protocol: 'aave-v3',
        actionType: 'supply',
        description: 'Aave V3 supply 1000 USDC',
        fuseActions: [
          {
            fuse: '0x26fD6EF391E98C78CfCA27e00c3d15be4D941625',
            data: '0x41b11ae7000000000000000000000000833589fcd6edb6e08f4c7c32d4f71b54bda02913',
          },
        ],
      },
    ],
  },
};

/** Empty queue — no actions pending */
export const Empty: Story = {
  args: {
    message: 'No pending actions',
    actions: [],
  },
};
