import z from 'zod';

interface TabConfig {
  label: string;
  description: string;
  id: string;
  requiredTag?: string;
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
    id: 'alpha',
    label: 'Alpha',
    description: 'Chat with AI about this vault',
    requiredTag: 'ipor-fusion',
  },
] as const satisfies TabConfig[];

export type TabId = (typeof TABS)[number]['id'];

export function getVisibleTabs(tags: string[]) {
  return TABS.filter((tab) => {
    if (!('requiredTag' in tab)) return true;
    return tags.includes(tab.requiredTag);
  });
}

export const getTabConfig = (id: TabId) => {
  return TABS.find((tab) => tab.id === id);
};

export const tabSchema = z.enum(TABS.map((tab) => tab.id));

export function isValidTab(tab: string): tab is TabId {
  return tabSchema.safeParse(tab).success;
}
