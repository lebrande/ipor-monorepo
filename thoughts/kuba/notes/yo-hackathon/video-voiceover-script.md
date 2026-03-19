# YO Treasury — Demo Video Voiceover Script

**Duration:** 3 minutes
**Format:** Screen recording with voiceover

---

## [0:00–0:20] Opening — The Problem

> DeFi yield is fragmented. If you want exposure to yoUSD, yoETH, yoBTC, and yoEUR, you need four separate deposit flows, manual swaps between assets, and dozens of wallet signatures. For treasuries managing real capital, this friction is a dealbreaker.
>
> YO Treasury fixes this. One vault. One deposit. AI handles the rest.

*Screen: Show the YO Treasury dashboard with 4 active vault allocations.*

---

## [0:20–0:50] What Is YO Treasury

> YO Treasury is a personal on-chain vault built on IPOR Fusion that wraps all YO Protocol vaults into a single position.
>
> You deposit USDC once into your vault. Then an AI copilot allocates your capital across yoUSD, yoETH, yoBTC, and yoEUR through natural conversation. Cross-asset swaps, deposits, and withdrawals — all batched into single atomic transactions.
>
> Let me show you how it works.

*Screen: Scroll through the dashboard — portfolio summary cards, allocation table with APR and TVL data.*

---

## [0:50–1:20] Vault Creation

> First, you create your own Treasury vault. This wizard deploys a PlasmaVault on Base — your personal vault with your own roles and permissions.
>
> Six steps: clone the vault from the factory, grant management roles, install the fuse modules, configure balance tracking, whitelist the YO vault markets and swap routers, and set up the dependency graph. Seventeen transactions total — each shown as a step with progress tracking.
>
> Once complete, you have a fully configured vault ready to earn yield across all four YO vaults on Base.

*Screen: Walk through the 6-step vault creation wizard. Show each step completing with green checkmarks.*

---

## [1:20–1:45] Depositing USDC

> Now let's fund the vault. I enter an amount — say 100 USDC — approve the token, and deposit. Standard ERC-4626 flow.
>
> The dashboard immediately shows my unallocated balance. My USDC is in the vault, ready to be allocated.

*Screen: Show the deposit form, approve transaction, deposit transaction, dashboard updating with unallocated balance.*

---

## [1:45–2:25] AI Agent — Allocate, Swap, Batch Execute

> Here's where it gets interesting. I open the chat and tell the agent: "Swap 50 USDC to WETH and allocate to yoETH."
>
> The agent fetches a DEX quote from Odos, encodes the swap calldata, then encodes the yoETH deposit — two fuse actions chained together. Before showing me anything, it runs a fork simulation. I see exact balance changes — USDC going down, yoETH shares going up.
>
> I click execute. One transaction. One signature. The swap and the deposit happen atomically on-chain. If either fails, both revert. No leftover tokens, no partial states.
>
> The agent can also do simple allocations — "Put 30 USDC in yoUSD" — or withdrawals — "Withdraw everything from yoBTC." Each operation goes through the same pipeline: encode calldata, simulate on fork, present proposal, execute.

*Screen: Show the chat interaction. Agent responds with transaction proposal card showing simulation diff. Click Execute, show tx confirmation. Dashboard updates.*

---

## [2:25–2:50] Security Model

> Security is built into the architecture. The AI agent never has access to private keys — it only produces transaction calldata. The Alpha role can only execute whitelisted actions through whitelisted fuses to whitelisted markets. No arbitrary contract calls. No token transfers to unknown addresses.
>
> The Atomist role — that's you — controls which fuses are installed and which assets are permitted. Strategy and execution are completely separated.
>
> And every single transaction is simulated on a fork before you sign. You always see what will happen before it happens.

*Screen: Show the role badges on the dashboard. Highlight the simulation diff with before/after balances.*

---

## [2:50–3:00] Closing

> YO Treasury. One vault for all your YO positions. AI-managed allocation. Atomic batch execution. Full on-chain transparency.
>
> Built with the YO SDK, IPOR Fusion, and deployed live on Base.

*Screen: Final shot of the dashboard with all 4 YO vaults active and earning yield.*

---

## Production Notes

- **Tone:** Confident, technical but accessible. Not overly salesy — let the product speak.
- **Pacing:** ~150 words per minute. The script is ~550 words, fitting comfortably in 3 minutes with natural pauses for screen transitions.
- **Screen recording tips:**
  - Use the Storybook environment for consistent UI state
  - Pre-fund the demo vault so all 4 allocations show as Active
  - Have the agent chat pre-loaded with a conversation showing allocation flow
  - Record wallet signing with a visible Rabby/MetaMask popup
- **Key moments to emphasize visually:**
  - The simulation diff (before/after balance comparison)
  - The single "Execute" button for a multi-step operation
  - The dashboard updating after transaction confirmation
  - The 4/4 Active Vaults badge
