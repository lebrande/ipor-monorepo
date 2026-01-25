import type {
  VaultsResponse,
  VaultsMetadata,
  VaultSearchParams,
} from '@/vault-directory/fetch-vaults';
import { VaultDirectoryContent } from '@/vault-directory/vault-directory-content';

interface Props {
  initialData: VaultsResponse;
  metadata: VaultsMetadata;
  searchParams: VaultSearchParams;
}

export function VaultDirectoryServer({
  initialData,
  metadata,
  searchParams,
}: Props) {
  return (
    <div className="min-h-screen bg-muted">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Vault Directory
          </h1>
          <p className="text-muted-foreground">
            Discover and analyze ERC4626 vaults across the DeFi ecosystem
          </p>
        </div>
        <VaultDirectoryContent
          vaults={initialData.vaults}
          pagination={initialData.pagination}
          metadata={metadata}
          searchParams={searchParams}
        />
      </div>
    </div>
  );
}
