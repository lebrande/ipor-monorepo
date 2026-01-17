---
description:
globs:
alwaysApply: false
---

# Product Description

## DeFi Panda - ERC4626 Vault Analytics Platform

### 1. Product Overview

**Product Name:** DeFi Panda  
**Product Type:** Web-based analytics platform  
**Target Users:** DeFi investors and analysts seeking comprehensive vault data, DeFi degens,
data-driven power users

**Problem Statement:**  
Finding comprehensive and reliable information about DeFi investments across web resources is
challenging and time-consuming. Users don't want to spend entire days conducting research and
analyzing data about ERC4626 vaults. DeFi protocols often prioritize positive public relations over
transparency, deliberately withholding critical data that might reveal vulnerabilities or
unfavorable metrics.

**Solution:**  
A dedicated analytics platform that aggregates and presents comprehensive ERC4626 vault data,
providing users with insights for technical and fundamental analysis that aren't readily available
on protocol websites.

### 2. Core Functionality

#### 2.1 Vault Directory (`/vaults`)

- **Layout:** Full-width cards (like rows) displaying 20 vaults per page
- **Pagination:** shadcn/ui Pagination component with vault count display
- **Vault Card Information (in order):**
  - Vault name
  - Protocol name
  - Total Value Locked (TVL) in USD
  - Underlying asset
  - Current depositor count
  - 7-day net flow

#### 2.2 Filtering System

- **Position:** Above vault listing
- **Filter Integration:** Active filters shown within filter controls themselves
- **Persistence:** All filter states saved to localStorage and in URL params
- **Filter Types:**
  - TVL size: Range slider/input
  - Number of current depositors: Dropdown with ranges
  - 7-day net flow: Positive/negative/all toggle
  - Underlying assets: Multi-select dropdown

#### 2.3 Sorting Options

- TVL (high to low)
- Current depositor count
- Newest first

#### 2.4 Vault Detail Pages (`/vaults/<vault-address>`)

- **Navigation:** Tab-based interface with URL reflection (`/vaults/<vault-address>/<tab>`)
- **Global Time Selector:** Affects all time-based charts (7d, 30d, 90d, 1y)

**Tab Structure:**

1. **Overview Tab:**
   - Current TVL
   - Total depositors (current and all-time)
   - Inflow / outflow chart
   - Vault age
   - Links to BlockExplorer and DeBank (open in new tabs with external link icons)

2. **Depositors Tab:**
   - Current depositors table with columns:
     - Wallet address (truncated with copy functionality)
     - Amount deposited
     - Percentage of total
     - Join date
   - Table features: Sorting, pagination (no search)

3. **Activity Tab:**
   - Deposit and withdrawal transactions
   - Inflow chart visualization

4. **Performance Tab:**
   - Share price over time (line chart)

### 3. Technical Requirements

#### 3.1 Technology Stack

- **Framework:** Astro 5 with file-based routing
- **Frontend:** TypeScript 5, React 19
- **Styling:** Tailwind CSS 4
- **Components:** shadcn/ui component library
- **Charts:** Chart libraries - visx with adjusted styles and recharts with components from shadcn
  with default styling

#### 3.2 Responsive Design

- **Approach:** Desktop-first design
- **Breakpoint:** 1200px (below this considered non-desktop)
- **Table Behavior:** Horizontal scroll for tables below 1200px
- **No mobile-specific variants**

#### 3.3 Data Visualization

- **TVL Charts:** Line charts with tooltips and time range selectors
- **Transaction Flow:** Inflow chart visualization
- **Depositor Data:** Data Table component from shadcn
- **Performance Metrics:** Line charts for share price over time

### 4. User Experience Specifications

#### 4.1 Navigation

- **Header:** Logo + Navigation Menu component (shadcn/ui)
- **Breadcrumbs:** Clear navigation path on vault detail pages
- **No additional top-level pages planned**

#### 4.2 Loading and Error States

- **Loading:** shadcn/ui Skeleton components adapted to specific data spots
- **Error Handling:** Placeholder with message "Sorry, we couldn't load the data"
- **Granular Error Boundaries:** Allow partial page failures without breaking entire experience

#### 4.3 Interactive Elements

- **Chart Interactions:** Tooltips on hover, no zoom functionality
- **Time Selectors:** Global selection affecting all time-based charts
- **Table Interactions:** Sorting and pagination, address copying
- **Filter Feedback:** Visual indicators for active states

### 5. Out of Scope (MVP)

- **No transaction capabilities:** Purely analytical platform
- **No vault management:** Users cannot add vaults through interface
- **No backend development:** APIs handled separately
- **No mobile application**
- **No user authentication or accounts**
- **No data export functionality**
- **No user onboarding flows**
- **No performance optimization requirements**

### 6. Success Criteria

- Users can discover valuable insights for technical and fundamental analysis
- Users report helpful data for informed investment decisions
- Platform reveals important information not available on protocol websites
- Smooth user experience with consistent loading states and error handling
- Filter preferences persist across sessions enhancing user workflow

### 7. Design System Requirements

- Consistent with shadcn/ui design tokens
- Financial data-optimized styling
- Proper accessibility for charts and tables
- Color coding for performance indicators (green positive, red negative)
- Brand accent: #00A76F

### 8. URL Structure

- **Directory:** `/vaults`
- **Vault Details:** `/vaults/<vault-address>`
- **Vault Tabs:** `/vaults/<vault-address>/<tab-name>`
- **State Persistence:** Filter states and active tabs reflected in URLs for sharing/bookmarking

This PRD provides comprehensive guidance for developing the DeFi Panda MVP while maintaining clear
boundaries and focusing on the core analytical value proposition.
