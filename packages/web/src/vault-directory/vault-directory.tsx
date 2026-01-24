'use client';

import { VaultDirectoryProvider } from './vault-directory.context';
import { AppProviders } from '@/app/app-providers';
import { useVaultDirectoryContext } from '@/vault-directory/vault-directory.context';
import { VaultFilters as VaultFiltersComponent } from '@/vault-directory/components/vault-filters';
import { VaultToolbar } from '@/vault-directory/components/vault-toolbar';
import { VaultGrid } from '@/vault-directory/components/vault-grid';
import { VaultDirectoryPagination } from '@/vault-directory/components/vault-directory-pagination';
import { ErrorBoundary } from '@/errors/components/error-boundary';

export const VaultDirectory = () => {
  return (
    <AppProviders>
      <VaultDirectoryProvider>
        <VaultDirectoryContent />
      </VaultDirectoryProvider>
    </AppProviders>
  );
};

const VaultDirectoryContent = () => {
  const { error, totalPages, refetch } = useVaultDirectoryContext();

  if (error) {
    return <ErrorBoundary error={error} onRetry={refetch} />;
  }

  return (
    <div className="space-y-6">
      {/* Filters Section */}
      <VaultFiltersComponent />

      {/* Toolbar Section */}
      <VaultToolbar />

      {/* Grid Section */}
      <VaultGrid />

      {/* Pagination Section */}
      {totalPages > 1 && <VaultDirectoryPagination />}
    </div>
  );
};
