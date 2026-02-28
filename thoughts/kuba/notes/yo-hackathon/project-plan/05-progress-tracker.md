# YO Treasury — Progress Tracker

## Adaptive Approach Note
This tracker reflects the current plan. Tasks may change as we learn during implementation. We create detailed tickets only for the very next step.

---

## Phase 1: Smart Contract Setup & Vault Creation Script
- [ ] Create `packages/yo-treasury/` package with package.json
- [ ] Define address constants per chain (factory, fuses, YO vaults, tokens, routers)
- [ ] Collect ABIs — check `@ipor/fusion-sdk` exports first, supplement as needed
- [ ] Write vault creation script (create-vault.ts)
- [ ] Write Hardhat fork tests for vault creation on Base
- [ ] Run fork tests — verify vault creation succeeds
- [ ] Verify roles granted including WHITELIST_ROLE=800 (read hasRole on-chain)
- [ ] Verify fuses installed (verify with getFuses)
- [ ] Test deposit into vault (1 USDC — requires WHITELIST_ROLE)
- [ ] Test PlasmaVault.execute with Erc4626SupplyFuse.enter(yoUSD)
- [ ] Test PlasmaVault.execute with UniversalTokenSwapperFuse.enter (USDC→WETH swap)
- [ ] Verify Erc4626SupplyFuse.exit(yoUSD) works (withdraw from YO)
- [ ] All fork tests pass: `pnpm test -- --grep yo-treasury`

## Phase 2: AI Agent (Mastra)
- [ ] Create tool output type definitions (YoTreasuryToolOutput union)
- [ ] Implement getYoVaultsTool (list vaults with APY/TVL)
- [ ] Implement getYoVaultDetailsTool (deep dive on single vault)
- [ ] Implement getTreasuryAllocationTool (read Fusion vault markets via @ipor/fusion-sdk)
- [ ] Implement createAllocationActionTool (Erc4626SupplyFuse.enter)
- [ ] Implement createWithdrawActionTool (Erc4626SupplyFuse.exit)
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
- [ ] Create data hooks: useVaultBalances, useYoVaultData
- [ ] Build PortfolioSummary component (total value, unallocated balance)
- [ ] Build AllocationBreakdown component (per-YO-vault positions with APR)
- [ ] Build YoVaultsOverview component (available vaults with APR/TVL)
- [ ] Build DepositForm component (standard USDC deposit — web UI, NOT chat)
- [ ] Build WithdrawForm component (standard USDC withdraw — web UI, NOT chat)
- [ ] Build TreasuryDashboard layout (compose above components)
- [ ] Build ChainSelector component (Base/Ethereum/Arbitrum)
- [ ] Build CreateVaultFlow with transaction stepper (NO convertToPublicVault step)
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
