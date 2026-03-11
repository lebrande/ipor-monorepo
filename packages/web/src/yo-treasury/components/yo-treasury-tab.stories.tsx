import type { Meta, StoryObj } from '@storybook/react';
import { WalletDecorator } from '@/app/wallet.decorator';
import { YoTreasuryTab } from './yo-treasury-tab';

const meta: Meta<typeof YoTreasuryTab> = {
  title: 'YO Treasury / Treasury Tab',
  component: YoTreasuryTab,
  decorators: [WalletDecorator],
  parameters: {
    layout: 'fullscreen',
    themes: { themeOverride: 'dark' },
  },
};

export default meta;
type Story = StoryObj<typeof YoTreasuryTab>;

export const Base: Story = {
  args: {
    chainId: 8453,
    vaultAddress: '0x09d1C2E03F73853916Ee86b4e1A729F9FbAA960D',
  },
};
