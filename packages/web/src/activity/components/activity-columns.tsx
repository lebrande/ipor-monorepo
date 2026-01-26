'use client';

import { type ColumnDef } from '@tanstack/react-table';
import { Badge } from '@/components/ui/badge';
import { ChainIcon } from '@/components/chain-icon';
import Link from 'next/link';
import type { ActivityItem } from '../fetch-activity';
import { RelativeDate } from './relative-date';
import { TxHashLink } from './tx-hash-link';
import { DepositorAddress } from './depositor-address';

function formatCurrency(amount: number): string {
  if (amount >= 1_000_000) {
    return `$${(amount / 1_000_000).toFixed(2)}M`;
  }
  if (amount >= 1_000) {
    return `$${(amount / 1_000).toFixed(2)}K`;
  }
  return `$${amount.toFixed(2)}`;
}

export function createActivityColumns(): ColumnDef<ActivityItem>[] {
  return [
    {
      id: 'type',
      header: () => 'Activity',
      cell: ({ row }) => {
        const isDeposit = row.original.type === 'deposit';
        return (
          <div className="flex items-center gap-2">
            <ChainIcon chainId={row.original.chainId} className="w-5 h-5" />
            <Badge
              variant={isDeposit ? 'default' : 'secondary'}
              className={
                isDeposit
                  ? 'bg-green-500/10 text-green-500 hover:bg-green-500/20'
                  : 'bg-red-500/10 text-red-500 hover:bg-red-500/20'
              }
            >
              {isDeposit ? 'Add' : 'Remove'}
            </Badge>
          </div>
        );
      },
    },
    {
      accessorKey: 'vaultName',
      header: () => 'Vault',
      cell: ({ row }) => {
        const { chainId, vaultAddress, vaultName } = row.original;
        return (
          <Link
            href={`/vaults/${chainId}/${vaultAddress}`}
            className="text-primary hover:text-primary/80 hover:underline underline-offset-4 transition-colors font-medium"
          >
            {vaultName}
          </Link>
        );
      },
    },
    {
      accessorKey: 'amount',
      header: () => <div className="text-right">Amount</div>,
      cell: ({ row }) => (
        <div className="text-right font-mono">
          {formatCurrency(row.original.amount)}
        </div>
      ),
    },
    {
      id: 'depositor',
      header: () => 'Depositor',
      cell: ({ row }) => (
        <DepositorAddress
          address={row.original.depositorAddress}
          chainId={row.original.chainId}
        />
      ),
    },
    {
      id: 'txHash',
      header: () => 'Tx Hash',
      cell: ({ row }) => (
        <TxHashLink
          txHash={row.original.transactionHash}
          chainId={row.original.chainId}
        />
      ),
    },
    {
      accessorKey: 'timestamp',
      header: () => <div className="text-right">Date</div>,
      cell: ({ row }) => (
        <div className="text-right">
          <RelativeDate timestamp={row.original.timestamp} />
        </div>
      ),
    },
  ];
}
