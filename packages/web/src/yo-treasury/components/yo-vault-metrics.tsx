'use client';

import { TrendingUp, DollarSign, BarChart3, Activity } from 'lucide-react';
import type { VaultSnapshot, VaultPerformance } from '@yo-protocol/core';

interface Props {
  snapshot: VaultSnapshot | undefined;
  performance: VaultPerformance | undefined;
  isLoading: boolean;
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
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none bg-yo-neon/[0.02]" />

      <div className="flex items-center gap-2 mb-2">
        <div
          className={`p-1.5 rounded-md ${accent ? 'bg-yo-neon/10' : 'bg-white/5'}`}
        >
          <Icon
            className={`w-3.5 h-3.5 ${accent ? 'text-yo-neon' : 'text-yo-muted'}`}
          />
        </div>
        <span className="text-[11px] font-medium tracking-wider uppercase text-yo-muted">
          {label}
        </span>
      </div>

      <div
        className={`text-xl font-semibold tracking-tight ${accent ? 'text-yo-neon' : 'text-white'}`}
      >
        {value}
      </div>

      {subValue && (
        <div className="text-xs text-yo-muted mt-0.5">{subValue}</div>
      )}
    </div>
  );
}

function formatApr(yield7d: string | null | undefined): string {
  if (!yield7d) return '—';
  const num = parseFloat(yield7d);
  if (isNaN(num)) return '—';
  return `${num.toFixed(2)}%`;
}

function formatTvl(formatted: string | undefined): string {
  if (!formatted) return '—';
  return formatted;
}

export function YoVaultMetrics({ snapshot, performance, isLoading }: Props) {
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

  const apr = formatApr(snapshot?.stats.yield?.['7d']);
  const tvl = formatTvl(snapshot?.stats.tvl?.formatted);
  const sharePrice = snapshot?.stats.sharePrice?.formatted ?? '—';
  const unrealizedReturn = performance?.unrealized?.formatted ?? '—';

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <StatCard
        label="7d APR"
        value={apr}
        subValue="annualized yield"
        icon={TrendingUp}
        accent
      />
      <StatCard
        label="Total Value Locked"
        value={tvl}
        subValue={snapshot?.asset?.symbol ?? ''}
        icon={DollarSign}
      />
      <StatCard
        label="Share Price"
        value={sharePrice}
        subValue="per share"
        icon={BarChart3}
      />
      <StatCard
        label="Unrealized Return"
        value={unrealizedReturn}
        subValue="all time"
        icon={Activity}
      />
    </div>
  );
}
