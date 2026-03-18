import { Loader2 } from 'lucide-react';
import { MarketBalancesList } from './market-balances/market-balances-list';
import { ActionWithSimulation } from './action-with-simulation/action-with-simulation';
import { PendingActionsList } from './pending-actions/pending-actions-list';
import { ExecuteActions } from './execute-actions/execute-actions';
import type { ToolPartProps } from '../agent-chat';
import type {
  ActionWithSimulationOutput,
  PendingActionsOutput,
  ExecuteActionsOutput,
  MarketBalancesOutput,
} from '@ipor/fusion-mastra/alpha-types';

export function ToolRenderer({ state, output, chainId }: ToolPartProps) {
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

  const typed = output as { type: string };

  switch (typed.type) {
    case 'market-balances': {
      const mb = typed as MarketBalancesOutput;
      return (
        <MarketBalancesList
          assets={mb.assets}
          markets={mb.markets}
          totalValueUsd={mb.totalValueUsd}
          message={mb.message}
          chainId={chainId}
        />
      );
    }

    case 'action-with-simulation': {
      const action = typed as ActionWithSimulationOutput;
      return (
        <ActionWithSimulation
          success={action.success}
          protocol={action.protocol}
          actionType={action.actionType}
          description={action.description}
          error={action.error}
          simulation={action.simulation}
          chainId={chainId}
        />
      );
    }
    case 'pending-actions': {
      const pending = typed as PendingActionsOutput;
      return (
        <PendingActionsList
          actions={pending.actions}
          message={pending.message}
        />
      );
    }
    case 'execute-actions': {
      const exec = typed as ExecuteActionsOutput;
      return (
        <ExecuteActions
          vaultAddress={exec.vaultAddress}
          chainId={exec.chainId}
          flatFuseActions={exec.flatFuseActions}
          actionsCount={exec.actionsCount}
          fuseActionsCount={exec.fuseActionsCount}
          actionsSummary={exec.actionsSummary}
        />
      );
    }

    default:
      return null;
  }
}
