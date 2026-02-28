# YO Treasury — Progress Tracker

## Phase 1: Smart Contract Setup & Vault Creation Script
- [ ] Create `packages/yo-treasury/` package with package.json
- [ ] Define address constants per chain (factory, fuses, YO vaults, tokens, routers)
- [ ] Collect ABIs from ipor-webapp and fusion-sdk
- [ ] Write vault creation script (create-vault.ts)
- [ ] Run script on Base — verify vault creation
- [ ] Verify roles granted (read hasRole on-chain)
- [ ] Verify fuses installed
- [ ] Test deposit into vault (1 USDC)
- [ ] Test PlasmaVault.execute with Erc4626SupplyFuse.enter(yoUSD)
- [ ] Test PlasmaVault.execute with UniversalTokenSwapperFuse.enter (USDC→WETH swap)
- [ ] Verify Erc4626SupplyFuse.exit(yoUSD) works (withdraw from YO)

## Phase 2: AI Agent (Mastra)
- [ ] Create yo-treasury-agent.ts with system prompt
- [ ] Implement getYoVaultsTool (list vaults with APY/TVL)
- [ ] Implement getYoVaultDetailsTool (deep dive on single vault)
- [ ] Implement getTreasuryAllocationTool (read Fusion vault markets)
- [ ] Implement createAllocationActionTool (Erc4626SupplyFuse.enter)
- [ ] Implement createWithdrawActionTool (Erc4626SupplyFuse.exit)
- [ ] Implement createSwapActionTool (Odos API + UniversalTokenSwapperFuse)
- [ ] Wire up displayPendingActionsTool and executePendingActionsTool (reuse)
- [ ] Wire up Anvil fork simulation (reuse simulateOnFork)
- [ ] Register agent in mastra/index.ts
- [ ] Define YoTreasuryToolOutput type union
- [ ] Export types from package.json
- [ ] Test in Mastra Studio: "What are my yield options?"
- [ ] Test in Mastra Studio: "Show my allocation"
- [ ] Test in Mastra Studio: "Allocate 100 USDC to yoUSD" (with simulation)
- [ ] Test in Mastra Studio: "Swap 50 USDC to WETH" (Odos integration)

## Phase 3: Frontend — Vault Creation Onboarding
- [ ] Create /yo-treasury page route
- [ ] Build ChainSelector component (Base/Ethereum/Arbitrum)
- [ ] Build CreateVaultFlow with transaction stepper
- [ ] Implement FusionFactory.clone() transaction step
- [ ] Implement role granting transaction step
- [ ] Implement fuse installation transaction step
- [ ] Implement substrate configuration transaction step
- [ ] Implement convertToPublicVault transaction step
- [ ] Store vault address in localStorage after creation
- [ ] Detect existing vault on page load (skip creation)
- [ ] Test: full vault creation flow on Base

## Phase 4: Frontend — Chat UI & Tool Renderers
- [ ] Create API route: POST /api/yo/treasury/chat
- [ ] Build TreasuryChat component (reuse useChat pattern)
- [ ] Build YoToolRenderer switch component
- [ ] Build YoVaultsList renderer (vault cards)
- [ ] Build YoVaultDetail renderer
- [ ] Build TreasuryAllocation renderer (allocation breakdown)
- [ ] Build SwapPreview renderer
- [ ] Wire up existing ActionWithSimulation renderer
- [ ] Wire up existing PendingActionsList renderer
- [ ] Wire up existing ExecuteActions 5-step flow
- [ ] Test: "What are my yield options?" → vault cards render
- [ ] Test: "Show my allocation" → allocation breakdown renders
- [ ] Test: "Put 100 USDC into yoUSD" → full flow works
- [ ] Test: "Swap 50 USDC to WETH and allocate to yoETH" → batched tx
- [ ] Test: "Withdraw from yoUSD" → exit flow works

## Phase 5: Polish, Demo & Submission
- [ ] Branding and color scheme
- [ ] Loading states and transitions
- [ ] Error handling and user-friendly messages
- [ ] Mobile responsive layout check
- [ ] Rehearse demo script
- [ ] Record 3-minute demo video
- [ ] Write README.md for submission
- [ ] Clean up GitHub repo
- [ ] Submit on DoraHacks

## Stretch Goals (if time permits)
- [ ] Multi-chain portfolio view (read positions on multiple chains)
- [ ] Merkl rewards display
- [ ] Yield comparison chart (yoUSD vs alternatives)
- [ ] Goal-based saving ("Save $5K by August")
- [ ] Allocation pie chart animation
- [ ] Real-time allocation widget in sidebar alongside chat
