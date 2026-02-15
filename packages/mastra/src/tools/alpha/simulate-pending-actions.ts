import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { type Address, type Hex } from 'viem';
import { getPublicClient, SUPPORTED_CHAINS } from '../plasma-vault/utils/viem-clients';
import { readVaultBalances } from './read-vault-balances';
import { spawnAnvilFork } from './anvil-fork';

/** Minimal ABI for PlasmaVault.execute(FuseAction[]) */
const plasmaVaultExecuteAbi = [
  {
    type: 'function',
    name: 'execute',
    inputs: [
      {
        name: 'calls_',
        type: 'tuple[]',
        internalType: 'struct FuseAction[]',
        components: [
          { name: 'fuse', type: 'address', internalType: 'address' },
          { name: 'data', type: 'bytes', internalType: 'bytes' },
        ],
      },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
] as const;

const balanceAssetSchema = z.object({
  address: z.string(),
  name: z.string(),
  symbol: z.string(),
  decimals: z.number(),
  balance: z.string(),
  balanceFormatted: z.string(),
  priceUsd: z.string(),
  valueUsd: z.string(),
});

const balanceMarketPositionSchema = z.object({
  underlyingToken: z.string(),
  underlyingSymbol: z.string(),
  supplyFormatted: z.string(),
  supplyValueUsd: z.string(),
  borrowFormatted: z.string(),
  borrowValueUsd: z.string(),
  totalValueUsd: z.string(),
});

const balanceMarketSchema = z.object({
  marketId: z.string(),
  protocol: z.string(),
  positions: z.array(balanceMarketPositionSchema),
  totalValueUsd: z.string(),
});

const balanceSnapshotSchema = z.object({
  assets: z.array(balanceAssetSchema),
  markets: z.array(balanceMarketSchema),
  totalValueUsd: z.string(),
});

export const simulatePendingActionsTool = createTool({
  id: 'simulate-pending-actions',
  description: `Simulate executing pending fuse actions on a PlasmaVault using an Anvil fork.
Forks the live chain state, executes the transaction, and reads balances before and after.
Returns a comprehensive before/after comparison with deltas for every token and market position.
Requires the caller address (must have ALPHA_ROLE on the vault).
Call this when the user asks to simulate, test, or validate their pending actions.`,
  inputSchema: z.object({
    vaultAddress: z.string().describe('PlasmaVault contract address'),
    chainId: z.number().describe('Chain ID (1=Ethereum, 42161=Arbitrum, 8453=Base)'),
    callerAddress: z.string().describe('Address that will call execute (must have ALPHA_ROLE)'),
    actions: z.array(z.object({
      id: z.string(),
      protocol: z.enum(['aave-v3', 'morpho', 'euler-v2']),
      actionType: z.enum(['supply', 'withdraw', 'borrow', 'repay']),
      description: z.string(),
      fuseActions: z.array(z.object({
        fuse: z.string(),
        data: z.string(),
      })),
    })).describe('The pending actions from working memory to simulate'),
  }),
  outputSchema: z.object({
    type: z.literal('simulation-result'),
    success: z.boolean(),
    message: z.string(),
    vaultAddress: z.string(),
    chainId: z.number(),
    callerAddress: z.string(),
    actionsCount: z.number(),
    fuseActionsCount: z.number(),
    error: z.string().optional(),
    flatFuseActions: z.array(z.object({
      fuse: z.string(),
      data: z.string(),
    })),
    balancesBefore: balanceSnapshotSchema.optional(),
    balancesAfter: balanceSnapshotSchema.optional(),
  }),
  execute: async ({ vaultAddress, chainId, callerAddress, actions }) => {
    const flatFuseActions = actions.flatMap(a => a.fuseActions);

    if (flatFuseActions.length === 0) {
      return {
        type: 'simulation-result' as const,
        success: false,
        message: 'No fuse actions to simulate',
        vaultAddress,
        chainId,
        callerAddress,
        actionsCount: 0,
        fuseActionsCount: 0,
        flatFuseActions: [],
      };
    }

    let fork: Awaited<ReturnType<typeof spawnAnvilFork>> | null = null;

    try {
      // 1. Spawn Anvil fork
      fork = await spawnAnvilFork(chainId);

      // 2. Read "before" balances on the fork (identical to live state)
      const balancesBefore = await readVaultBalances(
        fork.publicClient,
        vaultAddress as Address,
      );

      // 3. Impersonate caller and fund gas
      await fork.impersonateAndFund(callerAddress as Address);

      // 4. Execute the transaction on the fork
      const walletClient = fork.createImpersonatedWalletClient(callerAddress as Address);
      const hash = await walletClient.writeContract({
        account: callerAddress as Address,
        chain: SUPPORTED_CHAINS[chainId],
        address: vaultAddress as Address,
        abi: plasmaVaultExecuteAbi,
        functionName: 'execute',
        args: [flatFuseActions.map(a => ({
          fuse: a.fuse as Address,
          data: a.data as Hex,
        }))],
      });

      // Wait for the tx to be mined on the fork
      await fork.publicClient.waitForTransactionReceipt({ hash });

      // 5. Read "after" balances on the fork (post-execution state)
      const balancesAfter = await readVaultBalances(
        fork.publicClient,
        vaultAddress as Address,
      );

      return {
        type: 'simulation-result' as const,
        success: true,
        message: `Simulation successful! ${flatFuseActions.length} fuse action${flatFuseActions.length === 1 ? '' : 's'} from ${actions.length} pending action${actions.length === 1 ? '' : 's'} executed on fork.`,
        vaultAddress,
        chainId,
        callerAddress,
        actionsCount: actions.length,
        fuseActionsCount: flatFuseActions.length,
        flatFuseActions,
        balancesBefore,
        balancesAfter,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);

      // Fallback: if Anvil fork failed, try simple eth_call simulation
      let simpleSimSuccess = false;
      try {
        const publicClient = getPublicClient(chainId);
        await publicClient.simulateContract({
          account: callerAddress as Address,
          address: vaultAddress as Address,
          abi: plasmaVaultExecuteAbi,
          functionName: 'execute',
          args: [flatFuseActions.map(a => ({
            fuse: a.fuse as Address,
            data: a.data as Hex,
          }))],
        });
        simpleSimSuccess = true;
      } catch {
        // Both fork and simple sim failed
      }

      return {
        type: 'simulation-result' as const,
        success: false,
        message: simpleSimSuccess
          ? `Fork simulation failed (${errorMessage}), but eth_call simulation succeeded. Transaction would likely succeed on-chain.`
          : `Simulation failed: ${errorMessage}`,
        vaultAddress,
        chainId,
        callerAddress,
        actionsCount: actions.length,
        fuseActionsCount: flatFuseActions.length,
        error: errorMessage,
        flatFuseActions,
      };
    } finally {
      // 6. Always clean up the Anvil process
      fork?.kill();
    }
  },
});
