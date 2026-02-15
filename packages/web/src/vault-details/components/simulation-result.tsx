'use client';

import { useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  CheckCircle2,
  XCircle,
  Wallet,
  Loader2,
} from 'lucide-react';
import {
  useAccount,
  useConnect,
  useWriteContract,
  useWaitForTransactionReceipt,
} from 'wagmi';
import type { Address, Hex } from 'viem';
import type { SimulationResultOutput, BalanceSnapshot } from '@ipor/fusion-mastra/alpha-types';
import { SimulationBalanceComparison } from './simulation-balance-comparison';

/** Minimal ABI for PlasmaVault.execute(FuseAction[]) */
const plasmaVaultExecuteAbi = [
  {
    type: 'function' as const,
    name: 'execute' as const,
    inputs: [
      {
        name: 'calls_' as const,
        type: 'tuple[]' as const,
        components: [
          { name: 'fuse' as const, type: 'address' as const },
          { name: 'data' as const, type: 'bytes' as const },
        ],
      },
    ],
    outputs: [],
    stateMutability: 'nonpayable' as const,
  },
] as const;

interface Props {
  success: SimulationResultOutput['success'];
  message: SimulationResultOutput['message'];
  vaultAddress: SimulationResultOutput['vaultAddress'];
  chainId: SimulationResultOutput['chainId'];
  error?: SimulationResultOutput['error'];
  flatFuseActions: SimulationResultOutput['flatFuseActions'];
  actionsCount: SimulationResultOutput['actionsCount'];
  fuseActionsCount: SimulationResultOutput['fuseActionsCount'];
  balancesBefore?: BalanceSnapshot;
  balancesAfter?: BalanceSnapshot;
}

export function SimulationResult({
  success,
  message,
  vaultAddress,
  chainId,
  error,
  flatFuseActions,
  actionsCount,
  fuseActionsCount,
  balancesBefore,
  balancesAfter,
}: Props) {
  const { isConnected } = useAccount();
  const { connect, connectors, isPending: isConnecting, error: connectError } = useConnect();
  const {
    writeContract,
    data: txHash,
    isPending: isWriting,
    error: writeError,
    reset: resetWrite,
  } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({ hash: txHash });

  const handleConnect = useCallback(() => {
    const connector = connectors[0];
    if (connector) {
      connect({ connector });
    }
  }, [connect, connectors]);

  const handleExecute = useCallback(() => {
    writeContract({
      address: vaultAddress as Address,
      abi: plasmaVaultExecuteAbi,
      functionName: 'execute',
      args: [
        flatFuseActions.map((a) => ({
          fuse: a.fuse as Address,
          data: a.data as Hex,
        })),
      ],
      chainId,
    });
  }, [writeContract, vaultAddress, flatFuseActions, chainId]);

  return (
    <Card
      className={`p-4 space-y-3 ${success ? 'border-green-500/50' : 'border-destructive/50'}`}
    >
      {/* Status header */}
      <div className="flex items-center gap-2">
        {success ? (
          <CheckCircle2 className="w-5 h-5 text-green-500" />
        ) : (
          <XCircle className="w-5 h-5 text-destructive" />
        )}
        <p className="text-sm font-medium">{message}</p>
      </div>

      {/* Error details */}
      {error && (
        <pre className="text-xs bg-destructive/10 text-destructive rounded p-2 overflow-auto max-h-32">
          {error}
        </pre>
      )}

      {/* Action summary */}
      {success && (
        <p className="text-xs text-muted-foreground">
          {actionsCount} action{actionsCount === 1 ? '' : 's'},{' '}
          {fuseActionsCount} fuse call{fuseActionsCount === 1 ? '' : 's'}
        </p>
      )}

      {/* Balance comparison — when simulation succeeded with balance data */}
      {success && balancesBefore && balancesAfter && (
        <SimulationBalanceComparison
          before={balancesBefore}
          after={balancesAfter}
          chainId={chainId}
        />
      )}

      {/* Execute section — only when simulation succeeded */}
      {success && !isConfirmed && (
        <div className="pt-2 border-t space-y-2">
          {!isConnected ? (
            <>
              <Button
                onClick={handleConnect}
                disabled={isConnecting}
                variant="outline"
                size="sm"
                className="w-full"
              >
                {isConnecting ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <Wallet className="w-4 h-4 mr-2" />
                )}
                Connect Wallet to Execute
              </Button>
              {connectError && (
                <p className="text-xs text-destructive">
                  {connectError.message.slice(0, 200)}
                </p>
              )}
            </>
          ) : (
            <Button
              onClick={handleExecute}
              disabled={isWriting || isConfirming}
              size="sm"
              className="w-full"
            >
              {isWriting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Confirm in wallet...
                </>
              ) : isConfirming ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Waiting for confirmation...
                </>
              ) : (
                'Execute Transaction'
              )}
            </Button>
          )}

          {/* Write error */}
          {writeError && (
            <div className="space-y-1">
              <p className="text-xs text-destructive">
                Transaction failed: {writeError.message.slice(0, 200)}
              </p>
              <Button variant="ghost" size="sm" onClick={() => resetWrite()}>
                Try again
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Tx hash & confirmation */}
      {txHash && (
        <div className="pt-2 border-t">
          {isConfirmed && (
            <div className="flex items-center gap-2 text-green-500">
              <CheckCircle2 className="w-4 h-4" />
              <span className="text-sm font-medium">
                Transaction confirmed!
              </span>
            </div>
          )}
          <p className="text-xs text-muted-foreground mt-1 font-mono">
            tx: {txHash.slice(0, 10)}...{txHash.slice(-8)}
          </p>
        </div>
      )}
    </Card>
  );
}
