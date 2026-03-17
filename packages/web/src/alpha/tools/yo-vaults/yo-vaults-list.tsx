'use client';

import { TokenIcon } from '@/components/token-icon';
import { formatCurrency } from '@/lib/utils';
import type { YoVaultsOutput } from '@ipor/fusion-mastra/yo-treasury-types';
import type { Address } from 'viem';

interface Props {
  output: YoVaultsOutput;
  chainId: number;
}

function formatApy(apy: string | null): string {
  if (!apy) return 'N/A';
  const num = parseFloat(apy);
  if (isNaN(num)) return 'N/A';
  return `${num.toFixed(2)}%`;
}

function formatTvl(tvl: string | null): string {
  if (!tvl) return '';
  const num = parseFloat(tvl.replace(/[$,]/g, ''));
  if (isNaN(num)) return tvl;
  return formatCurrency(num);
}

function formatUnallocated(vault: YoVaultsOutput['vaults'][number]): string {
  if (!vault.unallocatedBalance) return `0 ${vault.underlying}`;
  const val = parseFloat(vault.unallocatedBalance);
  if (val === 0) return `0 ${vault.underlying}`;
  const decimals = vault.underlyingDecimals <= 6 ? 2 : 6;
  return `${val.toFixed(decimals)} ${vault.underlying}`;
}

function formatBalance(vault: YoVaultsOutput['vaults'][number]): string {
  if (!vault.userPosition) return `0 ${vault.underlying}`;
  const val = parseFloat(vault.userPosition.underlyingFormatted);
  const decimals = vault.underlyingDecimals <= 6 ? 2 : 6;
  return `${val.toFixed(decimals)} ${vault.underlying}`;
}

function formatBalanceUsd(vault: YoVaultsOutput['vaults'][number]): string {
  const val = vault.userPosition ? parseFloat(vault.userPosition.valueUsd) : 0;
  return `$${val.toFixed(2)}`;
}

export function YoVaultsList({ output, chainId }: Props) {
  if (!output.success) {
    return (
      <div className="p-2 text-sm text-destructive">
        {output.error ?? 'Failed to load vaults'}
      </div>
    );
  }

  return (
    <table className="w-[30rem] text-xs border-collapse">
      <thead>
        <tr className="text-muted-foreground text-left">
          <th className="font-normal pb-1 pl-1">Vault</th>
          <th className="font-normal pb-1 text-right">TVL</th>
          <th className="font-normal pb-1 text-right">APR</th>
          <th className="font-normal pb-1 text-right">Unallocated</th>
          <th className="font-normal pb-1 text-right">Balance</th>
          <th className="font-normal pb-1 text-right pr-1">Value</th>
        </tr>
      </thead>
      <tbody>
        {output.vaults.map((vault) => (
          <tr key={vault.address} className="border-t border-border/50">
            <td className="py-1 pl-1">
              <div className="flex items-center gap-1.5">
                <TokenIcon
                  chainId={vault.chainId ?? chainId}
                  address={vault.underlyingAddress as Address}
                  className="w-4 h-4"
                />
                <span className="font-medium">{vault.symbol}</span>
                <span className="text-muted-foreground">{vault.underlying}</span>
              </div>
            </td>
            <td className="py-1 text-right text-muted-foreground">{formatTvl(vault.tvl)}</td>
            <td className="py-1 text-right text-green-500 font-mono font-medium">{formatApy(vault.apy7d)}</td>
            <td className="py-1 text-right font-mono">{formatUnallocated(vault)}</td>
            <td className="py-1 text-right font-mono">{formatBalance(vault)}</td>
            <td className="py-1 text-right font-mono text-muted-foreground pr-1">{formatBalanceUsd(vault)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
