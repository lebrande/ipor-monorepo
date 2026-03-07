'use client';

import { TreasuryChat } from './treasury-chat';
import { useAccount } from 'wagmi';
import type { ChainId } from '@/app/chains.config';
import type { Address } from 'viem';

interface Props {
  chainId: ChainId;
  vaultAddress: Address;
}

export function YoTreasuryTab({ chainId, vaultAddress }: Props) {
  const { address } = useAccount();

  return (
    <TreasuryChat
      chainId={chainId}
      vaultAddress={vaultAddress}
      callerAddress={address}
    />
  );
}
