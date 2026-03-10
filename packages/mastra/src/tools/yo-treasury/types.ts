import { z } from 'zod';
import type { TreasuryAsset, YoPosition } from './read-yo-treasury-balances';

/** Shared schema for existing pending actions passed to action tools */
export const existingActionSchema = z.object({
  id: z.string(),
  fuseActions: z.array(z.object({ fuse: z.string(), data: z.string() })),
});

/** Per-vault user position (optional, included when vaultAddress is provided) */
export type YoVaultUserPosition = {
  shares: string;
  underlyingAmount: string;
  underlyingFormatted: string;
  valueUsd: string;
};

/** YO vault info returned by getYoVaultsTool */
export type YoVaultsOutput = {
  type: 'yo-vaults';
  success: boolean;
  chainId: number;
  vaults: Array<{
    symbol: string;
    name: string;
    address: string;
    underlying: string;
    underlyingAddress: string;
    underlyingDecimals: number;
    apy7d: string | null;
    tvl: string | null;
    chainId: number;
    userPosition?: YoVaultUserPosition;
    unallocatedBalance?: string;
  }>;
  message: string;
  error?: string;
};

/** Treasury allocation returned by getTreasuryAllocationTool */
export type TreasuryBalancesOutput = {
  type: 'treasury-balances';
  success: boolean;
  assets: TreasuryAsset[];
  yoPositions: YoPosition[];
  totalValueUsd: string;
  message: string;
  error?: string;
};

/** Action with simulation — yo-specific protocols */
export type YoActionWithSimulationOutput = {
  type: 'action-with-simulation';
  success: boolean;
  protocol: 'yo-erc4626' | 'yo-swap';
  actionType: 'supply' | 'withdraw' | 'swap';
  description: string;
  fuseActions: Array<{
    fuse: string;
    data: string;
  }>;
  error?: string;
  simulation?: {
    success: boolean;
    message: string;
    actionsCount: number;
    fuseActionsCount: number;
    error?: string;
  };
};

/** Union of all YO Treasury tool outputs */
export type YoTreasuryToolOutput =
  | YoVaultsOutput
  | TreasuryBalancesOutput
  | YoActionWithSimulationOutput;
