'use client';

import { useMemo, useCallback } from 'react';
import { VaultProvider } from '@/vault/vault.context';
import { TreasuryHeader } from '@/yo-treasury/components/treasury-header';
import { TreasuryDashboard } from '@/yo-treasury/components/treasury-dashboard';
import { TreasuryChat } from '@/yo-treasury/components/treasury-chat';
import { DepositForm } from '@/yo-treasury/components/deposit-form';
import { WithdrawForm } from '@/yo-treasury/components/withdraw-form';
import { VaultMetrics } from '@/vault-metrics/vault-metrics';
import { FlowChart } from '@/flow-chart/flow-chart';
import { DepositorsChart } from '@/depositors-chart/depositors-chart';
import { DepositorsList } from '@/depositors-list/depositors-list';
import { ActivityDataTable } from '@/activity/components/activity-data-table';
import { ActivityScrollTrigger } from '@/activity/components/activity-scroll-trigger';
import { useInfiniteActivity } from '@/activity/hooks/use-infinite-activity';
import { useAccount } from 'wagmi';
import { base } from 'viem/chains';
import type { Address } from 'viem';

const VAULT_ADDRESS = '0x09d1C2E03F73853916Ee86b4e1A729F9FbAA960D' as Address;
const CHAIN_ID = base.id;
const VAULT_NAME = 'YO Treasury';

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-[11px] font-medium tracking-[0.15em] uppercase text-yo-muted">
      {children}
    </h2>
  );
}

function ActivitySection() {
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useInfiniteActivity({
      params: {
        chains: String(CHAIN_ID),
        vaults: VAULT_ADDRESS.toLowerCase(),
      },
    });

  const allActivities = useMemo(() => {
    if (!data) return [];
    return data.pages.flatMap((page) => page.activities);
  }, [data]);

  const handleLoadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  return (
    <>
      <ActivityDataTable activities={allActivities} />
      <ActivityScrollTrigger
        onLoadMore={handleLoadMore}
        hasMore={hasNextPage ?? false}
        isLoading={isFetchingNextPage}
      />
    </>
  );
}

export default function YoTreasuryPage() {
  const { address } = useAccount();

  return (
    <VaultProvider chainId={CHAIN_ID} vaultAddress={VAULT_ADDRESS}>
      {/* Header */}
      <TreasuryHeader
        chainId={CHAIN_ID}
        vaultAddress={VAULT_ADDRESS}
        vaultName={VAULT_NAME}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
        {/* Section 1: Portfolio — TreasuryDashboard (PortfolioSummary + AllocationTable) */}
        <section className="space-y-3">
          <SectionLabel>Portfolio</SectionLabel>
          <TreasuryDashboard chainId={CHAIN_ID} vaultAddress={VAULT_ADDRESS} />
        </section>

        {/* Section 2: Vault Metrics */}
        <section className="space-y-3">
          <SectionLabel>Vault Metrics</SectionLabel>
          <VaultMetrics />
        </section>

        {/* Section 3: Analytics — Flow Chart */}
        <section className="space-y-3">
          <SectionLabel>Analytics</SectionLabel>
          <FlowChart />
        </section>

        {/* Section 4: Depositors — Chart + List */}
        <section className="space-y-3">
          <SectionLabel>Depositors</SectionLabel>
          <DepositorsChart />
          <DepositorsList />
        </section>

        {/* Section 5: Activity — Recent transactions */}
        <section className="space-y-3">
          <SectionLabel>Activity</SectionLabel>
          <ActivitySection />
        </section>

        {/* Section 6: Chat + Forms */}
        <section className="space-y-3">
          <SectionLabel>AI Copilot</SectionLabel>
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Chat */}
            <div className="flex-1 min-w-0 order-2 lg:order-1">
              <TreasuryChat
                chainId={CHAIN_ID}
                vaultAddress={VAULT_ADDRESS}
                callerAddress={address}
              />
            </div>

            {/* Deposit + Withdraw */}
            <div className="w-full lg:w-80 shrink-0 lg:sticky lg:top-20 lg:self-start space-y-3 order-1 lg:order-2">
              <DepositForm chainId={CHAIN_ID} vaultAddress={VAULT_ADDRESS} />
              <WithdrawForm chainId={CHAIN_ID} vaultAddress={VAULT_ADDRESS} />
            </div>
          </div>
        </section>
      </main>
    </VaultProvider>
  );
}
