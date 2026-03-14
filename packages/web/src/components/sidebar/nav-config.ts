import { Home, Vault, Activity, Users, Landmark, Plus, type LucideIcon } from 'lucide-react';

export interface NavItem {
  title: string;
  url: string;
  icon: LucideIcon;
}

export const navItems: NavItem[] = [
  {
    title: 'Dashboard',
    url: '/',
    icon: Home,
  },
  {
    title: 'Vaults List',
    url: '/vaults',
    icon: Vault,
  },
  {
    title: 'Depositors',
    url: '/depositors',
    icon: Users,
  },
  {
    title: 'Activity',
    url: '/activity',
    icon: Activity,
  },
  {
    title: 'YO Treasury',
    url: '/vaults/8453/0x09d1C2E03F73853916Ee86b4e1A729F9FbAA960D',
    icon: Landmark,
  },
  {
    title: 'Create YO Treasury',
    url: '/yo-treasury/create',
    icon: Plus,
  },
];

export function getActiveNavItem(pathname: string): string | undefined {
  // Exact match first
  const exact = navItems.find((item) => item.url === pathname);
  if (exact) return exact.url;

  // Prefix match for nested routes (e.g., /vaults/123 matches /vaults)
  const prefix = navItems.find(
    (item) => item.url !== '/' && pathname.startsWith(item.url),
  );
  return prefix?.url;
}
