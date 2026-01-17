import { Card, CardContent } from '@/components/ui/card';
import { SortControls } from '@/vault-directory/components/sort-controls';
import { useVaultDirectoryContext } from '@/vault-directory/vault-directory.context';

export const VaultToolbar = () => {
  const { sortBy, sortActions, totalVaults, loading } =
    useVaultDirectoryContext();

  return (
    <Card>
      <CardContent className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        {/* Vault Summary */}
        <div className="flex items-center">
          <h3 className="text-lg font-medium">
            {loading ? (
              <span className="flex items-center">
                <div className="w-4 h-4 mr-2 bg-muted rounded animate-pulse"></div>
                Loading vaults...
              </span>
            ) : (
              <>
                {totalVaults.toLocaleString()}{' '}
                {totalVaults === 1 ? 'vault' : 'vaults'} found
              </>
            )}
          </h3>
        </div>

        {/* Sort Controls */}
        <div className="flex items-center gap-4">
          <span className="text-sm text-muted-foreground">Sort by:</span>
          <SortControls
            value={sortBy}
            onChange={sortActions.updateSort}
            disabled={loading}
          />
        </div>
      </CardContent>
    </Card>
  );
};
