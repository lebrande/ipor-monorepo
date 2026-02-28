# YO Treasury — Technical Architecture

## System Overview

```
+-------------------+     +------------------+     +------------------+
|   User Browser    |     |   Next.js API    |     |   Mastra Agent   |
|                   |     |                  |     |                  |
| Chat UI           |---->| POST /api/yo/    |---->| yo-treasury-     |
| (vault-alpha      |     |   treasury/chat  |     |   agent          |
|  pattern)         |<----|                  |<----| (6-8 tools)      |
|                   |     +------------------+     +------------------+
| Tool Renderers    |                                     |
| - YoVaultCard     |                                     |
| - AllocationView  |                              +------+------+
| - SwapPreview     |                              |             |
| - SimulationDiff  |                        @yo-protocol  @ipor/fusion
| - ExecuteActions  |                          /core SDK      -sdk
|                   |                              |             |
| Onboarding Flow   |                              v             v
| - CreateVault     |                        +------------------+
| - ConfigureFuses  |                        |  On-Chain        |
| - GrantRoles      |                        |                  |
+-------------------+                        | FusionFactory    |
        |                                    | PlasmaVault      |
        | wagmi/viem                         | Erc4626SupplyFuse|
        |                                    | UniversalSwapFuse|
        v                                    | YO Vaults        |
+-------------------+                        | (yoUSD/yoETH/..)|
|  User's Wallet    |                        +------------------+
|  (MetaMask, etc.) |
+-------------------+
```

## On-Chain Architecture

### Per-User Vault Stack (created by FusionFactory.clone())

```
User's PlasmaVault (ERC4626)
├── AccessManager (IporFusionAccessManager)
│   ├── OWNER_ROLE (200) → User
│   ├── ATOMIST_ROLE (100) → User
│   ├── ALPHA_ROLE (200) → User
│   └── FUSE_MANAGER_ROLE (300) → User
│
├── Installed Fuses
│   ├── Erc4626SupplyFuse (market ERC4626_0001) → yoUSD
│   ├── Erc4626SupplyFuse (market ERC4626_0002) → yoETH
│   ├── Erc4626SupplyFuse (market ERC4626_0003) → yoBTC
│   ├── Erc4626SupplyFuse (market ERC4626_0004) → yoEUR
│   └── UniversalTokenSwapperFuse (market for swaps) → Odos/KyberSwap
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
│   └── Swap market: [USDC, WETH, cbBTC, EURC, Odos router, KyberSwap router]
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
| **Erc4626SupplyFuse (slot 3)** | See config for ERC4626_0003 |
| **Erc4626SupplyFuse (slot 4)** | See config for ERC4626_0004 |
| **Erc4626BalanceFuse (slot 1)** | `0x7F4D9EFdE7EfEBBAFbb506ca3f711764cBc96391` |
| **UniversalTokenSwapperFuse** | `0xdBc5f9962CE85749F1b3c51BA0473909229E3807` |
| **Odos Router (Base)** | `0x19cEeAd7105607Cd444F5ad10dd51356436095a1` |
| **KyberSwap Router (Base)** | `0x6131B5fae19EA4f9D964eAc0408E4408b66337b5` |
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
TX 1: FusionFactory.clone(name, symbol, underlyingToken, 1, owner, 0)
       → Creates PlasmaVault + AccessManager + all managers
       → Returns FusionInstance with vault + accessManager addresses
       → User gets OWNER_ROLE automatically

TX 2: AccessManager.grantRole(ATOMIST_ROLE=100, user, 0)
TX 3: AccessManager.grantRole(FUSE_MANAGER_ROLE=300, user, 0)
TX 4: AccessManager.grantRole(ALPHA_ROLE=200, user, 0)

TX 5: PlasmaVault.addFuses([
         erc4626SupplyFuse_slot1,
         erc4626SupplyFuse_slot2,
         erc4626SupplyFuse_slot3,
         erc4626SupplyFuse_slot4,
         universalTokenSwapperFuse
       ])

TX 6: PlasmaVault.addBalanceFuse(100001n, erc4626BalanceFuse_slot1)
TX 7: PlasmaVault.addBalanceFuse(100002n, erc4626BalanceFuse_slot2)
TX 8: PlasmaVault.addBalanceFuse(100003n, erc4626BalanceFuse_slot3)
TX 9: PlasmaVault.addBalanceFuse(100004n, erc4626BalanceFuse_slot4)

TX 10: PlasmaVault.grantMarketSubstrates(100001n, [pad(yoUSD)])
TX 11: PlasmaVault.grantMarketSubstrates(100002n, [pad(yoETH)])
TX 12: PlasmaVault.grantMarketSubstrates(100003n, [pad(yoBTC)])
TX 13: PlasmaVault.grantMarketSubstrates(100004n, [pad(yoEUR)])
TX 14: PlasmaVault.grantMarketSubstrates(swapMarketId, [
         pad(USDC), pad(WETH), pad(cbBTC), pad(EURC),
         pad(OdosRouter), pad(KyberSwapRouter)
       ])

TX 15: PlasmaVault.updateDependencyBalanceGraphs(
         [100001n, 100002n, 100003n, 100004n], [[], [], [], []]
       )

TX 16: PlasmaVault.convertToPublicVault()
```

**Optimization**: Many of these can be batched:
- TXs 2-4 could be combined if AccessManager supports multicall
- TXs 6-9 and 10-14 could potentially use batch variants
- For hackathon: sequential is fine, wrap in a stepper UI showing progress

## AI Agent Architecture

### Agent: `yo-treasury-agent`

Based on existing `alphaAgent` pattern from `packages/mastra/src/agents/alpha-agent.ts`.

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
| `createSwapActionTool` | Create UniversalTokenSwapperFuse.enter FuseAction | Odos/KyberSwap API + fusion-sdk | `action-with-simulation` |
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
YoTreasuryApp (new Next.js page)
├── OnboardingFlow (if no vault detected)
│   ├── ChainSelector (Base/Ethereum/Arbitrum)
│   ├── CreateVaultStepper
│   │   ├── Step 1: FusionFactory.clone()
│   │   ├── Step 2: Grant roles
│   │   ├── Step 3: Add fuses
│   │   ├── Step 4: Configure substrates
│   │   └── Step 5: Convert to public
│   └── VaultCreatedSuccess
│
├── TreasuryChat (main view, if vault exists)
│   ├── ChatInterface (reuse vault-alpha.tsx useChat pattern)
│   ├── AllocationSidebar (optional, minimal)
│   │   ├── TotalValue
│   │   └── AllocationBreakdown (per YO vault)
│   └── ToolRenderers (switch on output type)
│       ├── YoVaultsList → renders vault cards with APY/TVL
│       ├── YoVaultDetail → deep dive card
│       ├── TreasuryAllocation → allocation pie/table
│       ├── SwapPreview → swap route visualization
│       ├── ActionWithSimulation → balance diff
│       ├── PendingActionsList → action queue
│       └── ExecuteActions → 5-step tx executor
│
└── WalletProvider (wagmi, multi-chain)
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

### New Components Needed

| Component | Purpose |
|-----------|---------|
| `CreateVaultStepper` | Multi-step vault creation with tx tracking |
| `YoVaultCard` | Displays YO vault APY, TVL, underlying |
| `TreasuryAllocation` | Shows allocation breakdown across YO vaults |
| `SwapPreview` | Shows swap route, expected output, slippage |
| `ChainSelector` | Pick chain for vault creation |
