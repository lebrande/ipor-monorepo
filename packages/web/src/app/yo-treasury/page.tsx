'use client';

import { TreasuryChat } from '@/yo-treasury/components/treasury-chat';
import { useAccount } from 'wagmi';
import { base } from 'viem/chains';

export default function YoTreasuryPage() {
  const { address } = useAccount();

  return (
    <div className="p-4 md:p-6">
      <div className="mb-4">
        <h1 className="text-2xl font-bold tracking-tight">YO Treasury</h1>
        <p className="text-muted-foreground">
          AI-managed yield allocations across YO Protocol vaults
        </p>
      </div>
      <TreasuryChat
        chainId={base.id}
        vaultAddress={undefined}
        callerAddress={address}
      />
    </div>
  );
}
