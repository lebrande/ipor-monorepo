import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarRail,
} from '@/components/ui/sidebar';
import { NavMain } from './nav-main';
import { navItems, getActiveNavItem } from './nav-config';

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  pathname: string;
}

export function AppSidebar({ pathname, ...props }: AppSidebarProps) {
  const activeUrl = getActiveNavItem(pathname);

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <div className="flex items-center gap-2 px-2 py-2">
          <img
            src="/favicon.png"
            alt="DeFi Panda"
            className="h-8 w-8 rounded-lg"
          />
          <span className="font-semibold text-sidebar-foreground group-data-[collapsible=icon]:hidden">
            DeFi Panda
          </span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navItems} activeUrl={activeUrl} />
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
}
