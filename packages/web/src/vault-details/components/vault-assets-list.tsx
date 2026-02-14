'use client';

import { Card } from '@/components/ui/card';
import { Coins } from 'lucide-react';
import type { VaultAssetsOutput } from '@ipor/fusion-mastra/alpha-types';

type VaultAsset = VaultAssetsOutput['assets'][number];

function formatBalance(value: string): string {
  const num = parseFloat(value);
  if (num === 0) return '0';
  if (num < 0.01) return '<0.01';
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(2)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(2)}K`;
  return num.toFixed(2);
}

function formatUsd(value: string): string {
  const num = parseFloat(value);
  if (num === 0) return '$0.00';
  if (num < 0.01) return '<$0.01';
  if (num >= 1_000_000) return `$${(num / 1_000_000).toFixed(2)}M`;
  if (num >= 1_000) return `$${(num / 1_000).toFixed(2)}K`;
  return `$${num.toFixed(2)}`;
}

function AssetRow({ asset }: { asset: VaultAsset }) {
  return (
    <div className="flex items-center justify-between py-2 border-b last:border-b-0">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
          {asset.symbol.slice(0, 3)}
        </div>
        <div>
          <p className="text-sm font-medium">{asset.symbol}</p>
          <p className="text-xs text-muted-foreground">{asset.name}</p>
        </div>
      </div>
      <div className="text-right">
        <p className="text-sm font-medium">
          {formatBalance(asset.balanceFormatted)}
        </p>
        <p className="text-xs text-muted-foreground">
          {formatUsd(asset.valueUsd)}
        </p>
      </div>
    </div>
  );
}

interface Props {
  assets: VaultAsset[];
  totalValueUsd: string;
  message: string;
}

export function VaultAssetsList({ assets, totalValueUsd, message }: Props) {
  if (assets.length === 0) {
    return (
      <Card className="p-4 border-dashed border-2 bg-muted/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Coins className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="text-sm font-medium">{message}</p>
            <p className="text-xs text-muted-foreground">No tokens found</p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Coins className="w-4 h-4 text-primary" />
          <p className="text-sm font-medium">{message}</p>
        </div>
        <p className="text-sm font-semibold">{formatUsd(totalValueUsd)}</p>
      </div>
      <div>
        {assets.map((asset) => (
          <AssetRow key={asset.address} asset={asset} />
        ))}
      </div>
    </Card>
  );
}
