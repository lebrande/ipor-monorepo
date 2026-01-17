# Vault Directory View Implementation Plan

## 1. Overview

The Vault Directory view serves as the central hub for ERC4626 vault discovery and evaluation in the
DeFi Panda platform. This view displays a comprehensive list of vaults with advanced filtering,
sorting, and pagination capabilities. Users can filter vaults by TVL range, depositor count, net
flow, and underlying assets, while maintaining state persistence across sessions through
localStorage and URL parameters.

## 2. View Routing

**Path**: `/vaults` **Query Parameters**:

- `page` - Current page number
- `sort` - Sort option (tvl, depositors, age)
- `tvl_min` - Minimum TVL filter
- `tvl_max` - Maximum TVL filter
- `depositors` - Depositor count range
- `net_flow` - Net flow filter (positive, negative, all)
- `assets` - Comma-separated underlying assets

## 3. Component Structure

```
VaultDirectory (Main Page Component)
├── VaultFilters (Filter Controls Container)
│   ├── TVLRangeFilter (TVL Range Slider + Inputs)
│   ├── DepositorCountFilter (Dropdown with Ranges)
│   ├── NetFlowFilter (Toggle Buttons)
│   ├── UnderlyingAssetFilter (Multi-select with Search)
│   └── ClearFiltersButton (Conditional Clear Button)
├── VaultToolbar (Sort + Summary)
│   ├── SortControls (Sort Dropdown)
│   └── VaultSummary (Total Count Display)
├── VaultGrid (Vault Display Container)
│   ├── VaultCard (Individual Vault Cards ×20)
│   └── VaultGridSkeleton (Loading State)
└── Pagination (Page Navigation)
```

## 4. Component Details

### VaultDirectory

- **Component description**: Main container component that orchestrates the entire vault directory
  functionality, managing state, API calls, and coordinating child components
- **Main elements**: `<main>` wrapper with header, filters section, toolbar, grid, and pagination
- **Supported interactions**: Initial data loading, URL parameter parsing, state initialization
- **Supported validation**: URL parameter validation, filter range validation, page number
  validation
- **Types**: `VaultDirectoryProps`, `VaultFilters`, `SortOptions`, `PaginationState`
- **Props**: No props (page-level component)

### VaultFilters

- **Component description**: Container for all filter controls, managing filter state and
  coordinating updates across different filter types
- **Main elements**: `<div>` with responsive grid layout containing all filter components
- **Supported interactions**: Filter value changes, clear filters action, filter state updates
- **Supported validation**: TVL range validation (min ≤ max), depositor count validation, asset
  selection validation
- **Types**: `VaultFiltersProps`, `FilterState`, `FilterActions`
- **Props**: `filters: VaultFilters`, `onFiltersChange: (filters: VaultFilters) => void`,
  `availableAssets: string[]`

### TVLRangeFilter

- **Component description**: Dual-range slider with input fields for setting minimum and maximum TVL
  values
- **Main elements**: Range slider component, two number inputs, labels, and validation messages
- **Supported interactions**: Slider drag, input field changes, validation on blur
- **Supported validation**: Min value ≤ Max value, positive numbers only, maximum limit validation
- **Types**: `TVLRangeFilterProps`, `TVLRange`
- **Props**: `value: TVLRange`, `onChange: (range: TVLRange) => void`, `min: number`, `max: number`

### DepositorCountFilter

- **Component description**: Dropdown select with predefined depositor count ranges
- **Main elements**: Select dropdown with predefined options (1-10, 11-50, 51-100, 100-500, 500+)
- **Supported interactions**: Dropdown selection, clear selection
- **Supported validation**: Valid range selection validation
- **Types**: `DepositorCountFilterProps`, `DepositorRange`
- **Props**: `value: DepositorRange | null`, `onChange: (range: DepositorRange | null) => void`

### NetFlowFilter

- **Component description**: Toggle button group for selecting net flow direction (Positive,
  Negative, All)
- **Main elements**: Button group with three toggle buttons, visual active state indicators
- **Supported interactions**: Button clicks, single selection toggle
- **Supported validation**: Single selection validation
- **Types**: `NetFlowFilterProps`, `NetFlowOption`
- **Props**: `value: NetFlowOption`, `onChange: (option: NetFlowOption) => void`

### UnderlyingAssetFilter

- **Component description**: Multi-select dropdown with search functionality for underlying assets
- **Main elements**: Dropdown trigger, search input, checkbox list, selected items display
- **Supported interactions**: Search input, checkbox selection/deselection, clear selections
- **Supported validation**: Valid asset selection validation, search term validation
- **Types**: `UnderlyingAssetFilterProps`, `AssetOption`
- **Props**: `value: string[]`, `onChange: (assets: string[]) => void`, `options: string[]`

### VaultCard

- **Component description**: Individual vault display card showing key vault metrics and information
- **Main elements**: Card container with vault name, protocol, TVL, underlying asset, depositor
  count, net flow
- **Supported interactions**: Click to navigate to vault detail page
- **Supported validation**: Vault data validation, address format validation
- **Types**: `VaultCardProps`, `VaultData`
- **Props**: `vault: VaultData`, `onClick: (vaultAddress: string) => void`

### VaultGrid

- **Component description**: Grid container managing vault card layout and loading states
- **Main elements**: CSS Grid layout with responsive columns, loading skeleton components
- **Supported interactions**: None (display only)
- **Supported validation**: None
- **Types**: `VaultGridProps`, `VaultData[]`
- **Props**: `vaults: VaultData[]`, `loading: boolean`, `error: string | null`

### Pagination

- **Component description**: Navigation controls for page-based data browsing
- **Main elements**: Previous/Next buttons, page number buttons, page info display
- **Supported interactions**: Page navigation, direct page selection
- **Supported validation**: Page number validation, boundary checking
- **Types**: `PaginationProps`, `PaginationState`
- **Props**: `currentPage: number`, `totalPages: number`, `onPageChange: (page: number) => void`

### SortControls

- **Component description**: Dropdown for selecting vault sorting options
- **Main elements**: Select dropdown with sorting options (TVL, Depositors, Age)
- **Supported interactions**: Sort option selection
- **Supported validation**: Valid sort option validation
- **Types**: `SortControlsProps`, `SortOption`
- **Props**: `value: SortOption`, `onChange: (option: SortOption) => void`

## 5. Types

```typescript
// Core vault data structure
interface VaultData {
  address: Address; // Ethereum address from viem
  name: string;
  protocol: string;
  tvl: number; // Total Value Locked in USD
  underlyingAsset: string; // Symbol of underlying asset used in filtering
  underlyingAssetAddress: Address; // Ethereum address of ERC20 contract
  depositorCount: number;
  netFlow7d: number; // 7-day net flow in USD
  creationDate: Date; // Vault creation date
  sharePrice: number;
}

// Filter state management
interface VaultFilters {
  tvlRange: TVLRange | null;
  depositorRange: DepositorRange | null;
  netFlow: NetFlowOption;
  underlyingAssets: string[]; // Symbols of selected underlying assets
}

interface TVLRange {
  min: number;
  max: number;
}

interface DepositorRange {
  min: number;
  max: number;
  label: string;
}

type NetFlowOption = 'all' | 'positive' | 'negative';

type SortOption = 'tvl' | 'depositors' | 'age';

// API request/response types
interface VaultDirectoryRequest {
  page: number;
  limit: number;
  sort: SortOption;
  filters: VaultFilters;
}

interface VaultDirectoryResponse {
  vaults: VaultData[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
}

// Component prop types
interface VaultDirectoryState {
  vaults: VaultData[];
  loading: boolean;
  error: string | null;
  filters: VaultFilters;
  sortBy: SortOption;
  currentPage: number;
  totalPages: number;
  totalVaults: number;
}

interface FilterActions {
  updateTVLRange: (range: TVLRange | null) => void;
  updateDepositorRange: (range: DepositorRange | null) => void;
  updateNetFlow: (option: NetFlowOption) => void;
  updateUnderlyingAssets: (assets: string[]) => void;
  clearFilters: () => void;
}
```

## 6. State Management

The view uses a custom hook `useVaultDirectory` that manages all state and side effects:

```typescript
const useVaultDirectory = () => {
  // State management with URL synchronization
  const [filters, setFilters] = useState<VaultFilters>(defaultFilters);
  const [sortBy, setSortBy] = useState<SortOption>('tvl');
  const [currentPage, setCurrentPage] = useState(1);

  // Tanstack Query for data fetching
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['vaults', filters, sortBy, currentPage],
    queryFn: ({ queryKey }) => fetchVaults(...queryKey.slice(1)),
    keepPreviousData: true,
  });

  // URL parameter synchronization
  useEffect(() => {
    updateURLParams({ filters, sortBy, currentPage });
  }, [filters, sortBy, currentPage]);

  // localStorage persistence
  useEffect(() => {
    saveFiltersToLocalStorage(filters);
  }, [filters]);

  return {
    vaults: data?.vaults || [],
    loading: isLoading,
    error: error?.message || null,
    filters,
    sortBy,
    currentPage,
    totalPages: data?.totalPages || 0,
    totalVaults: data?.totalCount || 0,
    filterActions: {
      updateTVLRange: (range) => setFilters((prev) => ({ ...prev, tvlRange: range })),
      updateDepositorRange: (range) => setFilters((prev) => ({ ...prev, depositorRange: range })),
      updateNetFlow: (option) => setFilters((prev) => ({ ...prev, netFlow: option })),
      updateUnderlyingAssets: (assets) =>
        setFilters((prev) => ({ ...prev, underlyingAssets: assets })),
      clearFilters: () => setFilters(defaultFilters),
    },
    sortActions: {
      updateSort: setSortBy,
    },
    paginationActions: {
      goToPage: setCurrentPage,
    },
  };
};
```

## 7. API Integration - External service

**Endpoint**: `GET /api/vaults`

**Request Parameters**:

```typescript
interface VaultAPIParams {
  page: number;
  limit: number; // Fixed at 20
  sort: 'tvl' | 'depositors' | 'age';
  tvl_min?: number;
  tvl_max?: number;
  depositors_min?: number;
  depositors_max?: number;
  net_flow?: 'positive' | 'negative';
  underlying_assets?: string; // Comma-separated
}
```

**Response Structure**:

```typescript
interface VaultAPIResponse {
  success: boolean;
  data: {
    vaults: VaultData[];
    pagination: {
      currentPage: number;
      totalPages: number;
      totalCount: number;
      hasNext: boolean;
      hasPrevious: boolean;
    };
  };
  error?: string;
}
```

**Integration with Tanstack Query**:

```typescript
const fetchVaults = async (params: VaultAPIParams): Promise<VaultDirectoryResponse> => {
  const response = await axiosClient.get('/api/vaults', { params });
  return {
    vaults: response.data.data.vaults,
    totalCount: response.data.data.pagination.totalCount,
    totalPages: response.data.data.pagination.totalPages,
    currentPage: response.data.data.pagination.currentPage,
  };
};
```

## 8. User Interactions

### Filter Interactions

- **TVL Range Adjustment**: Drag slider handles or input values → Debounced API call → Update vault
  list
- **Depositor Range Selection**: Select from dropdown → Immediate API call → Update vault list
- **Net Flow Toggle**: Click toggle button → Immediate API call → Update vault list
- **Asset Selection**: Check/uncheck assets → Debounced API call → Update vault list
- **Clear Filters**: Click clear button → Reset all filters → API call → Update vault list

### Navigation Interactions

- **Vault Card Click**: Click card → Navigate to `/vaults/{address}` → Preserve filter state in only
  in localStorage
- **Pagination**: Click page number/arrow → Update page state → API call → Update vault list
- **Sort Change**: Select sort option → Update sort state → API call → Update vault list

### State Persistence

- **URL Updates**: All filter/sort/page changes update URL parameters for shareability
- **localStorage**: Filter preferences saved locally and restored on page load
- **Browser Back/Forward**: URL parameters drive state restoration

## 9. Conditions and Validation

### Filter Validation

- **TVL Range**: `min ≤ max`, both values ≥ 0, max value ≤ system maximum
- **Depositor Range**: Valid predefined range selection
- **Net Flow**: Valid option selection (all, positive, negative)
- **Underlying Assets**: Valid asset selection from available options

### UI State Conditions

- **Clear Filters Button**: Visible only when filters are active (any non-default value)
- **Pagination**: Disabled when loading, previous disabled on page 1, next disabled on last page
- **Sort Controls**: Disabled when loading
- **Vault Cards**: Clickable only when not loading

### Error Conditions

- **API Errors**: Display error message with retry option
- **Validation Errors**: Show field-specific validation messages
- **Network Errors**: Show network error with retry option
- **Empty Results**: Show "No vaults found" message with filter adjustment suggestions

## 10. Error Handling

### API Error Handling

```typescript
const ErrorBoundary = ({ error, retry }: { error: string; retry: () => void }) => (
  <div className="text-center py-8">
    <p className="text-red-600 mb-4">Sorry, we couldn't load the vault data.</p>
    <button onClick={retry} className="btn-primary">Try Again</button>
  </div>
);
```

### Validation Error Handling

- **Field-level validation**: Show validation messages below invalid fields
- **Form-level validation**: Prevent submission with invalid data
- **URL parameter validation**: Sanitize and validate URL parameters, use defaults for invalid
  values

### Network Error Handling

- **Timeout errors**: Show timeout message with retry option
- **Connection errors**: Show connection error with retry option
- **Server errors**: Show generic server error message

### Loading State Handling

- **Skeleton components**: Show loading skeletons during data fetch
- **Disabled states**: Disable interactive elements during loading
- **Progressive loading**: Show partial data while additional data loads

## 11. Implementation Steps

1. **Setup Base Components**
   - Create `VaultDirectory` page component in `/src/pages/vaults.astro`
   - Create component directory structure in `/src/components/vaults/`
   - Define TypeScript interfaces in `/src/types/vault-directory.ts`

2. **Implement State Management**
   - Create `useVaultDirectory` custom hook
   - Implement URL parameter synchronization utilities
   - Add localStorage persistence utilities
   - Set up Tanstack Query configuration

3. **Build Filter Components**
   - Implement `TVLRangeFilter` with dual-range slider
   - Create `DepositorCountFilter` dropdown
   - Build `NetFlowFilter` toggle buttons
   - Develop `UnderlyingAssetFilter` multi-select with search

4. **Create Display Components**
   - Build `VaultCard` component with vault data display
   - Implement `VaultGrid` with responsive layout
   - Create skeleton loading components
   - Add error boundary components

5. **Implement Navigation**
   - Create `Pagination` component with page controls
   - Build `SortControls` dropdown
   - Add `VaultSummary` total count display

6. **Integrate API**
   - Set up API client with Axios
   - Configure Tanstack Query integration
   - Implement error handling and retry logic
   - Add request/response type validation with Zod

7. **Add Styling and Responsive Design**
   - Implement Tailwind CSS responsive design
   - Add shadcn/ui component styling
   - Create mobile-responsive filter layouts
   - Add loading and error state styles

8. **Testing and Validation**
   - Test all filter combinations
   - Verify URL parameter persistence
   - Test pagination across different data sets
   - Validate responsive behavior
   - Test error handling scenarios

9. **Performance Optimization**
   - Implement debounced filter updates
   - Add query caching optimization
   - Optimize component re-renders
   - Add lazy loading for large datasets

10. **Final Integration**
    - Integrate with main application routing
    - Add breadcrumb navigation
    - Connect to vault detail page navigation
    - Perform end-to-end testing
