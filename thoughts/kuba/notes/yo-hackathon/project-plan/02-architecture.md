# YO Treasury — Technical Architecture

**Key decision:** No new packages. All frontend code (constants, ABIs, lib, components) lives in `packages/web/src/yo-treasury/`. Agent + tools in `packages/mastra/`. Fork tests in `packages/hardhat-tests/`. This maximizes reuse of existing wagmi, shadcn, sidebar, auth, chat, and transaction execution infrastructure.

## System Overview

```
+-------------------+     +------------------+     +------------------+
|   User Browser    |     |   Next.js API    |     |   Mastra Agent   |
|                   |     |                  |     |                  |
| Portfolio         |     | POST /api/yo/    |     | yo-treasury-     |
| Dashboard         |     |   treasury/chat  |     |   agent          |
| (primary view)    |     |                  |     | (alpha actions)  |
|                   |---->|                  |---->| (6-8 tools)      |
| - Allocations     |     +------------------+     +------------------+
| - APRs/TVL        |                                     |
| - Total Value     |                                     |
| - Unallocated     |                              +------+------+
|                   |                              |             |
| Deposit/Withdraw  |                        @yo-protocol  @ipor/fusion
| Forms (web UI)    |                          /core SDK      -sdk
|                   |                              |             |
| Chat UI           |                              v             v
| (alpha actions)   |                        +------------------+
| - AllocateToYo    |                        |  On-Chain        |
| - SwapAssets      |                        |                  |
| - WithdrawFromYo  |                        | FusionFactory    |
|                   |                        | PlasmaVault      |
| Tool Renderers    |                        | Erc4626SupplyFuse|
| - YoVaultCard     |                        | UniversalSwapFuse|
| - AllocationView  |                        | YO Vaults        |
| - SwapPreview     |                        | (yoUSD/yoETH/..)|
| - SimulationDiff  |                        +------------------+
| - ExecuteActions  |
|                   |
| Onboarding Flow   |
| - CreateVault     |
| - ConfigureFuses  |
| - GrantRoles      |
| - FirstDeposit    |
+-------------------+
        |
        | wagmi/viem
        |
        v
+-------------------+
|  User's Wallet    |
|  (MetaMask, etc.) |
+-------------------+
```

## On-Chain Architecture

### Per-User Vault Stack (created by FusionFactory.clone())

```
User's PlasmaVault (ERC4626)
├── AccessManager (IporFusionAccessManager)
│   ├── OWNER_ROLE (1) → User
│   ├── ATOMIST_ROLE (100) → User
│   ├── ALPHA_ROLE (200) → User
│   ├── FUSE_MANAGER_ROLE (300) → User
│   └── WHITELIST_ROLE (800) → User (deposit access, NOT public vault)
│
├── Installed Fuses
│   ├── Erc4626SupplyFuse (market ERC4626_0001) → yoUSD
│   ├── Erc4626SupplyFuse (market ERC4626_0002) → yoETH
│   ├── Erc4626SupplyFuse (market ERC4626_0003) → yoBTC
│   ├── Erc4626SupplyFuse (market ERC4626_0004) → yoEUR
│   └── UniversalTokenSwapperFuse (market for swaps) → Odos/KyberSwap/Velora
│
├── Balance Fuses (one per market, for portfolio tracking)
│   ├── Erc4626BalanceFuse (market ERC4626_0001)
│   ├── Erc4626BalanceFuse (market ERC4626_0002)
│   ├── Erc4626BalanceFuse (market ERC4626_0003)
│   └── Erc4626BalanceFuse (market ERC4626_0004)
│
├── Whitelisted Substrates
│   ├── ERC4626_0001: [yoUSD address]
│   ├── ERC4626_0002: [yoETH address]
│   ├── ERC4626_0003: [yoBTC address]
│   ├── ERC4626_0004: [yoEUR address]
│   └── Swap market: [USDC, WETH, cbBTC, EURC, Odos router, KyberSwap router, Velora router]
│
├── WithdrawManager
├── PriceManager
├── FeeManager
└── RewardsManager
```

### Contract Addresses (Base — Happy Path)

| Contract | Address |
|----------|---------|
| **FusionFactory** | `0x1455717668fA96534f675856347A973fA907e922` |
| **Erc4626SupplyFuse (slot 1)** | `0xbe8ab5217F4f251E4A667650fc34a63035C231a8` |
| **Erc4626SupplyFuse (slot 2)** | `0xed5Ec535e6e6a3051105A8Ea2E8Bd178951A9EAc` |
| **Erc4626SupplyFuse (slot 3)** | `0xdA0711a0b1B1dD289c4D7C08704Dd1e4cceA80C1` |
| **Erc4626SupplyFuse (slot 4)** | `0xb187050408857FC2a57be0a5618e39b331425E77` |
| **Erc4626BalanceFuse (slot 1)** | `0x7F4D9EFdE7EfEBBAFbb506ca3f711764cBc96391` |
| **Erc4626BalanceFuse (slot 2)** | `0x3Dfe25F60191AAee4213080398D2Fdf65EC3CF2F` |
| **Erc4626BalanceFuse (slot 3)** | `0xfEe84b6AF26a481C1819655dAde5f5588416e19f` |
| **Erc4626BalanceFuse (slot 4)** | `0x903c1ABb5A303Cf717196e8d12CE87F46dE56719` |
| **UniversalTokenSwapperFuse** | `0xdBc5f9962CE85749F1b3c51BA0473909229E3807` |
| **Odos Router (Base)** | `0x19cEeAd7105607Cd444F5ad10dd51356436095a1` |
| **KyberSwap Router (Base)** | `0x6131B5fae19EA4f9D964eAc0408E4408b66337b5` |
| **Velora/Paraswap Router (Base)** | TBD — research during implementation |
| **YoGateway** | `0xF1EeE0957267b1A474323Ff9CfF7719E964969FA` |

### YO Vault Addresses (Base)

| Vault | Address | Underlying | Decimals |
|-------|---------|-----------|----------|
| yoUSD | `0x0000000f2eb9f69274678c76222b35eec7588a65` | USDC | 6 |
| yoETH | `0x3a43aec53490cb9fa922847385d82fe25d0e9de7` | WETH | 18 |
| yoBTC | `0xbcbc8cb4d1e8ed048a6276a5e94a3e952660bcbc` | cbBTC | 8 |
| yoEUR | `0x50c749ae210d3977adc824ae11f3c7fd10c871e9` | EURC | 6 |

## Vault Creation Transaction Sequence

After user clicks "Create Treasury", the following transactions execute sequentially:

```
TX 1: FusionFactory.clone(name, symbol, underlyingToken=USDC, 1, owner, 0)
       → Creates PlasmaVault + AccessManager + all managers
       → Returns FusionInstance with vault + accessManager addresses
       → User gets OWNER_ROLE automatically

TX 2: AccessManager.grantRole(ATOMIST_ROLE=100, user, 0)
TX 3: AccessManager.grantRole(FUSE_MANAGER_ROLE=300, user, 0)
TX 4: AccessManager.grantRole(ALPHA_ROLE=200, user, 0)
TX 5: AccessManager.grantRole(WHITELIST_ROLE=800, user, 0)

TX 6: PlasmaVault.addFuses([
         erc4626SupplyFuse_slot1,
         erc4626SupplyFuse_slot2,
         erc4626SupplyFuse_slot3,
         erc4626SupplyFuse_slot4,
         universalTokenSwapperFuse
       ])

TX 7: PlasmaVault.addBalanceFuse(100001n, erc4626BalanceFuse_slot1)
TX 8: PlasmaVault.addBalanceFuse(100002n, erc4626BalanceFuse_slot2)
TX 9: PlasmaVault.addBalanceFuse(100003n, erc4626BalanceFuse_slot3)
TX 10: PlasmaVault.addBalanceFuse(100004n, erc4626BalanceFuse_slot4)

TX 11: PlasmaVault.grantMarketSubstrates(100001n, [pad(yoUSD)])
TX 12: PlasmaVault.grantMarketSubstrates(100002n, [pad(yoETH)])
TX 13: PlasmaVault.grantMarketSubstrates(100003n, [pad(yoBTC)])
TX 14: PlasmaVault.grantMarketSubstrates(100004n, [pad(yoEUR)])
TX 15: PlasmaVault.grantMarketSubstrates(swapMarketId, [
         pad(USDC), pad(WETH), pad(cbBTC), pad(EURC),
         pad(OdosRouter), pad(KyberSwapRouter), pad(VeloraRouter)
       ])

TX 16: PlasmaVault.updateDependencyBalanceGraphs(
         [100001n, 100002n, 100003n, 100004n], [[], [], [], []]
       )
```

**Note**: No `convertToPublicVault()` — vault remains non-public. Only the user (with WHITELIST_ROLE) can deposit. This is by design and is irreversible if public.

**Optimization**: Many of these can be batched:
- TXs 2-5 could be combined if AccessManager supports multicall
- TXs 7-10 and 11-15 could potentially use batch variants
- For hackathon: sequential is fine, wrap in a stepper UI showing progress

## AI Agent Architecture

### Agent: `yo-treasury-agent`

Based on existing `alphaAgent` pattern from `packages/mastra/src/agents/alpha-agent.ts`.

**Scope**: The agent handles **alpha actions only** — allocating to YO vaults, swapping assets, withdrawing from YO vaults, and viewing vault data. Deposit into treasury and withdraw from treasury are handled by standard web UI forms.

**Working Memory Schema:**
```typescript
{
  treasuryVaultAddress: string,       // user's PlasmaVault address
  treasuryChainId: number,            // current chain
  pendingActions: PendingAction[],    // accumulated fuse actions
}
```

### Tools (8 total)

| Tool | Purpose | Data Source | Output Type |
|------|---------|-------------|-------------|
| `getYoVaultsTool` | List available YO vaults with APY/TVL | `@yo-protocol/core` getVaultSnapshot | `yo-vaults` |
| `getYoVaultDetailsTool` | Deep dive on a specific vault | `@yo-protocol/core` getVaultState + snapshot | `yo-vault-details` |
| `getTreasuryAllocationTool` | Read user's Fusion vault allocation | `@ipor/fusion-sdk` readVaultBalances | `treasury-allocation` |
| `createAllocationActionTool` | Create Erc4626SupplyFuse.enter FuseAction | `@ipor/fusion-sdk` + simulation | `action-with-simulation` |
| `createWithdrawActionTool` | Create Erc4626SupplyFuse.exit FuseAction | `@ipor/fusion-sdk` + simulation | `action-with-simulation` |
| `createSwapActionTool` | Create UniversalTokenSwapperFuse.enter FuseAction | Odos/KyberSwap/Velora API + fusion-sdk | `action-with-simulation` |
| `displayPendingActionsTool` | Show accumulated pending actions | working memory | `pending-actions` |
| `executePendingActionsTool` | Flatten and send to UI for signing | working memory | `execute-actions` |

### Swap Action Flow (createSwapActionTool)

```
1. Agent receives: "Swap 500 USDC to WETH"
2. Tool calls Odos API: POST https://api.odos.xyz/sor/quote/v2
   - tokenIn: USDC, tokenOut: WETH, amount: 500e6
   - Returns: { pathId, outAmounts, gasEstimate }
3. Tool calls Odos API: POST https://api.odos.xyz/sor/assemble
   - pathId from quote
   - Returns: { to: OdosRouter, data: swapCalldata }
4. Tool encodes UniversalTokenSwapperFuse.enter({
     tokenIn: USDC_ADDRESS,
     tokenOut: WETH_ADDRESS,
     amountIn: 500000000n,
     data: {
       targets: [OdosRouter],
       data: [swapCalldata]
     }
   })
5. Returns FuseAction { fuse: universalSwapFuseAddress, data: encodedCalldata }
6. Agent may chain with allocation: add Erc4626SupplyFuse.enter for yoETH
7. Both actions go into pendingActions
8. On execute: PlasmaVault.execute([swapAction, allocateAction]) — single tx
```

**Fallback**: If Odos fails, try KyberSwap or Velora (Paraswap) APIs.

### Compound Actions (Swap + Allocate)

The agent can compose multi-step actions into a single `PlasmaVault.execute()` call:

```
User: "Swap 500 USDC to WETH and put it in yoETH"

→ FuseAction[0]: UniversalTokenSwapperFuse.enter(USDC→WETH via Odos)
→ FuseAction[1]: Erc4626SupplyFuse.enter(yoETH, WETH amount)
→ PlasmaVault.execute([action0, action1]) — atomically in one tx
```

## Frontend Architecture

### Component Tree

```
YoTreasuryApp (new page at packages/web/src/app/yo-treasury/)
├── OnboardingFlow (if no vault detected)
│   ├── ChainSelector (Base/Ethereum/Arbitrum)
│   ├── CreateVaultStepper
│   │   ├── Step 1: FusionFactory.clone()
│   │   ├── Step 2: Grant roles (incl. WHITELIST_ROLE)
│   │   ├── Step 3: Add fuses
│   │   ├── Step 4: Configure substrates
│   │   └── Step 5: Ready!
│   └── FirstDepositPrompt (USDC deposit form)
│
├── TreasuryDashboard (primary view, if vault exists with balance)
│   ├── PortfolioSummary
│   │   ├── TotalValue (USD)
│   │   ├── UnallocatedBalance (USDC in vault)
│   │   └── AllocationBreakdown (per YO vault: shares, value, APR, %)
│   ├── YoVaultsOverview (available vaults with APR, TVL)
│   ├── DepositForm (USDC deposit into treasury — web UI)
│   └── WithdrawForm (USDC withdraw from treasury — web UI)
│
├── TreasuryChat (secondary view, alpha actions)
│   ├── ChatInterface (reuse vault-alpha.tsx useChat pattern)
│   └── ToolRenderers (switch on output type)
│       ├── YoVaultsList → renders vault cards with APY/TVL
│       ├── YoVaultDetail → deep dive card
│       ├── TreasuryAllocation → allocation pie/table
│       ├── SwapPreview → swap route visualization
│       ├── ActionWithSimulation → balance diff
│       ├── PendingActionsList → action queue
│       └── ExecuteActions → 5-step tx executor
│
└── WalletProvider (existing wagmi from packages/web — already configured for multi-chain)
```

### API Routes

| Route | Purpose |
|-------|---------|
| `POST /api/yo/treasury/chat` | Stream agent responses (same pattern as alpha chat) |

### Reuse from Existing Codebase

| Component | Source | Modification Needed |
|-----------|--------|-------------------|
| `useChat` + streaming | `vault-alpha.tsx` | Change API endpoint, add vault context |
| `AlphaToolRenderer` switch | `alpha-tool-renderer.tsx` | Add new type cases for YO tools |
| `ExecuteActions` 5-step flow | `execute-actions.tsx` | Reuse as-is — already handles PlasmaVault.execute() |
| `SimulationBalanceComparison` | `simulation-balance-comparison.tsx` | Reuse as-is |
| `PendingActionsList` | `pending-actions-list.tsx` | Reuse as-is |
| Anvil fork simulation | `simulate-on-fork.ts` | Reuse as-is |
| viem client management | `viem-clients.ts` | Reuse as-is |
| wagmi config | `packages/web` | Add chain configs if needed |
| `PlasmaVault` class | `@ipor/fusion-sdk` | Reuse for balance reads, role checks |
| `substrateToAddress` | `@ipor/fusion-sdk` | Reuse as-is |
| `MARKET_ID` constants | `@ipor/fusion-sdk` | Reuse ERC4626_0001–0004, UNIVERSAL_TOKEN_SWAPPER |
| `ACCESS_MANAGER_ROLE` | `@ipor/fusion-sdk` | Reuse for WHITELIST_ROLE (800n) etc. |
| `FuseAction` type | `@ipor/fusion-sdk` | Reuse as-is |

### New Files Needed (all in `packages/web/src/yo-treasury/`)

| File | Purpose |
|------|---------|
| `constants/addresses.ts` | All contract addresses per chain (factory, fuses, YO vaults, tokens, routers) |
| `constants/abis.ts` | ABIs not already in `@ipor/fusion-sdk` (fusionFactory, erc4626SupplyFuse, universalTokenSwapperFuse) |
| `lib/create-vault.ts` | Vault creation tx config builders (used by CreateVaultFlow + fork tests) |
| `components/create-vault-flow.tsx` | Multi-step vault creation with tx tracking |
| `components/first-deposit-prompt.tsx` | USDC deposit form after vault creation |
| `components/treasury-dashboard.tsx` | Primary view — portfolio dashboard |
| `components/portfolio-summary.tsx` | Dashboard showing total value, allocations |
| `components/allocation-breakdown.tsx` | Per-YO-vault positions with APR |
| `components/yo-vaults-overview.tsx` | Available YO vaults with APR/TVL |
| `components/deposit-form.tsx` | Standard USDC deposit into treasury |
| `components/withdraw-form.tsx` | Standard USDC withdraw from treasury |
| `components/treasury-chat.tsx` | Chat UI (copy vault-alpha.tsx pattern) |
| `components/yo-tool-renderer.tsx` | Tool output switch (copy alpha-tool-renderer.tsx pattern) |
| `components/yo-vaults-list.tsx` | YO vault cards (chat renderer) |
| `components/treasury-allocation.tsx` | Allocation breakdown across YO vaults (chat renderer) |
| `components/swap-preview.tsx` | Swap route, expected output, slippage (chat renderer) |
| `components/chain-selector.tsx` | Pick chain for vault creation |
