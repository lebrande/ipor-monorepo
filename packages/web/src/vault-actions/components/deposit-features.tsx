'use client';

import { getVaultFromRegistry, hasTag, VAULT_TAG } from '@/lib/vaults-registry';
import { VaultActionTabs } from './vault-action-tabs';
import { YoVaultSidebar } from '@/yo-vault-actions/components/yo-vault-sidebar';
import type { ChainId } from '@/app/chains.config';
import type { Address } from 'viem';

const CHAIN_SLUGS: Record<number, string> = {
  1: 'ethereum',
  8453: 'base',
  42161: 'arbitrum',
};

function getAccessManagerUrl(chainId: number, vaultAddress: Address): string {
  const chain = CHAIN_SLUGS[chainId] ?? String(chainId);
  return `https://app.ipor.io/fusion/${chain}/${vaultAddress.toLowerCase()}/edit/access-manager`;
}

interface Props {
  chainId: ChainId;
  vaultAddress: Address;
}

export function DepositFeatures({ chainId, vaultAddress }: Props) {
  const vault = getVaultFromRegistry(chainId, vaultAddress);

  if (hasTag(vault, VAULT_TAG.YO_VAULT)) {
    return <YoVaultSidebar chainId={chainId} vaultAddress={vaultAddress} />;
  }

  const accessManagerUrl = hasTag(vault, VAULT_TAG.YO_TREASURY)
    ? getAccessManagerUrl(chainId, vaultAddress)
    : undefined;

  return (
    <VaultActionTabs
      chainId={chainId}
      vaultAddress={vaultAddress}
      accessManagerUrl={accessManagerUrl}
    />
  );
}
