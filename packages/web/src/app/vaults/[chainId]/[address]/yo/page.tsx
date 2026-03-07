import { YoTreasuryTab } from '@/yo-treasury/components/yo-treasury-tab';
import type { ChainId } from '@/app/chains.config';
import type { Address } from 'viem';

export const metadata = {
  title: 'YO Treasury - Fusion by IPOR',
};

export default async function YoTreasuryPage({
  params,
}: {
  params: Promise<{ chainId: string; address: string }>;
}) {
  const { chainId, address } = await params;

  return (
    <YoTreasuryTab
      chainId={Number(chainId) as ChainId}
      vaultAddress={address as Address}
    />
  );
}
