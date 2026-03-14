import { VaultOverviewContent } from '@/vault-details/components/vault-overview-content';
import { getVaultFromRegistry, hasTag, VAULT_TAG } from '@/lib/vaults-registry';
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
  const isYoTreasury = hasTag(vault, VAULT_TAG.YO_TREASURY);

  if (isYoTreasury) {
    return (
      <YoTreasuryOverview
        chainId={Number(chainId) as ChainId}
        vaultAddress={address as Address}
      />
    );
  }

  return <VaultOverviewContent />;
}
