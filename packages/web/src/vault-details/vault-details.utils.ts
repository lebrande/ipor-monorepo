import type { TimeRange } from '@/vault-details/vault-details.types';
import type { VaultParams } from '@/app/app.types';
import { isAddress, type Address } from 'viem';
import type { TabId } from '@/vault-details/components/vault-tabs';

// Default values
export const DEFAULT_TIME_RANGE: TimeRange = '7d';
export const DEFAULT_TAB: TabId = 'overview';

// Valid tabs
export const VALID_TABS: TabId[] = [
  'overview',
  'depositors',
  'activity',
  'performance',
];

// Valid time ranges
export const VALID_TIME_RANGES: TimeRange[] = ['7d', '30d', '90d', '1y'];

// Time range labels
export const TIME_RANGE_LABELS: Record<TimeRange, string> = {
  '7d': '7 Days',
  '30d': '30 Days',
  '90d': '90 Days',
  '1y': '1 Year',
};

// VaultParams validation
export const isValidVaultParams = (params: unknown): params is VaultParams => {
  if (!params || typeof params !== 'object') return false;
  const vaultParams = params as VaultParams;
  return (
    typeof vaultParams.chainId === 'number' &&
    typeof vaultParams.vaultAddress === 'string' &&
    isAddress(vaultParams.vaultAddress)
  );
};

// Tab validation
export const isValidTab = (tab: string): tab is TabId => {
  return VALID_TABS.includes(tab as TabId);
};

// Time range validation
export const isValidTimeRange = (range: string): range is TimeRange => {
  return VALID_TIME_RANGES.includes(range as TimeRange);
};

// URL parameter handling
export const getTabFromUrl = (tab?: string): TabId => {
  if (!tab) return DEFAULT_TAB;
  return isValidTab(tab) ? tab : DEFAULT_TAB;
};

// Time range persistence
const TIME_RANGE_STORAGE_KEY = 'vaultDetailsTimeRange';

export const saveTimeRangeToLocalStorage = (timeRange: TimeRange) => {
  try {
    localStorage.setItem(TIME_RANGE_STORAGE_KEY, timeRange);
  } catch (error) {
    console.warn('Failed to save time range to localStorage:', error);
  }
};

export const loadTimeRangeFromLocalStorage = (): TimeRange => {
  try {
    const stored = localStorage.getItem(TIME_RANGE_STORAGE_KEY);
    if (stored && isValidTimeRange(stored)) {
      return stored;
    }
  } catch (error) {
    console.warn('Failed to load time range from localStorage:', error);
  }
  return DEFAULT_TIME_RANGE;
};

// External link generation
export const generateExplorerUrl = (vaultParams: VaultParams): string => {
  // Default to Ethereum mainnet
  const baseUrls: Record<number, string> = {
    1: 'https://etherscan.io/address/',
    137: 'https://polygonscan.com/address/',
    42161: 'https://arbiscan.io/address/',
    10: 'https://optimistic.etherscan.io/address/',
  };

  const baseUrl = baseUrls[vaultParams.chainId] || baseUrls[1];
  return `${baseUrl}${vaultParams.vaultAddress}`;
};

export const generateDebankUrl = (address: Address): string => {
  return `https://debank.com/profile/${address}`;
};

// Format vault age
export const formatVaultAge = (ageInDays: number): string => {
  if (ageInDays < 1) {
    return '< 1 day';
  } else if (ageInDays < 30) {
    return `${Math.floor(ageInDays)} days`;
  } else if (ageInDays < 365) {
    const months = Math.floor(ageInDays / 30);
    return `${months} month${months > 1 ? 's' : ''}`;
  } else {
    const years = Math.floor(ageInDays / 365);
    const remainingMonths = Math.floor((ageInDays % 365) / 30);

    if (remainingMonths === 0) {
      return `${years} year${years > 1 ? 's' : ''}`;
    } else {
      return `${years}y ${remainingMonths}m`;
    }
  }
};

// Format depositor count
export const formatDepositorCount = (
  count: number,
  allTimeCount: number,
): string => {
  if (count === allTimeCount) {
    return `${count.toLocaleString()}`;
  }
  return `${count.toLocaleString()} / ${allTimeCount.toLocaleString()}`;
};

// Chart data helpers
export const formatChartDate = (date: Date, timeRange: TimeRange): string => {
  const options: Intl.DateTimeFormatOptions =
    timeRange === '7d'
      ? { month: 'short', day: 'numeric', hour: 'numeric' }
      : timeRange === '30d'
        ? { month: 'short', day: 'numeric' }
        : timeRange === '90d'
          ? { month: 'short', day: 'numeric' }
          : { month: 'short', year: 'numeric' };

  return date.toLocaleDateString('en-US', options);
};
