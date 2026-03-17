'use client';

import { TreasuryDashboard } from './treasury-dashboard';
import { useAccount } from 'wagmi';
import { AgentChat } from '@/alpha/agent-chat';
import { ToolRenderer } from '@/alpha/tools/tool-renderer';
import type { ChainId } from '@/app/chains.config';
import type { Address } from 'viem';

interface Props {
  chainId: ChainId;
  vaultAddress: Address;
}

export function YoTreasuryOverview({ chainId, vaultAddress }: Props) {
  const { address } = useAccount();

  return (
    <div className="space-y-4 font-yo">
      <TreasuryDashboard chainId={chainId} vaultAddress={vaultAddress} />
      <AgentChat
        apiEndpoint="/api/yo/treasury/chat"
        body={{ callerAddress: address, vaultAddress, chainId }}
        chainId={chainId}
        toolRenderer={ToolRenderer}
        emptyStateText="Ask about YO vaults or manage your treasury"
        placeholder="Ask about YO vaults or manage your treasury..."
      />
    </div>
  );
}
