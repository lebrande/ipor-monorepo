'use client';

import { Card } from '@/components/ui/card';
import { Coins, TrendingUp, TrendingDown } from 'lucide-react';
import { TokenIcon } from '@/components/token-icon/token-icon';
import { ProtocolIcon, getProtocolLabel } from '@/components/protocol-icon/protocol-icon';
import type { MarketBalancesOutput } from '@ipor/fusion-mastra/alpha-types';
import type { Address } from 'viem';

type VaultAsset = MarketBalancesOutput['assets'][number];
type MarketAllocation = MarketBalancesOutput['markets'][number];
type MarketPosition = MarketAllocation['positions'][number];

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

function AssetRow({ asset, chainId }: { asset: VaultAsset; chainId: number }) {
  return (
    <div className="flex items-center justify-between py-2 border-b last:border-b-0">
      <div className="flex items-center gap-3">
        <TokenIcon chainId={chainId} address={asset.address as Address} className="w-8 h-8" />
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

function PositionRow({ position, chainId }: { position: MarketPosition; chainId: number }) {
  const supplyNum = parseFloat(position.supplyValueUsd);
  const borrowNum = parseFloat(position.borrowValueUsd);

  return (
    <div className="flex items-center justify-between py-2 border-b last:border-b-0">
      <div className="flex items-center gap-3">
        <TokenIcon chainId={chainId} address={position.underlyingToken as Address} className="w-8 h-8" />
        <div>
          <p className="text-sm font-medium">
            {position.label ?? position.underlyingSymbol}
          </p>
          {position.label && (
            <p className="text-xs text-muted-foreground">{position.underlyingSymbol}</p>
          )}
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            {supplyNum > 0 && (
              <span className="flex items-center gap-0.5 text-green-600">
                <TrendingUp className="w-3 h-3" />
                {formatBalance(position.supplyFormatted)}
              </span>
            )}
            {borrowNum > 0 && (
              <span className="flex items-center gap-0.5 text-red-500">
                <TrendingDown className="w-3 h-3" />
                {formatBalance(position.borrowFormatted)}
              </span>
            )}
          </div>
        </div>
      </div>
      <div className="text-right">
        <p className="text-sm font-medium">
          {formatUsd(position.totalValueUsd)}
        </p>
        <div className="flex flex-col items-end text-xs text-muted-foreground">
          {supplyNum > 0 && (
            <span className="text-green-600">{formatUsd(position.supplyValueUsd)}</span>
          )}
          {borrowNum > 0 && (
            <span className="text-red-500">-{formatUsd(position.borrowValueUsd)}</span>
          )}
        </div>
      </div>
    </div>
  );
}

function MarketCard({ market, chainId }: { market: MarketAllocation; chainId: number }) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <ProtocolIcon protocol={market.protocol} className="w-4 h-4" />
          <p className="text-xs font-semibold text-muted-foreground tracking-wide">
            {getProtocolLabel(market.protocol)}
          </p>
        </div>
        <p className="text-xs font-medium">{formatUsd(market.totalValueUsd)}</p>
      </div>
      <div>
        {market.positions.map((pos, i) => (
          <PositionRow key={`${market.marketId}-${i}`} position={pos} chainId={chainId} />
        ))}
      </div>
    </div>
  );
}

interface Props {
  assets: VaultAsset[];
  markets: MarketAllocation[];
  totalValueUsd: string;
  message: string;
  chainId: number;
}

export function MarketBalancesList({ assets, markets, totalValueUsd, message, chainId }: Props) {
  const hasAssets = assets.length > 0;
  const hasMarkets = markets.length > 0;

  if (!hasAssets && !hasMarkets) {
    return (
      <Card className="p-4 border-dashed border-2 bg-muted/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Coins className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="text-sm font-medium">{message}</p>
            <p className="text-xs text-muted-foreground">No positions found</p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Coins className="w-4 h-4 text-primary" />
          <p className="text-sm font-medium">{message}</p>
        </div>
        <p className="text-sm font-semibold">{formatUsd(totalValueUsd)}</p>
      </div>

      {hasAssets && (
        <div className="space-y-1">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Unallocated Tokens
          </p>
          <div>
            {assets.map((asset) => (
              <AssetRow key={asset.address} asset={asset} chainId={chainId} />
            ))}
          </div>
        </div>
      )}

      {hasMarkets && markets.map((market) => (
        <MarketCard key={market.marketId} market={market} chainId={chainId} />
      ))}
    </Card>
  );
}
