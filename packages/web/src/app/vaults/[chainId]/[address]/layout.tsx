import { notFound } from 'next/navigation';
import { isAddress, type Address } from 'viem';
import { isValidChainId, type ChainId } from '@/app/chains.config';
import { getVaultFromRegistry } from '@/lib/vaults-registry';
import { getAppConfig } from '@/lib/app-config';
import { VaultDetailLayout } from './vault-detail-layout';

interface LayoutProps {
  children: React.ReactNode;
  params: Promise<{
    chainId: string;
    address: string;
  }>;
}

export default async function VaultLayout({ children, params }: LayoutProps) {
  const { chainId: chainIdParam, address: addressParam } = await params;

  const chainId = parseInt(chainIdParam, 10);
  if (isNaN(chainId) || !isValidChainId(chainId)) {
    notFound();
  }

  if (!isAddress(addressParam)) {
    notFound();
  }

  const vaultAddress = addressParam as Address;
  const vault = getVaultFromRegistry(chainId, vaultAddress);

  if (vault && vault.app !== getAppConfig().id) {
    notFound();
  }

  return (
    <VaultDetailLayout
      chainId={chainId as ChainId}
      vaultAddress={vaultAddress}
      vaultName={vault?.name}
      protocol={vault?.protocol}
    >
      {children}
    </VaultDetailLayout>
  );
}
