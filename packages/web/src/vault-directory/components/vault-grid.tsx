import React from 'react';
import { VaultCard } from './vault-card';
import { VaultGridSkeleton } from './vault-grid-skeleton';
import { useVaultDirectoryContext } from '@/vault-directory/vault-directory.context';
import { AlertCircle, Package } from 'lucide-react';

export const VaultGrid = () => {
  const { vaults, loading, error, navigateToVault } =
    useVaultDirectoryContext();

  // Show loading skeleton
  if (loading) {
    return <VaultGridSkeleton />;
  }

  // Show error state
  if (error) {
    return (
      <div className="text-center py-12">
        <div className="max-w-md mx-auto">
          <div className="mb-4">
            <AlertCircle className="mx-auto h-12 w-12 text-destructive" />
          </div>
          <h3 className="text-lg font-medium text-foreground mb-2">
            Unable to load vaults
          </h3>
          <p className="text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  // Show empty state
  if (vaults.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="max-w-md mx-auto">
          <div className="mb-4">
            <Package className="mx-auto h-12 w-12 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium text-foreground mb-2">
            No vaults found
          </h3>
          <p className="text-muted-foreground mb-4">
            Try adjusting your filters to see more results.
          </p>
        </div>
      </div>
    );
  }

  // Show vault grid
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {vaults.map((vault) => (
        <VaultCard
          key={vault.address}
          vault={vault}
          onVaultClick={navigateToVault}
        />
      ))}
    </div>
  );
};
