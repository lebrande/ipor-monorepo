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

### YoRedeemFuse (completed, deployment deferred):
- [x] Create `YoRedeemFuse.sol` standalone Solidity fuse (Hardhat 0.8.28)
- [x] Create `yoRedeemFuseAbi` TypeScript ABI + export from `@ipor/fusion-sdk`
- [x] Replace impersonation-based withdraw test with fuse-based test
- [x] All 5 fork tests pass with YoRedeemFuse
- [ ] Deploy YoRedeemFuse to Base — **deferred to Phase 3** (not needed until real web app transactions)

## Phase 2: AI Agent (Mastra)
- [ ] Create tool output type definitions (YoTreasuryToolOutput union)
- [ ] Implement getYoVaultsTool (list vaults with APY/TVL)
- [ ] Implement getYoVaultDetailsTool (deep dive on single vault)
- [ ] Implement getTreasuryAllocationTool (read Fusion vault markets via @ipor/fusion-sdk)
- [ ] Implement createAllocationActionTool (Erc4626SupplyFuse.enter)
- [ ] Implement createWithdrawActionTool (YoRedeemFuse.exit — uses `yoRedeemFuseAbi`)
- [ ] Implement createSwapActionTool (Odos/KyberSwap/Velora API + UniversalTokenSwapperFuse)
- [ ] Wire up displayPendingActionsTool and executePendingActionsTool (reuse from alpha)
- [ ] Wire up Anvil fork simulation (reuse simulateOnFork)
- [ ] Create yo-treasury-agent.ts with system prompt (alpha actions only, no deposit/withdraw)
- [ ] Register agent in mastra/index.ts
- [ ] Write automated test scripts for tool validation
- [ ] Test in Mastra Studio: "What are my yield options?"
- [ ] Test in Mastra Studio: "Show my allocation"
- [ ] Test in Mastra Studio: "Allocate 100 USDC to yoUSD" (with simulation)
- [ ] Test in Mastra Studio: "Swap 50 USDC to WETH" (Odos integration)
- [ ] Verify agent does NOT handle deposit/withdraw from treasury

## Phase 3: Frontend — Onboarding & Dashboard (Primary UI)

### Pre-requisite: On-chain deployments (do this first, once, before any real tx flow)
- [ ] Deploy YoRedeemFuse to Base (one instance per market — MARKET_ID is immutable, need 4 instances for yoUSD/yoETH/yoBTC/yoEUR)
- [x] ~~Deploy ZeroBalanceFuse(12) to Base (FSN-0046b)~~ → Done. Address: `0x706ca1cA4EcE9CF23301D6AB35ce6fb7Cf25DA15`
- [ ] Add deployed YoRedeemFuse addresses to `yo.addresses.ts` and vault creation flow

- [ ] Create data hooks: useVaultBalances, useYoVaultData
- [ ] Build PortfolioSummary component (total value, unallocated balance)
- [ ] Build AllocationBreakdown component (per-YO-vault positions with APR)
- [ ] Build YoVaultsOverview component (available vaults with APR/TVL)
- [ ] Build DepositForm component (standard USDC deposit — web UI, NOT chat)
- [ ] Build WithdrawForm component (standard USDC withdraw — web UI, NOT chat)
- [ ] Build TreasuryDashboard layout (compose above components)
- [ ] Build ChainSelector component (Base/Ethereum/Arbitrum)
- [ ] Build CreateVaultFlow with transaction stepper (NO convertToPublicVault step, include YoRedeemFuse registration)
- [ ] Implement WHITELIST_ROLE grant step in vault creation
- [ ] Build FirstDepositPrompt (shown after creation or when balance is zero)
- [ ] Create /yo-treasury page route with state-based rendering
- [ ] Store vault address in localStorage after creation
- [ ] Detect existing vault on page load
- [ ] Test with Playwright MCP: full vault creation flow on Base
- [ ] Test with Playwright MCP: first deposit flow
- [ ] Test with Playwright MCP: dashboard shows correct data
- [ ] Test: deposit form works (approve + deposit with WHITELIST_ROLE)
- [ ] Test: withdraw form works (unallocated USDC)

## Phase 4: Frontend — Chat UI & Tool Renderers (Alpha Actions)
- [ ] Create API route: POST /api/yo/treasury/chat
- [ ] Build TreasuryChat component (reuse useChat pattern)
- [ ] Build YoToolRenderer switch component
- [ ] Build YoVaultsList renderer (vault cards)
- [ ] Build TreasuryAllocation renderer (allocation breakdown — chat inline)
- [ ] Build SwapPreview renderer
- [ ] Wire up existing ActionWithSimulation renderer
- [ ] Wire up existing PendingActionsList renderer
- [ ] Wire up existing ExecuteActions 5-step flow
- [ ] Integrate chat as secondary tab/view alongside dashboard
- [ ] Test: "What are my yield options?" → vault cards render
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
