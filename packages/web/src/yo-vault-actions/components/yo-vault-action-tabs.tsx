'use client';

import { useState } from 'react';
import { useVaultState } from '@yo-protocol/react';
import { cn } from '@/lib/utils';
import { TokenIcon } from '@/components/token-icon';
import { YoDepositForm } from './yo-deposit-form';
import { YoWithdrawForm } from './yo-withdraw-form';
import type { ChainId } from '@/app/chains.config';
import type { Address } from 'viem';

interface Props {
  chainId: ChainId;
  vaultAddress: Address;
}

type Tab = 'deposit' | 'withdraw';

export function YoVaultActionTabs({ chainId, vaultAddress }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('deposit');
  const { vaultState } = useVaultState(vaultAddress);

  return (
    <div className="font-yo bg-black rounded-2xl border border-white/5 p-4 space-y-4">
      {/* Vault badge */}
      {vaultState && (
        <div className="flex items-center gap-2">
          {vaultState.asset && (
            <TokenIcon chainId={chainId} address={vaultState.asset} className="w-5 h-5" />
          )}
          <span className="text-sm font-semibold text-white">{vaultState.name}</span>
        </div>
      )}

      {/* Tab bar */}
      <div className="flex bg-yo-dark rounded-lg p-1">
        {(['deposit', 'withdraw'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              'flex-1 py-1.5 text-sm font-medium capitalize rounded-md transition-all',
              activeTab === tab
                ? 'bg-yo-neon text-black'
                : 'text-yo-muted hover:text-white',
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Form */}
      {activeTab === 'deposit' ? (
        <YoDepositForm chainId={chainId} vaultAddress={vaultAddress} />
      ) : (
        <YoWithdrawForm chainId={chainId} vaultAddress={vaultAddress} />
      )}
    </div>
  );
}
