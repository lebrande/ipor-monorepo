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
        <div className="flex items-center px-2 py-3">
          <img
            src="/assets/logo-fusion-by-ipor.svg"
            alt="Fusion by IPOR"
            className="h-10 w-auto"
          />
        </div>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navItems} activeUrl={activeUrl} />
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
}
