# YO Treasury — User Stories

## Epic 1: Vault Creation (Onboarding)

### US-1.1: Create Personal Treasury Vault
**As a** new user connecting their wallet,
**I want to** create my own on-chain treasury vault with one click,
**So that** I have a personal vault to manage my yield allocations.

**Acceptance Criteria:**
- User connects wallet and selects chain (Base default)
- App calls FusionFactory.clone() with user as owner
- Vault is configured with:
  - ERC4626SupplyFuse for each YO vault market slot
  - UniversalTokenSwapperFuse for swaps
  - Balance fuses for each market
  - YO vault addresses whitelisted as substrates
  - Swap router addresses whitelisted as substrates
- User receives OWNER_ROLE, ATOMIST_ROLE, ALPHA_ROLE, FUSE_MANAGER_ROLE
- Vault is converted to public (anyone can deposit — simplifies UX)
- App stores vault address locally and in URL

### US-1.2: Resume Existing Vault
**As a** returning user,
**I want to** reconnect to my existing treasury vault,
**So that** I can continue managing my allocations.

**Acceptance Criteria:**
- App checks if user has a vault on the connected chain (stored in localStorage or queried on-chain)
- If vault exists, skip creation and go straight to chat
- Works across browser sessions

---

## Epic 2: AI Copilot (Core Chat Experience)

### US-2.1: Ask About YO Vaults
**As a** user chatting with the copilot,
**I want to** ask "What are my yield options?" or "Tell me about yoUSD",
**So that** I understand available vaults before allocating.

**Acceptance Criteria:**
- Agent calls `@yo-protocol/core` to fetch vault snapshots (APY, TVL, yield sources)
- Tool renderer shows vault cards with APY, TVL, underlying asset, chain
- Agent explains risk profile in plain language

### US-2.2: Check My Allocation
**As a** user with funds in my treasury,
**I want to** ask "Where are my funds?" or "Show me my portfolio",
**So that** I see my current allocation across YO vaults.

**Acceptance Criteria:**
- Agent reads Fusion vault's ERC4626 market balances (which YO vaults hold how much)
- Agent reads unallocated token balances sitting in the vault
- Tool renderer shows allocation breakdown (pie chart or table)
- Shows USD values using price oracle data

### US-2.3: Deposit Into Treasury
**As a** user,
**I want to** say "Deposit 1000 USDC into my treasury",
**So that** I fund my vault for allocation.

**Acceptance Criteria:**
- Agent prepares ERC20 approve + PlasmaVault.deposit() transactions
- Uses existing 5-step execution flow (connect → chain → simulate → execute)
- User signs in wallet
- Vault balance updates after confirmation

### US-2.4: Allocate to YO Vault
**As a** user with funds in my treasury,
**I want to** say "Put 500 USDC into yoUSD" or "Allocate 50% to yoETH",
**So that** my funds start earning yield.

**Acceptance Criteria:**
- Agent creates FuseAction using Erc4626SupplyFuse.enter({ vault: yoUSD, amount })
- Agent simulates on Anvil fork showing balance before/after
- Tool renderer shows simulation results
- User signs PlasmaVault.execute([fuseActions])
- YO vault shares appear in treasury balance

### US-2.5: Swap Assets Before Allocation
**As a** user who deposited USDC but wants to allocate to yoETH,
**I want to** say "Swap 500 USDC to WETH and put it in yoETH",
**So that** I can allocate to any YO vault regardless of what I deposited.

**Acceptance Criteria:**
- Agent creates a two-step FuseAction sequence:
  1. UniversalTokenSwapperFuse.enter() — swap USDC → WETH via Odos/KyberSwap
  2. Erc4626SupplyFuse.enter() — deposit WETH into yoETH
- Both actions batched into single PlasmaVault.execute() call
- Simulation shows token balances before/after (USDC down, yoETH shares up)
- User signs once for the entire batch

### US-2.6: Withdraw from YO Vault
**As a** user wanting to reallocate or cash out,
**I want to** say "Pull my funds from yoUSD" or "Withdraw everything",
**So that** I get my assets back in the treasury vault.

**Acceptance Criteria:**
- Agent creates FuseAction using Erc4626SupplyFuse.exit({ vault: yoUSD, amount })
- Handles instant vs queued redemption (yoUSD may have async redeem)
- Simulation shows expected asset return
- User signs PlasmaVault.execute()

### US-2.7: Withdraw from Treasury
**As a** user wanting to take funds out of the treasury,
**I want to** say "Withdraw 500 USDC to my wallet",
**So that** I receive tokens back in my EOA.

**Acceptance Criteria:**
- Agent calls PlasmaVault.withdraw() or redeem() for unallocated funds
- Or combines: exit yoVault + withdraw from vault in sequence
- User signs transaction(s)

### US-2.8: Yield Projection
**As a** user considering an allocation,
**I want to** ask "How much would 5000 USDC earn me in 3 months in yoUSD?",
**So that** I can make informed decisions.

**Acceptance Criteria:**
- Agent reads current APY from `getVaultSnapshot()`
- Calculates projected yield: `amount * APY * (days/365)`
- Presents human-readable projection with caveats about variable APY

---

## Epic 3: Multi-Chain Support

### US-3.1: Select Chain on Onboarding
**As a** new user,
**I want to** choose Base, Ethereum, or Arbitrum when creating my vault,
**So that** I can use the chain that suits me.

**Acceptance Criteria:**
- Chain selector in onboarding flow
- Base is default/recommended (best APYs, lowest gas)
- Available YO vaults adjust based on chain selection
- FusionFactory address resolves per chain

### US-3.2: Multi-Chain Vault View (Stretch)
**As a** power user with vaults on multiple chains,
**I want to** see all my positions across chains,
**So that** I have a complete portfolio view.

**Acceptance Criteria:**
- Agent can query positions on multiple chains when asked
- Not the primary flow — single chain per session is fine for MVP

---

## Epic 4: Transparency & Trust

### US-4.1: See Allocation Breakdown
**As a** user,
**I want to** always see where my funds are allocated,
**So that** I trust the system.

**Acceptance Criteria:**
- Allocation widget shows: unallocated balance + per-YO-vault position + total USD value
- Updates after every transaction

### US-4.2: Simulation Before Every Action
**As a** user about to sign a transaction,
**I want to** see a simulation of what will happen to my balances,
**So that** I know exactly what I'm signing.

**Acceptance Criteria:**
- Every allocation/swap action runs through Anvil fork simulation first
- Shows balance diff (before → after) for all affected tokens
- User can decline to sign after seeing simulation

### US-4.3: Transaction History
**As a** user,
**I want to** ask "Show me my recent transactions",
**So that** I can track what happened.

**Acceptance Criteria:**
- Agent reads PlasmaVault execute events or YO user history
- Shows chronological list with links to block explorer
