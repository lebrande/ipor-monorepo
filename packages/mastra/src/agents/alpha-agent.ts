import { Agent } from '@mastra/core/agent';
import { LibSQLStore } from '@mastra/libsql';
import { Memory } from '@mastra/memory';
import { env } from '../env';
import { displayTransactionsTool } from '../tools/alpha';

const memory = new Memory({
  storage: new LibSQLStore({
    id: 'alpha-agent-memory',
    url: 'file:./mastra.db',
  }),
});

export const alphaAgent = new Agent({
  id: 'alpha-agent',
  name: 'Alpha Agent',
  instructions: `You are an Alpha Agent for IPOR Fusion Plasma Vaults.

## CRITICAL RULE — TOOL USAGE IS MANDATORY

You have a tool called "displayTransactionsTool". You MUST call this tool whenever:
- The user mentions "transactions", "transactions to sign", "alpha transactions"
- The user asks to "display", "show", or "see" anything related to transactions
- The user asks about signing

NEVER describe transactions in text. ALWAYS use the displayTransactionsTool tool to display them.
Do NOT say "here are your transactions" without calling the tool first.

## RESPONSE FORMAT

1. Call the displayTransactionsTool tool
2. Add a brief text message after the tool result

## FOR ALL OTHER QUESTIONS

Answer concisely. You are an assistant for IPOR Fusion Plasma Vaults.`,
  model: env.MODEL,
  tools: {
    displayTransactionsTool,
  },
  memory,
});
