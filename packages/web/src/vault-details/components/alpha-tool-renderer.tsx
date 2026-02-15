import { Loader2 } from 'lucide-react';
import { TransactionsToSign } from './transactions-to-sign';
import { PendingActionsList } from './pending-actions-list';
import { MarketBalancesList } from './market-balances-list';
import { SimulationResult } from './simulation-result';
import { ExecuteActions } from './execute-actions';
import { ActionWithSimulation } from './action-with-simulation';
import type { AlphaToolOutput } from '@ipor/fusion-mastra/alpha-types';

interface ToolPartProps {
  state: string;
  output?: unknown;
  chainId: number;
}

/**
 * Renders alpha agent tool outputs based on the discriminated `type` field.
 *
 * Adding a new component:
 * 1. Add the output type in packages/mastra/src/tools/alpha/types.ts
 * 2. Create a React component in this directory
 * 3. Add a case to the switch below
 */
export function AlphaToolRenderer({ state, output, chainId }: ToolPartProps) {
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
    case 'market-balances':
      return (
        <MarketBalancesList
          assets={typed.assets}
          markets={typed.markets}
          totalValueUsd={typed.totalValueUsd}
          message={typed.message}
          chainId={chainId}
        />
      );
    case 'action-with-simulation':
      return (
        <ActionWithSimulation
          success={typed.success}
          protocol={typed.protocol}
          actionType={typed.actionType}
          description={typed.description}
          error={typed.error}
          simulation={typed.simulation}
          chainId={chainId}
        />
      );
    case 'simulation-result':
      return (
        <SimulationResult
          success={typed.success}
          message={typed.message}
          vaultAddress={typed.vaultAddress}
          chainId={typed.chainId}
          error={typed.error}
          flatFuseActions={typed.flatFuseActions}
          actionsCount={typed.actionsCount}
          fuseActionsCount={typed.fuseActionsCount}
          balancesBefore={typed.balancesBefore}
          balancesAfter={typed.balancesAfter}
        />
      );
    case 'execute-actions':
      return (
        <ExecuteActions
          vaultAddress={typed.vaultAddress}
          chainId={typed.chainId}
          flatFuseActions={typed.flatFuseActions}
          actionsCount={typed.actionsCount}
          fuseActionsCount={typed.fuseActionsCount}
          actionsSummary={typed.actionsSummary}
        />
      );
    default:
      // Hide internal tool results (e.g. working memory updates)
      return null;
  }
}
