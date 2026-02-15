import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { type Address, type Hex } from 'viem';
import { PlasmaVault, EulerV2 } from '@ipor/fusion-sdk';
import { getPublicClient } from '../plasma-vault/utils/viem-clients';
import { simulateOnFork } from './simulate-on-fork';

const existingActionSchema = z.object({
  id: z.string(),
  fuseActions: z.array(z.object({ fuse: z.string(), data: z.string() })),
});

export const createEulerV2ActionTool = createTool({
  id: 'create-euler-v2-action',
  description: `Create an Euler V2 fuse action (supply or withdraw).
Returns the encoded FuseAction data and automatically simulates ALL pending actions (existing + new) on an Anvil fork if callerAddress is provided.`,
  inputSchema: z.object({
    vaultAddress: z.string().describe('Plasma Vault contract address (0x...)'),
    chainId: z.number().describe('Chain ID (1=Ethereum, 42161=Arbitrum, 8453=Base)'),
    actionType: z.enum(['supply', 'withdraw']).describe('Action to perform'),
    eulerVault: z.string().describe('Euler V2 vault address to supply to / withdraw from'),
    amount: z.string().describe('Amount in the token smallest unit'),
    subAccount: z.string().optional().describe('Euler sub-account byte (default 0x00)'),
    callerAddress: z.string().optional().describe('Caller address with ALPHA_ROLE for auto-simulation'),
    existingPendingActions: z.array(existingActionSchema).optional().describe('Existing pending actions from working memory for combined simulation'),
  }),
  outputSchema: z.object({
    type: z.literal('action-with-simulation'),
    success: z.boolean(),
    protocol: z.literal('euler-v2'),
    actionType: z.enum(['supply', 'withdraw']),
    description: z.string(),
    fuseActions: z.array(z.object({ fuse: z.string(), data: z.string() })),
    error: z.string().optional(),
    simulation: z.object({
      success: z.boolean(),
      message: z.string(),
      actionsCount: z.number(),
      fuseActionsCount: z.number(),
      balancesBefore: z.any().optional(),
      balancesAfter: z.any().optional(),
      error: z.string().optional(),
    }).optional(),
  }),
  execute: async ({ vaultAddress, chainId, actionType, eulerVault, amount, subAccount, callerAddress, existingPendingActions }) => {
    try {
      const publicClient = getPublicClient(chainId);
      const plasmaVault = await PlasmaVault.create(
        publicClient,
        vaultAddress as Address,
      );
      const euler = new EulerV2(plasmaVault);
      const amountBigInt = BigInt(amount);
      const sub = (subAccount ?? '0x00') as Hex;

      let fuseActions;
      switch (actionType) {
        case 'supply':
          fuseActions = euler.supply(eulerVault as Address, amountBigInt, sub);
          break;
        case 'withdraw':
          fuseActions = euler.withdraw(eulerVault as Address, amountBigInt, sub);
          break;
      }

      const newFuseActions = fuseActions.map(a => ({ fuse: a.fuse, data: a.data }));
      const description = `Euler V2 ${actionType} ${amount} in vault ${eulerVault.slice(0, 10)}...`;

      // Auto-simulate if callerAddress provided
      let simulation;
      if (callerAddress) {
        const existingFuseActions = (existingPendingActions ?? []).flatMap(a => a.fuseActions);
        const allFuseActions = [...existingFuseActions, ...newFuseActions];
        const simResult = await simulateOnFork({
          vaultAddress,
          chainId,
          callerAddress,
          flatFuseActions: allFuseActions,
        });
        simulation = {
          ...simResult,
          actionsCount: (existingPendingActions?.length ?? 0) + 1,
        };
      }

      return {
        type: 'action-with-simulation' as const,
        success: true,
        protocol: 'euler-v2' as const,
        actionType,
        description,
        fuseActions: newFuseActions,
        simulation,
      };
    } catch (error) {
      return {
        type: 'action-with-simulation' as const,
        success: false,
        protocol: 'euler-v2' as const,
        actionType,
        description: `Failed: Euler V2 ${actionType}`,
        fuseActions: [],
        error: error instanceof Error ? error.message : String(error),
      };
    }
  },
});
