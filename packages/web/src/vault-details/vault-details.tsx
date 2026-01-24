'use client';

import { VaultDetailsProvider } from '@/vault-details/vault-details.context';
import { VaultProvider } from '@/vault/vault.context';
import { useVaultDetailsContext } from '@/vault-details/vault-details.context';
import { VaultHeader } from '@/vault-details/components/vault-header';
import { GlobalTimeSelector } from '@/vault-details/components/global-time-selector';
import { VaultOverview } from '@/vault-details/components/vault-overview';
import { DepositorsList } from '@/depositors-list/depositors-list';
import { DepositorsChart } from '@/depositors-chart/depositors-chart';
import { AppProviders } from '@/app/app-providers';
import type { Address } from 'viem';
import type { ChainId } from '@/app/wagmi-provider';
import type { TabId } from '@/vault-details/components/vault-tabs';

interface Props {
  chainId: ChainId;
  vaultAddress: Address;
  activeTab: TabId;
}

export const VaultDetails = ({ vaultAddress, chainId, activeTab }: Props) => {
  return (
    <AppProviders>
      <VaultProvider chainId={chainId} vaultAddress={vaultAddress}>
        <VaultDetailsProvider activeTab={activeTab}>
          <VaultDetailsContent />
        </VaultDetailsProvider>
      </VaultProvider>
    </AppProviders>
  );
};

const VaultDetailsContent = () => {
  const { activeTab } = useVaultDetailsContext();

  return (
    <div className="space-y-6">
      <VaultHeader />

      <GlobalTimeSelector />

      {activeTab === 'overview' && <VaultOverview />}

      {activeTab === 'depositors' && (
        <div className="space-y-6">
          <DepositorsChart />
          <DepositorsList />
        </div>
      )}

      {/* Placeholder for not implemented tabs */}
      {activeTab !== 'overview' && activeTab !== 'depositors' && (
        <div className="text-center py-12">
          <div className="max-w-md mx-auto">
            <h3 className="text-lg font-medium text-foreground mb-2">
              {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Tab
            </h3>
            <p className="text-muted-foreground">
              This tab is not implemented yet. Coming soon!
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
