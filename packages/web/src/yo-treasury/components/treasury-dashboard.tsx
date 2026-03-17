'use client';

import { useAccount } from 'wagmi';
import type { ChainId } from '@/app/chains.config';
import type { Address } from 'viem';

import { useVaultReads } from '@/vault-actions/hooks/use-vault-reads';
import { useTreasuryPositions } from '../hooks/use-treasury-positions';
import { useYoVaultsData } from '../hooks/use-yo-vaults-data';
import { PortfolioSummary } from './portfolio-summary';
import { AllocationTable } from './allocation-table';

interface Props {
  chainId: ChainId;
  vaultAddress: Address;
}

export function TreasuryDashboard({ chainId, vaultAddress }: Props) {
  const { address: userAddress } = useAccount();

  // Treasury vault basics (asset, decimals, symbol, price)
  const {
    assetAddress,
    decimals,
    symbol,
    tokenPriceUsd,
  } = useVaultReads({ chainId, vaultAddress, userAddress });

  // PlasmaVault's positions in YO vaults + unallocated balance
  const {
    positions,
    unallocatedBalance,
    isLoading: isPositionsLoading,
  } = useTreasuryPositions({
    chainId,
    treasuryAddress: vaultAddress,
    assetAddress,
  });

  // YO vault metadata (APR, TVL) via @yo-protocol/core
  const { data: vaultsData, isLoading: isVaultsLoading } =
    useYoVaultsData(chainId);

  return (
    <div className="space-y-3 font-yo">
      {/* Portfolio stat cards */}
      <PortfolioSummary
        positions={positions}
        unallocatedBalance={unallocatedBalance}
        assetDecimals={decimals}
        assetSymbol={symbol}
        tokenPriceUsd={tokenPriceUsd}
        isLoading={isPositionsLoading}
        chainId={chainId}
        vaultAddress={vaultAddress}
        userAddress={userAddress}
      />

      {/* Allocation table with vault APR/TVL */}
      <AllocationTable
        chainId={chainId}
        positions={positions}
        vaultsData={vaultsData}
        isLoading={isPositionsLoading || isVaultsLoading}
      />
    </div>
  );
}
