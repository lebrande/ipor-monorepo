import { Home, Vault, Activity, type LucideIcon } from 'lucide-react';

export interface NavItem {
  title: string;
  url: string;
  icon: LucideIcon;
}

export const navItems: NavItem[] = [
  {
    title: 'Home',
    url: '/',
    icon: Home,
  },
  {
    title: 'Vault Directory',
    url: '/vaults',
    icon: Vault,
  },
  {
    title: 'Activity',
    url: '/activity',
    icon: Activity,
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
