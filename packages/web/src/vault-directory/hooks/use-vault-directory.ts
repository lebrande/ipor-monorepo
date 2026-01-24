import { useState, useEffect, useCallback } from 'react';
import type {
  VaultFilters,
  SortOption,
  FilterActions,
  TVLRange,
  DepositorRange,
  NetFlowOption,
} from '@/vault-directory/vault-directory.types';
import type { VaultParams } from '@/app/app.types';
import {
  DEFAULT_FILTERS,
  updateURLParams,
  parseURLParams,
  saveFiltersToLocalStorage,
  loadFiltersFromLocalStorage,
  isFiltersActive,
  convertFiltersToAPIParams,
} from '@/vault-directory/vault-directory.utils';
import { useVaultsQuery } from '@/vault-directory/queries/use-vaults-query';
import { useAssetsQuery } from '@/vault-directory/queries/use-assets-query';
import { useVaultsMetadataQuery } from '@/vault-directory/queries/use-vaults-metadata-query';

export const useVaultDirectory = () => {
  // Initialize state from URL parameters or localStorage
  const [isInitialized, setIsInitialized] = useState(false);
  const [filters, setFilters] = useState<VaultFilters>(DEFAULT_FILTERS);
  const [sortBy, setSortBy] = useState<SortOption>('tvl');
  const [currentPage, setCurrentPage] = useState(1);

  // Initialize from URL parameters and localStorage on first load
  useEffect(() => {
    if (typeof window !== 'undefined' && !isInitialized) {
      const urlParams = parseURLParams();
      const savedFilters = loadFiltersFromLocalStorage();

      // Check if URL has any active filters
      const hasUrlFilters =
        urlParams.filters.tvlRange ||
        urlParams.filters.depositorRange ||
        urlParams.filters.netFlow !== 'all' ||
        urlParams.filters.underlyingAssets.length > 0 ||
        urlParams.filters.chains.length > 0 ||
        urlParams.filters.protocols.length > 0;

      // URL parameters take precedence over localStorage
      // Merge with DEFAULT_FILTERS to ensure all fields exist (handles old localStorage data)
      const initialFilters = hasUrlFilters
        ? { ...DEFAULT_FILTERS, ...urlParams.filters }
        : savedFilters
          ? { ...DEFAULT_FILTERS, ...savedFilters }
          : DEFAULT_FILTERS;

      setFilters(initialFilters);
      setSortBy(urlParams.sortBy);
      setCurrentPage(urlParams.currentPage);
      setIsInitialized(true);
    }
  }, [isInitialized]);

  const { data, isLoading, error, refetch } = useVaultsQuery({
    params: convertFiltersToAPIParams(filters, sortBy, currentPage),
    enabled: isInitialized,
  });

  const { data: availableAssets } = useAssetsQuery();

  const { data: metadata, isLoading: isMetadataLoading } = useVaultsMetadataQuery();

  // Debounced URL parameter updates
  useEffect(() => {
    if (!isInitialized) return;

    const timeoutId = setTimeout(() => {
      updateURLParams({ filters, sortBy, currentPage });
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [filters, sortBy, currentPage, isInitialized]);

  // Save filters to localStorage
  useEffect(() => {
    if (isInitialized) {
      saveFiltersToLocalStorage(filters);
    }
  }, [filters, isInitialized]);

  // Reset to page 1 when filters or sort change
  useEffect(() => {
    if (isInitialized && currentPage > 1) {
      setCurrentPage(1);
    }
  }, [filters, sortBy, isInitialized, currentPage]);

  // Filter actions
  const filterActions: FilterActions = {
    updateTVLRange: useCallback((range: TVLRange | null) => {
      setFilters((prev) => ({ ...prev, tvlRange: range }));
    }, []),

    updateDepositorRange: useCallback((range: DepositorRange | null) => {
      setFilters((prev) => ({ ...prev, depositorRange: range }));
    }, []),

    updateNetFlow: useCallback((option: NetFlowOption) => {
      setFilters((prev) => ({ ...prev, netFlow: option }));
    }, []),

    updateUnderlyingAssets: useCallback((assets: string[]) => {
      setFilters((prev) => ({ ...prev, underlyingAssets: assets }));
    }, []),

    updateChains: useCallback((chains: number[]) => {
      setFilters((prev) => ({ ...prev, chains }));
    }, []),

    updateProtocols: useCallback((protocols: string[]) => {
      setFilters((prev) => ({ ...prev, protocols }));
    }, []),

    clearFilters: useCallback(() => {
      setFilters(DEFAULT_FILTERS);
    }, []),
  };

  // Sort actions
  const sortActions = {
    updateSort: useCallback((option: SortOption) => {
      setSortBy(option);
    }, []),
  };

  // Pagination actions
  const paginationActions = {
    goToPage: useCallback((page: number) => {
      setCurrentPage(page);
    }, []),
  };

  // Navigation action
  const navigateToVault = useCallback((vaultParams: VaultParams) => {
    // Navigate to vault detail page
    window.location.href = `/vaults/${vaultParams.chainId}/${vaultParams.vaultAddress}`;
  }, []);

  return {
    // Data
    vaults: data?.vaults || [],
    loading: isLoading,
    error: error?.message || null,
    totalPages: data?.pagination.totalPages || 0,
    totalVaults: data?.pagination.totalCount || 0,
    availableAssets,
    metadata,
    isMetadataLoading,

    // State
    filters,
    sortBy,
    currentPage,

    // Computed state
    isFiltersActive: isFiltersActive(filters),

    // Actions
    filterActions,
    sortActions,
    paginationActions,
    navigateToVault,

    // Utilities
    refetch,
  };
};
