import { notFound } from 'next/navigation';
import { VaultDetailsPage } from './vault-details-page';
import {
  getTabConfig,
  isValidTab,
  type TabId,
} from '@/vault-details/vault-tabs.config';
import { isValidChainId } from '@/app/chains.config';
import { isAddress, type Address } from 'viem';

interface PageProps {
  params: Promise<{
    chainId: string;
    address: string;
    tab: string[];
  }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { tab } = await params;
  const activeTab = (tab?.[0] || 'overview') as TabId;
  const tabConfig = getTabConfig(activeTab);

  return {
    title: `Vault ${tabConfig?.label || 'Details'} - DeFi Panda`,
  };
}

export default async function VaultPage({ params }: PageProps) {
  const { chainId: chainIdParam, address: addressParam, tab } = await params;

  // Validate chainId
  const chainId = parseInt(chainIdParam, 10);
  if (isNaN(chainId) || !isValidChainId(chainId)) {
    notFound();
  }

  // Validate address
  if (!isAddress(addressParam)) {
    notFound();
  }

  // Validate tab
  const activeTab = tab?.[0] || 'overview';
  if (!isValidTab(activeTab)) {
    notFound();
  }

  return (
    <VaultDetailsPage
      chainId={chainId}
      vaultAddress={addressParam as Address}
      activeTab={activeTab}
    />
  );
}
