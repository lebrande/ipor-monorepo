import { createTool } from '@mastra/core/tools';
import { z } from 'zod';

export const displayTransactionsTool = createTool({
  id: 'display-transactions',
  description:
    'Display a placeholder UI component showing transactions to sign. Call this tool when the user asks to see, show, or display transactions to sign.',
  inputSchema: z.object({
    message: z
      .string()
      .optional()
      .describe('Optional message to display with the transactions'),
  }),
  outputSchema: z.object({
    type: z.literal('transactions-to-sign'),
    message: z.string(),
    placeholder: z.literal(true),
  }),
  execute: async ({ message }) => {
    return {
      type: 'transactions-to-sign' as const,
      message: message ?? 'Alpha transactions ready to sign',
      placeholder: true as const,
    };
  },
});
