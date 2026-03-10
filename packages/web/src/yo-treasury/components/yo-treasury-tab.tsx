'use client';

import { TreasuryChat } from './treasury-chat';
import { DepositForm } from './deposit-form';
import { WithdrawForm } from './withdraw-form';
import { useAccount } from 'wagmi';
import type { ChainId } from '@/app/chains.config';
import type { Address } from 'viem';

interface Props {
  chainId: ChainId;
  vaultAddress: Address;
}

export function YoTreasuryTab({ chainId, vaultAddress }: Props) {
  const { address } = useAccount();

  return (
    <div className="flex flex-col lg:flex-row gap-4">
      {/* Chat */}
      <div className="flex-1 min-w-0 order-2 lg:order-1">
        <TreasuryChat
          chainId={chainId}
          vaultAddress={vaultAddress}
          callerAddress={address}
        />
      </div>

      {/* Deposit + Withdraw */}
      <div className="w-full lg:w-80 shrink-0 lg:sticky lg:top-0 lg:self-start space-y-3 order-1 lg:order-2">
        <DepositForm chainId={chainId} vaultAddress={vaultAddress} />
        <WithdrawForm chainId={chainId} vaultAddress={vaultAddress} />
      </div>
    </div>
  );
}
