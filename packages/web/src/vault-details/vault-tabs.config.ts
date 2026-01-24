import z from 'zod';

interface TabConfig {
  label: string;
  description: string;
  id: string;
}

export const TABS = [
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

export function isValidTab(tab: string): tab is TabId {
  return tabSchema.safeParse(tab).success;
}
