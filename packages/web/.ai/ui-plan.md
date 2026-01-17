# UI Architecture for DeFi Panda

## 1. UI Structure Overview

DeFi Panda employs a two-tier architecture centered around vault discovery and detailed analysis.
The primary interface consists of a comprehensive vault directory that serves as the entry point for
users to filter, sort, and discover ERC4626 vaults, followed by detailed vault analysis pages with
tabbed navigation for in-depth exploration.

The architecture follows a desktop-first responsive design with a 1200px breakpoint, utilizing Astro
5 with React 19 islands for interactivity. The design system is built on Tailwind 4 with shadcn/ui
components, featuring a consistent #00A76F accent color throughout the interface.

Key architectural principles include:

- **Progressive Disclosure**: Information is revealed through filtering and tabbed navigation
- **State Persistence**: All user preferences and navigation states are maintained across sessions
- **Graceful Degradation**: Robust error handling with consistent fallback experiences
- **Accessibility-First**: Full keyboard navigation and screen reader support

## 2. View List

### Vault Directory (`/vaults`)

- **Main Purpose**: Central hub for vault discovery, filtering, and initial evaluation
- **Key Information**: Vault cards displaying name, protocol, TVL, underlying asset, depositor
  count, and 7-day net flow
- **Key Components**:
  - Advanced filter controls (TVL range, depositor count, net flow, underlying asset multi-select)
  - Sort dropdown with options (TVL, depositor count, vault age)
  - Clear filters button (contextually visible)
  - Full-width vault card grid (20 per page)
  - Pagination controls with page navigation
  - Total vault count display
- **UX Considerations**: Filter state persists in localStorage and URL parameters for shareability
- **Accessibility**: Keyboard navigation for all filter controls, ARIA labels for screen readers
- **Security**: Input validation for filter parameters, XSS protection for user inputs

### Vault Detail - Overview (`/vaults/[address]`)

- **Main Purpose**: Provide immediate vault assessment with key metrics and trends
- **Key Information**: Current TVL, total depositors, vault age, inflow/outflow trends, external
  platform links
- **Key Components**:
  - Prominent TVL display
  - Depositor count metrics (current and all-time)
  - Interactive inflow/outflow chart
  - Vault age indicator
  - External links (BlockExplorer, DeBank) with new tab behavior
  - Global time selector (7d, 30d, 90d, 1y)
- **UX Considerations**: Default landing tab, immediate metric visibility, clear external link
  indication
- **Accessibility**: Chart tooltips accessible via keyboard, proper link labeling
- **Security**: Address validation, secure external link handling

### Vault Detail - Depositors (`/vaults/[address]/depositors`)

- **Main Purpose**: Analyze vault's user base composition and investment distribution
- **Key Information**: Depositor addresses, amounts, percentages, join dates
- **Key Components**:
  - Sortable table with columns (address, amount, percentage, join date)
  - Wallet address copy functionality with success feedback
  - Pagination for large depositor lists
  - Address truncation for display
- **UX Considerations**: Clear copy feedback, intuitive sorting, persistent sort state
- **Accessibility**: Keyboard-accessible copy buttons, sortable column headers
- **Security**: Address validation, clipboard API secure usage

### Vault Detail - Activity (`/vaults/[address]/activity`)

- **Main Purpose**: Display transaction patterns and vault activity trends
- **Key Information**: Deposit/withdrawal transactions, advanced inflow visualization
- **Key Components**:
  - Advanced inflow chart with time-based controls
  - Transaction table (address, amount, timestamp)
  - Pagination for transaction history
  - Time-responsive chart granularity
- **UX Considerations**: Chart responds to global time selector, clear transaction categorization
- **Accessibility**: Chart tooltips keyboard accessible, table navigation
- **Security**: Transaction data validation, secure timestamp handling

### Vault Detail - Performance (`/vaults/[address]/performance`)

- **Main Purpose**: Evaluate vault's historical returns and performance trends
- **Key Information**: Share price evolution over selected time periods
- **Key Components**:
  - Share price line chart with hover tooltips
  - Time range responsive data display
  - Performance metrics calculations
- **UX Considerations**: Clear performance visualization, responsive time controls
- **Accessibility**: Chart interactions accessible, performance data clearly labeled
- **Security**: Data validation for performance metrics

### Error Pages

- **404 Error Page**: For invalid vault addresses with clear navigation back to directory
- **Data Error States**: Consistent "Sorry, we couldn't load the data" messaging with retry options
- **Network Error States**: Graceful degradation maintaining navigation structure

## 3. User Journey Map

### Primary Discovery Flow

1. **Entry**: User lands on `/vaults` directory
2. **Filtering**: User applies multiple filters (TVL range, depositor count, net flow, underlying
   asset)
3. **Sorting**: User selects preferred sorting criteria
4. **Navigation**: User browses through paginated results
5. **Selection**: User clicks vault card to access detailed analysis
6. **Overview**: User lands on vault overview tab by default
7. **Deep Dive**: User switches between tabs (Depositors, Activity, Performance)
8. **Time Analysis**: User adjusts global time selector for chart analysis
9. **External Research**: User follows external links to BlockExplorer/DeBank
10. **Return Navigation**: User uses breadcrumb navigation to return to filtered directory

### Secondary Navigation Flows

- **Direct Access**: URLs with embedded filter states and tab selections
- **Sharing**: Filter states and specific vault tabs shareable via URL
- **Error Recovery**: Graceful handling of invalid addresses and data failures
- **Mobile/Tablet**: Horizontal scrolling for tables, maintained functionality

### State Persistence Journey

- **Filter Preferences**: Immediately saved to localStorage and URL parameters
- **Sort Selections**: Maintained across pagination and vault navigation
- **Tab States**: Reflected in URL structure for bookmarking
- **Time Selections**: Persisted across tab navigation within vault details

## 4. Layout and Navigation Structure

### Primary Navigation Architecture

- **Breadcrumb Navigation**: Home > Vaults > [Vault Name] > [Tab Name]
  - Each level clickable with state preservation
  - Updates dynamically with tab switching
  - Maintains filter state when returning to directory

### Tab-Based Navigation (Vault Details)

- **Four Primary Tabs**: Overview, Depositors, Activity, Performance
- **URL Structure**: `/vaults/[address]/[tab-name]`
- **Active State**: Visual highlighting and URL reflection
- **Keyboard Navigation**: Full tab accessibility

### Filter and Sort Navigation

- **Filter Controls**: Sidebar or header-based filter interface
- **Sort Integration**: Dropdown with clear current selection
- **Clear Functionality**: Contextual clear button when filters active
- **Pagination**: Maintains filter and sort state across pages

### Responsive Navigation

- **Desktop (>1200px)**: Full sidebar filters, complete table views
- **Tablet/Mobile (<1200px)**: Horizontal scrolling for tables, maintained functionality
- **Touch Navigation**: Optimized for touch interactions on charts and tables

## 5. Key Components

### VaultCard Component

- **Purpose**: Primary vault display unit in directory
- **Features**: Complete vault information, loading states, click navigation
- **Accessibility**: Keyboard navigation, proper heading hierarchy
- **Responsive**: Full-width layout with consistent spacing

### FilterControls Component

- **Purpose**: Comprehensive filtering interface
- **Features**: Range sliders, multi-select dropdowns, toggle buttons
- **State Management**: Single reducer with generic actions
- **Persistence**: localStorage integration with URL synchronization

### AppDataTable Component

- **Purpose**: Reusable sortable table for depositors and transactions
- **Features**: Sorting, pagination, copy functionality, responsive horizontal scrolling
- **Accessibility**: Keyboard navigation, screen reader support
- **Loading States**: Skeleton loading with consistent spacing

### AppChartContainer Component

- **Purpose**: Wrapper for Recharts with consistent styling and behavior
- **Features**: Hover tooltips, time-range responsiveness, loading states
- **Accessibility**: Keyboard interactions, data table alternatives
- **Responsive**: Maintains aspect ratio, touch-friendly interactions

### TimeSelector Component

- **Purpose**: Global time range selection for all charts
- **Features**: 7d, 30d, 90d, 1y options with visual highlighting
- **State Management**: Affects all time-based components simultaneously
- **Persistence**: Maintains selection across tab navigation

### BreadcrumbNavigation Component

- **Purpose**: Clear navigation hierarchy display
- **Features**: Clickable levels, dynamic updates, state preservation
- **Accessibility**: Skip links, clear hierarchy indication
- **Responsive**: Truncation strategies for smaller screens

### ExternalLink Component

- **Purpose**: Secure external link handling
- **Features**: New tab behavior, visual indicators, security attributes
- **Accessibility**: Clear external link indication, proper labeling
- **Security**: Proper rel attributes, trusted domain validation

### LoadingState Components

- **Purpose**: Consistent loading experience across all views
- **Features**: Skeleton components matching content structure
- **Accessibility**: Screen reader announcements, loading indicators
- **Performance**: Optimized skeleton rendering

### ErrorBoundary Component

- **Purpose**: Graceful error handling with consistent messaging
- **Features**: Error state display, retry mechanisms, navigation preservation
- **Accessibility**: Clear error communication, keyboard navigation
- **Recovery**: Maintains application state where possible
