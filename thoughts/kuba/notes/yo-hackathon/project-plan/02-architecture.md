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
│   ├── Erc4626SupplyFuse (market ERC4626_0001) → yoUSD  (deposit only)
│   ├── Erc4626SupplyFuse (market ERC4626_0002) → yoETH  (deposit only)
│   ├── Erc4626SupplyFuse (market ERC4626_0003) → yoBTC  (deposit only)
│   ├── Erc4626SupplyFuse (market ERC4626_0004) → yoEUR  (deposit only)
│   ├── YoRedeemFuse (market ERC4626_0001) → yoUSD withdrawal via redeem()
│   │   NOTE: Erc4626SupplyFuse.exit() calls withdraw() which YO vaults disable.
│   │   YoRedeemFuse calls redeem() instead. One instance per market needed.
│   │   Deploy to Base only when real transactions are needed (Phase 3).
│   └── UniversalTokenSwapperFuse (market for swaps) → Odos/KyberSwap/Velora
│
├── Balance Fuses (one per market, for portfolio tracking)
│   ├── Erc4626BalanceFuse (market ERC4626_0001)
│   ├── Erc4626BalanceFuse (market ERC4626_0002)
│   ├── Erc4626BalanceFuse (market ERC4626_0003)
│   ├── Erc4626BalanceFuse (market ERC4626_0004)
│   └── ZeroBalanceFuse (market UNIVERSAL_TOKEN_SWAPPER = 12)  ← REQUIRED!
│
│   **IMPORTANT**: The ZeroBalanceFuse for the swap market is REQUIRED. After PlasmaVault.execute()
│   delegatecalls a fuse, it calls _updateMarketsBalances() for each touched market. Without a
│   balance fuse for market 12, this reverts with AddressEmptyCode(address(0)).
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
| **Uniswap V3 SwapRouter02** | `0x2626664c2603336E57B271c5C0b26F421741e481` |
| **SwapExecutor** | `0x591435c065fce9713c8B112fcBf5Af98b8975cB3` |
| **YoRedeemFuse (slot 1, yoUSD)** | `0x6f7248f6d057e5f775a2608a71e1b0050b1adb95` |
| **YoRedeemFuse (slot 2, yoETH)** | `0xaebd1bab51368b0382a3f963468cab3edc524e5d` |
| **YoRedeemFuse (slot 3, yoBTC)** | `0x5760089c08a2b805760f0f86e867bffa9543aa41` |
| **YoRedeemFuse (slot 4, yoEUR)** | `0x7CB5E0e8083392EdEB4AaF68838215A3dD1831e5` |
| **ZeroBalanceFuse(12)** | `0x706ca1cA4EcE9CF23301D6AB35ce6fb7Cf25DA15` |
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
       Note: The deployed FusionFactory on Base has 6 params (including daoFeePackageIndex).
       The local source at external/ipor-fusion/contracts/factory/FusionFactory.sol has only 5 — it's outdated.
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
         universalTokenSwapperFuse,
         yoRedeemFuse  // calls redeem() instead of withdraw() — needed for YO vault exits
       ])

TX 7: PlasmaVault.addBalanceFuse(100001n, erc4626BalanceFuse_slot1)
TX 8: PlasmaVault.addBalanceFuse(100002n, erc4626BalanceFuse_slot2)
TX 9: PlasmaVault.addBalanceFuse(100003n, erc4626BalanceFuse_slot3)
TX 10: PlasmaVault.addBalanceFuse(100004n, erc4626BalanceFuse_slot4)
TX 10b: PlasmaVault.addBalanceFuse(12n, zeroBalanceFuse)  ← swap market balance fuse

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

### Demo Vault (Deployed)

A fully configured demo vault exists on Base:
- **Address**: `0x09d1C2E03F73853916Ee86b4e1A729F9FbAA960D`
- **Chain**: Base (8453)
- **Start block**: 43046896
- **Dashboard**: http://localhost:3000/vaults/8453/0x09d1C2E03F73853916Ee86b4e1A729F9FbAA960D
- **Status**: All 17 transactions completed — clone, roles, fuses, balance fuses, substrates, dependency graphs
- **Registered in**: `plasma-vaults.json` as "YO Treasury"

### Known Limitations (Discovered During Implementation)

1. **YoVault.withdraw() is disabled** — Permanently reverts with `Errors.UseRequestRedeem()`.
   The `Erc4626SupplyFuse.exit()` calls `IERC4626.withdraw()`, hitting this revert.
   **SOLVED**: Created `YoRedeemFuse` — a standalone Solidity fuse compiled with Hardhat (0.8.28)
   that calls `redeem()` instead of `withdraw()`. Share-denominated exit, caps at actual balance,
   reverts with `AsyncRedemptionNotSupported()` if redemption returns 0.
   - Source: `packages/hardhat-tests/contracts/YoRedeemFuse.sol`
   - ABI: `packages/sdk/src/markets/yo/abi/yo-redeem-fuse.abi.ts` (exported as `yoRedeemFuseAbi`)
   - **Deployed to Base** — 4 instances (one per market slot), addresses in `yo.addresses.ts`.

2. **YoVault.redeem() requires msg.sender == owner** — The PlasmaVault can only redeem
   if it's the share owner (which it is after allocating via Erc4626SupplyFuse.enter).
   **SOLVED**: YoRedeemFuse runs via delegatecall from PlasmaVault, so `address(this)` = PlasmaVault
   = share owner, satisfying YoVault's owner check. No impersonation needed.

3. **PriceOracleMiddleware** — The UniversalTokenSwapperFuse checks slippage via the vault's
   price oracle. Factory-cloned vaults come with a PriceManager but it may not have feeds
   configured for all token pairs. This didn't block the POC tests.

4. **Local Solidity source is outdated** — `external/ipor-fusion/contracts/factory/FusionFactory.sol`
   shows 5 params for `clone()`, but the deployed contract on Base has 6
   (includes `daoFeePackageIndex_`).

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
| `createWithdrawActionTool` | Create YoRedeemFuse.exit FuseAction (redeem, not withdraw) | `@ipor/fusion-sdk` + simulation | `action-with-simulation` |
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

### Component Tree (Actual Implementation)

```
/vaults/[chainId]/[address]/yo (Next.js page)
└── YoTreasuryTab (yo-treasury-tab.tsx) — entry point, font-yo container
    ├── TreasuryDashboard (treasury-dashboard.tsx) — full width, primary view
    │   ├── Hooks:
    │   │   ├── useVaultReads(chainId, vaultAddress, userAddress) — shared on-chain reads + oracle pricing
    │   │   ├── useTreasuryPositions(chainId, treasuryAddress, assetAddress) — wagmi multicall for YO vault shares + convertToAssets
    │   │   └── useYoVaultsData(chainId) — @yo-protocol/core getVaults() → APR/TVL
    │   ├── PortfolioSummary (portfolio-summary.tsx) — 4 stat cards
    │   │   ├── Total Value (USD, neon green accent)
    │   │   ├── Allocated (sum of positions)
    │   │   ├── Unallocated (USDC balance)
    │   │   └── Active Vaults (X/4 count)
    │   └── AllocationTable (allocation-table.tsx) — merged on-chain + API data
    │       ├── Vault column (color dot + logo + name + underlying)
    │       ├── APR column (text-yo-neon)
    │       ├── TVL column
    │       ├── Position column
    │       └── Status column (Active/Inactive badges)
    │
    ├── TreasuryChat (treasury-chat.tsx) — flex-1, secondary view
    │   ├── useChat → POST /api/yo/treasury/chat
    │   └── YoToolRenderer (yo-tool-renderer.tsx) — switch on type
    │       ├── 'yo-vaults' → YoVaultsList (yo-vaults-list.tsx)
    │       ├── 'treasury-allocation' → TreasuryAllocation (TODO)
    │       ├── 'swap-preview' → SwapPreview (TODO)
    │       ├── 'action-with-simulation' → ActionWithSimulation (reused from alpha)
    │       ├── 'pending-actions' → PendingActionsList (reused from alpha)
    │       └── 'execute-actions' → ExecuteActions 5-step flow (reused from alpha)
    │
    └── Forms (w-full lg:w-80, sticky sidebar on desktop)
        ├── DepositForm (deposit-form.tsx) — approve + deposit, uses useVaultReads
        └── WithdrawForm (withdraw-form.tsx) — redeem, isMax flag, uses useVaultReads

/yo-treasury/create (standalone page)
└── CreateVaultFlow — 6-step wagmi decomposition (FSN-0055)
    ├── CloneVaultStep — FusionFactory.clone()
    ├── GrantRolesStep — 4 grantRole txs (reads hasRole, skips if granted)
    ├── AddFusesStep — addFuses([9 fuses])
    ├── AddBalanceFusesStep — 5 addBalanceFuse txs
    ├── ConfigureSubstratesStep — 5 grantMarketSubstrates txs
    └── UpdateDepsStep — updateDependencyBalanceGraphs

WalletProvider (existing wagmi — already configured for multi-chain)
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

### Files Created (all in `packages/web/src/yo-treasury/`)

| File | Status | Purpose |
|------|--------|---------|
| `hooks/use-vault-reads.ts` | DONE | Shared on-chain reads (asset, decimals, symbol, balance, oracle price) |
| `hooks/use-treasury-positions.ts` | DONE | Wagmi multicall — YO vault share balances + convertToAssets |
| `hooks/use-yo-vaults-data.ts` | DONE | `@yo-protocol/core` getVaults() → APR/TVL + getPrices() |
| `components/treasury-dashboard.tsx` | DONE | Primary view — composes PortfolioSummary + AllocationTable |
| `components/portfolio-summary.tsx` | DONE | 4 stat cards (Total Value, Allocated, Unallocated, Active Vaults) |
| `components/allocation-table.tsx` | DONE | Merged on-chain positions + API data table |
| `components/deposit-form.tsx` | DONE | ERC20 approve + ERC4626 deposit flow |
| `components/withdraw-form.tsx` | DONE | ERC4626 redeem flow with isMax flag |
| `components/treasury-chat.tsx` | DONE | Chat UI (useChat + YoToolRenderer) |
| `components/yo-tool-renderer.tsx` | DONE | Tool output switch |
| `components/yo-vaults-list.tsx` | DONE | YO vault cards (chat renderer) |
| `components/yo-treasury-tab.tsx` | DONE | Entry point — dashboard-first layout |
| `components/yo-treasury-tab.stories.tsx` | DONE | Storybook story with WalletDecorator |
| `components/create-vault-flow.tsx` | DONE | 6-step vault creation (FSN-0055) |
| `components/treasury-allocation.tsx` | TODO | Allocation breakdown (chat inline renderer) |
| `components/swap-preview.tsx` | TODO | Swap route visualization (chat renderer) |
| `components/first-deposit-prompt.tsx` | STRETCH | Post-creation deposit guide |
| `components/chain-selector.tsx` | STRETCH | Chain selection for vault creation |
