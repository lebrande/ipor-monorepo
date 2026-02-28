# YO Treasury — Product Requirements Document

## One-Liner

An AI-powered personal yield vault that lets users create their own on-chain treasury, swap between assets, and allocate capital across YO Protocol vaults through natural conversation.

## Problem

DeFi yield is fragmented and confusing. Users face three barriers:

1. **Complexity**: Understanding ERC4626 vaults, share prices, APYs, and cross-chain mechanics requires deep DeFi knowledge
2. **No personalization**: YO vaults are shared pools — users can't customize allocation strategy or asset mix
3. **Manual management**: Depositing across multiple YO vaults (yoUSD, yoETH, yoBTC) requires separate transactions with no unified portfolio view

## Solution

**YO Treasury** creates a personal IPOR Fusion PlasmaVault for each user on-chain. This vault:

- Is **owned entirely by the user** (all management roles including Alpha)
- Uses **ERC4626 fuses** to deposit into YO vaults (yoUSD, yoETH, yoBTC, yoEUR)
- Uses **UniversalTokenSwapperFuse** to swap between assets (e.g., USDC → WETH for yoETH deposits)
- Is managed through an **AI copilot** that reads positions, suggests allocations, simulates outcomes, and prepares transactions
- Provides **transparent allocation visibility** — users always see where their funds are

## Target Users

1. **Crypto holders** who want yield but find DeFi overwhelming — the chat interface removes all friction
2. **Power users** who want a personal vault-of-vaults with custom allocation across YO strategies
3. **Small treasuries / teams** who want a dedicated on-chain treasury earning yield across multiple assets

## Hackathon Alignment

| Judging Criterion (Weight) | How We Win |
|---|---|
| **UX Simplicity (30%)** | Chat-first. "Deposit 1000 USDC" or "Move half to yoETH." Zero DeFi jargon required. |
| **Creativity (30%)** | A meta-vault (Fusion PlasmaVault) on top of YO — nobody else will build a vault-of-vaults with AI management and integrated swaps. |
| **Integration (20%)** | Deepest possible: `@yo-protocol/core` for vault data + ERC4626 standard for deposits + real on-chain Fusion vault + swap aggregators. |
| **Risk & Trust (20%)** | User owns all vault roles. Full allocation transparency. Funds always in user's vault. Simulation before every action. |

## Scope

### In Scope

- Multi-chain support (Base primary, Ethereum, Arbitrum)
- In-app vault creation via FusionFactory.clone()
- ERC4626SupplyFuse for YO vault deposits/withdrawals
- UniversalTokenSwapperFuse for asset swaps (via Odos/KyberSwap on Base)
- AI copilot agent (Mastra) with YO-specific tools
- Chat-first UI with tool renderers for vault data, allocations, swap previews
- 5-step transaction executor (reuse existing)
- Real deposit/redeem/swap flows with on-chain transactions

### Out of Scope

- Merkl rewards claiming (nice-to-have, not core)
- Multi-vault per user (one vault per chain is enough for hackathon)
- Automated rebalancing / keeper bot (user-initiated only)
- Mobile-specific UI (responsive web is fine)
- Pendle PT swaps (only standard asset swaps via aggregator)

## YO Vault Availability by Chain

| Vault | Base (8453) | Ethereum (1) | Arbitrum (42161) |
|-------|------------|-------------|-----------------|
| yoUSD | yes | yes | yes |
| yoETH | yes | yes | - |
| yoBTC | yes | yes | - |
| yoEUR | yes | yes | - |
| yoGOLD | - | yes | - |
| yoUSDT | - | yes | - |

**Base is the happy path** — most vaults, best APYs, lowest gas, swap infrastructure available.

## Key Differentiators vs. Other Hackathon Submissions

1. **On-chain personal vault** — not just a UI wrapper around YO SDK calls
2. **AI-managed allocation** — conversation-driven strategy, not forms and buttons
3. **Cross-asset swaps** — user can deposit USDC and have the vault swap to WETH for yoETH
4. **Composability story** — demonstrates ERC4626 composability (Fusion vault wrapping YO vaults)
5. **Simulation before execution** — Anvil fork shows balance changes before signing
