'use client';

import { Card } from '@/components/ui/card';
import { CheckCircle2, XCircle } from 'lucide-react';
import { ProtocolIcon, getProtocolLabel } from '@/components/protocol-icon/protocol-icon';
import { SimulationBalanceComparison } from './simulation-balance-comparison';
import type { ActionWithSimulationOutput, BalanceSnapshot } from '@ipor/fusion-mastra/alpha-types';

interface Props {
  success: ActionWithSimulationOutput['success'];
  protocol: ActionWithSimulationOutput['protocol'];
  actionType: ActionWithSimulationOutput['actionType'];
  description: ActionWithSimulationOutput['description'];
  error?: ActionWithSimulationOutput['error'];
  simulation?: ActionWithSimulationOutput['simulation'];
  chainId: number;
}

export function ActionWithSimulation({
  success,
  protocol,
  actionType,
  description,
  error,
  simulation,
  chainId,
}: Props) {
  return (
    <Card className={`p-4 space-y-3 ${success ? 'border-green-500/50' : 'border-destructive/50'}`}>
      {/* Action header */}
      <div className="flex items-center gap-2">
        {success ? (
          <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
        ) : (
          <XCircle className="w-5 h-5 text-destructive shrink-0" />
        )}
        <ProtocolIcon protocol={protocol} className="w-5 h-5 shrink-0" />
        <div className="min-w-0">
          <p className="text-sm font-medium">
            {getProtocolLabel(protocol)} — {actionType}
          </p>
          <p className="text-xs text-muted-foreground truncate">{description}</p>
        </div>
      </div>

      {/* Action error */}
      {error && !simulation && (
        <pre className="text-xs bg-destructive/10 text-destructive rounded p-2 overflow-auto max-h-32">
          {error}
        </pre>
      )}

      {/* Simulation results */}
      {simulation && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            {simulation.success ? (
              <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
            ) : (
              <XCircle className="w-4 h-4 text-destructive shrink-0" />
            )}
            <p className="text-xs text-muted-foreground">{simulation.message}</p>
          </div>

          {simulation.error && (
            <pre className="text-xs bg-destructive/10 text-destructive rounded p-2 overflow-auto max-h-32">
              {simulation.error}
            </pre>
          )}

          {simulation.success && simulation.actionsCount > 0 && (
            <p className="text-xs text-muted-foreground">
              Simulated {simulation.actionsCount} action{simulation.actionsCount === 1 ? '' : 's'},{' '}
              {simulation.fuseActionsCount} fuse call{simulation.fuseActionsCount === 1 ? '' : 's'}
            </p>
          )}

          {simulation.success && simulation.balancesBefore && simulation.balancesAfter && (
            <SimulationBalanceComparison
              before={simulation.balancesBefore as BalanceSnapshot}
              after={simulation.balancesAfter as BalanceSnapshot}
              chainId={chainId}
            />
          )}
        </div>
      )}
    </Card>
  );
}
