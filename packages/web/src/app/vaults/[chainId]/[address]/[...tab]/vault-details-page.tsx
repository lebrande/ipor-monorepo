'use client';

import { VaultDetails } from '@/vault-details/vault-details';
import type { ChainId } from '@/app/chains.config';
import type { Address } from 'viem';
import type { TabId } from '@/vault-details/vault-tabs.config';

interface VaultDetailsPageProps {
  chainId: ChainId;
  vaultAddress: Address;
  activeTab: TabId;
}

export function VaultDetailsPage({
  chainId,
  vaultAddress,
  activeTab,
}: VaultDetailsPageProps) {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <VaultDetails
          vaultAddress={vaultAddress}
          chainId={chainId}
          activeTab={activeTab}
        />
      </div>
    </div>
  );
}
