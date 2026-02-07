'use client';

import { AppProviders } from '@/app/app-providers';
import { VaultProvider } from '@/vault/vault.context';
import { VaultDetailHeader } from '@/vault-details/components/vault-detail-header';
import type { ChainId } from '@/app/chains.config';
import type { Address } from 'viem';

interface Props {
  children: React.ReactNode;
  chainId: ChainId;
  vaultAddress: Address;
  vaultName?: string;
  protocol?: string;
}

export function VaultDetailLayout({
  children,
  chainId,
  vaultAddress,
  vaultName,
  protocol,
}: Props) {
  return (
    <AppProviders>
      <VaultProvider chainId={chainId} vaultAddress={vaultAddress}>
        <div className="container mx-auto px-4 py-6 space-y-6 overflow-x-hidden">
          <VaultDetailHeader
            chainId={chainId}
            vaultAddress={vaultAddress}
            vaultName={vaultName}
            protocol={protocol}
          />
          {children}
        </div>
      </VaultProvider>
    </AppProviders>
  );
}
