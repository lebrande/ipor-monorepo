'use client';

import { useState, useCallback } from 'react';
import { useAccount, usePublicClient, useWalletClient } from 'wagmi';
import { base } from 'viem/chains';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  createAndConfigureVault,
  type VaultCreationResult,
} from '@ipor/fusion-sdk';

type Status = 'idle' | 'creating' | 'done' | 'error';

export default function CreateTreasuryVaultPage() {
  const { address } = useAccount();
  const publicClient = usePublicClient({ chainId: base.id });
  const { data: walletClient } = useWalletClient({ chainId: base.id });

  const [status, setStatus] = useState<Status>('idle');
  const [result, setResult] = useState<VaultCreationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = useCallback((msg: string) => {
    setLogs((prev) => [...prev, msg]);
  }, []);

  const handleCreate = async () => {
    if (!address || !publicClient || !walletClient) return;

    setStatus('creating');
    setError(null);
    setLogs([]);

    try {
      addLog('Creating treasury vault on Base...');
      addLog(`Owner: ${address}`);

      const truncated = `${address.slice(0, 6)}...${address.slice(-4)}`;
      const vaultName = `YO Treasury ${truncated} ${format(new Date(), 'yyyy-MM-dd')}`;

      const res = await createAndConfigureVault(publicClient, walletClient, {
        chainId: base.id,
        ownerAddress: address,
        vaultName,
      });

      addLog(`Vault created: ${res.vaultAddress}`);
      addLog(`Access Manager: ${res.accessManagerAddress}`);
      addLog(`Tx: ${res.txHash}`);
      setResult(res);
      setStatus('done');
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
      addLog(`Error: ${msg}`);
      setStatus('error');
    }
  };

  return (
    <div className="p-4 md:p-6 max-w-2xl">
      <h1 className="text-2xl font-bold tracking-tight mb-1">
        Create Treasury Vault
      </h1>
      <p className="text-muted-foreground mb-6">
        Deploy a new Fusion PlasmaVault on Base configured for YO Treasury
      </p>

      <Card className="p-4 space-y-4">
        {!address && (
          <p className="text-sm text-muted-foreground">
            Connect your wallet to create a vault.
          </p>
        )}

        {address && status === 'idle' && (
          <Button onClick={handleCreate}>Create Treasury Vault</Button>
        )}

        {status === 'creating' && (
          <p className="text-sm text-muted-foreground">
            Creating vault... sign the transactions in your wallet.
          </p>
        )}

        {logs.length > 0 && (
          <pre className="text-xs bg-muted p-3 rounded overflow-x-auto whitespace-pre-wrap">
            {logs.join('\n')}
          </pre>
        )}

        {result && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-green-600">
              Vault created successfully!
            </p>
            <div className="flex items-center gap-2">
              <code className="text-sm bg-muted px-2 py-1 rounded flex-1 select-all">
                {result.vaultAddress}
              </code>
            </div>
            <p className="text-xs text-muted-foreground">
              Copy this address, add it to plasma-vaults.json, and restart
              ponder.
            </p>
          </div>
        )}

        {error && <p className="text-sm text-destructive">{error}</p>}
      </Card>
    </div>
  );
}
