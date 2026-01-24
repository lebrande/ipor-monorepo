'use client';

import { cn } from '@/lib/utils';
import { useVaultContext } from '@/vault/vault.context';
import {
  TABS,
  getTabConfig,
  type TabId,
} from '@/vault-details/vault-tabs.config';

// Re-export for backwards compatibility
export { getTabConfig, isValidTab, tabSchema, type TabId } from '@/vault-details/vault-tabs.config';

interface Props {
  activeTab: TabId;
}

export const VaultTabs = ({ activeTab }: Props) => {
  const { vaultAddress, chainId } = useVaultContext();
  const activeTabConfig = getTabConfig(activeTab);

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-4">
      {/* Tab buttons - styled to match shadcn TabsList pattern */}
      <div className="inline-flex h-9 items-center justify-center rounded-lg bg-muted p-1 text-muted-foreground">
        {TABS.map(({ id, label }) => {
          const isActive = activeTab === id;

          return (
            <a
              key={id}
              className={cn(
                'inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-sm font-medium ring-offset-background transition-all',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                'disabled:pointer-events-none disabled:opacity-50',
                isActive
                  ? 'bg-background text-foreground shadow'
                  : 'hover:bg-background/50 hover:text-foreground',
              )}
              href={`/vaults/${chainId}/${vaultAddress}/${id}`}
            >
              {label}
            </a>
          );
        })}
      </div>

      {/* Tab description */}
      {activeTabConfig && (
        <div className="text-sm text-muted-foreground">
          <span>{activeTabConfig.description}</span>
        </div>
      )}
    </div>
  );
};
