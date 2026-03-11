'use client';

import type { TreasuryPosition } from '../hooks/use-treasury-positions';
import type { YoVaultData } from '../hooks/use-yo-vaults-data';

interface Props {
  positions: TreasuryPosition[];
  vaultsData: YoVaultData[] | undefined;
  isLoading: boolean;
}

function formatApy(apy: string | null): string {
  if (!apy) return '—';
  const num = parseFloat(apy);
  if (isNaN(num)) return '—';
  return `${num.toFixed(2)}%`;
}

function formatTvl(tvl: string | null): string {
  if (!tvl) return '—';
  const num = parseFloat(tvl.replace(/[$,]/g, ''));
  if (isNaN(num)) return tvl;
  if (num >= 1_000_000) return `$${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `$${(num / 1_000).toFixed(0)}K`;
  return `$${num.toFixed(0)}`;
}

function formatPosition(position: TreasuryPosition): string {
  if (position.shares === 0n) return '—';
  const val = Number(position.assetsFormatted);
  if (val === 0) return '—';
  const decimals = position.underlyingDecimals <= 6 ? 2 : 6;
  return `${val.toFixed(decimals)} ${position.underlying}`;
}

/**
 * Get the vault-specific color indicator
 */
function VaultDot({ color }: { color: string }) {
  return (
    <span
      className="inline-block w-2 h-2 rounded-full shrink-0"
      style={{ backgroundColor: color }}
    />
  );
}

export function AllocationTable({ positions, vaultsData, isLoading }: Props) {
  if (isLoading) {
    return (
      <div className="bg-yo-dark rounded-lg border border-white/5 p-4">
        <div className="h-4 w-32 bg-white/5 rounded mb-4 animate-pulse" />
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex gap-4 py-2">
            <div className="h-4 w-16 bg-white/5 rounded animate-pulse" />
            <div className="h-4 w-12 bg-white/5 rounded animate-pulse" />
            <div className="h-4 w-16 bg-white/5 rounded animate-pulse" />
            <div className="h-4 w-20 bg-white/5 rounded animate-pulse" />
          </div>
        ))}
      </div>
    );
  }

  // Merge on-chain positions with YO vault API data
  const rows = positions.map((pos) => {
    const vaultData = vaultsData?.find(
      (v) => v.vaultAddress.toLowerCase() === pos.vaultAddress.toLowerCase(),
    );
    return { ...pos, apy7d: vaultData?.apy7d ?? null, tvl: vaultData?.tvlFormatted ?? null };
  });

  const hasAnyPosition = rows.some((r) => r.shares > 0n);

  return (
    <div className="bg-yo-dark rounded-lg border border-white/5 overflow-hidden">
      <div className="px-4 pt-4 pb-2">
        <h3 className="text-xs font-medium tracking-wider uppercase text-yo-muted">
          Yield Allocations
        </h3>
      </div>

      <table className="w-full text-sm">
        <thead>
          <tr className="text-yo-muted text-[11px] uppercase tracking-wider">
            <th className="font-medium pb-2 pl-4 text-left">Vault</th>
            <th className="font-medium pb-2 text-right">APR</th>
            <th className="font-medium pb-2 text-right">TVL</th>
            <th className="font-medium pb-2 text-right">Position</th>
            <th className="font-medium pb-2 pr-4 text-right">Status</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const isActive = row.shares > 0n;

            return (
              <tr
                key={row.vaultId}
                className={`border-t border-white/5 transition-colors ${
                  isActive ? 'bg-white/[0.02]' : ''
                }`}
              >
                {/* Vault */}
                <td className="py-3 pl-4">
                  <div className="flex items-center gap-2">
                    <VaultDot color={row.color} />
                    <img
                      src={row.logo}
                      alt={row.vaultName}
                      className="w-5 h-5 rounded-full"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                    <span className="font-medium text-white">
                      {row.vaultName}
                    </span>
                    <span className="text-yo-muted text-xs">
                      {row.underlying}
                    </span>
                  </div>
                </td>

                {/* APR */}
                <td className="py-3 text-right">
                  <span className="font-mono font-medium text-yo-neon">
                    {formatApy(row.apy7d)}
                  </span>
                </td>

                {/* TVL */}
                <td className="py-3 text-right text-yo-muted font-mono text-xs">
                  {formatTvl(row.tvl)}
                </td>

                {/* Position */}
                <td className="py-3 text-right">
                  <span
                    className={`font-mono text-xs ${
                      isActive ? 'text-white' : 'text-yo-muted'
                    }`}
                  >
                    {formatPosition(row)}
                  </span>
                </td>

                {/* Status */}
                <td className="py-3 pr-4 text-right">
                  {isActive ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-medium bg-yo-neon/10 text-yo-neon px-2 py-0.5 rounded-full">
                      <span className="w-1.5 h-1.5 rounded-full bg-yo-neon animate-pulse" />
                      Active
                    </span>
                  ) : (
                    <span className="text-[10px] text-yo-muted">—</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {!hasAnyPosition && (
        <div className="px-4 pb-4 pt-2 text-center">
          <p className="text-xs text-yo-muted">
            No allocations yet. Use the AI copilot below to allocate funds to YO vaults.
          </p>
        </div>
      )}
    </div>
  );
}
