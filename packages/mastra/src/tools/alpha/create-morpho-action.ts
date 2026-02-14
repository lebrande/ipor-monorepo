import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { type Address, type Hex } from 'viem';
import { PlasmaVault, Morpho } from '@ipor/fusion-sdk';
import { getPublicClient } from '../plasma-vault/utils/viem-clients';

export const createMorphoActionTool = createTool({
  id: 'create-morpho-action',
  description: `Create a Morpho fuse action (supply, withdraw, borrow, or repay).
Returns the encoded FuseAction data to add to pending actions.
Requires vault address, chain ID, Morpho market ID (bytes32 hex), amount, and action type.`,
  inputSchema: z.object({
    vaultAddress: z.string().describe('Plasma Vault contract address (0x...)'),
    chainId: z.number().describe('Chain ID (1=Ethereum, 42161=Arbitrum, 8453=Base)'),
    actionType: z.enum(['supply', 'withdraw', 'borrow', 'repay']).describe('Action to perform'),
    morphoMarketId: z.string().describe('Morpho Blue market ID (bytes32 hex string starting with 0x)'),
    amount: z.string().describe('Amount in the token smallest unit'),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    protocol: z.literal('morpho'),
    actionType: z.enum(['supply', 'withdraw', 'borrow', 'repay']),
    description: z.string(),
    fuseActions: z.array(z.object({
      fuse: z.string(),
      data: z.string(),
    })),
    error: z.string().optional(),
  }),
  execute: async ({ vaultAddress, chainId, actionType, morphoMarketId, amount }) => {
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

      return {
        success: true,
        protocol: 'morpho' as const,
        actionType,
        description: `Morpho ${actionType} ${amount} in market ${morphoMarketId.slice(0, 10)}...`,
        fuseActions: fuseActions.map(a => ({ fuse: a.fuse, data: a.data })),
      };
    } catch (error) {
      return {
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
