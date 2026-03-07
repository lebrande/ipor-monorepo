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
- [ ] Test: "Show my allocation" (demo vault: `0x09d1C2E03F73853916Ee86b4e1A729F9FbAA960D`)
- [ ] Test: "Allocate 100 USDC to yoUSD" (demo vault)
- [ ] Test: "Swap 50 USDC to WETH" (Odos integration)
- [ ] Verify agent does NOT handle deposit/withdraw from treasury

### Phase 2 Implementation Notes:
- **`@yo-protocol/core` v0.0.3 bug**: `getVaultSnapshot()` throws Zod validation error (`idleBalances.raw` comes back as number, expects string). APY/TVL fields return null until SDK is fixed. Tool handles this gracefully.
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
  - Max button, USD conversion ($1 hardcoded for USDC), position display in asset + USD
- [x] Build WithdrawPlaceholder component (`withdraw-placeholder.tsx`) — "Coming soon"
- [x] Restructure `yo-treasury-tab.tsx` to two-column layout: chat left (flex-1), deposit card right (w-80 sticky)
- [x] Create Storybook story with WalletDecorator + auto chain switch to Base
- [x] TypeScript compiles clean
- [x] Playwright MCP: verified layout renders correctly (two-column, deposit card, withdraw placeholder)
- [x] E2E test in Storybook: deposited 1 USDC into demo vault — approve → deposit → balance updated, position shows 1 USDC ($1.00)

### Phase 3 remaining (dashboard, withdraw, polish):
- [ ] Build WithdrawForm component (standard USDC withdraw — web UI, NOT chat) — **FSN-0059**
- [ ] Create data hooks: useVaultBalances, useYoVaultData
- [ ] Build PortfolioSummary component (total value, unallocated balance)
- [ ] Build AllocationBreakdown component (per-YO-vault positions with APR)
- [ ] Build YoVaultsOverview component (available vaults with APR/TVL)
- [ ] Build TreasuryDashboard layout (compose above components)
- [ ] Build ChainSelector component (Base/Ethereum/Arbitrum)
- [ ] Build FirstDepositPrompt (shown after creation or when balance is zero)
- [ ] Test with Playwright MCP: full vault creation flow on Base
- [ ] Test with Playwright MCP: dashboard shows correct data

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
- [ ] Build TreasuryAllocation renderer (allocation breakdown — chat inline)
- [ ] Build SwapPreview renderer
- [ ] Test: "Show my allocation" → allocation breakdown renders
- [ ] Test: "Put 100 USDC into yoUSD" → full flow works
- [ ] Test: "Swap 50 USDC to WETH and allocate to yoETH" → batched tx
- [ ] Test: "Withdraw from yoUSD" → exit flow works
- [ ] Test: dashboard updates after chat-initiated transactions

## Phase 5: Polish, Demo & Submission
- [ ] Branding and color scheme (differentiate from YO's black/neon green)
- [ ] Loading states and transitions
- [ ] Error handling and user-friendly messages
- [ ] Mobile responsive layout check
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
