import { ChevronRight, Home } from 'lucide-react';
import { useVaultDetailsContext } from '@/vault-details/vault-details.context';
import { useVaultContext } from '@/vault/vault.context';
import { VaultTabs } from '@/vault-details/components/vault-tabs';
import { formatCurrency } from '@/lib/utils';
import { truncateHex } from '@/lib/truncate-hex';

export const VaultHeader = () => {
  const { activeTab, protocol, tvl } = useVaultDetailsContext();

  const { name, asset, chainId, vaultAddress } = useVaultContext();

  return (
    <div className="border-b border-border pb-6">
      {/* Breadcrumbs */}
      <div className="flex items-center text-sm text-muted-foreground mb-4">
        <button
          onClick={() => (window.location.href = '/')}
          className="flex items-center hover:text-foreground transition-colors"
        >
          <Home className="w-4 h-4 mr-1" />
          Home
        </button>
        <ChevronRight className="w-4 h-4 mx-2" />
        <button
          onClick={() => (window.location.href = '/vaults')}
          className="hover:text-foreground transition-colors"
        >
          Vaults
        </button>
        <ChevronRight className="w-4 h-4 mx-2" />
        <span className="text-foreground">
          {name || (vaultAddress ? truncateHex(vaultAddress, 4) : '')}
        </span>
      </div>

      {/* Vault Information */}
      <div className="mb-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">{name}</h1>
          <div className="flex items-center gap-4 text-muted-foreground mb-2">
            <span className="text-sm">
              Protocol:{' '}
              <span className="text-foreground font-medium">{protocol}</span>
            </span>
            <span className="text-sm">
              Asset:{' '}
              <span className="text-foreground font-medium">{asset}</span>
            </span>
            <span className="text-sm">
              TVL:{' '}
              <span className="text-foreground font-medium">
                {formatCurrency(tvl)}
              </span>
            </span>
          </div>
          <div className="text-sm text-muted-foreground">
            <span className="font-mono text-xs bg-muted px-2 py-1 rounded">
              {vaultAddress}
            </span>
            <span className="ml-2 text-xs bg-muted px-2 py-1 rounded">
              Chain ID: {chainId}
            </span>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <VaultTabs activeTab={activeTab} />
    </div>
  );
};
