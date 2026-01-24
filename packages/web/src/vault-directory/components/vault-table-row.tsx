import { TableCell, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/utils';
import { ChainIcon } from '@/components/chain-icon';
import type { VaultData } from '@/vault-directory/queries/use-vaults-query';
import type { VaultParams } from '@/app/app.types';
import type { ChainId } from '@/app/wagmi-provider';

interface Props {
  vault: VaultData;
  onVaultClick: (vaultParams: VaultParams) => void;
}

export const VaultTableRow = ({ vault, onVaultClick }: Props) => {
  const formatNetFlow = (
    flow: number,
  ): { value: string; isPositive: boolean } => {
    const isPositive = flow >= 0;
    const absFlow = Math.abs(flow);
    return {
      value: formatCurrency(absFlow),
      isPositive,
    };
  };

  const formatDate = (date: Date): string => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(date);
  };

  const netFlow = formatNetFlow(vault.netFlow7d);

  const vaultParams: VaultParams = {
    chainId: vault.chainId as ChainId,
    vaultAddress: vault.address,
  };

  const handleClick = () => {
    onVaultClick(vaultParams);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onVaultClick(vaultParams);
    }
  };

  return (
    <TableRow
      className="cursor-pointer"
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
      aria-label={`View details for ${vault.name} vault`}
    >
      <TableCell>
        <div className="flex items-center gap-2">
          <ChainIcon chainId={vault.chainId} className="w-5 h-5" />
          <Badge variant="secondary">{vault.underlyingAsset}</Badge>
        </div>
      </TableCell>
      <TableCell className="font-medium">{vault.name}</TableCell>
      <TableCell className="text-right font-mono">
        {formatCurrency(vault.tvl)}
      </TableCell>
      <TableCell className="text-right">
        {vault.depositorCount.toLocaleString()}
      </TableCell>
      <TableCell className="text-right">
        <span
          className={netFlow.isPositive ? 'text-green-600' : 'text-destructive'}
        >
          {netFlow.isPositive ? '+' : '-'}
          {netFlow.value}
        </span>
      </TableCell>
      <TableCell className="text-right text-muted-foreground">
        {formatDate(vault.creationDate)}
      </TableCell>
    </TableRow>
  );
};
