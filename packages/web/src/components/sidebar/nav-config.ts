import { Home, Vault, Activity, Users, Landmark, type LucideIcon } from 'lucide-react';

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
    url: '/yo-treasury',
    icon: Landmark,
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
