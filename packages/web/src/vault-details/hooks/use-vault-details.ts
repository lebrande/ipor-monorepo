import { useState, useEffect, useCallback } from 'react';
import type { TimeRange } from '@/vault-details/vault-details.types';
import {
  getTabFromUrl,
  loadTimeRangeFromLocalStorage,
  saveTimeRangeToLocalStorage,
  DEFAULT_TIME_RANGE,
} from '@/vault-details/vault-details.utils';
import { useVaultContext } from '@/vault/vault.context';
import type { TabId } from '@/vault-details/components/vault-tabs';

const protocol = 'Unknown Protocol';
const tvl = 0;

export const useVaultDetails = (tabParam: TabId) => {
  const { chainId, vaultAddress } = useVaultContext();

  // Initialize state
  const [activeTab, setActiveTab] = useState<TabId>(getTabFromUrl(tabParam));
  const [selectedTimeRange, setSelectedTimeRange] =
    useState<TimeRange>(DEFAULT_TIME_RANGE);
  const [isInitialized, setIsInitialized] = useState(false);

  // Load time range from localStorage on first load
  useEffect(() => {
    if (typeof window !== 'undefined' && !isInitialized) {
      const savedTimeRange = loadTimeRangeFromLocalStorage();
      setSelectedTimeRange(savedTimeRange);
      setIsInitialized(true);
    }
  }, [isInitialized]);

  // Save time range to localStorage
  useEffect(() => {
    if (isInitialized) {
      saveTimeRangeToLocalStorage(selectedTimeRange);
    }
  }, [selectedTimeRange, isInitialized]);

  // Update URL when tab changes
  useEffect(() => {
    if (isInitialized) {
      const newUrl =
        activeTab === 'overview'
          ? `/vaults/${chainId}/${vaultAddress}`
          : `/vaults/${chainId}/${vaultAddress}/${activeTab}`;

      // Update URL without triggering a page reload
      window.history.replaceState({}, '', newUrl);
    }
  }, [activeTab, isInitialized]);

  // Actions
  const setActiveTabAction = useCallback((tab: TabId) => {
    setActiveTab(tab);
  }, []);

  const setSelectedTimeRangeAction = useCallback((range: TimeRange) => {
    setSelectedTimeRange(range);
  }, []);

  return {
    protocol,
    tvl,

    // UI state
    activeTab,
    selectedTimeRange,

    // Actions
    setActiveTab: setActiveTabAction,
    setSelectedTimeRange: setSelectedTimeRangeAction,
  };
};
