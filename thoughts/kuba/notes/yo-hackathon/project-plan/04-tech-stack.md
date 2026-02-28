# YO Treasury — Tooling, Dev Tools & Tech Stack

## Core Dependencies

### Smart Contract Interaction
| Package | Version | Purpose |
|---------|---------|---------|
| `viem` | latest | Ethereum client library (encoding, multicall, contract reads/writes) |
| `wagmi` | latest | React hooks for wallet connection, chain switching, contract interaction |
| `@yo-protocol/core` | latest | YO Protocol SDK — vault reads, snapshots, yield data |
| `@ipor/fusion-sdk` | workspace | IPOR Fusion SDK — PlasmaVault, market IDs, protocol adapters |

### AI Agent
| Package | Version | Purpose |
|---------|---------|---------|
| `@mastra/core` | workspace | Agent framework, tool system, memory |
| `@ai-sdk/react` | latest | `useChat` hook for streaming chat UI |
| `ai` | latest | AI SDK stream utilities (`toAISdkStream`, `createUIMessageStreamResponse`) |
| Claude Haiku 4.5 (via OpenRouter) | - | LLM model for agent reasoning |

### Frontend
| Package | Version | Purpose |
|---------|---------|---------|
| `next` | 16 | React framework with App Router |
| `react` | 19 | UI library |
| `tailwindcss` | 4 | Styling |
| `shadcn/ui` | latest | UI component primitives |
| `zod` | latest | Runtime type validation |
| `recharts` | latest | Charts for allocation visualization (if needed) |

### Dev Tools
| Tool | Purpose |
|------|---------|
| `pnpm` | Package manager (workspace monorepo) |
| `tsx` | TypeScript script runner (for deployment scripts) |
| `anvil` (Foundry) | Local fork simulation for action testing |
| `@yo-protocol/cli` | CLI tool for ad-hoc vault queries during development |

## External APIs

### Odos (Swap Aggregator)
- **Quote API**: `POST https://api.odos.xyz/sor/quote/v2`
- **Assemble API**: `POST https://api.odos.xyz/sor/assemble`
- Free, no API key required
- Returns swap calldata for UniversalTokenSwapperFuse
- Base router: `0x19cEeAd7105607Cd444F5ad10dd51356436095a1`

### KyberSwap (Backup Swap Aggregator)
- **Quote API**: `GET https://aggregator-api.kyberswap.com/base/api/v1/routes`
- **Build API**: `POST https://aggregator-api.kyberswap.com/base/api/v1/route/build`
- Free, no API key required
- Base router: `0x6131B5fae19EA4f9D964eAc0408E4408b66337b5`

### YO Protocol REST API
- **Base URL**: `https://api.yo.xyz`
- Vault snapshots, yield history, TVL history, user history
- No auth required
- Already wrapped by `@yo-protocol/core` SDK methods

## Environment Variables

```env
# RPC URLs (required)
BASE_RPC_URL=https://...          # Base chain RPC
ETHEREUM_RPC_URL=https://...      # Ethereum mainnet RPC (optional for multi-chain)
ARBITRUM_RPC_URL=https://...      # Arbitrum RPC (optional for multi-chain)

# Mastra Agent
MODEL=openrouter/anthropic/claude-haiku-4-5-20251001  # or claude-sonnet

# Existing
PONDER_DATABASE_URL=...           # If connecting to Supabase for anything
```

## Project Structure

```
packages/
├── yo-treasury/                    # NEW — Hackathon package
│   ├── scripts/
│   │   └── create-vault.ts         # Deployment script for manual vault creation
│   ├── src/
│   │   └── constants/
│   │       ├── addresses.ts         # All contract addresses per chain
│   │       └── abis.ts             # Collected ABIs
│   └── package.json
│
├── mastra/                         # EXISTING — Add agent + tools
│   └── src/
│       ├── agents/
│       │   └── yo-treasury-agent.ts     # NEW agent definition
│       ├── tools/
│       │   └── yo-treasury/             # NEW tool directory
│       │       ├── index.ts
│       │       ├── types.ts             # Tool output type union
│       │       ├── get-yo-vaults.ts
│       │       ├── get-yo-vault-details.ts
│       │       ├── get-treasury-allocation.ts
│       │       ├── create-allocation-action.ts
│       │       ├── create-withdraw-action.ts
│       │       └── create-swap-action.ts
│       └── mastra/
│           └── index.ts             # Register new agent
│
├── web/                            # EXISTING — Add pages + components
│   └── src/
│       ├── app/
│       │   ├── yo-treasury/
│       │   │   └── page.tsx         # NEW entry page
│       │   └── api/yo/treasury/
│       │       └── chat/route.ts    # NEW API route
│       └── yo-treasury/
│           └── components/
│               ├── create-vault-flow.tsx
│               ├── vault-setup-stepper.tsx
│               ├── treasury-chat.tsx
│               ├── yo-tool-renderer.tsx
│               ├── yo-vaults-list.tsx
│               ├── treasury-allocation.tsx
│               └── swap-preview.tsx
```

## Key ABIs Needed

| ABI | Source | Functions Used |
|-----|--------|---------------|
| `fusionFactoryAbi` | ipor-webapp `fusion/factory/abi/` | `clone`, `getDaoFeePackages` |
| `plasmaVaultFactoryAbi` | ipor-webapp `fusion/factory/abi/` | `PlasmaVaultCreated` event |
| `accessManagerAbi` | ipor-webapp `fusion/accessManager/abi/` | `grantRole`, `hasRole` |
| `plasmaVaultAbi` | `@ipor/fusion-sdk` | `addFuses`, `addBalanceFuse`, `grantMarketSubstrates`, `updateDependencyBalanceGraphs`, `convertToPublicVault`, `execute`, `deposit`, `withdraw`, `redeem` |
| `erc4626SupplyFuseAbi` | ipor-webapp `fusion/fuses/config/Erc4626SupplyFuseV001/abi.ts` | `enter`, `exit` |
| `universalTokenSwapperFuseAbi` | ipor-webapp `fusion/fuses/config/UniversalTokenSwapperFuseV001/abi.ts` | `enter` |
| `erc20Abi` | viem | `approve`, `balanceOf`, `allowance` |

## Development Workflow

1. **Start Mastra dev server**: `cd packages/mastra && pnpm dev` — for agent testing in Mastra Studio
2. **Start Next.js dev**: `cd packages/web && pnpm dev` — for frontend development
3. **Test agent tools**: Chat in Mastra Studio at `http://localhost:4111`
4. **Test vault creation**: Run `pnpm tsx packages/yo-treasury/scripts/create-vault.ts`
5. **Test full flow**: Open `http://localhost:3000/yo-treasury`, connect wallet
6. **Ad-hoc YO queries**: `npx yo info vaults --chain 8453` or `npx yo api vault-snapshot --vault yoUSD --chain 8453`
