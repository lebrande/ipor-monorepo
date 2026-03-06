'use client';

import { Card } from '@/components/ui/card';
import { TokenIcon } from '@/components/token-icon';
import { BlockExplorerAddress } from '@/components/ui/block-explorer-address';
import { formatCurrency } from '@/lib/utils';
import type { YoVaultsOutput } from '@ipor/fusion-mastra/yo-treasury-types';
import type { Address } from 'viem';
import type { ChainId } from '@/app/wagmi-provider';

interface Props {
  output: YoVaultsOutput;
  chainId: number;
}

function formatApy(apy: string | null): string {
  if (!apy) return 'APY N/A';
  const num = parseFloat(apy);
  if (isNaN(num)) return 'APY N/A';
  return `${num.toFixed(2)}% APY`;
}

function formatTvl(tvl: string | null): string {
  if (!tvl) return '';
  const num = parseFloat(tvl.replace(/[$,]/g, ''));
  if (isNaN(num)) return `TVL: ${tvl}`;
  return `TVL: ${formatCurrency(num)}`;
}

export function YoVaultsList({ output, chainId }: Props) {
  if (!output.success) {
    return (
      <Card className="p-3 text-sm text-destructive">
        {output.error ?? 'Failed to load vaults'}
      </Card>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-xs text-muted-foreground">{output.message}</p>
      <div className="grid gap-2">
        {output.vaults.map((vault) => (
          <Card key={vault.address} className="p-3 space-y-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TokenIcon
                  chainId={vault.chainId ?? chainId}
                  address={vault.underlyingAddress as Address}
                  className="w-5 h-5"
                />
                <span className="text-sm font-medium">{vault.symbol}</span>
              </div>
              <span className="text-sm text-green-500 font-mono">
                {formatApy(vault.apy7d)}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Underlying: {vault.underlying}</span>
              <span>{formatTvl(vault.tvl)}</span>
            </div>
            <BlockExplorerAddress
              chainId={(vault.chainId ?? chainId) as ChainId}
              address={vault.address as Address}
            />
          </Card>
        ))}
      </div>
    </div>
  );
}
