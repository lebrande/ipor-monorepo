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
