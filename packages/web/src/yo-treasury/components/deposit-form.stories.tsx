import { useEffect } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import type { Decorator } from '@storybook/react';
import { useSwitchChain } from 'wagmi';
import { WalletDecorator } from '@/app/wallet.decorator';
import { DepositForm } from './deposit-form';

const SwitchToBase: Decorator = (Story) => {
  const { switchChain } = useSwitchChain();
  useEffect(() => {
    switchChain({ chainId: 8453 });
  }, [switchChain]);
  return <Story />;
};

const meta: Meta<typeof DepositForm> = {
  title: 'YO Treasury / Deposit Form',
  component: DepositForm,
  decorators: [SwitchToBase, WalletDecorator],
  parameters: {
    layout: 'centered',
  },
};

export default meta;
type Story = StoryObj<typeof DepositForm>;

export const Base: Story = {
  args: {
    chainId: 8453,
    vaultAddress: '0x09d1C2E03F73853916Ee86b4e1A729F9FbAA960D',
  },
};
