'use client';

import { TreasuryChat } from './treasury-chat';
import { TreasuryDashboard } from './treasury-dashboard';
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
    <div className="space-y-4 font-yo">
      {/* Dashboard — always visible, primary view */}
      <TreasuryDashboard chainId={chainId} vaultAddress={vaultAddress} />

      {/* AI Copilot */}
      <TreasuryChat
        chainId={chainId}
        vaultAddress={vaultAddress}
        callerAddress={address}
      />
    </div>
  );
}
