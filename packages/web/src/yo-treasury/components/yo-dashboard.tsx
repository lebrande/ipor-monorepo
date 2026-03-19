'use client';

import { AppProviders } from '@/app/app-providers';
import { YoTreasuryOverview } from './yo-treasury-overview';
import type { ChainId } from '@/app/chains.config';
import type { Address } from 'viem';

const YO_TREASURY_ADDRESS =
  '0x09d1C2E03F73853916Ee86b4e1A729F9FbAA960D' as Address;
const YO_TREASURY_CHAIN_ID = 8453 as ChainId;

export function YoDashboard() {
  return (
    <AppProviders>
      <div className="p-4 md:p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            YO Treasury Dashboard
          </h1>
        </div>
        <YoTreasuryOverview
          chainId={YO_TREASURY_CHAIN_ID}
          vaultAddress={YO_TREASURY_ADDRESS}
        />
      </div>
    </AppProviders>
  );
}
