import { AlphaChatWrapper } from './alpha-chat-wrapper';
import type { ChainId } from '@/app/chains.config';
import type { Address } from 'viem';

export const metadata = {
  title: 'Alpha - Fusion by IPOR',
};

export default async function VaultAlphaPage({
  params,
}: {
  params: Promise<{ chainId: string; address: string }>;
}) {
  const { chainId, address } = await params;

  return (
    <AlphaChatWrapper
      chainId={Number(chainId) as ChainId}
      vaultAddress={address as Address}
    />
  );
}
