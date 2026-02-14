import { Agent } from '@mastra/core/agent';
import { LibSQLStore } from '@mastra/libsql';
import { Memory } from '@mastra/memory';
import { z } from 'zod';
import { env } from '../env';
import {
  displayPendingActionsTool,
  createAaveV3ActionTool,
  createMorphoActionTool,
  createEulerV2ActionTool,
} from '../tools/alpha';

/** Schema for a single pending action stored in working memory */
const pendingActionSchema = z.object({
  id: z.string().describe('Unique ID for this action, e.g. "1", "2"'),
  protocol: z.enum(['aave-v3', 'morpho', 'euler-v2']).describe('Protocol name'),
  actionType: z.enum(['supply', 'withdraw', 'borrow', 'repay']).describe('Action type'),
  description: z.string().describe('Human-readable description'),
  fuseActions: z.array(z.object({
    fuse: z.string().describe('Fuse contract address'),
    data: z.string().describe('Hex-encoded calldata'),
  })).describe('Raw FuseAction data from SDK'),
});

/** Working memory schema for the Alpha Agent */
export const alphaWorkingMemorySchema = z.object({
  pendingActions: z.array(pendingActionSchema).optional().describe(
    'List of pending fuse actions to execute as a batch'
  ),
});

export type PendingAction = z.infer<typeof pendingActionSchema>;

const memory = new Memory({
  storage: new LibSQLStore({
    id: 'alpha-agent-memory',
    url: 'file:./mastra.db',
  }),
  options: {
    workingMemory: {
      enabled: true,
      schema: alphaWorkingMemorySchema,
    },
  },
});

export const alphaAgent = new Agent({
  id: 'alpha-agent',
  name: 'Alpha Agent',
  instructions: `You are an Alpha Agent for IPOR Fusion Plasma Vaults. You help users build a batch of fuse actions to execute on a vault.

## YOUR CAPABILITIES

You can create fuse actions using three DeFi protocol SDKs:
- **Aave V3**: supply, withdraw, borrow, repay (needs asset address + amount)
- **Morpho**: supply, withdraw, borrow, repay (needs Morpho market ID + amount)
- **Euler V2**: supply, withdraw (needs Euler vault address + amount)

## WORKFLOW

1. When the user asks to create an action, use the appropriate SDK tool (createAaveV3ActionTool, createMorphoActionTool, or createEulerV2ActionTool).
2. If the tool returns success, ADD the action to your working memory's pendingActions list. Generate a simple incremental ID ("1", "2", etc.). Copy the protocol, actionType, description, and fuseActions from the tool result.
3. When the user asks to see/show/list/display pending actions, call displayPendingActionsTool with the current pendingActions from your working memory.
4. When the user asks to remove an action, update your working memory pendingActions to exclude it.
5. When the user asks to clear all actions, set pendingActions to an empty array.

## WORKING MEMORY MANAGEMENT

Your working memory has a pendingActions array. After each SDK tool call that succeeds:
- Read your current pendingActions (may be empty or have existing items)
- Append the new action with all fields (id, protocol, actionType, description, fuseActions)
- The fuseActions field contains the raw encoded data — copy it exactly from the tool output

When removing actions, provide the complete updated array WITHOUT the removed item.

## IMPORTANT RULES

- ALWAYS use the SDK tools to create actions. NEVER fabricate FuseAction data.
- ALWAYS call displayPendingActionsTool to show actions. NEVER describe them in text only.
- The vaultAddress and chainId come from the conversation context. Use them when calling SDK tools.
- Amounts must be in the token's smallest unit (e.g., USDC has 6 decimals, so 1000 USDC = "1000000000").
- Keep responses concise.`,
  model: env.MODEL,
  tools: {
    displayPendingActionsTool,
    createAaveV3ActionTool,
    createMorphoActionTool,
    createEulerV2ActionTool,
  },
  memory,
});
