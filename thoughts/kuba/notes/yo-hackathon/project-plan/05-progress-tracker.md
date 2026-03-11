# YO Treasury — Progress Tracker

## Adaptive Approach Note
This tracker reflects the current plan. Tasks may change as we learn during implementation. We create detailed tickets only for the very next step.

---

## Phase 1: Smart Contract Setup & Vault Creation
- [x] ~~Create `packages/web/src/yo-treasury/constants/addresses.ts`~~ → `packages/sdk/src/markets/yo/yo.addresses.ts`
- [x] ~~Create `packages/web/src/yo-treasury/constants/abis.ts`~~ → `packages/sdk/src/markets/yo/abi/*.abi.ts`
- [x] ~~Create `packages/web/src/yo-treasury/lib/create-vault.ts`~~ → `packages/sdk/src/markets/yo/create-vault.ts`
- [x] Write Hardhat fork tests for vault creation on Base
- [x] Run fork tests — verify vault creation succeeds
- [x] Verify roles granted including WHITELIST_ROLE=800
- [x] Verify fuses installed
- [x] Test deposit into vault (100 USDC — requires WHITELIST_ROLE)
- [x] Test PlasmaVault.execute with Erc4626SupplyFuse.enter(yoUSD)
- [x] Test PlasmaVault.execute with UniversalTokenSwapperFuse.enter (USDC→WETH via Uniswap V3)
- [x] ~~Verify Erc4626SupplyFuse.exit(yoUSD) works~~ → **BLOCKED**: YoVault.withdraw() is disabled. **FIXED**: Created `YoRedeemFuse` — standalone Solidity fuse calling `redeem()` instead of `withdraw()`. Fork test deploys + registers it and proves withdrawal through fuse system (no impersonation).
- [x] All fork tests pass (5/5) — including YoRedeemFuse-based withdrawal

### Phase 1 Follow-up (FSN-0046):
- [x] ~~Fix SDK `create-vault.ts` library (FSN-0046a)~~ → Done. Functions accept `PlasmaVault` instance, `addBalanceFuses()` handles ZeroBalanceFuse.
- [x] ~~Refactor test to use SDK library (FSN-0046a)~~ → Done. Test `before()` uses SDK library functions.
- [x] ~~Deploy ZeroBalanceFuse(12) on Base (FSN-0046b)~~ → Done. Address: `0x706ca1cA4EcE9CF23301D6AB35ce6fb7Cf25DA15`
- [x] ~~Update obsolete project plans (FSN-0046c)~~ → Done
- [x] ~~Code review cleanup (FSN-0047)~~ → Done. Removed unused `VaultCreationResult` import, added `SWAP_EXECUTOR_ADDRESS` to SDK, deduplicated executor address in test.

### YoRedeemFuse (completed, deployed):
- [x] Create `YoRedeemFuse.sol` standalone Solidity fuse (Hardhat 0.8.28)
- [x] Create `yoRedeemFuseAbi` TypeScript ABI + export from `@ipor/fusion-sdk`
- [x] Replace impersonation-based withdraw test with fuse-based test
- [x] All 5 fork tests pass with YoRedeemFuse
- [x] Deploy 4 YoRedeemFuse instances to Base mainnet (one per market slot)
  - Slot1 (yoUSD): `0x6f7248f6d057e5f775a2608a71e1b0050b1adb95`
  - Slot2 (yoETH): `0xaebd1bab51368b0382a3f963468cab3edc524e5d`
  - Slot3 (yoBTC): `0x5760089c08a2b805760f0f86e867bffa9543aa41`
  - Slot4 (yoEUR): `0x7CB5E0e8083392EdEB4AaF68838215A3dD1831e5`
- [x] Added deployed addresses to `packages/sdk/src/markets/yo/yo.addresses.ts`
- [x] Updated `addFuses()` to include all 9 fuses (4 supply + 4 redeem + 1 swap)
- [x] Fixed SDK re-exports in `packages/sdk/src/index.ts`
- [x] Fork tests updated to use real deployed fuses (block 42988200)

## Phase 2: AI Agent (Mastra)
- [x] Create tool output type definitions (`packages/mastra/src/tools/yo-treasury/types.ts` — `YoVaultsOutput`, `YoActionWithSimulationOutput`)
- [x] Implement getYoVaultsTool (list vaults via `@yo-protocol/core` SDK)
- [x] ~~Implement getYoVaultDetailsTool~~ → Merged into getYoVaultsTool (snapshot data included when SDK works)
- [x] Implement getTreasuryAllocationTool (wraps `readVaultBalances` — now with ERC4626 support)
- [x] Implement createYoAllocationActionTool (Erc4626SupplyFuse.enter, per-slot fuse addresses)
- [x] Implement createYoWithdrawActionTool (YoRedeemFuse.exit — uses `yoRedeemFuseAbi`)
- [x] Implement createYoSwapActionTool (Odos API quote+assemble + UniversalTokenSwapperFuse.enter)
- [x] Wire up displayPendingActionsTool and executePendingActionsTool (reused from alpha, relaxed protocol enums to `z.string()`)
- [x] Wire up Anvil fork simulation (reuses `simulateOnFork` as-is)
- [x] Create yo-treasury-agent.ts with system prompt, working memory, 7 tools
- [x] Register agent in mastra/index.ts
- [x] Extend `readVaultBalances` for ERC4626 markets (shared improvement for alpha + yo agents)
- [x] Test in Mastra Studio: "What are my yield options?" → returns 4 YO vaults ✓
- [x] E2E test in browser: "What are my yield options?" → table with 5 vaults (Base + Ethereum), user positions, brief text ✓
- [x] Test: "Show my allocation" (demo vault: `0x09d1C2E03F73853916Ee86b4e1A729F9FbAA960D`) — reads balances, renders treasury overview
- [x] Test: "Allocate USDC to yoUSD" (demo vault) — full e2e: tool → simulation → execute → on-chain confirmed
- [x] Test: "Withdraw from yoUSD" — fixed `createYoWithdrawActionTool` to resolve YoRedeemFuse address internally (was LLM input → fabricated wrong address → UnsupportedFuse). Full e2e confirmed.
- [x] Test: "Swap 0.1 USDC to WETH" (Odos integration) — Odos quote+assemble → simulation → execute → on-chain confirmed
- [x] Verify agent does NOT handle deposit/withdraw from treasury — agent correctly refuses both, directs to web UI forms

### Phase 2 Implementation Notes:
- **~~`@yo-protocol/core` v0.0.3 bug~~** RESOLVED: Upgraded to v1.0.7. Dashboard uses `getVaults()` → `VaultStatsItem[]` which includes yield, TVL, share price. `getVaultSnapshot()` no longer needed.
- **No `getYoVaultDetailsTool`**: Merged into getYoVaultsTool — one tool returns all vault metadata + snapshot data.
- **ERC4626 readVaultBalances**: Added branch detecting `MARKET_100xxx` / `ERC4626_xxxx` market names. Reads share balances via `erc4626Abi.convertToAssets`, gets USD prices from price oracle. Benefits both alpha and YO agents.
- **Protocol enum relaxation**: Changed `PendingActionsOutput.protocol` and `ActionWithSimulationOutput.protocol` from narrow enum to `string` so `'yo-erc4626'` and `'yo-swap'` work alongside `'aave-v3'`/`'morpho'`/`'euler-v2'`.

## Phase 3: Frontend — Onboarding & Dashboard (Primary UI)

### Pre-requisite: On-chain deployments — ALL DONE
- [x] Deploy YoRedeemFuse to Base (4 instances) — Done. See YoRedeemFuse section above.
- [x] ~~Deploy ZeroBalanceFuse(12) to Base (FSN-0046b)~~ → Done. Address: `0x706ca1cA4EcE9CF23301D6AB35ce6fb7Cf25DA15`
- [x] Add deployed YoRedeemFuse addresses to `yo.addresses.ts` and vault creation flow — Done.

### Vault Creation Page (FSN-0054 → FSN-0055):
- [x] Create vault creation page at `/yo-treasury/create` (calls `createAndConfigureVault()`)
- [x] Add `@ipor/fusion-sdk` as web package dependency
- [x] Add "Create YO Treasury" sidebar nav entry
- [x] Create Storybook story with WalletDecorator
- [x] Verify renders in Storybook (Playwright MCP screenshot)
- [x] **UX refinement (FSN-0055)** — decomposed monolithic `createAndConfigureVault()` into 6 per-step wagmi components
  - [x] `CloneVaultStep` — `useSimulateContract` + `useWriteContract` (1 tx)
  - [x] `GrantRolesStep` — reads `hasRole`, grants missing roles sequentially (4 txs)
  - [x] `AddFusesStep` — single `addFuses([...9 addresses])` tx, checks `getFuses()` for skip
  - [x] `AddBalanceFusesStep` — 5 sequential `addBalanceFuse()` txs, auto-advances
  - [x] `ConfigureSubstratesStep` — 5 sequential `grantMarketSubstrates()` txs, reads existing substrates to skip
  - [x] `UpdateDepsStep` — single `updateDependencyBalanceGraphs()` tx
  - [x] Chain switching — detects wrong chain, prompts "Switch to Base" via `useSwitchChain`
  - [x] localStorage persistence — only vault address stored, all other state read from chain
  - [x] Success card with copy, "View Vault Dashboard" link, "Create Another" button
  - [x] **17 total transactions across 6 steps** — all tested end-to-end on Base mainnet

### Demo Vault (deployed on Base, 2026-03-07):
- **Address**: `0x09d1C2E03F73853916Ee86b4e1A729F9FbAA960D`
- **Chain**: Base (8453)
- **Start block**: 43046896
- **Dashboard**: http://localhost:3000/vaults/8453/0x09d1C2E03F73853916Ee86b4e1A729F9FbAA960D
- **Added to** `plasma-vaults.json` as "YO Treasury"
- All roles granted, all fuses installed, all substrates configured, dependency graphs updated

### YO Treasury Tab (working):
- [x] Added `yo` tab to `vault-tabs.config.ts`
- [x] Created `yo-treasury-tab.tsx` client wrapper
- [x] Created `/vaults/[chainId]/[address]/yo/page.tsx`
- [x] Manual testing with demo vault — chat + table rendering verified via Playwright

### Deposit Form (FSN-0058, completed 2026-03-07):
- [x] Build DepositForm component (`deposit-form.tsx`) — ERC20 approve + ERC4626 deposit flow
  - Reads asset address, decimals, symbol, wallet balance, allowance, share balance, convertToAssets
  - Two-step tx: approve (if needed) → deposit, with refetch after confirmation
  - States: connect wallet, enter amount, insufficient balance, approve, deposit, success, error
  - Max button, USD conversion via on-chain price oracle, position display in asset + USD
- [x] ~~Build WithdrawPlaceholder component~~ → Deleted (dead code, replaced by WithdrawForm)
- [x] Restructure `yo-treasury-tab.tsx` to responsive layout: mobile stacked (forms first), desktop side-by-side
- [x] Create Storybook story with WalletDecorator + auto chain switch to Base
- [x] TypeScript compiles clean
- [x] Playwright MCP: verified layout renders correctly (responsive two-column, deposit card, withdraw form)
- [x] E2E test in Storybook: deposited 1 USDC into demo vault — approve → deposit → balance updated, position shows 1 USDC ($1.00)

### Withdraw Form (FSN-0059, completed 2026-03-07):
- [x] Build WithdrawForm component (`withdraw-form.tsx`) — ERC4626 redeem flow
  - Reads asset address, decimals, symbol, share balance, convertToAssets, convertToShares
  - Single-step tx: `redeem(shares, receiver, owner)` — no approval needed
  - `isMax` flag: Max uses raw shareBalance (avoids rounding), partial uses convertToShares
  - States: connect wallet, enter amount, exceeds position, withdraw, success, error
  - Max button, USD conversion, position display in asset + USD
- [x] Replaced WithdrawPlaceholder with WithdrawForm in `yo-treasury-tab.tsx`
- [x] Added `useSwitchChain` "Switch to chain" button to both deposit-form and withdraw-form
- [x] Fixed stale balance after tx: delayed refetch (2s retry) to handle RPC lag
- [x] Fixed zero-balance display: `shareBalance === 0n` check takes priority over stale cached `positionAssets`
- [x] Create Storybook story with WalletDecorator + auto chain switch to Base
- [x] TypeScript compiles clean
- [x] E2E test in Storybook: withdrew 0.5 USDC (partial), then 0.5 USDC (max) — position updates to 0 USDC

### Code Review Fixes (FSN-0063, completed 2026-03-11):
- [x] Extracted `useVaultReads` shared hook — deduplicates 5 `useReadContract` calls across deposit/withdraw forms
- [x] On-chain USD pricing via `getPriceOracleMiddleware()` + `getAssetPrice()` — replaces $1/token assumption
- [x] `formatAmountUsd()` helper — formats token amounts with oracle price, falls back to raw amount
- [x] Changed fallback symbol from `'USDC'` to `'...'`
- [x] Deleted dead `withdraw-placeholder.tsx`
- [x] Mobile responsive layout — `flex-col lg:flex-row`, forms-first on mobile
- [x] Deduplicated `existingActionSchema` → shared `types.ts` (was copy-pasted in 3 tool files)
- [x] Replaced `z.any()` with proper Zod schemas in `get-treasury-allocation.ts` output
- [x] Removed unused `parts` variable in `get-treasury-allocation.ts`
- [x] Verified in Storybook via Playwright (headed): desktop + mobile layouts, USD pricing, form inputs

### Phase 3 remaining (dashboard, polish):
- [x] Create data hooks: `useTreasuryPositions` (wagmi multicall for PlasmaVault's YO vault share balances + convertToAssets) + `useYoVaultsData` (uses `@yo-protocol/core` `createYoClient().getVaults()` for APR/TVL) + `useYoPrices` (token prices via `getPrices()`)
- [x] Build PortfolioSummary component — 4 stat cards (Total Value, Allocated, Unallocated, Active Vaults) with YO brand aesthetic (neon green accent, #2B2C2A cards, Space Grotesk font)
- [x] Build AllocationTable component — combined view showing all YO vaults with APR/TVL from API + user positions from on-chain reads, vault color dots, logo images, active/inactive status badges
- [x] Build TreasuryDashboard layout — composes PortfolioSummary + AllocationTable, uses `useVaultReads` + `useTreasuryPositions` + `useYoVaultsData`
- [x] Restructured `yo-treasury-tab.tsx` — dashboard-first layout: TreasuryDashboard (full width top) → Chat + Forms below
- [x] Added YO theme tokens to `global.css`: Space Grotesk font import, `--color-yo-neon`, `--color-yo-dark`, `--color-yo-muted`, vault colors (`yo-usd`, `yo-btc`, `yo-eur`, `yo-gold`), `--font-yo`
- [x] Verified in Storybook: live APR/TVL data from @yo-protocol/core, portfolio summary with real $0.08 USDC position, all 4 Base YO vaults rendered
- [x] Fixed CSS @import ordering — `@import url('...Space+Grotesk...')` must precede `@import 'tailwindcss'` in global.css (Next.js CSS parser requires this)
- [x] Verified in Next.js app at `http://localhost:3000/vaults/8453/.../yo` — full dashboard with live APR/TVL, portfolio summary, allocation table, chat + forms all rendering correctly
- [ ] Build ChainSelector component (Base/Ethereum/Arbitrum) — stretch
- [ ] Build FirstDepositPrompt (shown after creation or when balance is zero) — stretch

## Phase 4: Frontend — Chat UI & Tool Renderers (Alpha Actions)
- [x] Create API route: POST /api/yo/treasury/chat
- [x] Build TreasuryChat component (reuse useChat pattern from vault-alpha)
- [x] Build YoToolRenderer switch component (discriminated union on `type` field)
- [x] Build YoVaultsList renderer — table layout with Vault, TVL, APR, Balance, Value columns
- [x] Wire up existing ActionWithSimulation renderer (reused from alpha)
- [x] Wire up existing PendingActionsList renderer (reused from alpha)
- [x] Wire up existing ExecuteActions 5-step flow (reused from alpha)
- [x] Integrate chat as YO Treasury tab on vault detail page (`/vaults/[chainId]/[address]/yo`)
- [x] Enhanced getYoVaultsTool to include user positions (Balance + Value columns)
- [x] Agent system prompt tuned — brief plain text, no markdown, no data duplication
- [x] Tool output messages include "[UI rendered...]" directive to prevent LLM from repeating data
- [x] E2E browser test: "What are my yield options?" — table renders, agent responds with 1 sentence
- [x] Add "Unallocated" column to YO vaults table (FSN-0062) — `getYoVaultsTool` multicalls `balanceOf(treasuryAddress)` for each underlying, frontend shows column between APR and Balance. **Note**: Can't verify in Storybook because mastra uses real chain RPC while wagmi uses Anvil fork — see known issues.
- [x] ~~Build TreasuryAllocation renderer~~ → Implemented as `TreasuryBalances` (type `treasury-balances`) — shows unallocated tokens + YO allocations with token icons and USD values
- [x] ~~Build SwapPreview renderer~~ → Swap tool returns `action-with-simulation` type, rendered by existing `ActionWithSimulation` component (shows simulation balance diffs). No separate preview type needed.
- [x] Test: "Show my allocation" → treasury overview renders with assets + YO positions
- [x] Test: "Allocate USDC to yoUSD" → full flow works (tool → sim → execute → confirmed)
- [x] Test: "Swap 0.04 USDC to WETH and allocate to yoETH" → batched tx. Agent chains swap (Odos quote+assemble) + allocation (Erc4626SupplyFuse.enter) as 2 pending actions. Anvil fork simulation passes with both fuse actions. ExecuteActions renders with 2 actions / 2 fuse calls summary. Screenshot: `screenshots/swap-allocate-batched-test.png`
- [x] Test: "Swap 0.1 USDC to WETH" → Odos swap works (tool → sim → execute → confirmed)
- [x] Test: "Withdraw from yoUSD" → exit flow works (YoRedeemFuse address resolved internally)
- [x] Dashboard refresh after chat txs — `ExecuteActions` calls `queryClient.invalidateQueries()` immediately + 2s delayed retry (RPC may return stale data right after tx). Verified: after page reload, dashboard shows updated positions (Total Value ~$0.04, Active Vaults 1/4, yoETH 0.000020 WETH Active).
- [x] Auto-skip client-side simulation — agent already simulates on Anvil fork. `ExecuteActions` auto-advances simulation step to `success` when preconditions met (wallet + chain + ALPHA_ROLE). Prevents Odos swap calldata expiration during manual simulation click.
- [x] Odos slippage increased from 0.5% to 1.0% — small amounts cause rounding-based slippage failures
- [x] **All 4 YO vaults allocated on Base mainnet** via chat copilot:
  - yoUSD: 0.009 USDC direct allocation — tx `0x2ec994eb...465471de`
  - yoETH: 0.04 USDC → WETH swap+allocate — tx `0xa823be7f...6e7b6062`
  - yoBTC: 0.01 USDC → cbBTC swap+allocate — tx `0x78f6dd70...65ba01f3`
  - yoEUR: 0.01 USDC → EURC swap+allocate — tx `0xab289cb9...71e5505a`
  - Dashboard shows 4/4 Active Vaults generating yield

## Phase 5: Polish, Demo & Submission
- [ ] Branding and color scheme (differentiate from YO's black/neon green)
- [ ] Loading states and transitions
- [ ] Error handling and user-friendly messages
- [x] Mobile responsive layout check — `yo-treasury-tab.tsx` uses `flex-col lg:flex-row` (verified via Playwright)
- [ ] Rehearse demo script (dashboard-first narrative)
- [ ] Record 3-minute demo video
- [ ] Write README.md for submission
- [ ] Clean up GitHub repo
- [ ] Submit on DoraHacks

## Stretch Goals (if time permits)
- [ ] Multi-chain portfolio view (read positions on multiple chains)
- [ ] Merkl rewards display
- [ ] Yield comparison chart (yoUSD vs alternatives)
- [ ] Allocation pie chart animation
- [ ] Real-time allocation widget updates (websocket or polling)
