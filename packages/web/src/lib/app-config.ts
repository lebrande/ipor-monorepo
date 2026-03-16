import {
  Home,
  Vault,
  Landmark,
  Plus,
  Users,
  Activity,
  type LucideIcon,
} from 'lucide-react';
import type { AppId } from './vaults-registry';

export type ConfigId = AppId | 'all';

export interface NavItem {
  title: string;
  url: string;
  icon: LucideIcon;
}

export interface AppConfig {
  id: ConfigId;
  name: string;
  title: string;
  description: string;
  logo: string;
  /** CSS classes applied to <html> element */
  themeClass: string;
  navItems: NavItem[];
  features: {
    alphaTab: boolean;
    flowCharts: boolean;
    depositorsList: boolean;
    activityPage: boolean;
  };
}

const fusionConfig: AppConfig = {
  id: 'fusion',
  name: 'Fusion by IPOR',
  title: 'Fusion by IPOR',
  description: 'ERC4626 Vault Analytics Dashboard',
  logo: '/assets/logo-fusion-by-ipor.svg',
  themeClass: '',
  navItems: [
    { title: 'Dashboard', url: '/', icon: Home },
    { title: 'Vaults List', url: '/vaults', icon: Vault },
    { title: 'Depositors', url: '/depositors', icon: Users },
    { title: 'Activity', url: '/activity', icon: Activity },
  ],
  features: {
    alphaTab: true,
    flowCharts: true,
    depositorsList: true,
    activityPage: true,
  },
};

const yoConfig: AppConfig = {
  id: 'yo',
  name: 'YO Treasury',
  title: 'YO Treasury',
  description: 'YO Protocol Treasury Management',
  logo: '/assets/logo-icon.svg',
  themeClass: 'yo',
  navItems: [
    { title: 'Dashboard', url: '/', icon: Home },
    { title: 'Vaults List', url: '/vaults', icon: Vault },
    {
      title: 'YO Treasury',
      url: '/vaults/8453/0x09d1C2E03F73853916Ee86b4e1A729F9FbAA960D',
      icon: Landmark,
    },
    { title: 'Create YO Treasury', url: '/yo-treasury/create', icon: Plus },
  ],
  features: {
    alphaTab: false,
    flowCharts: false,
    depositorsList: false,
    activityPage: false,
  },
};

const allConfig: AppConfig = {
  id: 'all',
  name: 'Vaults Panda',
  title: 'Vaults Panda',
  description: 'ERC4626 Vault Analytics Dashboard',
  logo: '/assets/logo-fusion-by-ipor.svg',
  themeClass: '',
  navItems: [
    { title: 'Dashboard', url: '/', icon: Home },
    { title: 'Vaults List', url: '/vaults', icon: Vault },
    { title: 'Depositors', url: '/depositors', icon: Users },
    { title: 'Activity', url: '/activity', icon: Activity },
  ],
  features: {
    alphaTab: true,
    flowCharts: true,
    depositorsList: true,
    activityPage: true,
  },
};

const configs: Record<ConfigId, AppConfig> = {
  all: allConfig,
  fusion: fusionConfig,
  yo: yoConfig,
};

let cachedConfig: AppConfig | null = null;

export function getAppConfig(): AppConfig {
  if (cachedConfig) return cachedConfig;
  const id = (process.env.NEXT_PUBLIC_APP_CONFIG || 'all') as ConfigId;
  cachedConfig = configs[id] ?? allConfig;
  return cachedConfig;
}

const APP_THEME_CLASS: Record<AppId, string> = {
  fusion: 'fusion',
  yo: 'yo',
};

export function getThemeClassForVaultApp(app: AppId): string {
  return APP_THEME_CLASS[app] ?? '';
}
