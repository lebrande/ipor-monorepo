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
    <div className="flex gap-4">
      {/* Left column: Chat */}
      <div className="flex-1 min-w-0">
        <TreasuryChat
          chainId={chainId}
          vaultAddress={vaultAddress}
          callerAddress={address}
        />
      </div>

      {/* Right column: Deposit + Withdraw */}
      <div className="w-80 shrink-0 sticky top-0 self-start space-y-3">
        <DepositForm chainId={chainId} vaultAddress={vaultAddress} />
        <WithdrawForm chainId={chainId} vaultAddress={vaultAddress} />
      </div>
    </div>
  );
}
