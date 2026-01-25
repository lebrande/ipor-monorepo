import {
  fetchVaults,
  fetchVaultsMetadata,
  type VaultSearchParams,
} from '@/vault-directory/fetch-vaults';
import { VaultDirectoryServer } from './vault-directory-server';

export const metadata = {
  title: 'Vaults List - Fusion by IPOR',
};

interface PageProps {
  searchParams: Promise<VaultSearchParams>;
}

export default async function VaultsPage({ searchParams }: PageProps) {
  const params = await searchParams;

  const [vaultsData, vaultsMetadata] = await Promise.all([
    fetchVaults(params),
    fetchVaultsMetadata(),
  ]);

  return (
    <VaultDirectoryServer
      initialData={vaultsData}
      metadata={vaultsMetadata}
      searchParams={params}
    />
  );
}
