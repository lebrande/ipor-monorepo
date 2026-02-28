# YO Treasury — Implementation Phases

## Phase 1: Smart Contract Setup & Vault Creation Script

### Overview
Set up the on-chain infrastructure. Create a deployment script that creates a Fusion vault on Base, configures all fuses, substrates, and roles. This script validates the entire on-chain setup before we build the UI.

### Changes Required

#### 1. Deployment Script

**File**: `packages/yo-treasury/scripts/create-vault.ts` (new)

Create a TypeScript script using viem that:

```typescript
// 1. Clone vault from factory
const tx1 = await walletClient.writeContract({
  address: FUSION_VAULT_FACTORY_ADDRESS[8453], // Base
  abi: fusionFactoryAbi,
  functionName: 'clone',
  args: ['YO Treasury', 'yoTRSY', USDC_BASE, 1n, ownerAddress, 0n],
})
// Parse PlasmaVaultCreated event → vaultAddress, accessManagerAddress

// 2. Grant roles to owner
for (const role of [ATOMIST_ROLE, FUSE_MANAGER_ROLE, ALPHA_ROLE]) {
  await walletClient.writeContract({
    address: accessManagerAddress,
    abi: accessManagerAbi,
    functionName: 'grantRole',
    args: [role, ownerAddress, 0],
  })
}

// 3. Add fuses
await walletClient.writeContract({
  address: vaultAddress,
  abi: plasmaVaultAbi,
  functionName: 'addFuses',
  args: [[
    ERC4626_SUPPLY_FUSE_SLOT1_BASE,  // for yoUSD
    ERC4626_SUPPLY_FUSE_SLOT2_BASE,  // for yoETH
    ERC4626_SUPPLY_FUSE_SLOT3_BASE,  // for yoBTC
    ERC4626_SUPPLY_FUSE_SLOT4_BASE,  // for yoEUR
    UNIVERSAL_TOKEN_SWAPPER_FUSE_BASE,
  ]],
})

// 4. Add balance fuses (one per ERC4626 market)
for (const { marketId, balanceFuse } of erc4626Markets) {
  await walletClient.writeContract({
    address: vaultAddress,
    abi: plasmaVaultAbi,
    functionName: 'addBalanceFuse',
    args: [marketId, balanceFuse],
  })
}

// 5. Whitelist YO vault addresses as substrates
await walletClient.writeContract({
  address: vaultAddress,
  abi: plasmaVaultAbi,
  functionName: 'grantMarketSubstrates',
  args: [ERC4626_0001_MARKET_ID, [pad(YO_USD_BASE, { size: 32 })]],
})
// ... repeat for yoETH, yoBTC, yoEUR

// 6. Whitelist swap tokens + routers as substrates
await walletClient.writeContract({
  address: vaultAddress,
  abi: plasmaVaultAbi,
  functionName: 'grantMarketSubstrates',
  args: [SWAP_MARKET_ID, [
    pad(USDC_BASE, { size: 32 }),
    pad(WETH_BASE, { size: 32 }),
    pad(CBBTC_BASE, { size: 32 }),
    pad(EURC_BASE, { size: 32 }),
    pad(ODOS_ROUTER_BASE, { size: 32 }),
    pad(KYBERSWAP_ROUTER_BASE, { size: 32 }),
  ]],
})

// 7. Set dependency balance graphs
await walletClient.writeContract({
  address: vaultAddress,
  abi: plasmaVaultAbi,
  functionName: 'updateDependencyBalanceGraphs',
  args: [[100001n, 100002n, 100003n, 100004n], [[], [], [], []]],
})

// 8. Convert to public vault
await walletClient.writeContract({
  address: vaultAddress,
  abi: plasmaVaultAbi,
  functionName: 'convertToPublicVault',
  args: [],
})
```

#### 2. Address Constants

**File**: `packages/yo-treasury/src/constants/addresses.ts` (new)

Central registry of all contract addresses per chain:
- FusionFactory addresses (Base, Ethereum, Arbitrum)
- ERC4626SupplyFuse addresses per slot per chain
- ERC4626BalanceFuse addresses per slot per chain
- UniversalTokenSwapperFuse addresses per chain
- YO vault addresses per chain
- Token addresses per chain (USDC, WETH, cbBTC, EURC)
- Swap router addresses per chain (Odos, KyberSwap)

#### 3. ABIs

**File**: `packages/yo-treasury/src/constants/abis.ts` (new)

Collect needed ABIs:
- `fusionFactoryAbi` (clone function)
- `plasmaVaultFactoryAbi` (PlasmaVaultCreated event)
- `accessManagerAbi` (grantRole)
- `plasmaVaultAbi` (addFuses, addBalanceFuse, grantMarketSubstrates, updateDependencyBalanceGraphs, convertToPublicVault, execute, deposit, withdraw)
- `erc4626SupplyFuseAbi` (enter, exit)
- `universalTokenSwapperFuseAbi` (enter)
- `erc4626BalanceFuseAbi` (balanceOf)

### Success Criteria

#### Automated Verification:
- [ ] Script runs successfully on Base: `pnpm tsx scripts/create-vault.ts`
- [ ] Vault is created and address logged
- [ ] All roles granted (verify with `hasRole` read)
- [ ] All fuses installed (verify with `getInstallationStatus` or similar)
- [ ] Test deposit of 1 USDC into the vault works
- [ ] Test `PlasmaVault.execute([Erc4626SupplyFuse.enter(yoUSD, 1 USDC)])` works

#### Manual Verification:
- [ ] Vault visible on Base block explorer
- [ ] YO vault shares appear in vault balance after test allocation

---

## Phase 2: AI Agent (Mastra)

### Overview
Build the `yo-treasury-agent` with tools that read YO vault data, read Fusion vault allocation, create allocation/withdrawal/swap actions, simulate on Anvil, and pass to UI for execution.

### Changes Required

#### 1. Agent Definition

**File**: `packages/mastra/src/agents/yo-treasury-agent.ts` (new)

```typescript
import { Agent } from '@mastra/core/agent'
// ... imports

const yoTreasuryWorkingMemorySchema = z.object({
  pendingActions: z.array(pendingActionSchema).default([]),
})

export const yoTreasuryAgent = new Agent({
  id: 'yo-treasury-agent',
  model: env.MODEL,
  instructions: `You are a personal treasury copilot...`, // detailed system prompt
  tools: {
    getYoVaultsTool,
    getYoVaultDetailsTool,
    getTreasuryAllocationTool,
    createAllocationActionTool,
    createWithdrawActionTool,
    createSwapActionTool,
    displayPendingActionsTool,
    executePendingActionsTool,
  },
})
```

System prompt includes:
- Role: Personal treasury advisor managing a Fusion vault
- Available vaults by chain with current addresses
- How to read vault state (getYoVaults → allocation → suggest)
- Swap instructions: always swap before allocating cross-asset
- Action workflow: read → plan → create actions (with simulation) → display → execute
- Working memory rules (same as alpha agent)
- Always use tools, never describe tool output in text

#### 2. YO Vault Data Tools

**File**: `packages/mastra/src/tools/yo-treasury/get-yo-vaults.ts` (new)

```typescript
// Uses @yo-protocol/core
import { createYoClient } from '@yo-protocol/core'

export const getYoVaultsTool = createTool({
  id: 'getYoVaults',
  inputSchema: z.object({ chainId: z.number() }),
  execute: async ({ context }) => {
    const client = createYoClient({ chainId: context.chainId })
    const vaults = client.getVaults()
    const snapshots = await Promise.all(
      vaults.map(v => client.getVaultSnapshot(v.address))
    )
    return {
      type: 'yo-vaults' as const,
      vaults: vaults.map((v, i) => ({
        id: v.id, name: v.name, address: v.address,
        underlying: v.underlying.symbol,
        apy7d: snapshots[i]?.stats?.yield?.['7d'],
        tvl: snapshots[i]?.stats?.tvl?.formatted,
        yieldSources: snapshots[i]?.stats?.yieldSources,
      })),
    }
  },
})
```

**File**: `packages/mastra/src/tools/yo-treasury/get-yo-vault-details.ts` (new)

Deep dive tool using `getVaultState()` + `getVaultSnapshot()` + `getVaultYieldHistory()`.

#### 3. Treasury Allocation Tool

**File**: `packages/mastra/src/tools/yo-treasury/get-treasury-allocation.ts` (new)

Reads the Fusion vault's market balances using `@ipor/fusion-sdk`:
- ERC20 substrates (unallocated tokens)
- Per-market positions (ERC4626 markets → YO vault share positions)
- Converts to USD values using price oracle

Returns `type: 'treasury-allocation'` with:
```typescript
{
  unallocated: { token, balance, usdValue }[],
  allocations: { yoVault, shares, assetValue, usdValue, apy }[],
  totalUsdValue: string,
}
```

#### 4. Allocation Action Tool

**File**: `packages/mastra/src/tools/yo-treasury/create-allocation-action.ts` (new)

Creates Erc4626SupplyFuse.enter FuseAction:
```typescript
const fuseAction = {
  fuse: ERC4626_SUPPLY_FUSE_ADDRESS[marketSlot][chainId],
  data: encodeFunctionData({
    abi: erc4626SupplyFuseAbi,
    functionName: 'enter',
    args: [{ vault: yoVaultAddress, vaultAssetAmount: amount }],
  }),
}
```

Includes Anvil fork simulation (reuse `simulateOnFork` from alpha tools).

#### 5. Withdrawal Action Tool

**File**: `packages/mastra/src/tools/yo-treasury/create-withdraw-action.ts` (new)

Creates Erc4626SupplyFuse.exit FuseAction:
```typescript
const fuseAction = {
  fuse: ERC4626_SUPPLY_FUSE_ADDRESS[marketSlot][chainId],
  data: encodeFunctionData({
    abi: erc4626SupplyFuseAbi,
    functionName: 'exit',
    args: [{ vault: yoVaultAddress, vaultAssetAmount: amount }],
  }),
}
```

#### 6. Swap Action Tool

**File**: `packages/mastra/src/tools/yo-treasury/create-swap-action.ts` (new)

This is the most complex tool. Steps:
1. Call Odos API for swap quote (tokenIn → tokenOut)
2. Call Odos API for swap assembly (get calldata)
3. Encode UniversalTokenSwapperFuse.enter with the Odos calldata
4. Optionally chain with allocation action

```typescript
// 1. Get Odos quote
const quote = await fetch('https://api.odos.xyz/sor/quote/v2', {
  method: 'POST',
  body: JSON.stringify({
    chainId,
    inputTokens: [{ tokenAddress: tokenIn, amount: amountIn.toString() }],
    outputTokens: [{ tokenAddress: tokenOut, proportion: 1 }],
    userAddr: SWAP_EXECUTOR_ADDRESS, // the SwapExecutor contract
  }),
})

// 2. Assemble swap calldata
const assembled = await fetch('https://api.odos.xyz/sor/assemble', {
  method: 'POST',
  body: JSON.stringify({
    pathId: quote.pathId,
    userAddr: SWAP_EXECUTOR_ADDRESS,
  }),
})

// 3. Encode fuse action
const fuseAction = {
  fuse: UNIVERSAL_TOKEN_SWAPPER_FUSE_ADDRESS[chainId],
  data: encodeFunctionData({
    abi: universalTokenSwapperFuseAbi,
    functionName: 'enter',
    args: [{
      tokenIn,
      tokenOut,
      amountIn,
      data: {
        targets: [assembled.transaction.to],
        data: [assembled.transaction.data],
      },
    }],
  }),
}
```

#### 7. Reuse Existing Tools

Copy and adapt from alpha tools:
- `displayPendingActionsTool` — reuse as-is
- `executePendingActionsTool` — reuse as-is
- `simulateOnFork` — reuse as-is

#### 8. Register Agent

**File**: `packages/mastra/src/mastra/index.ts` (modify)

Add `yoTreasuryAgent` to the Mastra instance agents map.

### Success Criteria

#### Automated Verification:
- [ ] Agent instantiates without errors
- [ ] `getYoVaultsTool` returns live APY/TVL data from Base
- [ ] `getTreasuryAllocationTool` reads a test vault's balances
- [ ] `createAllocationActionTool` generates valid FuseAction calldata
- [ ] `createSwapActionTool` calls Odos API and returns valid swap calldata
- [ ] Anvil simulation works for allocation actions
- [ ] TypeScript compiles: `pnpm tsc --noEmit`

#### Manual Verification:
- [ ] Chat with agent in Mastra Studio — agent uses tools correctly
- [ ] Agent responds naturally to "What are my yield options?"
- [ ] Agent creates correct allocation actions when asked

**Implementation Note**: After completing this phase and all automated verification passes, pause here for manual confirmation.

---

## Phase 3: Frontend — Vault Creation Onboarding

### Overview
Build the in-app vault creation flow. User connects wallet, selects chain, and the app walks them through creating and configuring their personal vault.

### Changes Required

#### 1. YO Treasury Page

**File**: `packages/web/src/app/yo-treasury/page.tsx` (new)

Entry point that checks if user has an existing vault:
- If no vault → render `<CreateVaultFlow />`
- If vault exists → render `<TreasuryChat />`

Vault detection: check localStorage first, then optionally query chain.

#### 2. Create Vault Flow

**File**: `packages/web/src/yo-treasury/components/create-vault-flow.tsx` (new)

Multi-step stepper using `useContractWriteTransaction` pattern from ipor-webapp:
- Step 1: Select chain (Base recommended)
- Step 2: Confirm vault creation → FusionFactory.clone()
- Step 3: Configure vault → Grant roles + Add fuses + Configure substrates
- Step 4: Ready! → Navigate to chat

Each transaction step shows: pending → loading → done → error states.

Simplification vs ipor-webapp wizard:
- Skip strategy selection (always "YO Yield Optimizer")
- Skip fee configuration (use defaults)
- Skip alpha hire (user IS the alpha)
- Hardcode underlying as USDC (can deposit other tokens later via swap)

#### 3. Transaction Stepper Component

**File**: `packages/web/src/yo-treasury/components/vault-setup-stepper.tsx` (new)

Reusable stepper that tracks multiple sequential transactions:
```typescript
const steps = [
  { label: 'Create vault', tx: createVaultTx },
  { label: 'Grant roles', tx: grantRolesTx },
  { label: 'Install fuses', tx: addFusesTx },
  { label: 'Configure markets', tx: configureSubstratesTx },
  { label: 'Finalize', tx: convertToPublicTx },
]
```

### Success Criteria

#### Automated Verification:
- [ ] Page renders at `/yo-treasury`
- [ ] TypeScript compiles: `pnpm tsc --noEmit`
- [ ] Build succeeds: `pnpm build`

#### Manual Verification:
- [ ] Connect wallet on Base
- [ ] Walk through vault creation — all transactions succeed
- [ ] Vault address is stored and shown
- [ ] Navigates to chat after creation

**Implementation Note**: Pause here for manual testing of vault creation flow.

---

## Phase 4: Frontend — Chat UI & Tool Renderers

### Overview
Build the chat-first treasury management interface. Reuse the vault-alpha.tsx streaming chat pattern with new YO-specific tool renderers.

### Changes Required

#### 1. Treasury Chat Component

**File**: `packages/web/src/yo-treasury/components/treasury-chat.tsx` (new)

Based on `vault-alpha.tsx` pattern:
```typescript
const { messages, sendMessage, status } = useChat({
  transport: new DefaultChatTransport({
    api: `/api/yo/treasury/chat`,
    body: {
      callerAddress: walletAddress,
      vaultAddress: treasuryVaultAddress,
      chainId,
    },
  }),
})
```

#### 2. API Route

**File**: `packages/web/src/app/api/yo/treasury/chat/route.ts` (new)

Same pattern as alpha chat route:
- Validate chainId, vaultAddress
- Read { messages, callerAddress, vaultAddress, chainId } from body
- Build vault context string with vault address and chain
- Stream yoTreasuryAgent.stream(messages, { maxSteps: 5 })

#### 3. Tool Renderer

**File**: `packages/web/src/yo-treasury/components/yo-tool-renderer.tsx` (new)

Switch on `typed.type`:
```typescript
case 'yo-vaults': return <YoVaultsList vaults={typed.vaults} />
case 'yo-vault-details': return <YoVaultDetail vault={typed.vault} />
case 'treasury-allocation': return <TreasuryAllocation data={typed} />
case 'action-with-simulation': return <ActionWithSimulation ... /> // reuse existing
case 'pending-actions': return <PendingActionsList ... /> // reuse existing
case 'execute-actions': return <ExecuteActions ... /> // reuse existing
```

#### 4. New Tool Renderer Components

**File**: `packages/web/src/yo-treasury/components/yo-vaults-list.tsx` (new)

Card grid showing YO vaults:
- Vault name + logo/icon
- APY (large, highlighted)
- TVL
- Underlying asset
- "Available on: Base, Ethereum" badges

**File**: `packages/web/src/yo-treasury/components/treasury-allocation.tsx` (new)

Allocation breakdown:
- Unallocated balance (tokens sitting in vault)
- Per-YO-vault positions (shares, asset value, % of total)
- Total portfolio value in USD
- Simple bar or pie visualization

**File**: `packages/web/src/yo-treasury/components/swap-preview.tsx` (new)

Swap route visualization:
- Token in → Token out
- Exchange rate
- Slippage estimate
- Route (via Odos / KyberSwap)

#### 5. Type Definitions

**File**: `packages/mastra/src/tools/yo-treasury/types.ts` (new)

Discriminated union for all tool outputs:
```typescript
export type YoTreasuryToolOutput =
  | YoVaultsOutput           // type: 'yo-vaults'
  | YoVaultDetailsOutput     // type: 'yo-vault-details'
  | TreasuryAllocationOutput // type: 'treasury-allocation'
  | ActionWithSimulationOutput // reuse from alpha
  | PendingActionsOutput       // reuse from alpha
  | ExecuteActionsOutput       // reuse from alpha
```

Export from package.json as `@ipor/fusion-mastra/yo-treasury-types`.

### Success Criteria

#### Automated Verification:
- [ ] TypeScript compiles: `pnpm tsc --noEmit`
- [ ] Build succeeds: `pnpm build`
- [ ] API route responds to POST with streaming

#### Manual Verification:
- [ ] Chat loads with treasury context
- [ ] "What are my yield options?" → Shows YO vault cards with live data
- [ ] "Show my allocation" → Shows treasury breakdown
- [ ] "Put 100 USDC into yoUSD" → Creates action, shows simulation, signs tx
- [ ] "Swap 100 USDC to WETH" → Shows swap preview with Odos quote
- [ ] "Swap and allocate to yoETH" → Batched swap+allocate in single tx
- [ ] Transaction execution works end-to-end

**Implementation Note**: This is the core phase. Pause for thorough manual testing.

---

## Phase 5: Polish, Demo & Submission

### Overview
Polish the UX, record the demo video, prepare GitHub submission.

### Changes Required

#### 1. Branding & Styling
- Clean color scheme (differentiate from YO's black/neon green)
- Treasury-specific iconography
- Loading states and transitions
- Error handling and user-friendly error messages
- Mobile responsive layout

#### 2. Demo Script (3 minutes)

```
(0:00-0:20) Open app. "Meet YO Treasury — your personal AI-managed yield vault."
            Connect wallet on Base. Show empty state.

(0:20-0:45) "Create your Treasury." Walk through vault creation.
            Show transactions confirming. "Your personal vault is live on Base."

(0:45-1:15) Chat: "What yields can I earn?"
            Agent shows YO vaults: yoUSD at 19%, yoETH at 17%.
            "This is a real-time view from @yo-protocol/core."

(1:15-1:45) "Deposit 100 USDC into my treasury."
            Sign approve + deposit tx. Show vault balance update.

(1:45-2:15) "Allocate it all to yoUSD."
            Agent creates Erc4626SupplyFuse action, simulates, shows diff.
            Sign PlasmaVault.execute(). "My USDC is now earning 19% in yoUSD."

(2:15-2:45) "Actually, swap half to WETH and put it in yoETH."
            Agent calls Odos API, batches swap + allocate.
            Single tx: 50 USDC → WETH → yoETH. Show simulation.

(2:45-3:00) "Show my portfolio."
            Allocation view: 50% yoUSD, 50% yoETH.
            "This is DeFi savings through conversation."
```

#### 3. Submission Package
- GitHub repo (clean, well-documented README)
- 3-minute demo video
- Clear explanation of YO SDK usage
- Architecture diagram in README

### Success Criteria

#### Automated Verification:
- [ ] App builds clean: `pnpm build`
- [ ] No TypeScript errors: `pnpm tsc --noEmit`
- [ ] No lint errors: `pnpm lint`

#### Manual Verification:
- [ ] Full demo script executes without errors
- [ ] Demo video recorded and under 3 minutes
- [ ] README clearly explains the project
- [ ] GitHub repo is public and clean
