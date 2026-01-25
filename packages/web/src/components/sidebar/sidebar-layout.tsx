'use client';

import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { Separator } from '@/components/ui/separator';
import { AppSidebar } from './app-sidebar';
import { BottomNav } from './bottom-nav';

interface SidebarLayoutProps {
  children: React.ReactNode;
  pathname: string;
}

export function SidebarLayout({ children, pathname }: SidebarLayoutProps) {
  return (
    <SidebarProvider>
      <AppSidebar pathname={pathname} />
      <SidebarInset>
        <header className="flex h-14 shrink-0 items-center gap-2 border-b border-border px-4 md:h-16">
          <SidebarTrigger className="-ml-1 hidden md:flex" />
          <Separator
            orientation="vertical"
            className="mr-2 hidden h-4 md:block"
          />
          <span className="font-semibold md:hidden">Fusion</span>
        </header>
        <div className="flex-1 pb-16 md:pb-0">{children}</div>
      </SidebarInset>
      <BottomNav pathname={pathname} />
    </SidebarProvider>
  );
}
