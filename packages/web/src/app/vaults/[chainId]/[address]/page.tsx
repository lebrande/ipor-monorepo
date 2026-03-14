import { VaultOverviewContent } from '@/vault-details/components/vault-overview-content';
import { getVaultFromRegistry } from '@/lib/vaults-registry';
import { YoTreasuryOverview } from '@/yo-treasury/components/yo-treasury-overview';
import type { ChainId } from '@/app/chains.config';
import type { Address } from 'viem';

export const metadata = {
  title: 'Vault Overview - Fusion by IPOR',
};

export default async function VaultOverviewPage({
  params,
}: {
  params: Promise<{ chainId: string; address: string }>;
}) {
  const { chainId, address } = await params;
  const vault = getVaultFromRegistry(Number(chainId), address);

  if (vault?.tags.includes('yo-treasury')) {
    return (
      <YoTreasuryOverview
        chainId={Number(chainId) as ChainId}
        vaultAddress={address as Address}
      />
    );
  }

  return <VaultOverviewContent />;
}
