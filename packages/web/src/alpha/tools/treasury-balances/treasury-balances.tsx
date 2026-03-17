'use client';

import { Card } from '@/components/ui/card';
import { TokenIcon } from '@/components/token-icon';
import { BlockExplorerAddress } from '@/components/ui/block-explorer-address';
import type { TreasuryBalancesOutput } from '@ipor/fusion-mastra/yo-treasury-types';
import type { Address } from 'viem';
import type { ChainId } from '@/app/chains.config';

interface Props {
  output: TreasuryBalancesOutput;
  chainId: number;
}

function formatUsd(value: string): string {
  const num = parseFloat(value);
  if (isNaN(num)) return `$${value}`;
  return `$${num.toFixed(2)}`;
}

export function TreasuryBalances({ output, chainId }: Props) {
  if (!output.success) {
    return (
      <Card className="p-3 text-sm text-destructive">
        {output.error ?? 'Failed to load balances'}
      </Card>
    );
  }

  return (
    <Card className="p-4 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">Treasury Overview</span>
        <span className="text-sm font-mono">{formatUsd(output.totalValueUsd)}</span>
      </div>

      {output.assets.length > 0 && (
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground font-medium">
            Unallocated
          </p>
          {output.assets.map((asset) => (
            <div
              key={asset.address}
              className="flex items-center gap-2 text-sm"
            >
              <TokenIcon
                chainId={chainId}
                address={asset.address as Address}
                className="w-4 h-4"
              />
              <span className="flex-1">{asset.symbol}</span>
              <span className="font-mono">
                {asset.balanceFormatted} ({formatUsd(asset.valueUsd)})
              </span>
            </div>
          ))}
        </div>
      )}

      {output.yoPositions.length > 0 && (
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground font-medium">
            YO Allocations
          </p>
          {output.yoPositions.map((pos) => (
            <div
              key={pos.vaultAddress}
              className="space-y-0.5"
            >
              <div className="flex items-center gap-2 text-sm">
                <TokenIcon
                  chainId={chainId}
                  address={pos.underlyingAddress as Address}
                  className="w-4 h-4"
                />
                <span className="flex-1">{pos.vaultSymbol}</span>
                <span className="font-mono">
                  {pos.underlyingFormatted} {pos.underlyingSymbol} ({formatUsd(pos.valueUsd)})
                </span>
              </div>
              <div className="pl-6">
                <BlockExplorerAddress
                  chainId={chainId as ChainId}
                  address={pos.vaultAddress as Address}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      <p className="text-xs text-muted-foreground">{output.message}</p>
    </Card>
  );
}
