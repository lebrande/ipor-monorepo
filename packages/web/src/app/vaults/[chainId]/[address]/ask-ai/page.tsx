import { VaultAskAi } from '@/vault-details/components/vault-ask-ai';
import type { ChainId } from '@/app/chains.config';
import type { Address } from 'viem';

export const metadata = {
  title: 'Ask AI - Fusion by IPOR',
};

export default async function VaultAskAiPage({
  params,
}: {
  params: Promise<{ chainId: string; address: string }>;
}) {
  const { chainId, address } = await params;

  return (
    <VaultAskAi
      chainId={Number(chainId) as ChainId}
      vaultAddress={address as Address}
    />
  );
}
