'use client';

import { SidebarLayout } from '@/components/sidebar';
import { AppProviders } from '@/app/app-providers';
import { usePathname } from 'next/navigation';

export default function YoTreasuryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname() ?? '/yo-treasury';
  return (
    <AppProviders>
      <SidebarLayout pathname={pathname}>{children}</SidebarLayout>
    </AppProviders>
  );
}
