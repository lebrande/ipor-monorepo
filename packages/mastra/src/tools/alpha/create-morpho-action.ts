import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { type Address, type Hex } from 'viem';
import { PlasmaVault, Morpho } from '@ipor/fusion-sdk';
import { getPublicClient } from '../plasma-vault/utils/viem-clients';
import { simulateOnFork } from './simulate-on-fork';

const existingActionSchema = z.object({
  id: z.string(),
  fuseActions: z.array(z.object({ fuse: z.string(), data: z.string() })),
});

export const createMorphoActionTool = createTool({
  id: 'create-morpho-action',
  description: `Create a Morpho fuse action (supply, withdraw, borrow, or repay).
Returns the encoded FuseAction data and automatically simulates ALL pending actions (existing + new) on an Anvil fork if callerAddress is provided.`,
  inputSchema: z.object({
    vaultAddress: z.string().describe('Plasma Vault contract address (0x...)'),
    chainId: z.number().describe('Chain ID (1=Ethereum, 42161=Arbitrum, 8453=Base)'),
    actionType: z.enum(['supply', 'withdraw', 'borrow', 'repay']).describe('Action to perform'),
    morphoMarketId: z.string().describe('Morpho Blue market ID (bytes32 hex string starting with 0x)'),
    amount: z.string().describe('Amount in the token smallest unit'),
    callerAddress: z.string().optional().describe('Caller address with ALPHA_ROLE for auto-simulation'),
    existingPendingActions: z.array(existingActionSchema).optional().describe('Existing pending actions from working memory for combined simulation'),
  }),
  outputSchema: z.object({
    type: z.literal('action-with-simulation'),
    success: z.boolean(),
    protocol: z.literal('morpho'),
    actionType: z.enum(['supply', 'withdraw', 'borrow', 'repay']),
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
  execute: async ({ vaultAddress, chainId, actionType, morphoMarketId, amount, callerAddress, existingPendingActions }) => {
    try {
      const publicClient = getPublicClient(chainId);
      const plasmaVault = await PlasmaVault.create(
        publicClient,
        vaultAddress as Address,
      );
      const morpho = new Morpho(plasmaVault);
      const amountBigInt = BigInt(amount);

      let fuseActions;
      switch (actionType) {
        case 'supply':
          fuseActions = morpho.supply(morphoMarketId as Hex, amountBigInt);
          break;
        case 'withdraw':
          fuseActions = morpho.withdraw(morphoMarketId as Hex, amountBigInt);
          break;
        case 'borrow':
          fuseActions = morpho.borrow(morphoMarketId as Hex, amountBigInt);
          break;
        case 'repay':
          fuseActions = morpho.repay(morphoMarketId as Hex, amountBigInt);
          break;
      }

      const newFuseActions = fuseActions.map(a => ({ fuse: a.fuse, data: a.data }));
      const description = `Morpho ${actionType} ${amount} in market ${morphoMarketId.slice(0, 10)}...`;

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
        protocol: 'morpho' as const,
        actionType,
        description,
        fuseActions: newFuseActions,
        simulation,
      };
    } catch (error) {
      return {
        type: 'action-with-simulation' as const,
        success: false,
        protocol: 'morpho' as const,
        actionType,
        description: `Failed: Morpho ${actionType}`,
        fuseActions: [],
        error: error instanceof Error ? error.message : String(error),
      };
    }
  },
});
