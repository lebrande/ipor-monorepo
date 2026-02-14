import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { type Address } from 'viem';
import { PlasmaVault, AaveV3 } from '@ipor/fusion-sdk';
import { getPublicClient } from '../plasma-vault/utils/viem-clients';

export const createAaveV3ActionTool = createTool({
  id: 'create-aave-v3-action',
  description: `Create an Aave V3 fuse action (supply, withdraw, borrow, or repay).
Returns the encoded FuseAction data to add to pending actions.
Requires vault address, chain ID, asset address, amount, and action type.`,
  inputSchema: z.object({
    vaultAddress: z.string().describe('Plasma Vault contract address (0x...)'),
    chainId: z.number().describe('Chain ID (1=Ethereum, 42161=Arbitrum, 8453=Base)'),
    actionType: z.enum(['supply', 'withdraw', 'borrow', 'repay']).describe('Action to perform'),
    assetAddress: z.string().describe('ERC20 token address to supply/withdraw/borrow/repay'),
    amount: z.string().describe('Amount in the token smallest unit (e.g. "1000000000" for 1000 USDC with 6 decimals)'),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    protocol: z.literal('aave-v3'),
    actionType: z.enum(['supply', 'withdraw', 'borrow', 'repay']),
    description: z.string(),
    fuseActions: z.array(z.object({
      fuse: z.string(),
      data: z.string(),
    })),
    error: z.string().optional(),
  }),
  execute: async ({ vaultAddress, chainId, actionType, assetAddress, amount }) => {
    try {
      const publicClient = getPublicClient(chainId);
      const plasmaVault = await PlasmaVault.create(
        publicClient,
        vaultAddress as Address,
      );
      const aaveV3 = new AaveV3(plasmaVault);
      const amountBigInt = BigInt(amount);

      let fuseActions;
      switch (actionType) {
        case 'supply':
          fuseActions = aaveV3.supply(assetAddress as Address, amountBigInt);
          break;
        case 'withdraw':
          fuseActions = aaveV3.withdraw(assetAddress as Address, amountBigInt);
          break;
        case 'borrow':
          fuseActions = aaveV3.borrow(assetAddress as Address, amountBigInt);
          break;
        case 'repay':
          fuseActions = aaveV3.repay(assetAddress as Address, amountBigInt);
          break;
      }

      return {
        success: true,
        protocol: 'aave-v3' as const,
        actionType,
        description: `Aave V3 ${actionType} ${amount} of asset ${assetAddress}`,
        fuseActions: fuseActions.map(a => ({ fuse: a.fuse, data: a.data })),
      };
    } catch (error) {
      return {
        success: false,
        protocol: 'aave-v3' as const,
        actionType,
        description: `Failed: Aave V3 ${actionType}`,
        fuseActions: [],
        error: error instanceof Error ? error.message : String(error),
      };
    }
  },
});
