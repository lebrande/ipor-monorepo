import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { type Address, type Hex } from 'viem';
import { getPublicClient } from '../plasma-vault/utils/viem-clients';

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

export const simulatePendingActionsTool = createTool({
  id: 'simulate-pending-actions',
  description: `Simulate executing pending fuse actions on a PlasmaVault contract.
Uses eth_call to validate the transaction would succeed without actually sending it.
Requires the caller address (must have ALPHA_ROLE on the vault).
Call this when the user asks to simulate, test, validate, or execute their pending actions.`,
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

      return {
        type: 'simulation-result' as const,
        success: true,
        message: `Simulation successful! ${flatFuseActions.length} fuse action${flatFuseActions.length === 1 ? '' : 's'} from ${actions.length} pending action${actions.length === 1 ? '' : 's'} would execute successfully.`,
        vaultAddress,
        chainId,
        callerAddress,
        actionsCount: actions.length,
        fuseActionsCount: flatFuseActions.length,
        flatFuseActions,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        type: 'simulation-result' as const,
        success: false,
        message: `Simulation failed: ${errorMessage}`,
        vaultAddress,
        chainId,
        callerAddress,
        actionsCount: actions.length,
        fuseActionsCount: flatFuseActions.length,
        error: errorMessage,
        flatFuseActions,
      };
    }
  },
});
