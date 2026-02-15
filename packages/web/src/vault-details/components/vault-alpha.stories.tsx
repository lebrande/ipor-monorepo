import type { Meta, StoryObj } from '@storybook/react';
import { WalletDecorator } from '@/app/wallet.decorator';
import { VaultAlpha } from './vault-alpha';

const meta: Meta<typeof VaultAlpha> = {
  title: 'Vault Details / VaultAlpha',
  component: VaultAlpha,
  decorators: [WalletDecorator],
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;
type Story = StoryObj<typeof VaultAlpha>;

/** Real alpha agent chat for USDC vault on Base */
export const BaseUsdcVault: Story = {
  args: {
    chainId: 8453,
    vaultAddress: '0xa13f7342a1db4c32f8dc0539e3b6d1cf101e7d04',
    className: 'h-screen',
  },
};
