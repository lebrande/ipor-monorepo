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

## Smart Contracts

### YoRedeemFuse not deployed to Base
- **Issue**: Only exists as a Hardhat-compiled artifact deployed dynamically in fork tests. Needs on-chain deployment for Phase 3 web app.
- **Complexity**: Need 4 separate instances (one per YO vault market) because `MARKET_ID` is immutable in the constructor: yoUSD (100001), yoETH (100002), yoBTC (100003), yoEUR (100004).
- **Action**: Deploy before Phase 3. Add addresses to `yo.addresses.ts` and wire into `addFuses()`.

### YoRedeemFuse skips substrate validation
- **Location**: `packages/hardhat-tests/contracts/YoRedeemFuse.sol`
- **Issue**: The fuse does not validate that the `vault` parameter is a whitelisted substrate (unlike `Erc4626SupplyFuse` which uses `PlasmaVaultConfigLib`). PlasmaVault's fuse registration check is the only guard.
- **Impact**: Low for hackathon — the vault owner controls which fuses are registered and which substrates are whitelisted. In production, substrate validation would add defense-in-depth.
- **Action**: Acceptable for hackathon. Document as a limitation.

### Only yoUSD redeem is tested
- **Issue**: Fork test only deploys YoRedeemFuse for market ERC4626_0001 (yoUSD) and tests withdrawal from yoUSD. yoETH/yoBTC/yoEUR redemption is untested.
- **Impact**: Low — the fuse contract is market-agnostic (same code, different `MARKET_ID` constructor arg). If yoUSD works, others should too.
- **Action**: Not adding more redeem tests now. Will be implicitly tested when building multi-vault agent flows.
