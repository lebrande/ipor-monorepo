# Vault Detail Overview View Implementation Plan

## 1. Overview

The Vault Detail Overview view provides immediate vault assessment with key metrics and trends. It
serves as the default landing page when users navigate to `/vaults/[address]` and displays
comprehensive vault information including current TVL, depositor counts, vault age, inflow/outflow
trends, and external platform links. This view is part of a tabbed interface that allows users to
switch between Overview, Depositors, Activity, and Performance tabs.

## 2. View Routing

**Primary Path:** `/vaults/[address]` **Default Tab Path:** `/vaults/[address]` (defaults to
Overview tab) **Explicit Tab Path:** `/vaults/[address]/overview`

The view should handle dynamic routing with address validation and provide proper error handling for
invalid addresses.

## 3. Component Structure

```
VaultDetail (Main Container)
├── VaultHeader
│   ├── Breadcrumbs
│   └── VaultTabs
├── GlobalTimeSelector
└── VaultOverview
    ├── VaultMetrics
    │   ├── TVLDisplay
    │   ├── DepositorCount
    │   └── VaultAge
    ├── InflowOutflowChart
    └── ExternalLinks
```

## 4. Component Details

### VaultDetail

- **Component description:** Root container component that manages the entire vault detail page
  state and routing
- **Main elements:** Header section, time selector, tab content container, error boundary wrapper
- **Supported interactions:** Tab navigation, address validation, route handling
- **Supported validation:** Ethereum address validation, tab existence validation
- **Types:** VaultAddress, ActiveTab, VaultData
- **Props:** address (from URL params)

### VaultHeader

- **Component description:** Header section containing vault name, breadcrumbs, and tab navigation
- **Main elements:** Breadcrumb navigation, vault title, tab navigation buttons
- **Supported interactions:** Breadcrumb navigation, tab switching
- **Supported validation:** None specific
- **Types:** VaultData, ActiveTab
- **Props:** vaultData, activeTab, onTabChange

### VaultTabs

- **Component description:** Tab navigation component for switching between vault sections
- **Main elements:** Tab buttons (Overview, Depositors, Activity, Performance), active tab indicator
- **Supported interactions:** Tab selection, keyboard navigation
- **Supported validation:** Valid tab selection
- **Types:** TabType, ActiveTab
- **Props:** activeTab, onTabChange, vaultAddress

### GlobalTimeSelector

- **Component description:** Time range selector that affects all time-based charts
- **Main elements:** Time range buttons (7d, 30d, 90d, 1y), active selection indicator
- **Supported interactions:** Time range selection
- **Supported validation:** Valid time range selection
- **Types:** TimeRange, SelectedTimeRange
- **Props:** selectedTimeRange, onTimeRangeChange

### VaultOverview

- **Component description:** Main content area for the overview tab displaying key metrics and
  charts
- **Main elements:** Metrics section, chart section, external links section
- **Supported interactions:** Chart interactions, external link clicks
- **Supported validation:** Data existence validation
- **Types:** VaultOverviewData, TimeRange
- **Props:** vaultAddress, timeRange

### VaultMetrics

- **Component description:** Displays key vault metrics in a prominent grid layout
- **Main elements:** TVL card, depositor count card, vault age card
- **Supported interactions:** None
- **Supported validation:** Data formatting validation
- **Types:** VaultMetricsData
- **Props:** tvl, depositorCount, allTimeDepositors, vaultAge

### InflowOutflowChart

- **Component description:** Interactive chart showing inflow and outflow trends over selected time
  period
- **Main elements:** Line chart, tooltip, legend, axis labels
- **Supported interactions:** Hover interactions, tooltip display
- **Supported validation:** Chart data existence and format validation
- **Types:** ChartData, TimeRange, ChartPoint
- **Props:** data, timeRange, isLoading

### ExternalLinks

- **Component description:** Links to external platforms (BlockExplorer, DeBank) with proper
  security attributes
- **Main elements:** Link buttons with external icons, new tab indicators
- **Supported interactions:** Link clicks (opens in new tab)
- **Supported validation:** URL validation
- **Types:** VaultAddress, ExternalURL
- **Props:** vaultAddress, explorerUrl, debankUrl

## 5. State Management

The view uses a feature-based context pattern with `VaultDetailContext` to manage state across all
components:

**VaultDetailContext** manages:

- Vault address and validation state
- Active tab state
- Selected time range
- Vault data and loading states
- Error states

**Custom Hooks:**

- `useVaultDetail()` - Main hook for vault data fetching and state management
- `useVaultOverview()` - Hook for overview-specific data and chart data
- `useTimeRange()` - Hook for managing time range selection across components

The context prevents prop drilling and centralizes state management. State persistence is handled
through URL parameters for tabs and localStorage for time range preferences.

## 6. User Interactions

**Tab Navigation:**

- User clicks on tab button
- Update URL to `/vaults/[address]/[tab]`
- Load appropriate tab content
- Update breadcrumb navigation

**Time Range Selection:**

- User clicks time range button
- Update selected time range state
- Trigger chart data refetch
- Update all time-based visualizations

**Chart Interactions:**

- User hovers over chart elements
- Display tooltip with specific data point information
- Ensure keyboard accessibility for tooltips

**External Link Clicks:**

- User clicks BlockExplorer or DeBank link
- Open external site in new tab
- Maintain security attributes (noopener, noreferrer)

**Breadcrumb Navigation:**

- User clicks breadcrumb element
- Navigate to selected level (home, vaults directory)
- Preserve filter state when returning to directory

## 7. Conditions and Validation

**Address Validation:**

- Validate Ethereum address format on route entry
- Show error page for invalid addresses
- Provide navigation back to vault directory

**Data Existence Validation:**

- Check if vault data exists before rendering
- Handle missing or null data gracefully
- Show appropriate loading states

**Tab Validation:**

- Validate tab parameter against allowed tabs
- Default to overview for invalid tabs
- Update URL to correct tab path

**Time Range Validation:**

- Validate time range selection against allowed options
- Default to 7d for invalid selections
- Ensure time range compatibility with chart data

**Chart Data Validation:**

- Validate chart data format and structure
- Handle empty datasets gracefully
- Provide fallback states for missing data

## 8. Error Handling

**Invalid Address Errors:**

- Display user-friendly error message
- Provide link to return to vault directory
- Log error for debugging purposes

**API Failure Errors:**

- Show loading state during retry attempts
- Display "Sorry, we couldn't load the data" message
- Provide manual retry button
- Maintain partial page functionality when possible

**Network Errors:**

- Handle connection timeouts gracefully
- Show network-specific error messages
- Implement progressive retry with backoff

**Chart Data Errors:**

- Display empty state for missing chart data
- Show placeholder or skeleton for loading charts
- Handle malformed data without breaking layout

**Route Errors:**

- Handle invalid tab parameters
- Redirect to valid routes when possible
- Maintain browser history integrity

## 9. Implementation Steps

1. **Set up feature directory structure**
   - Create `src/vault-details/` directory
   - Set up files and subdirectories

2. **Implement routing and page structure**
   - Create Astro page at `src/pages/vaults/[address]/[...tab].astro`
   - Set up dynamic routing with address validation
   - Implement tab parameter handling

3. **Create vault detail context**
   - Implement `VaultDetailContext` with state management
   - Create `useVaultDetail` hook
   - Set up API integration hooks

4. **Build core components**
   - Implement `VaultDetail` root component
   - Create `VaultHeader` with breadcrumbs and tabs
   - Build `GlobalTimeSelector` component

5. **Implement overview tab components**
   - Create `VaultOverview` container
   - Build `VaultMetrics` display components
   - Implement `InflowOutflowChart` with Recharts

6. **Add external links functionality**
   - Create `ExternalLinks` component
   - Implement secure external link handling
   - Add proper accessibility attributes

7. **Implement data fetching**
   - Set up TanStack Query hooks
   - Create API service functions
   - Implement error handling and retry logic

8. **Add loading and error states**
   - Create skeleton components
   - Implement error boundaries
   - Add loading state management

9. **Implement responsive design**
   - Apply responsive breakpoints
   - Test on different screen sizes
   - Ensure proper touch interactions

10. **Add accessibility features**
    - Implement keyboard navigation
    - Add proper ARIA labels
    - Ensure screen reader compatibility

11. **Testing and validation**
    - Test address validation
    - Verify tab navigation
    - Test chart interactions
    - Validate external link behavior

12. **Performance optimization**
    - Implement code splitting
    - Add memoization for expensive operations
    - Optimize chart rendering performance
