'use client';

import { formatUnits } from 'viem';
import { Wallet, TrendingUp, Layers, Zap } from 'lucide-react';
import type { TreasuryPosition } from '../hooks/use-treasury-positions';

interface Props {
  positions: TreasuryPosition[];
  unallocatedBalance: bigint | undefined;
  assetDecimals: number;
  assetSymbol: string;
  tokenPriceUsd: number | undefined;
  isLoading: boolean;
}

function formatUsd(value: number): string {
  if (value < 0.01 && value > 0) return '<$0.01';
  return `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function StatCard({
  label,
  value,
  subValue,
  icon: Icon,
  accent,
}: {
  label: string;
  value: string;
  subValue?: string;
  icon: React.ComponentType<{ className?: string }>;
  accent?: boolean;
}) {
  return (
    <div className="relative bg-yo-dark rounded-lg p-4 border border-white/5 overflow-hidden group">
      {/* Subtle glow on hover */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none bg-yo-neon/[0.02]" />

      <div className="flex items-center gap-2 mb-2">
        <div className={`p-1.5 rounded-md ${accent ? 'bg-yo-neon/10' : 'bg-white/5'}`}>
          <Icon className={`w-3.5 h-3.5 ${accent ? 'text-yo-neon' : 'text-yo-muted'}`} />
        </div>
        <span className="text-[11px] font-medium tracking-wider uppercase text-yo-muted">
          {label}
        </span>
      </div>

      <div className={`text-xl font-semibold tracking-tight ${accent ? 'text-yo-neon' : 'text-white'}`}>
        {value}
      </div>

      {subValue && (
        <div className="text-xs text-yo-muted mt-0.5">{subValue}</div>
      )}
    </div>
  );
}

export function PortfolioSummary({
  positions,
  unallocatedBalance,
  assetDecimals,
  assetSymbol,
  tokenPriceUsd,
  isLoading,
}: Props) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="bg-yo-dark rounded-lg p-4 border border-white/5 animate-pulse"
          >
            <div className="h-3 w-16 bg-white/5 rounded mb-3" />
            <div className="h-6 w-24 bg-white/5 rounded" />
          </div>
        ))}
      </div>
    );
  }

  // Calculate totals
  const unallocatedNum = unallocatedBalance
    ? Number(formatUnits(unallocatedBalance, assetDecimals))
    : 0;
  const unallocatedUsd = tokenPriceUsd ? unallocatedNum * tokenPriceUsd : unallocatedNum;

  // For allocated positions, sum up USD values
  // Since positions are in different tokens, we estimate USD based on the
  // assumption that the treasury underlying is the primary unit.
  // For non-underlying positions (yoETH, yoBTC), we'd need separate prices.
  // For hackathon: show asset amounts, use unallocated USD for total.
  const activePositions = positions.filter((p) => p.shares > 0n);

  // Simple total: unallocated USD + position asset values
  // This is approximate — proper USD conversion would need per-token prices
  let allocatedUsd = 0;
  for (const pos of activePositions) {
    const amount = Number(pos.assetsFormatted);
    // For USDC-denominated positions, approximate $1
    if (pos.underlying === 'USDC') {
      allocatedUsd += amount;
    } else if (pos.underlying === 'EURC') {
      allocatedUsd += amount * 1.1; // rough EUR/USD
    } else {
      // For WETH/cbBTC we don't have exact prices here
      // Show the position amount without USD conversion
      allocatedUsd += 0; // will show "—" for non-USD positions
    }
  }

  const totalUsd = unallocatedUsd + allocatedUsd;
  const hasNonUsdPositions = activePositions.some(
    (p) => p.underlying !== 'USDC' && p.underlying !== 'EURC',
  );

  const unallocatedFormatted =
    unallocatedBalance !== undefined
      ? `${Number(formatUnits(unallocatedBalance, assetDecimals)).toLocaleString(undefined, { maximumFractionDigits: 2 })} ${assetSymbol}`
      : '—';

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <StatCard
        label="Total Value"
        value={hasNonUsdPositions ? '~' + formatUsd(totalUsd) : formatUsd(totalUsd)}
        subValue="treasury holdings"
        icon={Wallet}
        accent
      />
      <StatCard
        label="Allocated"
        value={
          activePositions.length > 0
            ? allocatedUsd > 0
              ? formatUsd(allocatedUsd)
              : `${activePositions.length} vault${activePositions.length > 1 ? 's' : ''}`
            : '$0.00'
        }
        subValue="earning yield"
        icon={TrendingUp}
      />
      <StatCard
        label="Unallocated"
        value={tokenPriceUsd ? formatUsd(unallocatedUsd) : unallocatedFormatted}
        subValue={tokenPriceUsd ? unallocatedFormatted : 'idle funds'}
        icon={Layers}
      />
      <StatCard
        label="Active Vaults"
        value={`${activePositions.length} / ${positions.length}`}
        subValue={
          activePositions.length > 0
            ? 'generating yield'
            : 'allocate via chat'
        }
        icon={Zap}
      />
    </div>
  );
}
