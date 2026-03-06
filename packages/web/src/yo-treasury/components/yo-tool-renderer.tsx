import { Loader2 } from 'lucide-react';
import { YoVaultsList } from './yo-vaults-list';
import { TreasuryBalances } from './treasury-balances';
import { ActionWithSimulation } from '@/vault-details/components/action-with-simulation';
import { PendingActionsList } from '@/vault-details/components/pending-actions-list';
import { ExecuteActions } from '@/vault-details/components/execute-actions';
import type { YoVaultsOutput, TreasuryBalancesOutput } from '@ipor/fusion-mastra/yo-treasury-types';
import type { ActionWithSimulationOutput, PendingActionsOutput, ExecuteActionsOutput } from '@ipor/fusion-mastra/alpha-types';

interface ToolPartProps {
  state: string;
  output?: unknown;
  chainId: number;
}

export function YoToolRenderer({ state, output, chainId }: ToolPartProps) {
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
    case 'yo-vaults':
      return <YoVaultsList output={typed as YoVaultsOutput} chainId={chainId} />;
    case 'treasury-balances':
      return <TreasuryBalances output={typed as TreasuryBalancesOutput} chainId={chainId} />;
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
