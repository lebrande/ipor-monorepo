import { cn } from '@/lib/utils';
import { useVaultContext } from '@/vault/vault.context';
import z from 'zod';

interface TabConfig {
  label: string;
  description: string;
  id: string;
}

const TABS = [
  {
    id: 'overview',
    label: 'Overview',
    description: 'Key metrics and flow analysis',
  },
  {
    id: 'depositors',
    label: 'Depositors',
    description: 'Depositor information and statistics',
  },
  {
    id: 'activity',
    label: 'Activity',
    description: 'Recent transactions and activity',
  },
  {
    id: 'performance',
    label: 'Performance',
    description: 'Performance metrics and analytics',
  },
] as const satisfies TabConfig[];

export type TabId = (typeof TABS)[number]['id'];

export const getTabConfig = (id: TabId) => {
  return TABS.find((tab) => tab.id === id);
};

export const tabSchema = z.enum(TABS.map((tab) => tab.id));

interface Props {
  activeTab: TabId;
}

export const VaultTabs = ({ activeTab }: Props) => {
  const { vaultAddress, chainId } = useVaultContext();
  const activeTabConfig = getTabConfig(activeTab);

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-4">
      {/* Tab buttons */}
      <div className="flex items-center gap-1 bg-muted p-1 rounded-lg">
        {TABS.map(({ id, label }) => {
          const isActive = activeTab === id;

          return (
            <a
              key={id}
              className={cn(
                'px-4 py-2 text-sm font-medium rounded-md transition-all duration-200',
                'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
                'hover:bg-background hover:text-foreground',
                isActive
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground',
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
