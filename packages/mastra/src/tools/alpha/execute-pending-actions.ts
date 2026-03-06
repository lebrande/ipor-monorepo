import { createTool } from '@mastra/core/tools';
import { z } from 'zod';

export const executePendingActionsTool = createTool({
  id: 'execute-pending-actions',
  description: `Execute pending fuse actions on a PlasmaVault. Passes actions to the UI for the full wallet flow: connect wallet → check ALPHA_ROLE → simulate → execute. Call this when the user asks to execute, run, send, or submit their pending actions.`,
  inputSchema: z.object({
    vaultAddress: z.string().describe('PlasmaVault contract address'),
    chainId: z.number().describe('Chain ID (1=Ethereum, 42161=Arbitrum, 8453=Base)'),
    actions: z.array(z.object({
      id: z.string(),
      protocol: z.string(),
      actionType: z.string(),
      description: z.string(),
      fuseActions: z.array(z.object({
        fuse: z.string(),
        data: z.string(),
      })),
    })).describe('The pending actions from working memory to execute'),
  }),
  outputSchema: z.object({
    type: z.literal('execute-actions'),
    vaultAddress: z.string(),
    chainId: z.number(),
    flatFuseActions: z.array(z.object({
      fuse: z.string(),
      data: z.string(),
    })),
    actionsCount: z.number(),
    fuseActionsCount: z.number(),
    actionsSummary: z.string(),
  }),
  execute: async ({ vaultAddress, chainId, actions }) => {
    const flatFuseActions = actions.flatMap(a => a.fuseActions);

    const actionsSummary = actions
      .map(a => `${a.actionType} on ${a.protocol}: ${a.description}`)
      .join('\n');

    return {
      type: 'execute-actions' as const,
      vaultAddress,
      chainId,
      flatFuseActions,
      actionsCount: actions.length,
      fuseActionsCount: flatFuseActions.length,
      actionsSummary,
    };
  },
});
