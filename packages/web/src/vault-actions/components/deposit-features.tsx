'use client';

import { getVaultFromRegistry, hasTag, VAULT_TAG } from '@/lib/vaults-registry';
import { VaultActionTabs } from './vault-action-tabs';
import { YoVaultSidebar } from '@/yo-vault-actions/components/yo-vault-sidebar';
import type { ChainId } from '@/app/chains.config';
import type { Address } from 'viem';

interface Props {
  chainId: ChainId;
  vaultAddress: Address;
}

export function DepositFeatures({ chainId, vaultAddress }: Props) {
  const vault = getVaultFromRegistry(chainId, vaultAddress);

  if (hasTag(vault, VAULT_TAG.YO_VAULT)) {
    return <YoVaultSidebar chainId={chainId} vaultAddress={vaultAddress} />;
  }

  return <VaultActionTabs chainId={chainId} vaultAddress={vaultAddress} />;
}
