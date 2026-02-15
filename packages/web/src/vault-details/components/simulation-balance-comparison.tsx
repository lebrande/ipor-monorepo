'use client';

import { Card } from '@/components/ui/card';
import { ArrowRight, TrendingUp, TrendingDown } from 'lucide-react';
import type { BalanceSnapshot } from '@ipor/fusion-mastra/alpha-types';

type Asset = BalanceSnapshot['assets'][number];
type Market = BalanceSnapshot['markets'][number];
type Position = Market['positions'][number];

function formatBalance(value: string): string {
  const num = parseFloat(value);
  if (num === 0) return '0';
  if (num < 0.01 && num > 0) return '<0.01';
  if (num > -0.01 && num < 0) return '>-0.01';
  if (Math.abs(num) >= 1_000_000) return `${(num / 1_000_000).toFixed(2)}M`;
  if (Math.abs(num) >= 1_000) return `${(num / 1_000).toFixed(2)}K`;
  return num.toFixed(2);
}

function formatUsd(value: string): string {
  const num = parseFloat(value);
  if (num === 0) return '$0.00';
  if (num < 0.01 && num > 0) return '<$0.01';
  if (num > -0.01 && num < 0) return '>-$0.01';
  const abs = Math.abs(num);
  const sign = num < 0 ? '-' : '';
  if (abs >= 1_000_000) return `${sign}$${(abs / 1_000_000).toFixed(2)}M`;
  if (abs >= 1_000) return `${sign}$${(abs / 1_000).toFixed(2)}K`;
  return `${sign}$${abs.toFixed(2)}`;
}

function DeltaBadge({ before, after }: { before: string; after: string }) {
  const delta = parseFloat(after) - parseFloat(before);
  if (Math.abs(delta) < 0.005) {
    return <span className="text-xs text-muted-foreground">&mdash;</span>;
  }
  const isPositive = delta > 0;
  return (
    <span className={`text-xs font-medium ${isPositive ? 'text-green-600' : 'text-red-500'}`}>
      {isPositive ? '+' : ''}{formatUsd(delta.toFixed(2))}
    </span>
  );
}

function BalanceDelta({ before, after }: { before: string; after: string }) {
  const delta = parseFloat(after) - parseFloat(before);
  if (Math.abs(delta) < 0.000001) return null;
  const isPositive = delta > 0;
  return (
    <span className={`text-xs ${isPositive ? 'text-green-600' : 'text-red-500'}`}>
      {isPositive ? '+' : ''}{formatBalance(delta.toFixed(6))}
    </span>
  );
}

function AssetRow({ before, after }: { before: Asset; after: Asset }) {
  return (
    <div className="flex items-center justify-between py-2 border-b last:border-b-0">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
          {before.symbol.slice(0, 3)}
        </div>
        <div>
          <p className="text-sm font-medium">{before.symbol}</p>
          <p className="text-xs text-muted-foreground">{before.name}</p>
        </div>
      </div>
      <div className="text-right space-y-0.5">
        <div className="flex items-center gap-1.5 justify-end">
          <span className="text-xs text-muted-foreground">{formatBalance(before.balanceFormatted)}</span>
          <ArrowRight className="w-3 h-3 text-muted-foreground" />
          <span className="text-sm font-medium">{formatBalance(after.balanceFormatted)}</span>
        </div>
        <div className="flex items-center gap-1.5 justify-end">
          <span className="text-xs text-muted-foreground">{formatUsd(before.valueUsd)}</span>
          <ArrowRight className="w-3 h-3 text-muted-foreground" />
          <span className="text-xs font-medium">{formatUsd(after.valueUsd)}</span>
          <DeltaBadge before={before.valueUsd} after={after.valueUsd} />
        </div>
      </div>
    </div>
  );
}

function PositionRow({ before, after }: { before: Position; after: Position }) {
  const beforeSupply = parseFloat(before.supplyValueUsd);
  const afterSupply = parseFloat(after.supplyValueUsd);
  const beforeBorrow = parseFloat(before.borrowValueUsd);
  const afterBorrow = parseFloat(after.borrowValueUsd);
  const hasSupply = beforeSupply > 0 || afterSupply > 0;
  const hasBorrow = beforeBorrow > 0 || afterBorrow > 0;

  return (
    <div className="flex items-center justify-between py-2 border-b last:border-b-0">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
          {before.underlyingSymbol.slice(0, 3)}
        </div>
        <div>
          <p className="text-sm font-medium">{before.underlyingSymbol}</p>
          <div className="flex flex-col gap-0.5 text-xs text-muted-foreground">
            {hasSupply && (
              <span className="flex items-center gap-1">
                <TrendingUp className="w-3 h-3 text-green-600" />
                {formatBalance(before.supplyFormatted)}
                <ArrowRight className="w-2.5 h-2.5" />
                {formatBalance(after.supplyFormatted)}
                <BalanceDelta before={before.supplyFormatted} after={after.supplyFormatted} />
              </span>
            )}
            {hasBorrow && (
              <span className="flex items-center gap-1">
                <TrendingDown className="w-3 h-3 text-red-500" />
                {formatBalance(before.borrowFormatted)}
                <ArrowRight className="w-2.5 h-2.5" />
                {formatBalance(after.borrowFormatted)}
                <BalanceDelta before={before.borrowFormatted} after={after.borrowFormatted} />
              </span>
            )}
          </div>
        </div>
      </div>
      <div className="text-right">
        <div className="flex items-center gap-1.5 justify-end">
          <span className="text-xs text-muted-foreground">{formatUsd(before.totalValueUsd)}</span>
          <ArrowRight className="w-3 h-3 text-muted-foreground" />
          <span className="text-sm font-medium">{formatUsd(after.totalValueUsd)}</span>
        </div>
        <DeltaBadge before={before.totalValueUsd} after={after.totalValueUsd} />
      </div>
    </div>
  );
}

function MarketSection({ beforeMarket, afterMarket }: { beforeMarket: Market; afterMarket: Market }) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          {beforeMarket.protocol}
        </p>
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-muted-foreground">{formatUsd(beforeMarket.totalValueUsd)}</span>
          <ArrowRight className="w-3 h-3 text-muted-foreground" />
          <span className="text-xs font-medium">{formatUsd(afterMarket.totalValueUsd)}</span>
          <DeltaBadge before={beforeMarket.totalValueUsd} after={afterMarket.totalValueUsd} />
        </div>
      </div>
      <div>
        {beforeMarket.positions.map((beforePos, i) => {
          const afterPos = afterMarket.positions[i] ?? beforePos;
          return (
            <PositionRow
              key={`${beforeMarket.marketId}-${i}`}
              before={beforePos}
              after={afterPos}
            />
          );
        })}
      </div>
    </div>
  );
}

interface Props {
  before: BalanceSnapshot;
  after: BalanceSnapshot;
}

export function SimulationBalanceComparison({ before, after }: Props) {
  const totalBefore = parseFloat(before.totalValueUsd);
  const totalAfter = parseFloat(after.totalValueUsd);
  const totalDelta = totalAfter - totalBefore;

  const hasAssets = before.assets.length > 0 || after.assets.length > 0;
  const hasMarkets = before.markets.length > 0 || after.markets.length > 0;

  if (!hasAssets && !hasMarkets) return null;

  // Build lookup for matching after assets by address
  const afterAssetMap = new Map(after.assets.map(a => [a.address, a]));
  const afterMarketMap = new Map(after.markets.map(m => [m.marketId, m]));

  return (
    <Card className="p-4 space-y-4">
      {/* Total value header */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">Balance Changes</span>
        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">{formatUsd(before.totalValueUsd)}</span>
          <ArrowRight className="w-3 h-3 text-muted-foreground" />
          <span className="font-semibold">{formatUsd(after.totalValueUsd)}</span>
          {Math.abs(totalDelta) >= 0.01 && (
            <span className={`text-xs font-medium ${totalDelta > 0 ? 'text-green-600' : 'text-red-500'}`}>
              {totalDelta > 0 ? '+' : ''}{formatUsd(totalDelta.toFixed(2))}
            </span>
          )}
        </div>
      </div>

      {/* Unallocated Tokens */}
      {hasAssets && (
        <div className="space-y-1">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Unallocated Tokens
          </p>
          <div>
            {before.assets.map((beforeAsset) => {
              const afterAsset = afterAssetMap.get(beforeAsset.address) ?? beforeAsset;
              return (
                <AssetRow
                  key={beforeAsset.address}
                  before={beforeAsset}
                  after={afterAsset}
                />
              );
            })}
          </div>
        </div>
      )}

      {/* Market Positions */}
      {hasMarkets && before.markets.map((beforeMarket) => {
        const afterMarket = afterMarketMap.get(beforeMarket.marketId) ?? beforeMarket;
        return (
          <MarketSection
            key={beforeMarket.marketId}
            beforeMarket={beforeMarket}
            afterMarket={afterMarket}
          />
        );
      })}
    </Card>
  );
}
