# YO Treasury — Known Issues

## POC Test (`packages/hardhat-tests/test/yo-treasury/create-vault.ts`)

### USDC balance slot manipulation is fragile
- **Location**: `create-vault.ts:134-146`
- **Issue**: Test funds USDC via `testClient.setStorageAt` targeting FiatTokenV2's `_balanceAndBlacklistStates` mapping at storage slot 9. This is implementation-specific to Circle's current USDC proxy and could break if USDC undergoes a storage layout upgrade.
- **Alternative**: Other tests in the repo (e.g., `test/zaps/mint-rusd-from-usdc.ts`) use whale impersonation + transfer, which is storage-layout-agnostic.
- **Impact**: Low — only affects fork tests at pinned block numbers. If the fork block is updated and USDC has upgraded, this will silently produce wrong balances.
- **Action**: Not fixing now. The pinned block (42755236) is stable. Revisit if tests start failing after block number updates.

### Sequential test state dependencies
- **Location**: `create-vault.ts:204-545`
- **Issue**: All 4 `it()` blocks share sequential on-chain state — each test mutates vault balances that subsequent tests depend on. Tests 2-4 will fail if any earlier test fails mid-execution.
- **Impact**: Low — this is by design for a lifecycle test. Node:test runs `it()` blocks within a `describe()` in declaration order.
- **Action**: Not fixing. This is the intended pattern for an end-to-end lifecycle test.

### Swap tests use `amountOutMinimum: 0n`
- **Location**: `create-vault.ts:320,479`
- **Issue**: No slippage protection in swap calldata. Acceptable for deterministic fork tests but the production agent tools must use real minimums from swap aggregator quotes.
- **Action**: Not fixing in tests. Will be addressed when building the `createSwapActionTool` in Phase 2.

## SDK (`packages/sdk/src/markets/yo/`)

### `plasmaVaultFactoryAbi` exported but unused
- **Location**: `yo/abi/plasma-vault-factory.abi.ts`, exported via `yo/index.ts:3` and `sdk/index.ts:70`
- **Issue**: Contains only the `PlasmaVaultCreated` event definition. Not referenced by `create-vault.ts` or any consumer. The event parsing in `cloneVault()` uses `simulateContract` return value instead.
- **Impact**: None — unused export, no harm.
- **Action**: Keep for now. May be useful if event-based vault discovery is needed later.

### `YO_GATEWAY_ADDRESS` exported but unused
- **Location**: `yo.addresses.ts:72-74`, exported via barrels
- **Issue**: Defined for completeness but no SDK function references it.
- **Impact**: None.
- **Action**: Keep — will likely be used by agent tools in Phase 2 (`@yo-protocol/core` may need it).

## Agent (Mastra)

### YoRedeemFuse deployed — issue resolved
- **Previous**: "YoRedeemFuse not deployed to Base"
- **Status**: RESOLVED. 4 instances deployed. See progress tracker for addresses.

### Haiku model ignores system prompt for response verbosity
- **Issue**: Claude Haiku 4.5 via OpenRouter duplicates tool output data in text responses (full markdown tables, bullet lists) despite system prompt saying "NEVER repeat data" and "NEVER use markdown".
- **Root cause**: Smaller models weight tool result content higher than system prompt instructions.
- **Fix applied**: Added `[UI rendered... — do NOT list or repeat]` directive in tool `message` fields. This works because the guidance is right next to the data the model would otherwise repeat.
- **Pattern**: For Haiku-class models, put behavioral directives in tool output, not just system prompt.
- **Files**: `get-yo-vaults.ts:82`, `get-treasury-allocation.ts:41`

### `@yo-protocol/core` v0.0.3 Zod validation bug
- **Issue**: `getVaultSnapshot()` throws because `idleBalances.raw` comes back as JS `number`, Zod expects `string`.
- **Impact**: APY/TVL still work via `getVaults()` which uses a different API path. Snapshot-specific data (idle balances breakdown) unavailable.
- **Action**: Wait for SDK fix. Tool gracefully returns null for snapshot-only fields.

### ~~Demo vault has 0 balance~~ RESOLVED
- **Previous**: Demo vault had no deposited USDC.
- **Status**: RESOLVED. 1 USDC deposited via Storybook E2E test (2026-03-07). Deposit form (approve + deposit) tested end-to-end.

### RPC returns stale data immediately after tx confirmation
- **Location**: `deposit-form.tsx`, `withdraw-form.tsx` — post-tx refetch effects
- **Issue**: After `useWaitForTransactionReceipt` confirms, `refetch()` calls on `useReadContract` hooks may return stale data because the RPC node hasn't indexed the new block state yet.
- **Root cause**: RPC load balancers may serve reads from a node that lags 1-2 blocks behind the node that confirmed the tx.
- **Fix applied**: Delayed retry — `setTimeout(refetchAll, 2000)` fires a second refetch 2s after the initial one. Also important: do NOT use `return () => clearTimeout(timer)` in the effect cleanup, because `resetRedeem()`/`resetDeposit()` clears the tx hash, which makes `isRedeemConfirmed`/`isDepositConfirmed` go false, re-runs the effect, and fires the cleanup — cancelling the timer before it fires.
- **Additional fix**: Display logic now checks `shareBalance === 0n` before `positionAssets !== undefined` — prevents showing stale cached `convertToAssets` value when shares are fully redeemed (query disabled but data retained).
- **Pattern**: For wagmi post-tx refetches, always add a delayed retry and avoid cleanup functions that race with state resets.

## Storybook Anvil Fork

### External APIs don't reflect fork state
- **Issue**: Anvil forks only simulate EVM state. Any feature depending on external APIs will show real chain data, not fork state:
  - **Swap aggregators** (Odos, KyberSwap, 1inch) — Quote routes against real chain liquidity, not the fork. Quotes may fail or be stale after fork-side transactions.
  - **Yo Protocol REST API** (`useVaultSnapshot`, `useVaultYieldHistory`, `useUserPerformance`, `useMerklRewards`, etc.) — These hooks fetch from the Yo API server, which reads real chain state. Deposits/withdrawals on the fork won't appear in API responses.
  - **Indexers / subgraphs** (Ponder, The Graph) — Index real chain events, not fork events.
  - **Oracle APIs** (Chainlink off-chain, Pyth) — Won't reflect fork-side state changes.
- **What works**: Pure on-chain interactions — deposits, withdrawals, approvals, vault creation, fuse execution, role grants — anything using `eth_call` / `eth_sendTransaction`.
- **Impact**: Stories that only do on-chain transactions (deposit form, withdraw form, create vault) work perfectly. Features that also call external APIs show a mix of fork state and real state.
- **Action**: Acceptable limitation. Document in testing guide. If external API mocking is needed in the future, that's a separate effort.

### Anvil fork testing is limited to USDC/yoUSD flow
- **Issue**: The testable E2E flow on Anvil fork is: deposit USDC into treasury vault → allocate to yoUSD → withdraw from yoUSD → withdraw from treasury. Other YO vaults (yoETH, yoBTC, yoEUR) require their respective underlying assets (WETH, cbBTC, EURC) which the test wallet doesn't have.
- **Workaround**: Could swap USDC → WETH/cbBTC/EURC via Uniswap V3 smart contracts directly (as done in the POC test at `packages/hardhat-tests/test/yo-treasury/create-vault.ts`), but there's no swap UI in the treasury app — swaps are only possible via agent `execute()` actions.
- **Impact**: Only yoUSD allocation/withdrawal is testable through the UI on Anvil fork. Other vault flows would need either a swap UI or a script to fund the wallet with non-USDC assets before testing.
- **Action**: Acceptable for hackathon. The yoUSD flow covers the full deposit → allocate → withdraw lifecycle. Other vaults use identical fuse contracts (different `MARKET_ID`), so if yoUSD works, others should too.

## Smart Contracts

### ~~YoRedeemFuse not deployed to Base~~ RESOLVED
- 4 instances deployed to Base mainnet. Addresses in `yo.addresses.ts` and wired into `addFuses()`.

### YoRedeemFuse skips substrate validation
- **Location**: `packages/hardhat-tests/contracts/YoRedeemFuse.sol`
- **Issue**: The fuse does not validate that the `vault` parameter is a whitelisted substrate (unlike `Erc4626SupplyFuse` which uses `PlasmaVaultConfigLib`). PlasmaVault's fuse registration check is the only guard.
- **Impact**: Low for hackathon — the vault owner controls which fuses are registered and which substrates are whitelisted. In production, substrate validation would add defense-in-depth.
- **Action**: Acceptable for hackathon. Document as a limitation.

### Only yoUSD redeem is tested
- **Issue**: Fork test only deploys YoRedeemFuse for market ERC4626_0001 (yoUSD) and tests withdrawal from yoUSD. yoETH/yoBTC/yoEUR redemption is untested.
- **Impact**: Low — the fuse contract is market-agnostic (same code, different `MARKET_ID` constructor arg). If yoUSD works, others should too.
- **Action**: Not adding more redeem tests now. Will be implicitly tested when building multi-vault agent flows.

### ~~createYoWithdrawActionTool required LLM to provide YoRedeemFuse address~~ RESOLVED
- **Previous**: `inputSchema` included `yoRedeemFuseAddress` as required LLM input. Agent system prompt didn't list these addresses, so the LLM fabricated wrong addresses → `UnsupportedFuse()` revert on simulation.
- **Fix**: Removed `yoRedeemFuseAddress` from `inputSchema`. Tool now resolves the correct fuse address internally using `YO_VAULT_SLOTS[yoVaultId].slot` → `REDEEM_FUSE_BY_SLOT[slot][chainId]`. Same pattern as `createYoAllocationActionTool`.
- **File**: `packages/mastra/src/tools/yo-treasury/create-yo-withdraw-action.ts`
- **Status**: RESOLVED. Withdraw flow tested e2e in Storybook — simulation + execution confirmed on Base.

### ~~Treasury overview doesn't show non-underlying tokens (e.g., WETH after swap)~~ PARTIALLY RESOLVED
- **Previous**: `readYoTreasuryBalances` discovers the vault's primary underlying (via `asset()`) and any `ERC20_VAULT_BALANCE` substrates. Tokens acquired via swap (e.g., USDC→WETH) are not discovered.
- **Fix (FSN-0062)**: Added "Unallocated" column to YO vaults table. `getYoVaultsTool` now multicalls `balanceOf(treasuryAddress)` for each YO vault's underlying asset — covers the common case of seeing unallocated tokens that match YO vault underlyings.
- **Remaining**: Treasury overview card still doesn't show non-YO-vault tokens. Would require reading balances of all known tokens.

### Mastra agent tools use real chain RPC, not Anvil fork
- **Issue**: `getPublicClient()` in `packages/mastra/src/tools/plasma-vault/utils/viem-clients.ts` uses `BASE_RPC_URL` (from mastra env), which points to real Base mainnet. Storybook's wagmi uses `NEXT_PUBLIC_RPC_URL_BASE`, which can point to an Anvil fork.
- **Impact**: When testing in Storybook with an Anvil fork, the deposit/withdraw forms (wagmi) see fork state (e.g., 5,243 USDC position), but agent tools (mastra) read real chain state (0 balances). The YO vaults table shows 0 for Unallocated/Balance even though the deposit form shows a position.
- **Root cause**: Two separate RPC configurations — mastra reads `BASE_RPC_URL`, wagmi reads `NEXT_PUBLIC_RPC_URL_BASE`. When Storybook points wagmi to Anvil but mastra still points to real chain, the data is inconsistent.
- **Workaround**: Set `BASE_RPC_URL` in mastra's env to the same Anvil fork URL used by Storybook.
- **Action**: Document in testing guide. Could be fixed by having the chat API route pass the RPC URL from the frontend context, but that's a larger change.

### ~~readYoTreasuryBalances returned empty for ERC20 + ERC4626~~ RESOLVED
- **Previous**: `readYoTreasuryBalances` relied on `ERC20_VAULT_BALANCE` substrates (market ID 7n) which `configureSubstrates()` never configures for YO Treasury vaults. Also `getMarketIds({ include: ['balanceFuses'] })` returned empty.
- **Fix**: Rewrote to read underlying asset directly via ERC4626 `asset()`, merge with `ERC20_VAULT_BALANCE` substrates if available. Falls back to known ERC4626 market IDs (100001-100004) if `getMarketIds` returns empty.
- **File**: `packages/mastra/src/tools/yo-treasury/read-yo-treasury-balances.ts`
- **Status**: RESOLVED. Treasury balances now show both unallocated tokens and YO positions.
