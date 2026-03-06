import { createTool } from '@mastra/core/tools';
import { z } from 'zod';

export const displayPendingActionsTool = createTool({
  id: 'display-pending-actions',
  description: `Display the list of pending fuse actions to the user as a custom UI component.
Call this when the user asks to see, show, list, or display their pending actions or transactions.
Pass the current pendingActions from your working memory as input.`,
  inputSchema: z.object({
    actions: z.array(z.object({
      id: z.string(),
      protocol: z.string(),
      actionType: z.string(),
      description: z.string(),
      fuseActions: z.array(z.object({
        fuse: z.string(),
        data: z.string(),
      })),
    })).describe('The pending actions from working memory to display'),
    message: z.string().optional().describe('Optional message to display with the actions'),
  }),
  outputSchema: z.object({
    type: z.literal('pending-actions'),
    actions: z.array(z.object({
      id: z.string(),
      protocol: z.string(),
      actionType: z.string(),
      description: z.string(),
      fuseActions: z.array(z.object({
        fuse: z.string(),
        data: z.string(),
      })),
    })),
    message: z.string(),
  }),
  execute: async ({ actions, message }) => {
    return {
      type: 'pending-actions' as const,
      actions: actions ?? [],
      message: message ?? (actions.length === 0
        ? 'No pending actions'
        : `${actions.length} pending action${actions.length === 1 ? '' : 's'}`),
    };
  },
});
