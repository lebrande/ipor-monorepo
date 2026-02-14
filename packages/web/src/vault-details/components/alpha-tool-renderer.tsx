import { Loader2 } from 'lucide-react';
import { TransactionsToSign } from './transactions-to-sign';
import { PendingActionsList } from './pending-actions-list';
import type { AlphaToolOutput } from '@ipor/fusion-mastra/alpha-types';

interface ToolPartProps {
  state: string;
  output?: unknown;
}

/**
 * Renders alpha agent tool outputs based on the discriminated `type` field.
 *
 * Adding a new component:
 * 1. Add the output type in packages/mastra/src/tools/alpha/types.ts
 * 2. Create a React component in this directory
 * 3. Add a case to the switch below
 */
export function AlphaToolRenderer({ state, output }: ToolPartProps) {
  if (state === 'input-available' || state === 'input-streaming') {
    return (
      <div className="flex items-center gap-2 text-muted-foreground">
        <Loader2 className="w-4 h-4 animate-spin" />
        <span>Processing...</span>
      </div>
    );
  }

  if (state !== 'output-available' || !output) {
    return null;
  }

  const typed = output as AlphaToolOutput;

  switch (typed.type) {
    case 'transactions-to-sign':
      return <TransactionsToSign message={typed.message} />;
    case 'pending-actions':
      return <PendingActionsList actions={typed.actions} message={typed.message} />;
    default:
      return (
        <pre className="text-xs bg-muted rounded p-2 overflow-auto">
          {JSON.stringify(output, null, 2)}
        </pre>
      );
  }
}
